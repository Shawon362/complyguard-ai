import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugUsage() {
  console.log("\n=========================================");
  console.log("  🔍 USAGE DATA DIAGNOSTIC");
  console.log("=========================================\n");

  // === Table counts ===
  const merchantCount = await prisma.merchant.count();
  const scanCount = await prisma.scan.count();
  const issueCount = await prisma.issue.count();
  const imageCount = await prisma.analyzedImage.count();

  console.log("📊 Table Counts:");
  console.log(`   Merchants:       ${merchantCount}`);
  console.log(`   Scans:           ${scanCount}`);
  console.log(`   Issues:          ${issueCount}`);
  console.log(`   AnalyzedImages:  ${imageCount}`);
  console.log("");

  // === Scan details ===
  const allScans = await prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      shop: true,
      status: true,
      imagesProcessed: true,
      imagesTotal: true,
      createdAt: true,
      completedAt: true,
    },
  });

  console.log("📋 Last 5 Scans:");
  if (allScans.length === 0) {
    console.log("   No scans found in database.");
  } else {
    allScans.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.shop}`);
      console.log(`      Status: ${s.status}`);
      console.log(`      Images: ${s.imagesProcessed}/${s.imagesTotal}`);
      console.log(`      Created: ${s.createdAt.toLocaleString()}`);
      console.log(`      Completed: ${s.completedAt?.toLocaleString() || "Not completed"}`);
      console.log("");
    });
  }

  // === Today's date check ===
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  console.log("📅 Today Calculation:");
  console.log(`   Today midnight (server time): ${todayStart.toLocaleString()}`);
  console.log(`   Current time:                  ${new Date().toLocaleString()}`);
  console.log("");

  // === Today's scans ===
  const todayScans = await prisma.scan.findMany({
    where: { createdAt: { gte: todayStart } },
    select: {
      shop: true,
      status: true,
      imagesProcessed: true,
      imagesTotal: true,
      createdAt: true,
    },
  });

  console.log(`📅 Scans Today: ${todayScans.length}`);
  todayScans.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.shop} - ${s.status} - ${s.imagesProcessed} images - ${s.createdAt.toLocaleString()}`);
  });
  console.log("");

  // === Today's AnalyzedImages ===
  const todayImages = await prisma.analyzedImage.count({
    where: { analyzedAt: { gte: todayStart } },
  });

  console.log(`📅 AnalyzedImages Today: ${todayImages}`);
  console.log("");

  // === Month totals ===
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthScanTotals = await prisma.scan.aggregate({
    where: { createdAt: { gte: monthStart } },
    _sum: {
      imagesProcessed: true,
      imagesTotal: true,
    },
    _count: true,
  });

  const monthImages = await prisma.analyzedImage.count({
    where: { analyzedAt: { gte: monthStart } },
  });

  console.log("📊 This Month Summary:");
  console.log(`   Scans run:           ${monthScanTotals._count}`);
  console.log(`   Images processed:    ${monthScanTotals._sum.imagesProcessed || 0}`);
  console.log(`   Images total:        ${monthScanTotals._sum.imagesTotal || 0}`);
  console.log(`   AnalyzedImage rows:  ${monthImages}`);
  console.log("");

  // === Diagnosis ===
  console.log("🎯 DIAGNOSIS:");
  console.log("=========================================");

  if (scanCount === 0) {
    console.log("❌ No scans in database. Run a scan first.");
  } else if (imageCount === 0) {
    console.log("⚠️  AnalyzedImage table is EMPTY.");
    console.log("   Your scan code doesn't populate this table.");
    console.log("   Solution: We'll use Scan.imagesProcessed instead.");
  } else if (monthImages === 0 && monthScanTotals._count > 0) {
    console.log("⚠️  Scans exist this month, but no AnalyzedImage entries.");
    console.log("   Your scan code doesn't write to AnalyzedImage table.");
    console.log("   Solution: We'll use Scan.imagesProcessed instead.");
  } else {
    console.log("✅ Both tables populated. Data should be visible.");
  }
  
  console.log("");
  await prisma.$disconnect();
}

debugUsage().catch(console.error);