import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const business = await prisma.business.findFirst();
    if (!business) {
       console.log("No business found");
       return;
    }
    console.log("Found business:", business.id);
    
    const service = await prisma.service.create({
      data: {
        name: "Test Service",
        type: "MONTHLY",
        basePrice: 100,
        businessId: business.id
      }
    });
    console.log("Created service:", service.id);
  } catch (e: any) {
    console.error("FAILED:", e.message);
    if (e.code) console.error("CODE:", e.code);
    if (e.meta) console.error("META:", JSON.stringify(e.meta));
  } finally {
    await prisma.$disconnect();
  }
}

main();
