import { Router } from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { protect, hasRole } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const managers = [Role.ADMIN, Role.TEAM_LEADER, Role.ACCOUNT_MANAGER];

router.get('/', getProjects);
router.post('/', hasRole(...managers), createProject);
router.patch('/:id', hasRole(...managers, Role.FINANCE), updateProject);
router.delete('/:id', hasRole(...managers), deleteProject);

export default router;
