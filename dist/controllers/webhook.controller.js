"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../lib/socket");
const autoreply_service_1 = require("../services/autoreply.service");
const client_1 = require("@prisma/client");
class WebhookController {
    /**
     * Meta Developer portal hits this GET request to verify the webhook url connection.
     */
    static async verifyWebhook(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode && token) {
            if (mode === 'subscribe') {
                const config = await prisma_1.default.whatsAppConfig.findFirst({
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
    static async handleWebhookEvent(req, res) {
        const body = req.body;
        if (body.object) {
            if (body.entry &&
                body.entry[0]?.changes &&
                body.entry[0].changes[0]?.value.messages &&
                body.entry[0].changes[0].value.messages[0]) {
                const message = body.entry[0].changes[0].value.messages[0];
                const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = message.from;
                const messageId = message.id;
                // Find the business associated with this phone number ID
                const whatsappConfig = await prisma_1.default.whatsAppConfig.findFirst({
                    where: { phoneNumberId },
                    include: { business: true }
                });
                if (whatsappConfig) {
                    const businessId = whatsappConfig.businessId;
                    // Find or create the lead
                    let lead = await prisma_1.default.lead.findFirst({
                        where: {
                            phone: from,
                            businessId: businessId
                        }
                    });
                    if (!lead) {
                        const contactName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || from;
                        lead = await prisma_1.default.lead.create({
                            data: {
                                name: contactName,
                                phone: from,
                                businessId: businessId,
                                source: 'WHATSAPP'
                            }
                        });
                        // Emit new lead event
                        (0, socket_1.getIO)().to(`business:${businessId}`).emit('lead:new', lead);
                    }
                    // Determine message type and content
                    let type = client_1.MessageType.TEXT;
                    let content = '';
                    let mediaUrl = null;
                    if (message.type === 'text' && message.text) {
                        content = message.text.body;
                    }
                    else if (message.type === 'image' && message.image) {
                        type = client_1.MessageType.IMAGE;
                        content = message.image.caption || 'Image received';
                        mediaUrl = message.image.id;
                    }
                    else if (message.type === 'document' && message.document) {
                        type = client_1.MessageType.DOCUMENT;
                        content = message.document.filename || 'Document received';
                        mediaUrl = message.document.id;
                    }
                    // Save incoming message
                    const newMessage = await prisma_1.default.message.create({
                        data: {
                            content,
                            type,
                            direction: client_1.MessageDirection.INBOUND,
                            status: client_1.MessageStatus.READ,
                            whatsappId: messageId,
                            leadId: lead.id,
                            mediaUrl
                        }
                    });
                    // Update lead activity
                    await prisma_1.default.lead.update({
                        where: { id: lead.id },
                        data: { updatedAt: new Date() }
                    });
                    // Emit message event via Socket.io
                    (0, socket_1.getIO)().to(`business:${businessId}`).emit('message:new', {
                        leadId: lead.id,
                        message: newMessage
                    });
                    // Trigger Auto-Reply Logic (GROWTH FEATURE)
                    if (type === 'TEXT') {
                        await autoreply_service_1.AutoReplyService.processMessage(businessId, lead.id, from, content);
                    }
                }
            }
            else if (body.entry?.[0]?.changes?.[0]?.value.statuses?.[0]) {
                // Handle message status updates (sent, delivered, read)
                const statusUpdate = body.entry[0].changes[0].value.statuses[0];
                if (!statusUpdate)
                    return res.sendStatus(200);
                const whatsappId = statusUpdate.id;
                const status = statusUpdate.status.toUpperCase(); // SENT, DELIVERED, READ
                try {
                    const existingMsg = await prisma_1.default.message.findUnique({ where: { whatsappId } });
                    if (existingMsg) {
                        const updatedMsg = await prisma_1.default.message.update({
                            where: { whatsappId },
                            data: { status }
                        });
                        const lead = await prisma_1.default.lead.findUnique({ where: { id: updatedMsg.leadId } });
                        if (lead) {
                            (0, socket_1.getIO)().to(`business:${lead.businessId}`).emit('message:status', {
                                messageId: updatedMsg.id,
                                status: status
                            });
                        }
                    }
                }
                catch (err) {
                    console.error('Status update failed:', err);
                }
            }
            res.sendStatus(200);
        }
        else {
            res.sendStatus(404);
        }
    }
}
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhook.controller.js.map