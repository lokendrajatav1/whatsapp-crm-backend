import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Role, SubscriptionPlan } from '@prisma/client';

export const createBusiness = async (req: Request, res: Response) => {
  try {
    const { name, ownerEmail, ownerPassword, plan = 'FREE' } = req.body;

    // 1. Check if business owner already exists
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    // 2. Create Business & Subscription together
    const business = await prisma.business.create({
      data: {
        name,
        subscription: {
          create: { plan: plan as SubscriptionPlan }
        },
        users: {
          create: {
            email: ownerEmail,
            password: await bcrypt.hash(ownerPassword, 10),
            role: Role.ADMIN
          }
        }
      }
    });

    res.status(201).json({ business });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBusinesses = async (req: Request, res: Response) => {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        subscription: true,
        _count: {
          select: { users: true, leads: true }
        }
      }
    });
    res.json(businesses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const configureWhatsApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phoneNumberId, accessToken, webhookToken } = req.body;

    const config = await prisma.whatsAppConfig.upsert({
      where: { businessId: id as string },
      update: { phoneNumberId, accessToken, webhookToken },
      create: { businessId: id as string, phoneNumberId, accessToken, webhookToken }
    });

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Transaction to delete everything
    await prisma.$transaction([
      prisma.whatsAppConfig.deleteMany({ where: { businessId: id as string } }),
      prisma.subscription.deleteMany({ where: { businessId: id as string } }),
      prisma.autoReplyRule.deleteMany({ where: { businessId: id as string } }),
      prisma.message.deleteMany({ where: { lead: { businessId: id as string } } }),
      prisma.lead.deleteMany({ where: { businessId: id as string } }),
      prisma.user.deleteMany({ where: { businessId: id as string } }),
      prisma.business.delete({ where: { id: id as string } })
    ]);

    res.json({ message: 'Business and all associated data deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGlobalUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        business: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
