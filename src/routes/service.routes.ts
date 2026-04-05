import { Router } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/service.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getServices);
router.post('/', admin, createService);
router.patch('/:id', admin, updateService);
router.delete('/:id', admin, deleteService);

export default router;
