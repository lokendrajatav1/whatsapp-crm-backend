import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types/express';
import { z } from 'zod';
import { ServiceType } from '@prisma/client';

const createServiceSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.nativeEnum(ServiceType),
  basePrice: z.number().nonnegative(),
  description: z.string().optional(),
});

const updateServiceSchema = createServiceSchema.partial();

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const businessId = req.user?.businessId;
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const service = await prisma.service.create({
      data: { ...parsed.data, businessId }
    });
    res.status(201).json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const existing = await prisma.service.findFirst({
      where: { id, businessId: req.user?.businessId }
    });
    if (!existing) return res.status(404).json({ error: 'Service not found' });

    const service = await prisma.service.update({
      where: { id },
      data: parsed.data
    });
    res.json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.service.findFirst({
      where: { id, businessId: req.user?.businessId }
    });
    if (!existing) return res.status(404).json({ error: 'Service not found' });

    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
