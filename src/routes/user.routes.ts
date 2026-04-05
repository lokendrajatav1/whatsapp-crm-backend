import { Router } from 'express';
import { getAgents, createAgent, deleteAgent } from '../controllers/user.controller';
import { protect, admin, hasRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.get('/agents', hasRole(Role.ADMIN, Role.TEAM_LEADER), getAgents);
router.post('/agents', admin, createAgent);
router.delete('/agents/:id', admin, deleteAgent);

export default router;
