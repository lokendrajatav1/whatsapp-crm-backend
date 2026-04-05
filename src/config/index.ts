import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  whatsapp: {
    version: process.env.WHATSAPP_VERSION || 'v17.0',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'CRM_WEBHOOK_VERIFY_TOKEN'
  }
};
