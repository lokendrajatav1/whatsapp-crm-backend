import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest } from '../types/express';
import { Role } from '@prisma/client';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  businessId: string;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, config.jwtSecret) as any;
    
    // Validate that required fields exist before assigning
    if (!verified.id || !verified.role || !verified.businessId) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    req.user = {
      id: verified.id,
      email: verified.email,
      role: verified.role as Role,
      businessId: verified.businessId
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Requires ADMIN or SUPER_ADMIN role (read from JWT — no DB call).
 */
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.user.role === Role.ADMIN || req.user.role === Role.SUPER_ADMIN) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admin role required' });
};

/**
 * Requires SUPER_ADMIN role (read from JWT — no DB call).
 */
export const superAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.user.role === Role.SUPER_ADMIN) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Super Admin role required' });
};

/**
 * Higher-order middleware to check for one or several specific roles.
 */
export const hasRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role === Role.SUPER_ADMIN || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: `Forbidden: One of these roles required: ${roles.join(', ')}` });
  };
};
