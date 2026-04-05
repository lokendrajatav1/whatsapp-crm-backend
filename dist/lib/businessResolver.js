"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBusinessId = resolveBusinessId;
const prisma_1 = __importDefault(require("../config/prisma"));
/**
 * Resolves the businessId for a request.
 * 1. Returns user's own businessId if present.
 * 2. If user is SUPER_ADMIN, allows overriding via 'x-business-id' header or 'businessId' query.
 * 3. Fallback to database lookup if needed.
 */
async function resolveBusinessId(req) {
    try {
        const { role, businessId: userBusinessId, id: userId } = req.user || {};
        // 1. Regular admins/staff MUST use their own businessId
        if (userBusinessId)
            return userBusinessId;
        // 2. Super Admins (owner) can audit any business via Header or Query
        if (role === 'SUPER_ADMIN') {
            const explicitId = req.headers['x-business-id'] || req.query.businessId;
            if (explicitId)
                return explicitId;
        }
        if (!userId)
            return null;
        // 3. Fallback for accounts without businessId in token but exists in DB
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { businessId: true }
        });
        return user?.businessId ?? null;
    }
    catch (err) {
        console.error('[resolveBusinessId Error]:', err);
        return null;
    }
}
//# sourceMappingURL=businessResolver.js.map