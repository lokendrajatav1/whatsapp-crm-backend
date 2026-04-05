"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const errorCode = err.code || 'SERVER_ERROR';
    console.error(`[API Error] ${req.method} ${req.url} - ${status} (${errorCode}): ${message}`);
    res.status(status).json({
        error: message,
        code: errorCode,
        status
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.middleware.js.map