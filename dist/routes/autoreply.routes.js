"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autoreply_controller_1 = require("../controllers/autoreply.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, autoreply_controller_1.getRules);
router.post('/', auth_middleware_1.protect, autoreply_controller_1.createRule);
router.patch('/:id', auth_middleware_1.protect, autoreply_controller_1.updateRule);
router.delete('/:id', auth_middleware_1.protect, autoreply_controller_1.deleteRule);
exports.default = router;
//# sourceMappingURL=autoreply.routes.js.map