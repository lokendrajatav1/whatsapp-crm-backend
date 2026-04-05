"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// Flat routes (static first to prevent conflict with :id)
router.get('/reminders/all', lead_controller_1.getAllReminders);
router.delete('/bulk', lead_controller_1.bulkDeleteLeads);
router.patch('/bulk-assign', lead_controller_1.bulkAssignLeads);
// Lead CRUD
router.get('/', lead_controller_1.getLeads);
router.post('/', lead_controller_1.createLead);
router.get('/:id', lead_controller_1.getLead);
router.patch('/:id', lead_controller_1.updateLead);
router.delete('/:id', lead_controller_1.deleteLead);
// Messages for a lead
router.get('/:id/messages', lead_controller_1.getLeadMessages);
router.post('/:id/messages', lead_controller_1.sendMessage);
// Remarks for a lead
router.get('/:id/remarks', lead_controller_1.getLeadRemarks);
router.post('/:id/remarks', lead_controller_1.addLeadRemark);
// Reminders for a lead
router.get('/:id/reminders', lead_controller_1.getLeadReminders);
router.post('/:id/reminders', lead_controller_1.createReminder);
router.patch('/:id/reminders/:rid', lead_controller_1.updateReminder);
router.delete('/:id/reminders/:rid', lead_controller_1.deleteReminder);
exports.default = router;
//# sourceMappingURL=lead.routes.js.map