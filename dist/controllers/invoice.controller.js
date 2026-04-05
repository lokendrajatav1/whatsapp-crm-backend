"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoices = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const businessResolver_1 = require("../lib/businessResolver");
const createInvoiceSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().nonnegative(),
    taxAmount: zod_1.z.number().nonnegative().optional(),
    dueDate: zod_1.z.string(),
});
const updateInvoiceSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.InvoiceStatus).optional(),
    amount: zod_1.z.number().nonnegative().optional(),
    dueDate: zod_1.z.string().optional(),
});
const getInvoices = async (req, res) => {
    try {
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const period = req.query.period || 'all';
        const start = req.query.start;
        const end = req.query.end;
        const filter = { project: { businessId } };
        // Apply period filtering if requested
        if (period !== 'all') {
            const now = new Date();
            const startDate = new Date();
            if (period === 'today')
                startDate.setHours(0, 0, 0, 0);
            else if (period === 'week')
                startDate.setDate(now.getDate() - 7);
            else if (period === 'month')
                startDate.setDate(now.getDate() - 30);
            else if (period === 'year')
                startDate.setDate(now.getDate() - 365);
            filter.createdAt = { gte: startDate };
        }
        const invoices = await prisma_1.default.invoice.findMany({
            where: filter,
            include: {
                project: {
                    include: {
                        lead: { select: { id: true, name: true, businessName: true } },
                        service: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getInvoices = getInvoices;
const createInvoice = async (req, res) => {
    try {
        const parsed = createInvoiceSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const project = await prisma_1.default.project.findFirst({
            where: { id: parsed.data.projectId, businessId }
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found for this business' });
        const invoice = await prisma_1.default.invoice.create({
            data: {
                ...parsed.data,
                dueDate: new Date(parsed.data.dueDate)
            }
        });
        res.status(201).json(invoice);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createInvoice = createInvoice;
const updateInvoice = async (req, res) => {
    try {
        const id = req.params.id;
        const parsed = updateInvoiceSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const existing = await prisma_1.default.invoice.findFirst({
            where: { id, project: { businessId } }
        });
        if (!existing)
            return res.status(404).json({ error: 'Invoice not found' });
        const invoice = await prisma_1.default.invoice.update({
            where: { id },
            data: {
                status: parsed.data.status,
                amount: parsed.data.amount,
                dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
            }
        });
        res.json(invoice);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateInvoice = updateInvoice;
const deleteInvoice = async (req, res) => {
    try {
        const id = req.params.id;
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const existing = await prisma_1.default.invoice.findFirst({
            where: { id, project: { businessId } }
        });
        if (!existing)
            return res.status(404).json({ error: 'Invoice not found' });
        await prisma_1.default.invoice.delete({ where: { id } });
        res.json({ message: 'Invoice deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteInvoice = deleteInvoice;
//# sourceMappingURL=invoice.controller.js.map