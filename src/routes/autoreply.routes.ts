import { Router } from 'express';
import { getRules, createRule, updateRule, deleteRule } from '../controllers/autoreply.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', protect, getRules);
router.post('/', protect, createRule);
router.patch('/:id', protect, updateRule);
router.delete('/:id', protect, deleteRule);

export default router;
