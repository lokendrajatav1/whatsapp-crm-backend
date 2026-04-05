export declare class AutoReplyService {
    /**
     * Process an incoming message and check for auto-reply rules
     */
    static processMessage(businessId: string, leadId: string, phone: string, text: string): Promise<void>;
    /**
     * Send the auto-reply and log it in the database
     */
    private static sendReply;
}
