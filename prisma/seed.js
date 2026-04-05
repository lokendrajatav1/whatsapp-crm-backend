const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ adapter });

async function main() {
  const commonPassword = await bcrypt.hash('password123', 10);
  const superPassword = await bcrypt.hash('superadmin123', 10);

  console.log('--- Seeding Database (JS Version) ---');

  // 1. Clear existing data (optional but safer)
  // await prisma.lead.deleteMany({});
  // await prisma.user.deleteMany({});
  // await prisma.business.deleteMany({});

  // 2. Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@admin.com' },
    update: { password: superPassword },
    create: {
      email: 'super@admin.com',
      password: superPassword,
      role: 'SUPER_ADMIN'
    },
  });
  console.log('✅ Super Admin Seeded');

  // 3. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Cyber Agency 2026',
      subscription: {
        create: {
          plan: 'PRO',
          isActive: true
        }
      }
    }
  });
  console.log('✅ Business Seeded:', business.name);

  // 4. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'tester@agency.com',
      password: commonPassword,
      role: 'ADMIN',
      businessId: business.id
    }
  });

  const sales = await prisma.user.create({
    data: {
      email: 'sales@agency.com',
      password: commonPassword,
      role: 'SALES_EXEC',
      businessId: business.id
    }
  });
  console.log('✅ Users Seeded');

  // 5. Create Leads
  const leadsData = [
    {
      name: 'Neo Corleone',
      phone: '1234567890',
      businessName: 'Matrix Tech',
      status: 'NEW',
      businessId: business.id,
      source: 'Organic'
    },
    {
      name: 'Trinity Smith',
      phone: '0987654321',
      businessName: 'Sentinel Solutions',
      status: 'IN_PROGRESS',
      businessId: business.id,
      source: 'WhatsApp',
      assignedToId: sales.id
    },
    {
      name: 'Morpheus Anderson',
      phone: '5566778899',
      businessName: 'Zion Infosec',
      status: 'CLOSED',
      businessId: business.id,
      source: 'Referral'
    }
  ];

  for (const lead of leadsData) {
    await prisma.lead.create({ data: lead });
  }
  console.log('✅ Sample Leads Seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
