"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
    whatsapp: {
        version: process.env.WHATSAPP_VERSION || 'v17.0',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'CRM_WEBHOOK_VERIFY_TOKEN'
    }
};
//# sourceMappingURL=index.js.map