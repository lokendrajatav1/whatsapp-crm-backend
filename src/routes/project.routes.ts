import { Router } from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { protect, hasRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

// Projects can be managed by ADMIN, TL, and ACCOUNT_MANAGER
const projectManager = hasRole('ADMIN', 'TEAM_LEADER', 'ACCOUNT_MANAGER');

router.get('/', getProjects);
router.post('/', projectManager, createProject);
router.patch('/:id', projectManager, updateProject);
router.delete('/:id', projectManager, deleteProject);

export default router;
