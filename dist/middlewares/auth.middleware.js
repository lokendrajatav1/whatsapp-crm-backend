"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.superAdmin = exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const client_1 = require("@prisma/client");
const protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const verified = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        // Validate that required fields exist before assigning
        if (!verified.id || !verified.role || !verified.businessId) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }
        req.user = {
            id: verified.id,
            email: verified.email,
            role: verified.role,
            businessId: verified.businessId
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.protect = protect;
/**
 * Requires ADMIN or SUPER_ADMIN role (read from JWT — no DB call).
 */
const admin = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === client_1.Role.ADMIN || req.user.role === client_1.Role.SUPER_ADMIN) {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden: Admin role required' });
};
exports.admin = admin;
/**
 * Requires SUPER_ADMIN role (read from JWT — no DB call).
 */
const superAdmin = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === client_1.Role.SUPER_ADMIN) {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden: Super Admin role required' });
};
exports.superAdmin = superAdmin;
/**
 * Higher-order middleware to check for one or several specific roles.
 */
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.role === client_1.Role.SUPER_ADMIN || roles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json({ error: `Forbidden: One of these roles required: ${roles.join(', ')}` });
    };
};
exports.hasRole = hasRole;
//# sourceMappingURL=auth.middleware.js.map