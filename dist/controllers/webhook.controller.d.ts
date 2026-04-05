import { Request, Response } from 'express';
export declare class WebhookController {
    /**
     * Meta Developer portal hits this GET request to verify the webhook url connection.
     */
    static verifyWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Incoming messages and status updates from WhatsApp users.
     */
    static handleWebhookEvent(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
