import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, replace with actual origin
    },
  });

  io.on('connection', (socket) => {
    const businessId = socket.handshake.query['businessId'];
    if (businessId) {
      socket.join(`business:${businessId}`);
      console.log(`Socket joined business group: ${businessId}`);
    }

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
