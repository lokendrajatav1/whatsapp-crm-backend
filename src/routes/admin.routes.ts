import { Router } from 'express';
import { createBusiness, getBusinesses, configureWhatsApp, deleteBusiness, getGlobalUsers } from '../controllers/admin.controller';
import { protect, superAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Only Super Admins access these routes
router.post('/businesses', protect, superAdmin, createBusiness);
router.get('/businesses', protect, superAdmin, getBusinesses);
router.get('/users', protect, superAdmin, getGlobalUsers);
router.post('/businesses/:id/whatsapp', protect, superAdmin, configureWhatsApp);
router.delete('/businesses/:id', protect, superAdmin, deleteBusiness);

export default router;
