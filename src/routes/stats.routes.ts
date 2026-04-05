import { Router } from 'express';
import { getStats, getTeamStats } from '../controllers/stats.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', protect, getStats);
router.get('/team', protect, getTeamStats);

export default router;
