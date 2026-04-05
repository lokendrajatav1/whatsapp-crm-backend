import { AuthRequest } from '../types/express';
import prisma from '../config/prisma';

/**
 * Resolves the businessId for a request.
 * 1. Returns user's own businessId if present.
 * 2. If user is SUPER_ADMIN, allows overriding via 'x-business-id' header or 'businessId' query.
 * 3. Fallback to database lookup if needed.
 */
export async function resolveBusinessId(req: AuthRequest): Promise<string | null> {
  try {
    const { role, businessId: userBusinessId, id: userId } = req.user || {};
    
    // 1. Regular admins/staff MUST use their own businessId
    if (userBusinessId) return userBusinessId;
    
    // 2. Super Admins (owner) can audit any business via Header or Query
    if (role === 'SUPER_ADMIN') {
      const explicitId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
      if (explicitId) return explicitId;
    }

    if (!userId) return null;
    
    // 3. Fallback for accounts without businessId in token but exists in DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true }
    });
    return user?.businessId ?? null;
  } catch (err) {
    console.error('[resolveBusinessId Error]:', err);
    return null;
  }
}
