import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types/express';
import { resolveBusinessId } from '../lib/businessResolver';

// Fallback Enums to ensure compilation even if Prisma type-generation is stale in the editor
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEAM_LEADER = 'TEAM_LEADER',
  SALES_EXEC = 'SALES_EXEC',
  ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
  FINANCE = 'FINANCE'
}

enum LeadStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  DEAD = 'DEAD'
}

enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE'
}

const getDateRange = (period: string, start?: string, end?: string) => {
  const now = new Date();
  const startDate = new Date();
  
  if (period === 'custom' && start && end) {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    return { gte: s, lte: e };
  }

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      return { gte: startDate };
    case 'week':
      startDate.setDate(now.getDate() - 7);
      return { gte: startDate };
    case 'month':
      startDate.setDate(now.getDate() - 30);
      return { gte: startDate };
    case 'year':
      startDate.setDate(now.getDate() - 365);
      return { gte: startDate };
    case 'all':
    default:
      return null;
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const period = (req.query.period as string) || 'all';
    const start = req.query.start as string;
    const end = req.query.end as string;
    const dateFilter = getDateRange(period, start, end);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // SUPER_ADMIN Global Intelligence
    if (user.role === Role.SUPER_ADMIN) {
      const globalFilter = dateFilter ? { createdAt: dateFilter } : {};
      const [totalBusinesses, totalUsers, totalLeads, activeSubs] = await Promise.all([
        prisma.business.count({ where: globalFilter }),
        prisma.user.count({ where: globalFilter }),
        prisma.lead.count({ where: globalFilter }),
        prisma.subscription.count({ where: { isActive: true } })
      ]);

      return res.json({
        totalBusinesses,
        totalUsers,
        totalLeads,
        activeSubs,
        isSuperAdmin: true
      });
    }

    // Business Level Operational Analytics
    const businessId = user.businessId;
    if (!businessId) return res.status(404).json({ error: 'Business context missing' });

    const leadFilter: any = { businessId };
    if (dateFilter) leadFilter.createdAt = dateFilter;
    
    // Role-based data visibility
    if (user.role === Role.SALES_EXEC) {
      leadFilter.assignedToId = user.id;
    }

    console.log(`[Stats] Fetching operational data for period: ${period}`);
    const [
      totalLeads, 
      newLeads, 
      inProgressLeads, 
      closedLeads, 
      totalProjects, 
      pendingInvoices, 
      totalRevenue
    ] = await Promise.all([
      prisma.lead.count({ where: leadFilter }),
      prisma.lead.count({ where: { ...leadFilter, status: LeadStatus.NEW } }),
      prisma.lead.count({ where: { ...leadFilter, status: LeadStatus.IN_PROGRESS } }),
      prisma.lead.count({ where: { ...leadFilter, status: LeadStatus.CLOSED } }),
      prisma.project.count({ 
        where: { 
          businessId, 
          ...(dateFilter ? { startDate: dateFilter } : {}) 
        } 
      }),
      prisma.invoice.count({ 
        where: { 
          project: { businessId }, 
          status: InvoiceStatus.PENDING,
          ...(dateFilter ? { dueDate: dateFilter } : {})
        } 
      }),
      prisma.invoice.aggregate({
        where: { 
          project: { businessId }, 
          status: InvoiceStatus.PAID,
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalLeads,
      newLeads,
      inProgressLeads,
      closedLeads,
      totalProjects,
      pendingInvoices,
      revenueToDate: totalRevenue._sum.amount || 0,
      conversionRate: totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0,
      isSuperAdmin: false,
      role: user.role
    });
  } catch (error: any) {
    console.error('[Stats Controller Error]:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTeamStats = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business context missing' });

    const period = (req.query.period as string) || 'all';
    const start = req.query.start as string;
    const end = req.query.end as string;
    const dateFilter = getDateRange(period, start, end);

    // Fetch all users in the business along with their performance metrics
    const users = await prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        role: true,
        assignedLeads: {
          where: dateFilter ? { createdAt: dateFilter } : {},
          select: {
            status: true,
            projects: {
              select: {
                paidAmount: true,
                startDate: true
              }
            }
          }
        }
      }
    });

    const performance = users.map(user => {
      const totalLeads = user.assignedLeads.length;
      const closedLeads = user.assignedLeads.filter(l => l.status === 'CLOSED').length;
      
      // Calculate revenue from projects linked to leads assigned to this user
      const totalRevenue = user.assignedLeads.reduce((acc, lead) => {
        return acc + lead.projects.reduce((pAcc, project) => {
          if (dateFilter && project.startDate < (dateFilter.gte as Date)) return pAcc;
          return pAcc + (project.paidAmount || 0);
        }, 0);
      }, 0);

      return {
        id: user.id,
        name: user.email.split('@')[0], 
        email: user.email,
        role: user.role,
        conversionRate: totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0,
        totalLeads,
        totalRevenue
      };
    });

    res.json(performance);
  } catch (error: any) {
    console.error('[getTeamStats Error]:', error);
    res.status(500).json({ error: error.message });
  }
};
