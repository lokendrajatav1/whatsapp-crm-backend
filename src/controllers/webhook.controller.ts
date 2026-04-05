import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getIO } from '../lib/socket';
import { AutoReplyService } from '../services/autoreply.service';
import { MessageType, MessageStatus, MessageDirection } from '@prisma/client';

interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'image' | 'document' | 'video' | 'audio' | 'sticker' | 'unknown';
          text?: { body: string };
          image?: { id: string; caption?: string; mime_type: string; sha256: string };
          document?: { id: string; caption?: string; filename: string; mime_type: string; sha256: string };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted' | 'warning';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WebhookController {
  /**
   * Meta Developer portal hits this GET request to verify the webhook url connection.
   */
  static async verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'] as string | undefined;
    const token = req.query['hub.verify_token'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;

    if (mode && token) {
      if (mode === 'subscribe') {
        const config = await prisma.whatsAppConfig.findFirst({
          where: { webhookToken: token }
        });

        if (config) {
          console.log('WEBHOOK_VERIFIED');
          return res.status(200).send(challenge);
        }
      }
    }
    res.sendStatus(403);
  }

  /**
   * Incoming messages and status updates from WhatsApp users.
   */
  static async handleWebhookEvent(req: Request, res: Response) {
    const body = req.body as WhatsAppWebhookBody;

    if (body.object) {
      if (
        body.entry &&
        body.entry[0]?.changes &&
        body.entry[0].changes[0]?.value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = message.from;
        const messageId = message.id;

        // Find the business associated with this phone number ID
        const whatsappConfig = await prisma.whatsAppConfig.findFirst({
          where: { phoneNumberId },
          include: { business: true }
        });

        if (whatsappConfig) {
          const businessId = whatsappConfig.businessId;

          // Find or create the lead
          let lead = await prisma.lead.findFirst({
            where: { 
              phone: from,
              businessId: businessId
            }
          });

          if (!lead) {
            const contactName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || from;
            lead = await prisma.lead.create({
              data: {
                name: contactName,
                phone: from,
                businessId: businessId,
                source: 'WHATSAPP'
              }
            });
            
            // Emit new lead event
            getIO().to(`business:${businessId}`).emit('lead:new', lead);
          }

          // Determine message type and content
          let type: MessageType = MessageType.TEXT;
          let content = '';
          let mediaUrl: string | null = null;

          if (message.type === 'text' && message.text) {
            content = message.text.body;
          } else if (message.type === 'image' && message.image) {
            type = MessageType.IMAGE;
            content = message.image.caption || 'Image received';
            mediaUrl = message.image.id; 
          } else if (message.type === 'document' && message.document) {
            type = MessageType.DOCUMENT;
            content = message.document.filename || 'Document received';
            mediaUrl = message.document.id;
          }

          // Save incoming message
          const newMessage = await prisma.message.create({
            data: {
              content,
              type,
              direction: MessageDirection.INBOUND,
              status: MessageStatus.READ, 
              whatsappId: messageId,
              leadId: lead.id,
              mediaUrl
            }
          });

          // Update lead activity
          await prisma.lead.update({
            where: { id: lead.id },
            data: { updatedAt: new Date() }
          });

          // Emit message event via Socket.io
          getIO().to(`business:${businessId}`).emit('message:new', {
            leadId: lead.id,
            message: newMessage
          });

          // Trigger Auto-Reply Logic (GROWTH FEATURE)
          if (type === 'TEXT') {
            await AutoReplyService.processMessage(businessId, lead.id, from, content);
          }
        }
      } else if (
         body.entry?.[0]?.changes?.[0]?.value.statuses?.[0]
      ) {
         // Handle message status updates (sent, delivered, read)
         const statusUpdate = body.entry[0].changes[0].value.statuses[0];
         if (!statusUpdate) return res.sendStatus(200);

         const whatsappId = statusUpdate.id;
         const status = statusUpdate.status.toUpperCase() as MessageStatus; // SENT, DELIVERED, READ

         try {
           const existingMsg = await prisma.message.findUnique({ where: { whatsappId } });
           if (existingMsg) {
             const updatedMsg = await prisma.message.update({
               where: { whatsappId },
               data: { status }
             });

             const lead = await prisma.lead.findUnique({ where: { id: updatedMsg.leadId } });
             if (lead) {
               getIO().to(`business:${lead.businessId}`).emit('message:status', {
                 messageId: updatedMsg.id,
                 status: status
               });
             }
           }
         } catch (err) {
           console.error('Status update failed:', err);
         }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  }
}
