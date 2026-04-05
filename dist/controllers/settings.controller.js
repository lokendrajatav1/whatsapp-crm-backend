"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinessProfile = exports.updateWhatsAppConfig = exports.getWhatsAppConfig = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getWhatsAppConfig = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { businessId: true }
        });
        if (!user?.businessId)
            return res.status(404).json({ error: 'Business profile not found for this account' });
        const config = await prisma_1.default.whatsAppConfig.findUnique({
            where: { businessId: user.businessId }
        });
        res.json(config || {});
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getWhatsAppConfig = getWhatsAppConfig;
const updateWhatsAppConfig = async (req, res) => {
    try {
        const { phoneNumberId, accessToken, webhookToken } = req.body;
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { businessId: true }
        });
        if (!user?.businessId)
            return res.status(404).json({ error: 'No business associated with this account' });
        const config = await prisma_1.default.whatsAppConfig.upsert({
            where: { businessId: user.businessId },
            update: { phoneNumberId, accessToken, webhookToken },
            create: {
                businessId: user.businessId,
                phoneNumberId,
                accessToken,
                webhookToken
            }
        });
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateWhatsAppConfig = updateWhatsAppConfig;
const getBusinessProfile = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { businessId: true }
        });
        if (!user?.businessId)
            return res.status(404).json({ error: 'No business associated with this account' });
        const business = await prisma_1.default.business.findUnique({
            where: { id: user.businessId },
            include: {
                subscription: true,
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        projects: true,
                        services: true
                    }
                }
            }
        });
        res.json(business);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBusinessProfile = getBusinessProfile;
//# sourceMappingURL=settings.controller.js.map