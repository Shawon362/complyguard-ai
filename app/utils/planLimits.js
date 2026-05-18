// ============================================================
// Plan limits configuration
// ============================================================
// export const PLAN_LIMITS = {
//   free: {
//     name: "Free",
//     scansPerMonth: 1,
//     maxProducts: 50,
//     maxImages: 50,
//     autoFix: false,
//     freeAutoFixCount: 3,
//     pdfExport: false,
//     laneSpeed: "slow",
//   },
//   starter: {
//     name: "Starter",
//     scansPerMonth: 3,
//     maxProducts: 1000,
//     maxImages: 1000,
//     autoFix: true,
//     freeAutoFixCount: 0,
//     pdfExport: true,
//     laneSpeed: "normal",
//   },
//   growth: {
//     name: "Growth",
//     scansPerMonth: 15,
//     maxProducts: 5000,
//     maxImages: 5000,
//     autoFix: true,
//     freeAutoFixCount: 0,
//     pdfExport: true,
//     laneSpeed: "fast",
//   },
// };

// // ============================================================
// // Get scans count for current month
// // ============================================================
// export async function getCurrentMonthScans(prisma, shop) {
//   const startOfMonth = new Date();
//   startOfMonth.setDate(1);
//   startOfMonth.setHours(0, 0, 0, 0);

//   const count = await prisma.scan.count({
//     where: {
//       shop,
//       createdAt: { gte: startOfMonth },
//       status: "completed",
//     },
//   });

//   return count;
// }

// // ============================================================
// // Check if user can scan
// // ============================================================
// export async function checkScanLimit(prisma, shop) {
//   const merchant = await prisma.merchant.findUnique({ where: { shop } });
//   const plan = merchant?.plan || "free";
//   const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

//   const usedScans = await getCurrentMonthScans(prisma, shop);
//   const remaining = limits.scansPerMonth - usedScans;
//   const canScan = remaining > 0;

//   return {
//     plan,
//     planName: limits.name,
//     limit: limits.scansPerMonth,
//     used: usedScans,
//     remaining: Math.max(0, remaining),
//     canScan,
//     autoFix: limits.autoFix,
//     freeAutoFixCount: limits.freeAutoFixCount,
//     pdfExport: limits.pdfExport,
//     maxProducts: limits.maxProducts,
//     maxImages: limits.maxImages,
//     laneSpeed: limits.laneSpeed,
//     displayMaxProducts: plan === "growth" ? "Unlimited" : limits.maxProducts.toString(),
//     displayMaxImages: plan === "growth" ? "Unlimited" : limits.maxImages.toString(),
//   };
// }



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
    freeAutoFixCount: 3,
    pdfExport: false,
    laneSpeed: "slow",
  },
  starter: {
    name: "Starter",
    scansPerMonth: 3,
    maxProducts: 1000,
    maxImages: 1000,
    autoFix: true,
    freeAutoFixCount: 0,
    pdfExport: true,
    laneSpeed: "normal",
  },
  growth: {
    name: "Growth",
    scansPerMonth: 15,
    maxProducts: 5000,
    maxImages: 5000,
    autoFix: true,
    freeAutoFixCount: 0,
    pdfExport: true,
    laneSpeed: "fast",
  },
};

// ============================================================
// Get applicable scan limit (admin override or plan default)
// 
// Admins can override per-merchant limits via the admin panel.
// Stored in RateLimitOverride.monthlyApiLimit field.
// ============================================================
async function getApplicableScansLimit(prisma, shop, planDefault) {
  const override = await prisma.rateLimitOverride.findUnique({
    where: { shop },
  });

  return {
    scansPerMonth: override?.monthlyApiLimit ?? planDefault,
    isOverride: !!override,
    overrideNotes: override?.notes || null,
  };
}

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

  // Get applicable scan limit (with admin override support)
  const quota = await getApplicableScansLimit(prisma, shop, limits.scansPerMonth);

  const usedScans = await getCurrentMonthScans(prisma, shop);
  const remaining = quota.scansPerMonth - usedScans;
  const canScan = remaining > 0;

  return {
    // Plan info
    plan,
    planName: limits.name,

    // Quota status
    limit: quota.scansPerMonth,
    used: usedScans,
    remaining: Math.max(0, remaining),
    canScan,
    autoFix: limits.autoFix,
    freeAutoFixCount: limits.freeAutoFixCount,
    pdfExport: limits.pdfExport,
    maxProducts: limits.maxProducts,
    maxImages: limits.maxImages,
    laneSpeed: limits.laneSpeed,
    displayMaxProducts: plan === "growth" ? "Unlimited" : limits.maxProducts.toString(),
    displayMaxImages: plan === "growth" ? "Unlimited" : limits.maxImages.toString(),
    isOverride: quota.isOverride,
    overrideNotes: quota.overrideNotes,
  };
}

// ============================================================
// Build user-friendly error message for blocked scans
// ============================================================
export function getQuotaBlockedReason(limitInfo) {
  const { plan, used, limit } = limitInfo;

  let upgradeHint = "";
  if (plan === "free") {
    upgradeHint = " Upgrade to Starter for 3 scans/month or Growth for 15.";
  } else if (plan === "starter") {
    upgradeHint = " Upgrade to Growth for 15 scans/month.";
  } else if (plan === "growth") {
    upgradeHint = " Contact support for increased limit.";
  }

  return `Monthly scan limit reached (${used}/${limit} scans used).${upgradeHint} Limit resets on the 1st of next month.`;
}