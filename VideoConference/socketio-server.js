/**
 * Socket.io Server for Video Conference Signaling
 * Handles real-time communication between participants
 * Optimized for Vercel deployment
 */

const { Server } = require('socket.io');
const { createServer } = require('http');
const { randomUUID } = require('crypto');

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Handle health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'socketio-server' }));
    return;
  }
  
  // Handle Socket.io requests
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.io Server');
});

// Create Socket.io server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          "https://zuumcuk.vercel.app",
          "https://zuumcuk-5gzn1uxy3-asimsinans-projects.vercel.app",
          "https://zuumcuk-ca6ptbtnh-asimsinans-projects.vercel.app",
          "https://zuumcuk-nhebvwycb-asimsinans-projects.vercel.app",
          "https://zuumcuk-ntxzelnac-asimsinans-projects.vercel.app"
        ]
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Prioritize polling for Vercel
  allowEIO3: true
});

// Store active connections and rooms
const activeConnections = new Map(); // userId -> socket
const roomParticipants = new Map(); // roomId -> Set of userIds

// Handle connections
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Handle room join
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userId, participantName, participantId } = data;
      
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Room ID and User ID are required' });
        return;
      }

      // Store connection info
      activeConnections.set(userId, socket);
      socket.userId = userId;
      socket.roomId = roomId;
      socket.participantId = participantId;
      socket.participantName = participantName;

      // Join the room
      await socket.join(roomId);

      // Add to room participants
      if (!roomParticipants.has(roomId)) {
        roomParticipants.set(roomId, new Set());
      }
      roomParticipants.get(roomId).add(userId);

      console.log(`👤 User ${userId} joined room ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit('participant-joined', {
        userId,
        participantId,
        participantName: participantName || `Participant ${participantId}`,
        timestamp: Date.now()
      });

      // Send current room info to the new participant
      const currentParticipants = Array.from(roomParticipants.get(roomId) || [])
        .filter(id => id !== userId)
        .map(id => ({
          userId: id,
          participantId: `participant-${id}`,
          participantName: `Participant ${id}`,
          isConnected: true
        }));

      socket.emit('room-info', {
        roomId,
        participants: currentParticipants,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle WebRTC signaling
  socket.on('webrtc-signal', (data) => {
    const { to, signal, type } = data;
    
    if (!to || !signal || !type) {
      socket.emit('error', { message: 'Invalid signaling data' });
      return;
    }

    // Forward the signal to the target participant
    socket.to(to).emit('webrtc-signal', {
      from: socket.userId,
      signal,
      type,
      timestamp: Date.now()
    });
  });

  // Handle participant leave
  socket.on('leave-room', () => {
    if (socket.roomId && socket.userId) {
      console.log(`👋 User ${socket.userId} leaving room ${socket.roomId}`);
      
      // Remove from room participants
      const roomUsers = roomParticipants.get(socket.roomId);
      if (roomUsers) {
        roomUsers.delete(socket.userId);
        if (roomUsers.size === 0) {
          roomParticipants.delete(socket.roomId);
        }
      }

      // Notify others in the room
      socket.to(socket.roomId).emit('participant-left', {
        userId: socket.userId,
        participantId: socket.participantId,
        participantName: socket.participantName,
        timestamp: Date.now()
      });

      // Leave the room
      socket.leave(socket.roomId);
    }
  });

  // Handle heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // Handle room cleanup if in a room
      if (socket.roomId) {
        console.log(`👋 User ${socket.userId} disconnected from room ${socket.roomId}`);
        
        // Remove from room participants
        const roomUsers = roomParticipants.get(socket.roomId);
        if (roomUsers) {
          roomUsers.delete(socket.userId);
          if (roomUsers.size === 0) {
            roomParticipants.delete(socket.roomId);
          }
        }

        // Notify others in the room
        socket.to(socket.roomId).emit('participant-left', {
          userId: socket.userId,
          participantId: socket.participantId,
          participantName: socket.participantName,
          timestamp: Date.now()
        });
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down Socket.io server...');
  httpServer.close(() => {
    console.log('✅ Socket.io server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down Socket.io server...');
  httpServer.close(() => {
    console.log('✅ Socket.io server closed');
    process.exit(0);
  });
});
