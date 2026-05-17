import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTestMerchants() {
  console.log("Seeding test merchants...\n");

  const testMerchants = [
    { shop: "amazing-store.myshopify.com", plan: "growth" },
    { shop: "cool-shop.myshopify.com", plan: "starter" },
    { shop: "test-store-1.myshopify.com", plan: "free" },
    { shop: "fashion-hub.myshopify.com", plan: "starter" },
    { shop: "tech-mart.myshopify.com", plan: "growth" },
    { shop: "beauty-corner.myshopify.com", plan: "free" },
    { shop: "sports-arena.myshopify.com", plan: "free" },
    { shop: "home-decor-pro.myshopify.com", plan: "starter" },
  ];

  for (const data of testMerchants) {
    try {
      await prisma.merchant.upsert({
        where: { shop: data.shop },
        update: {},
        create: {
          shop: data.shop,
          plan: data.plan,
          onboardingDone: true,
          onboardingStep: 5,
          storeName: data.shop.replace(".myshopify.com", "").replace(/-/g, " "),
          planStartDate: new Date(Date.now() - Math.random() * 30 * 86400000),
        },
      });
      console.log(`✓ Added: ${data.shop} (${data.plan})`);
    } catch (e) {
      console.log(`✗ Failed: ${data.shop} — ${e.message}`);
    }
  }

  console.log("\n✅ Done!");
  await prisma.$disconnect();
}

seedTestMerchants();