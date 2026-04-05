"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const prisma_1 = __importDefault(require("../config/prisma"));
class WhatsAppService {
    /**
     * Send a text message via WhatsApp Cloud API
     */
    static async sendTextMessage(businessId, toPhone, messageText) {
        try {
            // Get the WhatsApp Config for this business
            const waConfig = await prisma_1.default.whatsAppConfig.findUnique({
                where: { businessId }
            });
            if (!waConfig) {
                throw new Error('WhatsApp configuration not found for this business.');
            }
            const { phoneNumberId, accessToken } = waConfig;
            const url = `https://graph.facebook.com/${config_1.config.whatsapp.version}/${phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: toPhone,
                type: 'text',
                text: {
                    preview_url: false,
                    body: messageText
                }
            };
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error sending WhatsApp message:', error?.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Send a template message (often required to initiate conversation outside 24h window)
     */
    static async sendTemplateMessage(businessId, toPhone, templateName, languageCode = 'en_US') {
        try {
            const waConfig = await prisma_1.default.whatsAppConfig.findUnique({
                where: { businessId }
            });
            if (!waConfig)
                throw new Error('WhatsApp configuration not found.');
            const { phoneNumberId, accessToken } = waConfig;
            const url = `https://graph.facebook.com/${config_1.config.whatsapp.version}/${phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                to: toPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    }
                }
            };
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error sending template message:', error?.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Get the direct download URL for a WhatsApp media ID
     */
    static async getMediaUrl(businessId, mediaId) {
        try {
            const waConfig = await prisma_1.default.whatsAppConfig.findUnique({
                where: { businessId }
            });
            if (!waConfig)
                throw new Error('WhatsApp configuration not found.');
            const { accessToken } = waConfig;
            const url = `https://graph.facebook.com/${config_1.config.whatsapp.version}/${mediaId}`;
            const response = await axios_1.default.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data.url;
        }
        catch (error) {
            console.error('Error fetching WhatsApp media URL:', error?.response?.data || error.message);
            throw error;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=whatsapp.service.js.map