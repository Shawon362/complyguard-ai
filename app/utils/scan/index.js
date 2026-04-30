import { markScanRunning, markScanCompleted, markScanFailed } from "../../scan-runner.server";
import { fetchProducts } from "./fetchProducts";
import { checkPolicies } from "./checkPolicies";
import { scanAIApps } from "./scanAIApps";
import { buildIssues } from "./buildIssues";
import { calculateScore } from "./calculateScore";

// ============================================================
// Helper: Get list of categories user has acknowledged recently
// ============================================================
async function getAcknowledgedCategories(prisma, shop) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const acknowledged = await prisma.issue.findMany({
    where: {
      shop,
      status: "user_acknowledged",
      acknowledgedAt: { gte: thirtyDaysAgo },
    },
    select: { category: true },
    distinct: ["category"],
  });

  const categorySet = new Set(acknowledged.map((i) => i.category));

  if (categorySet.size > 0) {
    console.log(`>>> Acknowledged categories (last 30 days): ${Array.from(categorySet).join(", ")}`);
  }

  return categorySet;
}

// ============================================================
// MAIN: Background scan orchestrator
// ============================================================
export async function runBackgroundScan({ scanId, shop, admin, prisma }) {
  console.log(`>>> Background scan started: ${scanId}`);
  markScanRunning(scanId);

  try {
    // ── Get acknowledged categories (skip these in this scan) ──
    const acknowledgedCategories = await getAcknowledgedCategories(prisma, shop);

    // ── Phase 1: Get plan limits ──
    await updateProgress(prisma, scanId, "fetching_products", 5);

    const { PLAN_LIMITS } = await import("../planLimits");
    const merchant = await prisma.merchant.findUnique({ where: { shop } });
    const userPlan = merchant?.plan || "free";
    const planConfig = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

    const productLimit = planConfig.maxProducts;
    const imageLimit = planConfig.maxImages;

    console.log(`>>> Plan: ${userPlan} | products: ${productLimit} | images: ${imageLimit}`);

    // ── Phase 2: Fetch products ──
    const products = await fetchProducts(admin, productLimit);
    console.log(`>>> Total products: ${products.length}`);

    // ── Phase 3: Check policies ──
    await updateProgress(prisma, scanId, "checking_policies", 15);
    const policies = await checkPolicies(admin);
    console.log(`>>> Policies:`, { privacy: policies.privacy, terms: policies.terms });

    // ── Phase 4: Scan AI apps ──
    await updateProgress(prisma, scanId, "scanning_apps", 25);
    const aiApps = await scanAIApps(admin, shop);

    // ── Phase 5: Collect images ──
    const allImages = [];
    let totalImagesCount = 0;
    for (const product of products) {
      for (const mediaItem of product.media.nodes) {
        if (!mediaItem.image) continue;
        totalImagesCount++;
        allImages.push({
          url: mediaItem.image.url,
          productTitle: product.title,
          altText: mediaItem.alt,
        });
      }
    }

    const imagesToAnalyze = allImages.slice(0, imageLimit);
    console.log(`>>> Total images: ${totalImagesCount}, analyzing: ${imagesToAnalyze.length}`);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        imagesTotal: imagesToAnalyze.length,
        totalProducts: products.length,
        totalImages: totalImagesCount,
      },
    });

    // ── Phase 6: AI Image Analysis ──
    await updateProgress(prisma, scanId, "analyzing_images", 30);

    const { analyzeImages } = await import("../../ai-detector.server");
    const aiResults = await analyzeImages(
      imagesToAnalyze,
      shop,
      prisma,
      async (processed, total) => {
        const imagePhaseProgress = total > 0 ? (processed / total) * 50 : 0;
        const overallProgress = Math.floor(30 + imagePhaseProgress);

        await prisma.scan.update({
          where: { id: scanId },
          data: {
            imagesProcessed: processed,
            progress: overallProgress,
          },
        });
      }
    );

    // ── Phase 7: Build issues ──
    await updateProgress(prisma, scanId, "saving_results", 85);
    const allIssues = await buildIssues({
      scanId,
      shop,
      products,
      policies,
      aiApps,
      aiResults,
      allImages,
    });

    // ── FILTER OUT ACKNOWLEDGED CATEGORIES ──
    const filteredIssues = allIssues.filter((issue) => {
      if (acknowledgedCategories.has(issue.category)) {
        console.log(`>>> Skipped (acknowledged): ${issue.title}`);
        return false;
      }
      return true;
    });

    console.log(`>>> Total issues: ${filteredIssues.length} (${allIssues.length - filteredIssues.length} acknowledged-skipped)`);

    if (filteredIssues.length > 0) {
      await prisma.issue.createMany({ data: filteredIssues });
    }

    // ── Phase 8: Calculate score (using filtered issues) ──
    await updateProgress(prisma, scanId, "saving_results", 95);
    const scoreData = calculateScore(filteredIssues);

    // ── Phase 9: Mark complete ──
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "completed",
        currentPhase: "completed",
        progress: 100,
        score: scoreData.score,
        grade: scoreData.grade,
        criticalCount: scoreData.criticalCount,
        highCount: scoreData.highCount,
        mediumCount: scoreData.mediumCount,
        lowCount: scoreData.lowCount,
        completedAt: new Date(),
      },
    });

    console.log(`>>> Scan complete. Grade: ${scoreData.grade}, Score: ${scoreData.score}`);
    markScanCompleted(scanId);
  } catch (error) {
    console.error(`>>> Scan FAILED: ${error.message}`, error);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "failed",
        currentPhase: "failed",
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });

    markScanFailed(scanId, error);
  }
}

// ============================================================
// Helper: Update scan progress in database
// ============================================================
async function updateProgress(prisma, scanId, phase, progress) {
  await prisma.scan.update({
    where: { id: scanId },
    data: { currentPhase: phase, progress },
  });
}