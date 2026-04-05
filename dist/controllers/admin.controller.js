"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalUsers = exports.deleteBusiness = exports.configureWhatsApp = exports.getBusinesses = exports.createBusiness = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const createBusiness = async (req, res) => {
    try {
        const { name, ownerEmail, ownerPassword, plan = 'FREE' } = req.body;
        // 1. Check if business owner already exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { email: ownerEmail } });
        if (existingUser)
            return res.status(400).json({ error: 'Email already in use' });
        // 2. Create Business & Subscription together
        const business = await prisma_1.default.business.create({
            data: {
                name,
                subscription: {
                    create: { plan: plan }
                },
                users: {
                    create: {
                        email: ownerEmail,
                        password: await bcryptjs_1.default.hash(ownerPassword, 10),
                        role: client_1.Role.ADMIN
                    }
                }
            }
        });
        res.status(201).json({ business });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createBusiness = createBusiness;
const getBusinesses = async (req, res) => {
    try {
        const businesses = await prisma_1.default.business.findMany({
            include: {
                subscription: true,
                _count: {
                    select: { users: true, leads: true }
                }
            }
        });
        res.json(businesses);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBusinesses = getBusinesses;
const configureWhatsApp = async (req, res) => {
    try {
        const { id } = req.params;
        const { phoneNumberId, accessToken, webhookToken } = req.body;
        const config = await prisma_1.default.whatsAppConfig.upsert({
            where: { businessId: id },
            update: { phoneNumberId, accessToken, webhookToken },
            create: { businessId: id, phoneNumberId, accessToken, webhookToken }
        });
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.configureWhatsApp = configureWhatsApp;
const deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        // Transaction to delete everything
        await prisma_1.default.$transaction([
            prisma_1.default.whatsAppConfig.deleteMany({ where: { businessId: id } }),
            prisma_1.default.subscription.deleteMany({ where: { businessId: id } }),
            prisma_1.default.autoReplyRule.deleteMany({ where: { businessId: id } }),
            prisma_1.default.message.deleteMany({ where: { lead: { businessId: id } } }),
            prisma_1.default.lead.deleteMany({ where: { businessId: id } }),
            prisma_1.default.user.deleteMany({ where: { businessId: id } }),
            prisma_1.default.business.delete({ where: { id: id } })
        ]);
        res.json({ message: 'Business and all associated data deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteBusiness = deleteBusiness;
const getGlobalUsers = async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            include: {
                business: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getGlobalUsers = getGlobalUsers;
//# sourceMappingURL=admin.controller.js.map