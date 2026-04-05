import prisma from '../config/prisma';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address: npm run script src/scripts/setSuperAdmin.ts <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log(`User ${user.email} promoted to SUPER_ADMIN successfully.`);
  } catch (err) {
    console.error('Failed to update user. Does the email exist?');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
