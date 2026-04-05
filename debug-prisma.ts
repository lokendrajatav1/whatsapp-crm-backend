import { MessageType, Role, LeadStatus } from '@prisma/client';
console.log('--- MessageType ---');
Object.keys(MessageType).forEach(k => console.log(k));
console.log('--- Role ---');
Object.keys(Role).forEach(k => console.log(k));
console.log('--- LeadStatus ---');
Object.keys(LeadStatus).forEach(k => console.log(k));
