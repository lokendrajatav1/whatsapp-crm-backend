import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { config } from '../config';

import { AuthRequest } from '../types/express';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, businessName } = req.body;

    if (!businessName) {
       return res.status(400).json({ error: 'Business name is required for registration.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        business: { create: { name: businessName } },
        role: 'ADMIN'
      },
      include: { business: true }
    });

    // Embed role + businessId so middleware needs no DB round-trip
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, businessId: user.businessId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    res.status(201).json({ user: userSafe, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, businessId: user.businessId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    res.status(200).json({ user: userSafe, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { business: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password: _, ...userSafe } = user;
    res.json(userSafe);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
