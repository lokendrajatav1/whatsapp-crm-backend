"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjects = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const businessResolver_1 = require("../lib/businessResolver");
const createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    leadId: zod_1.z.string().uuid(),
    serviceId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    totalValue: zod_1.z.number().nonnegative(),
    milestones: zod_1.z.any().optional(),
});
const updateProjectSchema = createProjectSchema.partial().extend({
    status: zod_1.z.nativeEnum(client_1.ProjectStatus).optional(),
    paidAmount: zod_1.z.number().nonnegative().optional(),
    progress: zod_1.z.number().min(0).max(100).optional(),
});
const getProjects = async (req, res) => {
    try {
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const filter = { businessId };
        const projects = await prisma_1.default.project.findMany({
            where: filter,
            include: {
                lead: { select: { id: true, name: true, businessName: true, phone: true } },
                service: true,
                _count: { select: { invoices: true } }
            },
            orderBy: { startDate: 'desc' }
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    try {
        const parsed = createProjectSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const [lead, service] = await Promise.all([
            prisma_1.default.lead.findFirst({ where: { id: parsed.data.leadId, businessId } }),
            prisma_1.default.service.findFirst({ where: { id: parsed.data.serviceId, businessId } })
        ]);
        if (!lead)
            return res.status(404).json({ error: 'Lead not found for this business' });
        if (!service)
            return res.status(404).json({ error: 'Service not found for this business' });
        const { leadId, serviceId, startDate, endDate, ...rest } = parsed.data;
        const project = await prisma_1.default.project.create({
            data: {
                ...rest,
                business: { connect: { id: businessId } },
                lead: { connect: { id: leadId } },
                service: { connect: { id: serviceId } },
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null
            },
            include: {
                lead: { select: { id: true, name: true } },
                service: true
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        const id = req.params.id;
        const parsed = updateProjectSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const existing = await prisma_1.default.project.findFirst({
            where: { id, businessId }
        });
        if (!existing)
            return res.status(404).json({ error: 'Project not found' });
        const { leadId, serviceId, startDate, endDate, ...rest } = parsed.data;
        const project = await prisma_1.default.project.update({
            where: { id },
            data: {
                ...rest,
                lead: leadId ? { connect: { id: leadId } } : undefined,
                service: serviceId ? { connect: { id: serviceId } } : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            },
            include: {
                lead: { select: { id: true, name: true } },
                service: true
            }
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const id = req.params.id;
        const businessId = await (0, businessResolver_1.resolveBusinessId)(req);
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const existing = await prisma_1.default.project.findFirst({
            where: { id, businessId }
        });
        if (!existing)
            return res.status(404).json({ error: 'Project not found' });
        const count = await prisma_1.default.invoice.count({ where: { projectId: id } });
        if (count > 0)
            return res.status(400).json({ error: 'Cannot delete project with existing invoices' });
        await prisma_1.default.project.delete({ where: { id } });
        res.json({ message: 'Project deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=project.controller.js.map