/**
 * Standalone WebSocket Server for Video Conference Signaling
 * Run this alongside the Next.js development server
 */

const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || process.env.WS_PORT || 3001;

// Simple WebSocket server implementation
class VideoConferenceWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/rooms' });
    this.rooms = new Map();
    this.setupEventHandlers();
    this.startHeartbeatChecker();
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, request) => {
      const clientIp = request.socket.remoteAddress;
      
      // Mark connection as alive
      ws.isAlive = true;
      
      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      ws.on('close', (code, reason) => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });
  }

  handleMessage(ws, message) {

    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message.data);
        break;

      case 'offer':
        this.handleOffer(ws, message);
        break;

      case 'answer':
        this.handleAnswer(ws, message);
        break;

      case 'iceCandidate':
        this.handleIceCandidate(ws, message);
        break;

      case 'chatMessage':
        this.handleChatMessage(ws, message);
        break;

      case 'mediaStateChange':
        this.handleMediaStateChange(ws, message);
        break;

      case 'ping':
        this.handlePing(ws);
        break;

      case 'leave':
        this.handleLeave(ws, message.data);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  handleJoin(ws, data) {
    const { participantId, roomId, participantName, userId } = data;
    
    
    if (!roomId || !participantId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Missing roomId or participantId' }
      }));
      return;
    }

    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        participants: new Map()
      };
      this.rooms.set(roomId, room);
    }

    // CRITICAL FIX: Remove any existing participant with the same USER_ID (not name!)
    // This handles page refresh where old WebSocket hasn't timed out yet
    let existingParticipantId = null;
    
    // FIRST: Check if this exact participantId already exists (database ID reuse)
    if (room.participants.has(participantId)) {
      existingParticipantId = participantId;
    }
    // SECOND: Check by userId (same user, different participant ID)
    else if (userId) {
      existingParticipantId = Array.from(room.participants.values())
        .find(p => p.userId === userId && p.id !== participantId)?.id;
      
      if (existingParticipantId) {
      }
    }
    
    if (existingParticipantId) {
      const oldParticipant = room.participants.get(existingParticipantId);
      
      // CRITICAL: Remove the old participant's WebSocket from our tracking FIRST
      // This prevents handleDisconnection from broadcasting again when we close it
      if (oldParticipant && oldParticipant.ws) {
        oldParticipant.ws._skipDisconnectionHandler = true; // Flag to skip handleDisconnection
      }
      
      // Remove old participant from room
      room.participants.delete(existingParticipantId);
      
      // Notify others that old participant left (BEFORE adding new one)
      this.broadcastToRoom(roomId, {
        type: 'participantLeft',
        data: {
          participantId: existingParticipantId,
          participantName: participantName,
          timestamp: Date.now()
        }
      }, participantId); // Exclude the new participant
      
      // Close old WebSocket if still open
      if (oldParticipant && oldParticipant.ws && oldParticipant.ws.readyState === 1) {
        oldParticipant.ws.close(1000, 'Replaced by new connection');
      }
      
    }

    // Create participant (now including userId for proper duplicate detection)
    const participant = {
      id: participantId,
      userId: userId, // Store userId for duplicate detection
      name: participantName || `Participant ${participantId}`,
      ws,
      roomId,
      joinedAt: Date.now()
    };

    // Add participant to room
    room.participants.set(participantId, participant);


    // Notify all participants in the room about the new participant
    this.broadcastToRoom(roomId, {
      type: 'participantJoined',
      data: {
        participantId,
        participantName: participant.name,
        timestamp: Date.now()
      }
    }, participantId);

    // Send list of existing participants to the new participant
    const existingParticipants = Array.from(room.participants.values())
      .filter(p => p.id !== participantId)
      .map(p => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joinedAt
      }));

    ws.send(JSON.stringify({
      type: 'roomInfo',
      data: {
        roomId,
        participants: existingParticipants
      }
    }));
  }

  handleOffer(ws, message) {
    const { to, data } = message;
    const participant = this.findParticipantByWebSocket(ws);
    
    if (!participant) return;

    // Forward offer to target participant
    this.sendToParticipant(to, {
      type: 'offer',
      data: {
        offer: data.offer,
        from: participant.id
      }
    });
  }

  handleAnswer(ws, message) {
    const { to, data } = message;
    const participant = this.findParticipantByWebSocket(ws);
    
    if (!participant) return;

    // Forward answer to target participant
    this.sendToParticipant(to, {
      type: 'answer',
      data: {
        answer: data.answer,
        from: participant.id
      }
    });
  }

  handleIceCandidate(ws, message) {
    const { to, data } = message;
    const participant = this.findParticipantByWebSocket(ws);
    
    if (!participant) return;

    // Forward ICE candidate to target participant
    this.sendToParticipant(to, {
      type: 'iceCandidate',
      data: {
        candidate: data.candidate,
        from: participant.id
      }
    });
  }

  handleChatMessage(ws, message) {
    const participant = this.findParticipantByWebSocket(ws);
    
    if (!participant) return;

    // Broadcast chat message to all participants in the room
    this.broadcastToRoom(participant.roomId, {
      type: 'chatMessage',
      data: {
        ...message.data,
        participantId: participant.id,
        participantName: participant.name,
        timestamp: Date.now()
      }
    });
  }

  handleMediaStateChange(ws, message) {
    const participant = this.findParticipantByWebSocket(ws);
    
    if (!participant) return;

    // Broadcast media state change to all participants in the room
    this.broadcastToRoom(participant.roomId, {
      type: 'mediaStateChange',
      data: {
        ...message.data,
        participantId: participant.id,
        participantName: participant.name,
        timestamp: Date.now()
      }
    }, participant.id);
  }

  handlePing(ws) {
    ws.send(JSON.stringify({
      type: 'pong',
      data: { timestamp: Date.now() }
    }));
  }

  handleLeave(ws, data) {
    // Explicit leave message - same logic as handleDisconnection
    this.handleDisconnection(ws);
  }

  handleDisconnection(ws) {
    // CRITICAL: Skip if this is a replaced connection
    if (ws._skipDisconnectionHandler) {
      return;
    }

    const participant = this.findParticipantByWebSocket(ws);
    
    if (participant) {
      
      const room = this.rooms.get(participant.roomId);
      if (room) {
        room.participants.delete(participant.id);
        
        // If room is empty, remove it
        if (room.participants.size === 0) {
          this.rooms.delete(participant.roomId);
        } else {
          // Notify remaining participants
          this.broadcastToRoom(participant.roomId, {
            type: 'participantLeft',
            data: {
              participantId: participant.id,
              participantName: participant.name,
              timestamp: Date.now()
            }
          });
        }
      }
    } else {
    }
  }

  findParticipantByWebSocket(ws) {
    for (const room of this.rooms.values()) {
      for (const participant of room.participants.values()) {
        if (participant.ws === ws) {
          return participant;
        }
      }
    }
    return null;
  }

  sendToParticipant(participantId, message) {
    for (const room of this.rooms.values()) {
      const participant = room.participants.get(participantId);
      if (participant && participant.ws.readyState === 1) { // WebSocket.OPEN
        participant.ws.send(JSON.stringify(message));
        return;
      }
    }
  }

  broadcastToRoom(roomId, message, excludeParticipantId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants.forEach((participant) => {
      if (participant.id !== excludeParticipantId && participant.ws.readyState === 1) { // WebSocket.OPEN
        participant.ws.send(JSON.stringify(message));
      }
    });
  }

  getRoomStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalParticipants: 0,
      rooms: []
    };

    this.rooms.forEach((room, roomId) => {
      stats.totalParticipants += room.participants.size;
      stats.rooms.push({
        roomId,
        participantCount: room.participants.size,
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          joinedAt: p.joinedAt
        }))
      });
    });

    return stats;
  }

  startHeartbeatChecker() {
    // Check every 3 seconds for dead connections (aggressive cleanup)
    setInterval(() => {
      
      let deadCount = 0;
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          deadCount++;
          
          // CRITICAL: Call handleDisconnection BEFORE terminating
          // to ensure the participant is removed from rooms immediately
          this.handleDisconnection(ws);
          
          // Then terminate the WebSocket
          ws.terminate();
          return;
        }
        
        // Mark as potentially dead, will be set to true if pong is received
        ws.isAlive = false;
        ws.ping();
      });
      
      if (deadCount > 0) {
      }
    }, 3000); // 3 seconds (aggressive cleanup to prevent ghosts)
  }
}

const server = createServer();
const wsServer = new VideoConferenceWebSocketServer(server);

server.listen(PORT, () => {
});

// Add stats endpoint
server.on('request', (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(wsServer.getRoomStats(), null, 2));
  } else if (req.url === '/debug') {
    // Debug endpoint to see detailed participant info
    const debug = {
      rooms: []
    };
    wsServer.rooms.forEach((room, roomId) => {
      const roomInfo = {
        roomId,
        participantCount: room.participants.size,
        participants: []
      };
      room.participants.forEach((participant, participantId) => {
        roomInfo.participants.push({
          id: participant.id,
          userId: participant.userId || 'NOT SET',
          name: participant.name,
          wsState: participant.ws ? participant.ws.readyState : 'NO WS',
          joinedAt: new Date(participant.joinedAt).toISOString()
        });
      });
      debug.rooms.push(roomInfo);
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(debug, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});