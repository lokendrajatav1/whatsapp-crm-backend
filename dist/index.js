"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const http_1 = __importDefault(require("http"));
const socket_1 = require("./lib/socket");
const notification_service_1 = require("./services/notification.service");
const PORT = config_1.config.port;
const httpServer = http_1.default.createServer(app_1.default);
(0, socket_1.initSocket)(httpServer);
(0, notification_service_1.startNotificationService)();
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
//# sourceMappingURL=index.js.map