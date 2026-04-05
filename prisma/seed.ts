import { PrismaClient, Role, LeadStatus, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const commonPassword = await bcrypt.hash('password123', 10);
    const superPassword = await bcrypt.hash('superadmin123', 10);

  console.log('🌱 Starting Seeding...');

  // 1. Create Super Admin
  await prisma.user.upsert({
    where: { email: 'super@admin.com' },
    update: { password: superPassword },
    create: {
      email: 'super@admin.com',
      password: superPassword,
      role: Role.SUPER_ADMIN
    },
  });
  console.log('✅ Super Admin Seeded');

  // 2. Create or Find Business
  let business = await prisma.business.findFirst({ where: { name: 'Cyber Agency 2026' } });
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'Cyber Agency 2026',
      }
    });
  }
  console.log('✅ Business Found/Created:', business.name);

  // 3. Create or Update Subscription (Separately to avoid unique constraint issues in nested create)
  const existingSub = await prisma.subscription.findUnique({ where: { businessId: business.id } });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        businessId: business.id,
        plan: SubscriptionPlan.PRO,
        isActive: true
      }
    });
  } else {
    await prisma.subscription.update({
      where: { businessId: business.id },
      data: { plan: SubscriptionPlan.PRO, isActive: true }
    });
  }
  console.log('✅ Subscription Synced');

  // 4. Create Users for EVERY Role
  const roles = [
    { email: 'tester@agency.com', role: Role.ADMIN },
    { email: 'tl@agency.com', role: 'TEAM_LEADER' as any },
    { email: 'sales@agency.com', role: 'SALES_EXEC' as any },
    { email: 'am@agency.com', role: 'ACCOUNT_MANAGER' as any },
    { email: 'finance@agency.com', role: 'FINANCE' as any },
  ];

  for (const u of roles) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, businessId: business.id },
      create: {
        email: u.email,
        password: commonPassword,
        role: u.role,
        businessId: business.id
      }
    });
  }
  console.log('✅ All Role Users Seeded');

  // 5. Sample Leads (only if none exist to prevent duplicate lead serials)
  const leadCount = await prisma.lead.count({ where: { businessId: business.id } });
  if (leadCount === 0) {
    const salesUser = await prisma.user.findFirst({ where: { email: 'sales@agency.com' } });
    await prisma.lead.create({
      data: {
        name: 'Trinity Smith',
        phone: '0987654321',
        businessName: 'Sentinel Solutions',
        status: 'IN_PROGRESS' as any,
        businessId: business.id,
        source: 'WhatsApp',
        assignedToId: salesUser?.id
      }
    });
    console.log('✅ Sample Lead Created');
  }
    // 6. Sample Deliverables (Service & Project)
    const serviceCount = await prisma.service.count({ where: { businessId: business.id } });
    if (serviceCount === 0) {
      const srv = await prisma.service.create({
        data: {
          name: 'WhatsApp Marketing Elite',
          basePrice: 25000,
          type: 'MONTHLY',
          businessId: business.id
        }
      });
      
      const lead = await prisma.lead.findFirst({ where: { businessId: business.id } });
      if (lead) {
        const prj = await prisma.project.create({
          data: {
            name: 'Cyber Launch Q2',
            status: 'IN_PROGRESS',
            leadId: lead.id,
            serviceId: srv.id,
            businessId: business.id,
            totalValue: 50000,
            paidAmount: 15000,
          }
        });
        
        await prisma.invoice.create({
          data: {
            projectId: prj.id,
            amount: 15000,
            status: 'PAID',
            dueDate: new Date(),
          }
        });

        await prisma.invoice.create({
          data: {
            projectId: prj.id,
            amount: 35000,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }
        });
      }
      console.log('✅ Sample Deliverables Seeded');
    }
  
    console.log('🚀 Seeding Completed Successfully');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
