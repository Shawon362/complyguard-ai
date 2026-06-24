import { PrismaClient } from "@prisma/client";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function setPlan() {
  console.log("\n==========================================");
  console.log("  🔧 SET MERCHANT PLAN");
  console.log("==========================================\n");

  // Show all merchants
  const merchants = await prisma.merchant.findMany({
    select: { shop: true, plan: true },
  });

  if (merchants.length === 0) {
    console.log("❌ No merchants found.\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log("Existing merchants:");
  merchants.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.shop} (current: ${m.plan})`);
  });
  console.log("");

  const shop = await ask("Which shop? (full domain): ");

  const merchant = await prisma.merchant.findUnique({
    where: { shop: shop.trim() },
  });

  if (!merchant) {
    console.log(`\n❌ No merchant found: ${shop}\n`);
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log("\nAvailable plans:");
  console.log("   1. free");
  console.log("   2. starter");
  console.log("   3. growth");
  console.log("");

  const planChoice = await ask("Which plan? (free/starter/growth): ");
  const plan = planChoice.trim().toLowerCase();

  if (!["free", "starter", "growth"].includes(plan)) {
    console.log(`\n❌ Invalid plan: ${plan}\n`);
    rl.close();
    await prisma.$disconnect();
    return;
  }

  await prisma.merchant.update({
    where: { shop: shop.trim() },
    data: { plan },
  });

  console.log("\n✅ Plan updated successfully!");
  console.log(`   Shop: ${shop}`);
  console.log(`   New plan: ${plan}`);
  console.log(`\n   Now ${plan === "growth" ? "1000 products, 1000 images, 15 scans" : plan} access\n`);

  rl.close();
  await prisma.$disconnect();
}

setPlan().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});