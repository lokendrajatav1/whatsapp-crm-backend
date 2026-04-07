import express, { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import prisma from './config/prisma';

import authRoutes from './routes/auth.routes';
import leadRoutes from './routes/lead.routes';
import statsRoutes from './routes/stats.routes';
import webhookRoutes from './routes/webhook.route';
import settingsRoutes from './routes/settings.routes';
import adminRoutes from './routes/admin.routes';
import autoReplyRoutes from './routes/autoreply.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import projectRoutes from './routes/project.routes';
import invoiceRoutes from './routes/invoice.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { requestTiming } from './middlewares/timing.middleware';

const app: Express = express();

// Performance & Security Middlewares
app.use(requestTiming);
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500 // Increased for rapid navigation
});
app.use('/api/', limiter);

// Strict limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, // Increased for smoother dev/testing
  message: { error: 'Too many login attempts, please try again later' }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Real health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'ok', 
      db: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/autoreply', autoReplyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/webhook/whatsapp', webhookRoutes);

// Route catch-all for undefined endpoints
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
