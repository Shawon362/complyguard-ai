import { PrismaClient } from "@prisma/client";
import { checkScanLimit, getCurrentMonthScans } from "../app/utils/planLimits.js";

const prisma = new PrismaClient();

async function testQuota() {
  const testShop = "complyguard-test-store.myshopify.com";

  console.log("\n=========================================");
  console.log("  🧪 SCAN QUOTA TEST");
  console.log("=========================================\n");

  // Test 1: Check
  const result = await checkScanLimit(prisma, testShop);

  console.log("📋 Plan Info:");
  console.log(`   Plan:           ${result.planName} (${result.plan})`);
  console.log(`   Lane Speed:     ${result.laneSpeed}`);
  console.log(`   Auto-Fix:       ${result.autoFix ? "✓ Enabled" : "✗ Disabled"}`);
  console.log(`   PDF Export:     ${result.pdfExport ? "✓ Enabled" : "✗ Disabled"}`);
  console.log("");

  console.log("📊 Quota Status:");
  console.log(`   Can Scan:       ${result.canScan ? "✅ Yes" : "❌ No"}`);
  console.log(`   Used:           ${result.used} scans this month`);
  console.log(`   Limit:          ${result.limit} scans/month`);
  console.log(`   Remaining:      ${result.remaining} scans`);
  console.log("");

  console.log("🎯 Per-Scan Capabilities:");
  console.log(`   Max Products:   ${result.displayMaxProducts}`);
  console.log(`   Max Images:     ${result.displayMaxImages}`);
  console.log("");

  if (result.isOverride) {
    console.log("⚙️  Admin Override:");
    console.log(`   Active:         Yes`);
    console.log(`   Notes:          ${result.overrideNotes || "(none)"}`);
    console.log("");
  } else {
    console.log("⚙️  Admin Override: Not active (using plan default)");
    console.log("");
  }

  console.log("=========================================\n");

  await prisma.$disconnect();
}

testQuota().catch((e) => {
  console.error(e);
  process.exit(1);
});