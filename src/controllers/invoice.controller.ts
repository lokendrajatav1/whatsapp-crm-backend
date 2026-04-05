import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types/express';
import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';
import { resolveBusinessId } from '../lib/businessResolver';

const createInvoiceSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().optional(),
  dueDate: z.string(),
});

const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  amount: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
});

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const period = (req.query.period as string) || 'all';
    const start = req.query.start as string;
    const end = req.query.end as string;
    
    const filter: any = { project: { businessId } };

    // Apply period filtering if requested
    if (period !== 'all') {
      const now = new Date();
      const startDate = new Date();
      if (period === 'today') startDate.setHours(0, 0, 0, 0);
      else if (period === 'week') startDate.setDate(now.getDate() - 7);
      else if (period === 'month') startDate.setDate(now.getDate() - 30);
      else if (period === 'year') startDate.setDate(now.getDate() - 365);
      
      filter.createdAt = { gte: startDate };
    }

    const invoices = await prisma.invoice.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, businessId }
    });
    if (!project) return res.status(404).json({ error: 'Project not found for this business' });

    const invoice = await prisma.invoice.create({
      data: {
        ...parsed.data,
        dueDate: new Date(parsed.data.dueDate)
      }
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const existing = await prisma.invoice.findFirst({
      where: { id, project: { businessId } }
    });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: parsed.data.status,
        amount: parsed.data.amount,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
      }
    });
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const existing = await prisma.invoice.findFirst({
      where: { id, project: { businessId } }
    });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    await prisma.invoice.delete({ where: { id } });
    res.json({ message: 'Invoice deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
