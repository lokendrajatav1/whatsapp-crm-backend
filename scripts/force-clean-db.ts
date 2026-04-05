import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDB() {
  try {
    console.log('--- Cleaning Database (Dropping All Tables and Enums) ---');
    // Drop all tables
    await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE;`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public;`);
    console.log('✅ Database cleaned successfully');
  } catch (err: any) {
    console.error('❌ Cleaning failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDB();
