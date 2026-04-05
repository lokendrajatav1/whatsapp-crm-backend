import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const users = await prisma.user.findMany({
      include: { business: true }
    });
    console.log('--- Users ---');
    console.log(JSON.stringify(users, null, 2));

    const leads = await prisma.lead.findMany({ take: 5 });
    console.log('--- Leads ---');
    console.log(JSON.stringify(leads, null, 2));

    const services = await prisma.service.findMany({ take: 5 });
    console.log('--- Services ---');
    console.log(JSON.stringify(services, null, 2));

  } catch (err) {
    console.error('Prisma check failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
