const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const businesses = await prisma.business.findMany({ include: { subscription: true } });
  console.log('Businesses:', JSON.stringify(businesses, null, 2));
  const users = await prisma.user.findMany();
  console.log('Users:', JSON.stringify(users.map(u => u.email), null, 2));
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
