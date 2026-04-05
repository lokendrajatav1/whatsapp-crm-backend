"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const config_1 = require("../config");
const register = async (req, res) => {
    try {
        const { email, password, businessName } = req.body;
        if (!businessName) {
            return res.status(400).json({ error: 'Business name is required for registration.' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                business: { create: { name: businessName } },
                role: 'ADMIN'
            },
            include: { business: true }
        });
        // Embed role + businessId so middleware needs no DB round-trip
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, businessId: user.businessId }, config_1.config.jwtSecret, { expiresIn: '7d' });
        const { password: _, ...userSafe } = user;
        res.status(201).json({ user: userSafe, token });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { business: true }
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, businessId: user.businessId }, config_1.config.jwtSecret, { expiresIn: '7d' });
        const { password: _, ...userSafe } = user;
        res.status(200).json({ user: userSafe, token });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: { business: true }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const { password: _, ...userSafe } = user;
        res.json(userSafe);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMe = getMe;
const changePassword = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Current password is incorrect' });
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({ where: { id: user.id }, data: { password: hashed } });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.changePassword = changePassword;
const logout = async (req, res) => {
    try {
        // For stateless JWT, we simply return success.
        // Client side will remove the token from storage.
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map