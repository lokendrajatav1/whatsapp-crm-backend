"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.get('/business', settings_controller_1.getBusinessProfile);
router.get('/whatsapp', settings_controller_1.getWhatsAppConfig);
router.post('/whatsapp', settings_controller_1.updateWhatsAppConfig);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map