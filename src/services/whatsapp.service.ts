import axios from 'axios';
import { config } from '../config';
import prisma from '../config/prisma';

export class WhatsAppService {
  /**
   * Send a text message via WhatsApp Cloud API
   */
  static async sendTextMessage(businessId: string, toPhone: string, messageText: string) {
    try {
      // Get the WhatsApp Config for this business
      const waConfig = await prisma.whatsAppConfig.findUnique({
        where: { businessId }
      });

      if (!waConfig) {
        throw new Error('WhatsApp configuration not found for this business.');
      }

      const { phoneNumberId, accessToken } = waConfig;
      const url = `https://graph.facebook.com/${config.whatsapp.version}/${phoneNumberId}/messages`;

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

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a template message (often required to initiate conversation outside 24h window)
   */
  static async sendTemplateMessage(businessId: string, toPhone: string, templateName: string, languageCode: string = 'en_US') {
     try {
       const waConfig = await prisma.whatsAppConfig.findUnique({
         where: { businessId }
       });
 
       if (!waConfig) throw new Error('WhatsApp configuration not found.');
 
       const { phoneNumberId, accessToken } = waConfig;
       const url = `https://graph.facebook.com/${config.whatsapp.version}/${phoneNumberId}/messages`;
 
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
 
       const response = await axios.post(url, payload, {
         headers: {
           'Authorization': `Bearer ${accessToken}`,
           'Content-Type': 'application/json'
         }
       });
 
       return response.data;
     } catch (error: any) {
       console.error('Error sending template message:', error?.response?.data || error.message);
       throw error;
     }
  }

  /**
   * Get the direct download URL for a WhatsApp media ID
   */
  static async getMediaUrl(businessId: string, mediaId: string) {
    try {
      const waConfig = await prisma.whatsAppConfig.findUnique({
        where: { businessId }
      });

      if (!waConfig) throw new Error('WhatsApp configuration not found.');

      const { accessToken } = waConfig;
      const url = `https://graph.facebook.com/${config.whatsapp.version}/${mediaId}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.url;
    } catch (error: any) {
      console.error('Error fetching WhatsApp media URL:', error?.response?.data || error.message);
      throw error;
    }
  }
}
