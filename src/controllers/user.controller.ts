import { Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types/express';
import { z } from 'zod';
import { resolveBusinessId } from '../lib/businessResolver';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.SALES_EXEC),
});

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const agents = await prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAgent = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as Role,
        businessId
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAgent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findFirst({
      where: { id, businessId }
    });

    if (!user) return res.status(404).json({ error: 'User not found or not in this business' });

    await prisma.$transaction([
      prisma.lead.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null }
      }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ message: 'User removed from business' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
