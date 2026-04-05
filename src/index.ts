import app from './app';
import { config } from './config';
import http from 'http';
import { initSocket } from './lib/socket';
import { startNotificationService } from './services/notification.service';

const PORT = config.port;
const httpServer = http.createServer(app);

initSocket(httpServer);
startNotificationService();

const server = httpServer.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
