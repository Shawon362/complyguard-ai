import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateApiKey() {
  console.log("\n==========================================");
  console.log("  🔄 Migrate Existing API Key to Database");
  console.log("==========================================\n");

  const envKey = process.env.OXYY_API_KEY;

  if (!envKey) {
    console.log("❌ No OXYY_API_KEY found in .env");
    console.log("   Add your key to .env first, then run again.\n");
    return;
  }

  // Check if already migrated
  const existing = await prisma.apiKey.findFirst({
    where: { apiKey: envKey },
  });

  if (existing) {
    console.log(`✓ This key is already in database as: ${existing.name}\n`);
    return;
  }

  // Create entry
  const created = await prisma.apiKey.create({
    data: {
      name: "Oxyy Primary (migrated from .env)",
      provider: "oxyy",
      apiKey: envKey,
      baseUrl: "https://api.oxyy.ai/v1",
      modelName: "gemini-2.5-flash",
      priority: 1,
      isActive: true,
      createdBy: "system-migration",
      notes: "Auto-migrated from OXYY_API_KEY in .env",
    },
  });

  console.log("✅ Successfully migrated to database!");
  console.log(`   ID:       ${created.id}`);
  console.log(`   Name:     ${created.name}`);
  console.log(`   Provider: ${created.provider}`);
  console.log(`   Priority: ${created.priority}\n`);

  console.log("📝 Next steps:");
  console.log("   1. Visit /admin/api-keys (we'll build this next)");
  console.log("   2. Add backup keys for redundancy");
  console.log("   3. .env OXYY_API_KEY এখনো থাকতে পারে (fallback)\n");

  await prisma.$disconnect();
}

migrateApiKey().catch((e) => {
  console.error(e);
  process.exit(1);
});