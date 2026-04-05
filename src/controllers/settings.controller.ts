import { Request, Response } from 'express';
import prisma from '../config/prisma';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const getWhatsAppConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
       where: { id: req.user.id },
       select: { businessId: true }
    });

    if (!user?.businessId) return res.status(404).json({ error: 'Business profile not found for this account' });

    const config = await prisma.whatsAppConfig.findUnique({
      where: { businessId: user.businessId }
    });

    res.json(config || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWhatsAppConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumberId, accessToken, webhookToken } = req.body;
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
       where: { id: req.user.id },
       select: { businessId: true }
    });

    if (!user?.businessId) return res.status(404).json({ error: 'No business associated with this account' });

    const config = await prisma.whatsAppConfig.upsert({
      where: { businessId: user.businessId },
      update: { phoneNumberId, accessToken, webhookToken },
      create: { 
        businessId: user.businessId, 
        phoneNumberId, 
        accessToken, 
        webhookToken 
      }
    });

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const getBusinessProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
       where: { id: req.user.id },
       select: { businessId: true }
    });

    if (!user?.businessId) return res.status(404).json({ error: 'No business associated with this account' });

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            leads: true,
            projects: true,
            services: true
          }
        }
      }
    });

    res.json(business);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
