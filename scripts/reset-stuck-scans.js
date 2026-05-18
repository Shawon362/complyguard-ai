import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetStuckScans() {
  console.log("\n=========================================");
  console.log("  🔧 RESET STUCK SCANS");
  console.log("=========================================\n");

  // Find all "running" scans older than 5 minutes
  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const stuckScans = await prisma.scan.findMany({
    where: {
      status: "running",
      createdAt: { lt: fiveMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (stuckScans.length === 0) {
    console.log("✅ No stuck scans found. All clean!\n");
    
    // Also show currently running scans (newer ones)
    const recentRunning = await prisma.scan.findMany({
      where: { status: "running" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    
    if (recentRunning.length > 0) {
      console.log(`ℹ️  ${recentRunning.length} scan(s) recently started (< 5 min):`);
      recentRunning.forEach((s) => {
        console.log(`   - ${s.shop} | Started: ${s.createdAt.toLocaleString()}`);
      });
      console.log("");
    }
    
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${stuckScans.length} stuck scan(s):\n`);

  for (const scan of stuckScans) {
    const ageMinutes = Math.floor(
      (Date.now() - new Date(scan.createdAt).getTime()) / 60000
    );

    console.log(`  ID:       ${scan.id}`);
    console.log(`  Shop:     ${scan.shop}`);
    console.log(`  Phase:    ${scan.currentPhase}`);
    console.log(`  Progress: ${scan.progress}%`);
    console.log(`  Age:      ${ageMinutes} minutes`);
    
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        currentPhase: "interrupted",
        errorMessage: "Scan interrupted (server restart or timeout). Please run scan again.",
        completedAt: new Date(),
      },
    });
    
    console.log(`  ✅ Reset to "failed"\n`);
  }

  console.log("=========================================");
  console.log(`✅ ${stuckScans.length} scan(s) reset successfully`);
  console.log("=========================================\n");
  
  await prisma.$disconnect();
}

resetStuckScans().catch((e) => {
  console.error(e);
  process.exit(1);
});