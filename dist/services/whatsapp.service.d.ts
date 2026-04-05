export declare class WhatsAppService {
    /**
     * Send a text message via WhatsApp Cloud API
     */
    static sendTextMessage(businessId: string, toPhone: string, messageText: string): Promise<any>;
    /**
     * Send a template message (often required to initiate conversation outside 24h window)
     */
    static sendTemplateMessage(businessId: string, toPhone: string, templateName: string, languageCode?: string): Promise<any>;
    /**
     * Get the direct download URL for a WhatsApp media ID
     */
    static getMediaUrl(businessId: string, mediaId: string): Promise<any>;
}
