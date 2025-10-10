/**
 * WebSocket Server Integration for Next.js
 * Creates WebSocket server alongside Next.js development server
 */

import { createServer } from 'http';
import { VideoConferenceWebSocketServer } from './websocket-server';

let wsServer: VideoConferenceWebSocketServer | null = null;

export function createWebSocketServer(port: number = 3001) {
  if (wsServer) {
    return wsServer;
  }

  const server = createServer();
  
  wsServer = new VideoConferenceWebSocketServer(server);
  
  server.listen(port, () => {
  });

  return wsServer;
}

export function getWebSocketServer(): VideoConferenceWebSocketServer | null {
  return wsServer;
}
