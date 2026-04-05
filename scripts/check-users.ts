import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Registered Users:');
  users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
}
check();
