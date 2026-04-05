import { Router } from 'express';
import {
  getLeads, createLead, getLeadMessages, sendMessage,
  getLeadReminders, createReminder, updateReminder, deleteReminder,
  getAllReminders, getLead, updateLead, deleteLead, bulkDeleteLeads,
  getLeadRemarks, addLeadRemark, bulkAssignLeads
} from '../controllers/lead.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

// Flat routes (static first to prevent conflict with :id)
router.get('/reminders/all', getAllReminders);
router.delete('/bulk', bulkDeleteLeads);
router.patch('/bulk-assign', bulkAssignLeads);

// Lead CRUD
router.get('/', getLeads);
router.post('/', createLead);
router.get('/:id', getLead);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);

// Messages for a lead
router.get('/:id/messages', getLeadMessages);
router.post('/:id/messages', sendMessage);

// Remarks for a lead
router.get('/:id/remarks', getLeadRemarks);
router.post('/:id/remarks', addLeadRemark);

// Reminders for a lead
router.get('/:id/reminders', getLeadReminders);
router.post('/:id/reminders', createReminder);
router.patch('/:id/reminders/:rid', updateReminder);
router.delete('/:id/reminders/:rid', deleteReminder);

export default router;
