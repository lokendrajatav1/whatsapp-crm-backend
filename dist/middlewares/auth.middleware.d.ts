import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { Role } from '@prisma/client';
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Requires ADMIN or SUPER_ADMIN role (read from JWT — no DB call).
 */
export declare const admin: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Requires SUPER_ADMIN role (read from JWT — no DB call).
 */
export declare const superAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Higher-order middleware to check for one or several specific roles.
 */
export declare const hasRole: (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
