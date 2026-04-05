"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
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
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map