import prisma from '../config/prisma';
import { WhatsAppService } from './whatsapp.service';

export class AutoReplyService {
  /**
   * Process an incoming message and check for auto-reply rules
   */
  static async processMessage(businessId: string, leadId: string, phone: string, text: string) {
    try {
      const normalizedText = text.toLowerCase().trim();

      // 1. Fetch active rules for this business
      const rules = await prisma.autoReplyRule.findMany({
        where: { businessId, isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      // 2. Look for Keyword Match
      const keywordMatch = rules.find(r => 
        r.type === 'KEYWORD' && 
        r.keyword && 
        normalizedText.includes(r.keyword.toLowerCase())
      );

      if (keywordMatch) {
        return await this.sendReply(businessId, leadId, phone, keywordMatch.response);
      }

      // 3. Fallback Reply (Only if configured)
      const fallbackMatch = rules.find(r => r.type === 'FALLBACK');
      if (fallbackMatch) {
         return await this.sendReply(businessId, leadId, phone, fallbackMatch.response);
      }

    } catch (error) {
      console.error('Auto-Reply process failed:', error);
    }
  }

  /**
   * Send the auto-reply and log it in the database
   */
  private static async sendReply(businessId: string, leadId: string, phone: string, content: string) {
    try {
      // Send via WhatsApp
      const response = await WhatsAppService.sendTextMessage(businessId, phone, content);
      const whatsappId = response?.messages?.[0]?.id || null;

      // Log the message
      await prisma.message.create({
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
    } catch (err) {
       console.error('Failed to send auto-reply:', err);
    }
  }
}
