import { Response } from 'express';
import prisma from '../config/prisma';
import { WhatsAppService } from '../services/whatsapp.service';
import { getIO } from '../lib/socket';
import { LeadStatus, MessageType, MessageDirection } from '@prisma/client';
import { z } from 'zod';

import { AuthRequest } from '../types/express';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(5).max(25),
  businessName: z.string().max(120).optional(),
  source: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

const updateLeadSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(5).max(25).optional(),
  businessName: z.string().max(120).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function resolveBusinessId(req: AuthRequest): Promise<string | null> {
  try {
    const { role, businessId: userBusinessId, id: userId } = req.user || {};
    
    // 1. Regular admins/staff MUST use their own businessId
    if (userBusinessId) return userBusinessId;
    
    // 2. Super Admins (you) can audit any business via Header or Query
    if (role === 'SUPER_ADMIN') {
      const explicitId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
      if (explicitId) return explicitId;
    }

    if (!userId) return null;
    
    // 3. Fallback for accounts without businessId in token but exists in DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true }
    });
    return user?.businessId ?? null;
  } catch (err) {
    console.error('[resolveBusinessId Error]:', err);
    return null;
  }
}

// ─── Controllers ─────────────────────────────────────────────────────────────

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const page  = Math.max(1, parseInt(req.query['page']  as string || '1'));
    const limit = Math.min(100, parseInt(req.query['limit'] as string || '50'));
    const skip  = (page - 1) * limit;
    const search = (req.query['search'] as string || '').trim();

    const filter: any = { businessId };

    // Role-based visibility
    if (req.user.role === 'SALES_EXEC') {
      filter.assignedToId = req.user.id;
    }

    if (search) {
      filter.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { businessName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: filter,
        include: { 
          assignedTo: { select: { id: true, email: true } },
          _count: { select: { remarks: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where: filter }),
    ]);

    res.json({ data: leads, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('[getLeads Error]:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
};

export const getLead = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const filter: any = { id, businessId };
    if (req.user?.role === 'SALES_EXEC') filter.assignedToId = req.user.id;

    const lead = await prisma.lead.findFirst({
      where: filter, 
      include: { 
        assignedTo: { select: { id: true, email: true } },
        remarks: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = createLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.create({
      data: { 
        ...parsed.data, 
        businessId,
        ...(req.user.role === 'SALES_EXEC' && { assignedToId: req.user.id })
      }
    });

    res.status(201).json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const filter: any = { id, businessId };
    if (req.user?.role === 'SALES_EXEC') filter.assignedToId = req.user.id;

    const existing = await prisma.lead.findFirst({ where: filter });
    if (!existing) return res.status(404).json({ error: 'Lead not found or access denied' });

    const parsed = updateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: parsed.data,
      include: { assignedTo: { select: { id: true, email: true } } }
    });
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const filter: any = { id, businessId };
    if (req.user?.role === 'SALES_EXEC') filter.assignedToId = req.user.id;

    const lead = await prisma.lead.findFirst({ where: filter });
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { leadId: id } }),
      prisma.reminder.deleteMany({ where: { leadId: id } }),
      prisma.leadRemark.deleteMany({ where: { leadId: id } }),
      prisma.lead.delete({ where: { id } })
    ]);

    res.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkDeleteLeads = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const ownedLeads = await prisma.lead.findMany({
      where: { id: { in: ids }, businessId },
      select: { id: true }
    });
    const safeIds = ownedLeads.map(l => l.id);

    if (safeIds.length === 0) return res.status(404).json({ error: 'No matching leads found' });

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { leadId: { in: safeIds } } }),
      prisma.reminder.deleteMany({ where: { leadId: { in: safeIds } } }),
      prisma.leadRemark.deleteMany({ where: { leadId: { in: safeIds } } }),
      prisma.lead.deleteMany({ where: { id: { in: safeIds } } }),
    ]);

    res.json({ message: `${safeIds.length} lead(s) deleted`, deleted: safeIds.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkAssignLeads = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const { ids, agentId } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    if (agentId) {
      const agent = await prisma.user.findFirst({ where: { id: agentId, businessId } });
      if (!agent) return res.status(404).json({ error: 'Invalid agent for this business' });
    }

    const { count } = await prisma.lead.updateMany({
      where: { id: { in: ids }, businessId },
      data: { assignedToId: agentId }
    });

    if (count > 0 && agentId) {
      // Notify the specific agent if they are online
      // Also notify the business group for general awareness
      getIO().to(`business:${businessId}`).emit('lead:assigned', {
        count,
        agentId,
        ids
      });
    }

    res.json({ message: `${count} lead(s) assigned`, assigned: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeadMessages = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.findFirst({ where: { id, businessId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });

    const page  = Math.max(1, parseInt(req.query['page'] as string || '1'));
    const limit = Math.min(200, parseInt(req.query['limit'] as string || '100'));
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { leadId: id } }),
    ]);

    res.json({ data: messages, total, page, limit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { content, type = MessageType.TEXT, mediaUrl = null } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.findFirst({ where: { id, businessId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found or access denied' });

    let whatsappId = null;
    try {
      const response = await WhatsAppService.sendTextMessage(businessId, lead.phone, content);
      whatsappId = response?.messages?.[0]?.id || null;
    } catch (waError: any) {
      console.error('WhatsApp delivery failed:', waError.message);
    }

    const message = await prisma.message.create({
      data: {
        content,
        type: type as MessageType,
        direction: MessageDirection.OUTBOUND,
        status: whatsappId ? 'SENT' : 'FAILED',
        whatsappId,
        leadId: id,
        mediaUrl
      }
    });

    await prisma.lead.update({ where: { id }, data: { updatedAt: new Date() } });
    getIO().to(`business:${businessId}`).emit('message:new', { leadId: id, message });

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeadRemarks = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.findFirst({ where: { id, businessId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const remarks = await prisma.leadRemark.findMany({
      where: { leadId: id },
      include: {
        author: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(remarks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addLeadRemark = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { content, text } = req.body;
    const finalContent = content || text;
    
    if (!finalContent?.trim()) return res.status(400).json({ error: 'Remark content is required' });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.findFirst({ where: { id, businessId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const remark = await prisma.leadRemark.create({
      data: { content: finalContent, leadId: id, authorId: req.user!.id },
      include: {
        author: {
          select: { email: true }
        }
      }
    });

    // Update lead timestamp
    await prisma.lead.update({ where: { id }, data: { updatedAt: new Date() } });

    res.status(201).json(remark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeadReminders = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.findFirst({ where: { id, businessId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const reminders = await prisma.reminder.findMany({
      where: { leadId: id },
      orderBy: { date: 'asc' }
    });
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllReminders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const filter: any = { lead: { businessId } };

    if (req.user.role === 'SALES_EXEC') {
      filter.lead = { ...filter.lead, assignedToId: req.user.id };
    }

    const reminders = await prisma.reminder.findMany({
      where: filter,
      include: { lead: { select: { name: true, phone: true } } },
      orderBy: { date: 'asc' }
    });

    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createReminder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { date, note } = req.body;

    if (!date || !note?.trim()) {
      return res.status(400).json({ error: 'Date and note are required' });
    }

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const lead = await prisma.lead.findFirst({ where: { id, businessId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const reminder = await prisma.reminder.create({
      data: { date: new Date(date), note, leadId: id }
    });

    res.status(201).json(reminder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReminder = async (req: AuthRequest, res: Response) => {
  try {
    const id  = req.params['id']  as string;
    const rid = req.params['rid'] as string;
    const { isDone, date, note } = req.body;

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const reminder = await prisma.reminder.findFirst({
      where: { id: rid, lead: { id, businessId } }
    });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    const updated = await prisma.reminder.update({
      where: { id: rid },
      data: {
        ...(isDone !== undefined && { isDone: Boolean(isDone) }),
        ...(date && { date: new Date(date) }),
        ...(note && { note }),
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReminder = async (req: AuthRequest, res: Response) => {
  try {
    const id  = req.params['id']  as string;
    const rid = req.params['rid'] as string;

    const businessId = await resolveBusinessId(req);
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const reminder = await prisma.reminder.findFirst({
      where: { id: rid, lead: { id, businessId } }
    });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    await prisma.reminder.delete({ where: { id: rid } });
    res.json({ message: 'Reminder deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
