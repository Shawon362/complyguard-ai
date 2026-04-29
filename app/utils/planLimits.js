// ============================================================
// Plan limits configuration
// ============================================================
export const PLAN_LIMITS = {
  free: {
    name: "Free",
    scansPerMonth: 1,
    maxProducts: 50,
    maxImages: 50,
    autoFix: false,
    pdfExport: false,
    laneSpeed: "slow",
  },
  starter: {
    name: "Starter",
    scansPerMonth: 3,
    maxProducts: 1000,
    maxImages: 1000,
    autoFix: true,
    pdfExport: true,
    laneSpeed: "normal",
  },
  growth: {
    name: "Growth",
    scansPerMonth: 15,
    maxProducts: 5000,
    maxImages: 5000,
    autoFix: true,
    pdfExport: true,
    laneSpeed: "fast",
  },
};

// ============================================================
// Get scans count for current month
// ============================================================
export async function getCurrentMonthScans(prisma, shop) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.scan.count({
    where: {
      shop,
      createdAt: { gte: startOfMonth },
      status: "completed",
    },
  });

  return count;
}

// ============================================================
// Check if user can scan
// ============================================================
export async function checkScanLimit(prisma, shop) {
  const merchant = await prisma.merchant.findUnique({ where: { shop } });
  const plan = merchant?.plan || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const usedScans = await getCurrentMonthScans(prisma, shop);
  const remaining = limits.scansPerMonth - usedScans;
  const canScan = remaining > 0;

  return {
    plan,
    planName: limits.name,
    limit: limits.scansPerMonth,
    used: usedScans,
    remaining: Math.max(0, remaining),
    canScan,
    autoFix: limits.autoFix,
    pdfExport: limits.pdfExport,
    maxProducts: limits.maxProducts,
    maxImages: limits.maxImages,
    laneSpeed: limits.laneSpeed,
    displayMaxProducts: plan === "growth" ? "Unlimited" : limits.maxProducts.toString(),
    displayMaxImages: plan === "growth" ? "Unlimited" : limits.maxImages.toString(),
  };
}