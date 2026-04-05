import { Router } from 'express';
import { getWhatsAppConfig, updateWhatsAppConfig, getBusinessProfile } from '../controllers/settings.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.get('/business', getBusinessProfile);
router.get('/whatsapp', getWhatsAppConfig);
router.post('/whatsapp', updateWhatsAppConfig);

export default router;
