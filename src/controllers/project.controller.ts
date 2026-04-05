import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types/express';
import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';
import { resolveBusinessId } from '../lib/businessResolver';

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  leadId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalValue: z.number().nonnegative(),
  milestones: z.any().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.nativeEnum(ProjectStatus).optional(),
  paidAmount: z.number().nonnegative().optional(),
});

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const filter: any = { businessId };
    
    const projects = await prisma.project.findMany({
      where: filter,
      include: { 
        lead: { select: { id: true, name: true, businessName: true, phone: true } },
        service: true,
        _count: { select: { invoices: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const [lead, service] = await Promise.all([
      prisma.lead.findFirst({ where: { id: parsed.data.leadId, businessId } }),
      prisma.service.findFirst({ where: { id: parsed.data.serviceId, businessId } })
    ]);

    if (!lead) return res.status(404).json({ error: 'Lead not found for this business' });
    if (!service) return res.status(404).json({ error: 'Service not found for this business' });

    const project = await prisma.project.create({
      data: {
        ...parsed.data, 
        businessId,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null
      },
      include: {
        lead: { select: { id: true, name: true } },
        service: true
      }
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const existing = await prisma.project.findFirst({
      where: { id, businessId }
    });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined
      },
      include: {
        lead: { select: { id: true, name: true } },
        service: true
      }
    });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const existing = await prisma.project.findFirst({
      where: { id, businessId }
    });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const count = await prisma.invoice.count({ where: { projectId: id } });
    if (count > 0) return res.status(400).json({ error: 'Cannot delete project with existing invoices' });

    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
