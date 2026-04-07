import { Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types/express';
import { z } from 'zod';
import { resolveBusinessId } from '../lib/businessResolver';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.SALES_EXEC),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(Role).optional(),
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
        name: true,
        phone: true,
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

    const { email, password, role, name, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: role as Role,
        businessId
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
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

export const updateAgent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      // Return first error message as string to prevent frontend crashes
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || 'Invalid input';
      return res.status(400).json({ error: firstError });
    }

    const { password, role, name, phone, email: newEmail } = parsed.data;

    // Verify user belongs to same business
    const userToUpdate = await prisma.user.findFirst({
      where: { id, businessId }
    });

    if (!userToUpdate) return res.status(404).json({ error: 'User not found in this business' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updateData: any = {};
    if (hashedPassword) updateData.password = hashedPassword;
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (newEmail) updateData.email = newEmail;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
