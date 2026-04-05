"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReminder = exports.updateReminder = exports.createReminder = exports.getAllReminders = exports.getLeadReminders = exports.addLeadRemark = exports.getLeadRemarks = exports.sendMessage = exports.getLeadMessages = exports.bulkAssignLeads = exports.bulkDeleteLeads = exports.deleteLead = exports.updateLead = exports.createLead = exports.getLead = exports.getLeads = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const whatsapp_service_1 = require("../services/whatsapp.service");
const socket_1 = require("../lib/socket");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// ─── Validation Schemas ──────────────────────────────────────────────────────
const createLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    phone: zod_1.z.string().min(5).max(25),
    businessName: zod_1.z.string().max(120).optional(),
    source: zod_1.z.string().max(60).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
    phone: zod_1.z.string().min(5).max(25).optional(),
    businessName: zod_1.z.string().max(120).optional(),
    status: zod_1.z.nativeEnum(client_1.LeadStatus).optional(),
    source: zod_1.z.string().max(60).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    assignedToId: zod_1.z.string().uuid().optional().nullable(),
});
// ─── Helpers ────────────────────────────────────────────────────────────────
async function resolveBusinessId(req) {
    try {
        const { role, businessId: userBusinessId, id: userId } = req.user || {};
        // 1. Regular admins/staff MUST use their own businessId
        if (userBusinessId)
            return userBusinessId;
        // 2. Super Admins (you) can audit any business via Header or Query
        if (role === 'SUPER_ADMIN') {
            const explicitId = req.headers['x-business-id'] || req.query.businessId;
            if (explicitId)
                return explicitId;
        }
        if (!userId)
            return null;
        // 3. Fallback for accounts without businessId in token but exists in DB
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { businessId: true }
        });
        return user?.businessId ?? null;
    }
    catch (err) {
        console.error('[resolveBusinessId Error]:', err);
        return null;
    }
}
// ─── Controllers ─────────────────────────────────────────────────────────────
const getLeads = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const page = Math.max(1, parseInt(req.query['page'] || '1'));
        const limit = Math.min(100, parseInt(req.query['limit'] || '50'));
        const skip = (page - 1) * limit;
        const search = (req.query['search'] || '').trim();
        const filter = { businessId };
        // Role-based visibility
        if (req.user.role === 'SALES_EXEC') {
            filter.assignedToId = req.user.id;
        }
        if (search) {
            filter.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { businessName: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [leads, total] = await Promise.all([
            prisma_1.default.lead.findMany({
                where: filter,
                include: {
                    assignedTo: { select: { id: true, email: true } },
                    _count: { select: { remarks: true } }
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.lead.count({ where: filter }),
        ]);
        res.json({ data: leads, total, page, limit, pages: Math.ceil(total / limit) });
    }
    catch (error) {
        console.error('[getLeads Error]:', error);
        res.status(500).json({ error: error.message, details: error.stack });
    }
};
exports.getLeads = getLeads;
const getLead = async (req, res) => {
    try {
        const id = req.params['id'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const filter = { id, businessId };
        if (req.user?.role === 'SALES_EXEC')
            filter.assignedToId = req.user.id;
        const lead = await prisma_1.default.lead.findFirst({
            where: filter,
            include: {
                assignedTo: { select: { id: true, email: true } },
                remarks: { orderBy: { createdAt: 'desc' } }
            }
        });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found or access denied' });
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getLead = getLead;
const createLead = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const parsed = createLeadSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        }
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.create({
            data: {
                ...parsed.data,
                businessId,
                ...(req.user.role === 'SALES_EXEC' && { assignedToId: req.user.id })
            }
        });
        res.status(201).json(lead);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createLead = createLead;
const updateLead = async (req, res) => {
    try {
        const id = req.params['id'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const filter = { id, businessId };
        if (req.user?.role === 'SALES_EXEC')
            filter.assignedToId = req.user.id;
        const existing = await prisma_1.default.lead.findFirst({ where: filter });
        if (!existing)
            return res.status(404).json({ error: 'Lead not found or access denied' });
        const parsed = updateLeadSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        }
        const lead = await prisma_1.default.lead.update({
            where: { id },
            data: parsed.data,
            include: { assignedTo: { select: { id: true, email: true } } }
        });
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateLead = updateLead;
const deleteLead = async (req, res) => {
    try {
        const id = req.params['id'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const filter = { id, businessId };
        if (req.user?.role === 'SALES_EXEC')
            filter.assignedToId = req.user.id;
        const lead = await prisma_1.default.lead.findFirst({ where: filter });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found or access denied' });
        await prisma_1.default.$transaction([
            prisma_1.default.message.deleteMany({ where: { leadId: id } }),
            prisma_1.default.reminder.deleteMany({ where: { leadId: id } }),
            prisma_1.default.leadRemark.deleteMany({ where: { leadId: id } }),
            prisma_1.default.lead.delete({ where: { id } })
        ]);
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteLead = deleteLead;
const bulkDeleteLeads = async (req, res) => {
    try {
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' });
        }
        const ownedLeads = await prisma_1.default.lead.findMany({
            where: { id: { in: ids }, businessId },
            select: { id: true }
        });
        const safeIds = ownedLeads.map(l => l.id);
        if (safeIds.length === 0)
            return res.status(404).json({ error: 'No matching leads found' });
        await prisma_1.default.$transaction([
            prisma_1.default.message.deleteMany({ where: { leadId: { in: safeIds } } }),
            prisma_1.default.reminder.deleteMany({ where: { leadId: { in: safeIds } } }),
            prisma_1.default.leadRemark.deleteMany({ where: { leadId: { in: safeIds } } }),
            prisma_1.default.lead.deleteMany({ where: { id: { in: safeIds } } }),
        ]);
        res.json({ message: `${safeIds.length} lead(s) deleted`, deleted: safeIds.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.bulkDeleteLeads = bulkDeleteLeads;
const bulkAssignLeads = async (req, res) => {
    try {
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const { ids, agentId } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' });
        }
        if (agentId) {
            const agent = await prisma_1.default.user.findFirst({ where: { id: agentId, businessId } });
            if (!agent)
                return res.status(404).json({ error: 'Invalid agent for this business' });
        }
        const { count } = await prisma_1.default.lead.updateMany({
            where: { id: { in: ids }, businessId },
            data: { assignedToId: agentId }
        });
        if (count > 0 && agentId) {
            // Notify the specific agent if they are online
            // Also notify the business group for general awareness
            (0, socket_1.getIO)().to(`business:${businessId}`).emit('lead:assigned', {
                count,
                agentId,
                ids
            });
        }
        res.json({ message: `${count} lead(s) assigned`, assigned: count });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.bulkAssignLeads = bulkAssignLeads;
const getLeadMessages = async (req, res) => {
    try {
        const id = req.params['id'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.findFirst({ where: { id, businessId } });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found or access denied' });
        const page = Math.max(1, parseInt(req.query['page'] || '1'));
        const limit = Math.min(200, parseInt(req.query['limit'] || '100'));
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            prisma_1.default.message.findMany({
                where: { leadId: id },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            prisma_1.default.message.count({ where: { leadId: id } }),
        ]);
        res.json({ data: messages, total, page, limit });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getLeadMessages = getLeadMessages;
const sendMessage = async (req, res) => {
    try {
        const id = req.params['id'];
        const { content, type = client_1.MessageType.TEXT, mediaUrl = null } = req.body;
        if (!content?.trim())
            return res.status(400).json({ error: 'Message content is required' });
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.findFirst({ where: { id, businessId } });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found or access denied' });
        let whatsappId = null;
        try {
            const response = await whatsapp_service_1.WhatsAppService.sendTextMessage(businessId, lead.phone, content);
            whatsappId = response?.messages?.[0]?.id || null;
        }
        catch (waError) {
            console.error('WhatsApp delivery failed:', waError.message);
        }
        const message = await prisma_1.default.message.create({
            data: {
                content,
                type: type,
                direction: client_1.MessageDirection.OUTBOUND,
                status: whatsappId ? 'SENT' : 'FAILED',
                whatsappId,
                leadId: id,
                mediaUrl
            }
        });
        await prisma_1.default.lead.update({ where: { id }, data: { updatedAt: new Date() } });
        (0, socket_1.getIO)().to(`business:${businessId}`).emit('message:new', { leadId: id, message });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.sendMessage = sendMessage;
const getLeadRemarks = async (req, res) => {
    try {
        const id = req.params['id'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.findFirst({ where: { id, businessId } });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        const remarks = await prisma_1.default.leadRemark.findMany({
            where: { leadId: id },
            include: {
                author: {
                    select: { email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(remarks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getLeadRemarks = getLeadRemarks;
const addLeadRemark = async (req, res) => {
    try {
        const id = req.params['id'];
        const { content, text } = req.body;
        const finalContent = content || text;
        if (!finalContent?.trim())
            return res.status(400).json({ error: 'Remark content is required' });
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.findFirst({ where: { id, businessId } });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        const remark = await prisma_1.default.leadRemark.create({
            data: { content: finalContent, leadId: id, authorId: req.user.id },
            include: {
                author: {
                    select: { email: true }
                }
            }
        });
        // Update lead timestamp
        await prisma_1.default.lead.update({ where: { id }, data: { updatedAt: new Date() } });
        res.status(201).json(remark);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addLeadRemark = addLeadRemark;
const getLeadReminders = async (req, res) => {
    try {
        const id = req.params['id'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.findFirst({ where: { id, businessId } });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        const reminders = await prisma_1.default.reminder.findMany({
            where: { leadId: id },
            orderBy: { date: 'asc' }
        });
        res.json(reminders);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getLeadReminders = getLeadReminders;
const getAllReminders = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const filter = { lead: { businessId } };
        if (req.user.role === 'SALES_EXEC') {
            filter.lead = { ...filter.lead, assignedToId: req.user.id };
        }
        const reminders = await prisma_1.default.reminder.findMany({
            where: filter,
            include: { lead: { select: { name: true, phone: true } } },
            orderBy: { date: 'asc' }
        });
        res.json(reminders);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllReminders = getAllReminders;
const createReminder = async (req, res) => {
    try {
        const id = req.params['id'];
        const { date, note } = req.body;
        if (!date || !note?.trim()) {
            return res.status(400).json({ error: 'Date and note are required' });
        }
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const lead = await prisma_1.default.lead.findFirst({ where: { id, businessId } });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        const reminder = await prisma_1.default.reminder.create({
            data: { date: new Date(date), note, leadId: id }
        });
        res.status(201).json(reminder);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createReminder = createReminder;
const updateReminder = async (req, res) => {
    try {
        const id = req.params['id'];
        const rid = req.params['rid'];
        const { isDone, date, note } = req.body;
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const reminder = await prisma_1.default.reminder.findFirst({
            where: { id: rid, lead: { id, businessId } }
        });
        if (!reminder)
            return res.status(404).json({ error: 'Reminder not found' });
        const updated = await prisma_1.default.reminder.update({
            where: { id: rid },
            data: {
                ...(isDone !== undefined && { isDone: Boolean(isDone) }),
                ...(date && { date: new Date(date) }),
                ...(note && { note }),
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateReminder = updateReminder;
const deleteReminder = async (req, res) => {
    try {
        const id = req.params['id'];
        const rid = req.params['rid'];
        const businessId = await resolveBusinessId(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const reminder = await prisma_1.default.reminder.findFirst({
            where: { id: rid, lead: { id, businessId } }
        });
        if (!reminder)
            return res.status(404).json({ error: 'Reminder not found' });
        await prisma_1.default.reminder.delete({ where: { id: rid } });
        res.json({ message: 'Reminder deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteReminder = deleteReminder;
//# sourceMappingURL=lead.controller.js.map