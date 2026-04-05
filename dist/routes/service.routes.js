"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.get('/', service_controller_1.getServices);
router.post('/', auth_middleware_1.admin, service_controller_1.createService);
router.patch('/:id', auth_middleware_1.admin, service_controller_1.updateService);
router.delete('/:id', auth_middleware_1.admin, service_controller_1.deleteService);
exports.default = router;
//# sourceMappingURL=service.routes.js.map