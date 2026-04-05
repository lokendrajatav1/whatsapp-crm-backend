import { Request, Response } from 'express';
import prisma from '../config/prisma';

import { AuthRequest } from '../types/express';

export const getRules = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user?.businessId) return res.status(404).json({ error: 'Business not found' });

    const rules = await prisma.autoReplyRule.findMany({
      where: { businessId: user.businessId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { keyword, response, type = 'KEYWORD', isActive = true } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.businessId) return res.status(404).json({ error: 'Business not found' });

    const rule = await prisma.autoReplyRule.create({
      data: {
        keyword: type === 'KEYWORD' ? keyword : null,
        response,
        type,
        isActive,
        businessId: user.businessId
      }
    });

    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { keyword, response, isActive, type } = req.body;

    const businessId = req.user?.businessId;
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    // Ensure rule belongs to this business
    const existing = await prisma.autoReplyRule.findFirst({
      where: { id: id as string, businessId }
    });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });

    const rule = await prisma.autoReplyRule.update({
      where: { id: id as string },
      data: { keyword, response, isActive, type }
    });

    res.json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    // Ensure rule belongs to this business
    const existing = await prisma.autoReplyRule.findFirst({
      where: { id: id as string, businessId }
    });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });

    await prisma.autoReplyRule.delete({ where: { id: id as string } });
    res.json({ message: 'Rule deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
