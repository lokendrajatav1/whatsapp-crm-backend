import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

router.get('/', WebhookController.verifyWebhook);
router.post('/', WebhookController.handleWebhookEvent);

export default router;
