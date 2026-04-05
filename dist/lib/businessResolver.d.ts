import { AuthRequest } from '../types/express';
/**
 * Resolves the businessId for a request.
 * 1. Returns user's own businessId if present.
 * 2. If user is SUPER_ADMIN, allows overriding via 'x-business-id' header or 'businessId' query.
 * 3. Fallback to database lookup if needed.
 */
export declare function resolveBusinessId(req: AuthRequest): Promise<string | null>;
