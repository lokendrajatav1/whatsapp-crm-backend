"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.get('/agents', (0, auth_middleware_1.hasRole)(client_1.Role.ADMIN, client_1.Role.TEAM_LEADER), user_controller_1.getAgents);
router.post('/agents', auth_middleware_1.admin, user_controller_1.createAgent);
router.patch('/agents/:id', auth_middleware_1.admin, user_controller_1.updateAgent);
router.delete('/agents/:id', auth_middleware_1.admin, user_controller_1.deleteAgent);
exports.default = router;
//# sourceMappingURL=user.routes.js.map