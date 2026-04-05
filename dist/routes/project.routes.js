"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
const managers = [client_1.Role.ADMIN, client_1.Role.TEAM_LEADER, client_1.Role.ACCOUNT_MANAGER];
router.get('/', project_controller_1.getProjects);
router.post('/', (0, auth_middleware_1.hasRole)(...managers), project_controller_1.createProject);
router.patch('/:id', (0, auth_middleware_1.hasRole)(...managers, client_1.Role.FINANCE), project_controller_1.updateProject);
router.delete('/:id', (0, auth_middleware_1.hasRole)(...managers), project_controller_1.deleteProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map