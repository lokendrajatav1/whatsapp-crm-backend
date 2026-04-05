"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
router.get('/', webhook_controller_1.WebhookController.verifyWebhook);
router.post('/', webhook_controller_1.WebhookController.handleWebhookEvent);
exports.default = router;
//# sourceMappingURL=webhook.route.js.map