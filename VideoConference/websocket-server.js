/**
 * Standalone WebSocket Server for Video Conference Signaling
 * Run this alongside the Next.js development server
 */

const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.WS_PORT || 3001;

// Simple WebSocket server implementation
class VideoConferenceWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/rooms' });
    this.rooms = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, request) => {
      console.log('New WebSocket connection');
      
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
        console.log('WebSocket connection closed:', code, reason.toString());
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });
  }

  handleMessage(ws, message) {
    console.log('Received message:', message.type);

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

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  handleJoin(ws, data) {
    const { participantId, roomId, participantName } = data;
    
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

    // Create participant
    const participant = {
      id: participantId,
      name: participantName || `Participant ${participantId}`,
      ws,
      roomId,
      joinedAt: Date.now()
    };

    // Add participant to room
    room.participants.set(participantId, participant);

    console.log(`Participant ${participantId} joined room ${roomId}`);

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

  handleDisconnection(ws) {
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
}

const server = createServer();
const wsServer = new VideoConferenceWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}/rooms`);
  console.log(`📊 Room stats endpoint: http://localhost:${PORT}/stats`);
});

// Add stats endpoint
server.on('request', (req, res) => {
  if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(wsServer.getRoomStats(), null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  server.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  server.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});