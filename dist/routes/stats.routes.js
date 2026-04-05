"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controllers/stats.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, stats_controller_1.getStats);
router.get('/team', auth_middleware_1.protect, stats_controller_1.getTeamStats);
exports.default = router;
//# sourceMappingURL=stats.routes.js.map