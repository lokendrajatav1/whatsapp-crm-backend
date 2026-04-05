"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServices = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    type: zod_1.z.nativeEnum(client_1.ServiceType),
    basePrice: zod_1.z.number().nonnegative(),
    description: zod_1.z.string().optional(),
});
const updateServiceSchema = createServiceSchema.partial();
const getServices = async (req, res) => {
    try {
        const businessId = req.user?.businessId;
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const services = await prisma_1.default.service.findMany({
            where: { businessId },
            orderBy: { name: 'asc' }
        });
        res.json(services);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getServices = getServices;
const createService = async (req, res) => {
    try {
        const parsed = createServiceSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        const businessId = req.user?.businessId;
        if (!businessId)
            return res.status(404).json({ error: 'Business not found' });
        const service = await prisma_1.default.service.create({
            data: { ...parsed.data, businessId }
        });
        res.status(201).json(service);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const id = req.params.id;
        const parsed = updateServiceSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        const existing = await prisma_1.default.service.findFirst({
            where: { id, businessId: req.user?.businessId }
        });
        if (!existing)
            return res.status(404).json({ error: 'Service not found' });
        const service = await prisma_1.default.service.update({
            where: { id },
            data: parsed.data
        });
        res.json(service);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateService = updateService;
const deleteService = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.default.service.findFirst({
            where: { id, businessId: req.user?.businessId }
        });
        if (!existing)
            return res.status(404).json({ error: 'Service not found' });
        await prisma_1.default.service.delete({ where: { id } });
        res.json({ message: 'Service deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteService = deleteService;
//# sourceMappingURL=service.controller.js.map