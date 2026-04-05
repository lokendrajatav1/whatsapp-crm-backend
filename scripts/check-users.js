const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log('Registered Users:');
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error fetching users:', err.message);
    process.exit(1);
  }
}
check();
