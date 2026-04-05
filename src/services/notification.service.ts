import prisma from '../config/prisma';
import { getIO } from '../lib/socket';

export const startNotificationService = () => {
  console.log('[NotificationService]: Starting Reminder Polling...');
  
  // Poll every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      // Find reminders due in the past or now that haven't been notified
      const dueReminders = await prisma.reminder.findMany({
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
          getIO().to(`business:${reminder.lead.businessId}`).emit('reminder:due', {
            id: reminder.id,
            note: reminder.note,
            leadName: reminder.lead.name,
            leadId: reminder.lead.id,
            assignedToId: reminder.lead.assignedToId
          });

          // Mark as notified
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { notified: true }
          });
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error:', error);
    }
  }, 60000); 
};
