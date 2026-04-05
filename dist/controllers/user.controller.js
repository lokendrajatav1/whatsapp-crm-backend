"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgent = exports.deleteAgent = exports.createAgent = exports.getAgents = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const businessResolver_1 = require("../lib/businessResolver");
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.nativeEnum(client_1.Role).default(client_1.Role.SALES_EXEC),
});
const updateUserSchema = zod_1.z.object({
    password: zod_1.z.string().min(8).optional(),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
});
const getAgents = async (req, res) => {
    try {
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const agents = await prisma_1.default.user.findMany({
            where: { businessId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(agents);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAgents = getAgents;
const createAgent = async (req, res) => {
    try {
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        }
        const { email, password, role } = parsed.data;
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing)
            return res.status(400).json({ error: 'User already exists' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role,
                businessId
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
        res.status(201).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createAgent = createAgent;
const deleteAgent = async (req, res) => {
    try {
        const id = req.params.id;
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        if (id === req.user?.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        const user = await prisma_1.default.user.findFirst({
            where: { id, businessId }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found or not in this business' });
        await prisma_1.default.$transaction([
            prisma_1.default.lead.updateMany({
                where: { assignedToId: id },
                data: { assignedToId: null }
            }),
            prisma_1.default.user.delete({ where: { id } })
        ]);
        res.json({ message: 'User removed from business' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteAgent = deleteAgent;
const updateAgent = async (req, res) => {
    try {
        const id = req.params.id;
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            // Return first error message as string to prevent frontend crashes
            const fieldErrors = parsed.error.flatten().fieldErrors;
            const firstError = Object.values(fieldErrors).flat()[0] || 'Invalid input';
            return res.status(400).json({ error: firstError });
        }
        const { password, role } = parsed.data;
        // Verify user belongs to same business
        const userToUpdate = await prisma_1.default.user.findFirst({
            where: { id, businessId }
        });
        if (!userToUpdate)
            return res.status(404).json({ error: 'User not found in this business' });
        const hashedPassword = password ? await bcryptjs_1.default.hash(password, 10) : undefined;
        const updateData = {};
        if (hashedPassword)
            updateData.password = hashedPassword;
        if (role)
            updateData.role = role;
        const updated = await prisma_1.default.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateAgent = updateAgent;
//# sourceMappingURL=user.controller.js.map