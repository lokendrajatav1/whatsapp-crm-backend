"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const prisma_1 = __importDefault(require("./config/prisma"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const webhook_route_1 = __importDefault(require("./routes/webhook.route"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const autoreply_routes_1 = __importDefault(require("./routes/autoreply.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500 // Increased for rapid navigation
});
app.use('/api/', limiter);
// Strict limiter for auth
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for smoother dev/testing
    message: { error: 'Too many login attempts, please try again later' }
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Real health check route
app.get('/health', async (req, res) => {
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'ok',
            db: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
        res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
    }
});
// Routes
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/leads', lead_routes_1.default);
app.use('/api/stats', stats_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/autoreply', autoreply_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/webhook/whatsapp', webhook_route_1.default);
// Route catch-all for undefined endpoints
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
// Global Error Handler
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map