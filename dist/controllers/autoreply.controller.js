"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRule = exports.updateRule = exports.createRule = exports.getRules = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getRules = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user?.businessId)
            return res.status(404).json({ error: 'Business not found' });
        const rules = await prisma_1.default.autoReplyRule.findMany({
            where: { businessId: user.businessId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getRules = getRules;
const createRule = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const { keyword, response, type = 'KEYWORD', isActive = true } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user?.businessId)
            return res.status(404).json({ error: 'Business not found' });
        const rule = await prisma_1.default.autoReplyRule.create({
            data: {
                keyword: type === 'KEYWORD' ? keyword : null,
                response,
                type,
                isActive,
                businessId: user.businessId
            }
        });
        res.status(201).json(rule);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createRule = createRule;
const updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { keyword, response, isActive, type } = req.body;
        const businessId = req.user?.businessId;
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        // Ensure rule belongs to this business
        const existing = await prisma_1.default.autoReplyRule.findFirst({
            where: { id: id, businessId }
        });
        if (!existing)
            return res.status(404).json({ error: 'Rule not found' });
        const rule = await prisma_1.default.autoReplyRule.update({
            where: { id: id },
            data: { keyword, response, isActive, type }
        });
        res.json(rule);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateRule = updateRule;
const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user?.businessId;
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        // Ensure rule belongs to this business
        const existing = await prisma_1.default.autoReplyRule.findFirst({
            where: { id: id, businessId }
        });
        if (!existing)
            return res.status(404).json({ error: 'Rule not found' });
        await prisma_1.default.autoReplyRule.delete({ where: { id: id } });
        res.json({ message: 'Rule deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteRule = deleteRule;
//# sourceMappingURL=autoreply.controller.js.map