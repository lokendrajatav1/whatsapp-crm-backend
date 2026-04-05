"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoReplyService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const whatsapp_service_1 = require("./whatsapp.service");
class AutoReplyService {
    /**
     * Process an incoming message and check for auto-reply rules
     */
    static async processMessage(businessId, leadId, phone, text) {
        try {
            const normalizedText = text.toLowerCase().trim();
            // 1. Fetch active rules for this business
            const rules = await prisma_1.default.autoReplyRule.findMany({
                where: { businessId, isActive: true },
                orderBy: { createdAt: 'desc' }
            });
            // 2. Look for Keyword Match
            const keywordMatch = rules.find(r => r.type === 'KEYWORD' &&
                r.keyword &&
                normalizedText.includes(r.keyword.toLowerCase()));
            if (keywordMatch) {
                return await this.sendReply(businessId, leadId, phone, keywordMatch.response);
            }
            // 3. Fallback Reply (Only if configured)
            const fallbackMatch = rules.find(r => r.type === 'FALLBACK');
            if (fallbackMatch) {
                return await this.sendReply(businessId, leadId, phone, fallbackMatch.response);
            }
        }
        catch (error) {
            console.error('Auto-Reply process failed:', error);
        }
    }
    /**
     * Send the auto-reply and log it in the database
     */
    static async sendReply(businessId, leadId, phone, content) {
        try {
            // Send via WhatsApp
            const response = await whatsapp_service_1.WhatsAppService.sendTextMessage(businessId, phone, content);
            const whatsappId = response?.messages?.[0]?.id || null;
            // Log the message
            await prisma_1.default.message.create({
                data: {
                    content,
                    type: 'AUTO',
                    direction: 'OUTBOUND',
                    status: whatsappId ? 'SENT' : 'FAILED',
                    whatsappId,
                    leadId
                }
            });
            console.log(`Auto-reply sent to ${phone}: "${content}"`);
        }
        catch (err) {
            console.error('Failed to send auto-reply:', err);
        }
    }
}
exports.AutoReplyService = AutoReplyService;
//# sourceMappingURL=autoreply.service.js.map