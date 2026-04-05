"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../lib/socket");
const startNotificationService = () => {
    console.log('[NotificationService]: Starting Reminder Polling...');
    // Poll every 60 seconds
    setInterval(async () => {
        try {
            const now = new Date();
            // Find reminders due in the past or now that haven't been notified
            const dueReminders = await prisma_1.default.reminder.findMany({
                where: {
                    date: { lte: now },
                    isDone: false,
                    notified: false
                },
                include: {
                    lead: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            businessId: true,
                            assignedToId: true
                        }
                    }
                }
            });
            if (dueReminders.length > 0) {
                console.log(`[NotificationService]: Sending ${dueReminders.length} reminders...`);
                for (const reminder of dueReminders) {
                    // Emit to the specific business room
                    (0, socket_1.getIO)().to(`business:${reminder.lead.businessId}`).emit('reminder:due', {
                        id: reminder.id,
                        note: reminder.note,
                        leadName: reminder.lead.name,
                        leadId: reminder.lead.id,
                        assignedToId: reminder.lead.assignedToId
                    });
                    // Mark as notified
                    await prisma_1.default.reminder.update({
                        where: { id: reminder.id },
                        data: { notified: true }
                    });
                }
            }
        }
        catch (error) {
            console.error('[NotificationService] Error:', error);
        }
    }, 60000);
};
exports.startNotificationService = startNotificationService;
//# sourceMappingURL=notification.service.js.map