"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Only Super Admins access these routes
router.post('/businesses', auth_middleware_1.protect, auth_middleware_1.superAdmin, admin_controller_1.createBusiness);
router.get('/businesses', auth_middleware_1.protect, auth_middleware_1.superAdmin, admin_controller_1.getBusinesses);
router.get('/users', auth_middleware_1.protect, auth_middleware_1.superAdmin, admin_controller_1.getGlobalUsers);
router.post('/businesses/:id/whatsapp', auth_middleware_1.protect, auth_middleware_1.superAdmin, admin_controller_1.configureWhatsApp);
router.delete('/businesses/:id', auth_middleware_1.protect, auth_middleware_1.superAdmin, admin_controller_1.deleteBusiness);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map