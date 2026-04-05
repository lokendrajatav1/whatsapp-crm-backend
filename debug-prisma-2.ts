import prisma from './src/config/prisma';
async function test() {
  const user = await prisma.user.findFirst();
  console.log('User Keys:', Object.keys(user || {}));
}
test();
