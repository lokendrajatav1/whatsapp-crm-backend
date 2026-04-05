import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      businessId: true
    }
  });
  
  console.log('--- USER DATABASE SCAN ---');
  if (users.length === 0) {
    console.log('❌ DATABASE IS EMPTY (No Users Found)');
  } else {
    users.forEach(u => console.log(`📧 ${u.email} | Role: ${u.role} | Business: ${u.businessId || 'NONE'}`));
  }
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
