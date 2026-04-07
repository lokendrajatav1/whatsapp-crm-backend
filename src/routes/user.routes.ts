import { Router } from 'express';
import { getAgents, createAgent, deleteAgent, updateAgent } from '../controllers/user.controller';
import { protect, admin, hasRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

router.get('/agents', hasRole(Role.ADMIN, Role.TEAM_LEADER, Role.ACCOUNT_MANAGER), getAgents);
router.post('/agents', admin, createAgent);
router.patch('/agents/:id', admin, updateAgent);
router.delete('/agents/:id', admin, deleteAgent);

export default router;
