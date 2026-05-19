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
    // ──────────────────────────────────────────────────────────
    // 🛡️ SAFETY NET: Scan Quota Check
    // (Merchant dashboard checks first, this is backup)
    // ──────────────────────────────────────────────────────────
    const { checkScanLimit, getQuotaBlockedReason } = await import("../planLimits");
    const limitCheck = await checkScanLimit(prisma, shop);

    if (!limitCheck.canScan) {
      const reason = getQuotaBlockedReason(limitCheck);
      console.log(`>>> Scan BLOCKED: ${reason}`);

      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "failed",
          currentPhase: "blocked_by_quota",
          errorMessage: reason,
          completedAt: new Date(),
        },
      });
      markScanFailed(scanId, new Error(reason));
      return;
    }

    console.log(
      `>>> Quota OK: ${limitCheck.used + 1}/${limitCheck.limit} scans this month` +
        (limitCheck.isOverride ? " (admin override active)" : "")
    );

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

    // ── Phase 6.5: Validate AI Analysis Success ──
    const successfulAnalyses = aiResults.filter((r) => r.success).length;
    const totalAttempted = aiResults.length;
    const aiAnalysisFailed = totalAttempted > 0 && successfulAnalyses === 0;
    const aiAnalysisDegraded =
      totalAttempted >= 5 &&
      successfulAnalyses > 0 &&
      successfulAnalyses < totalAttempted * 0.5;

    let aiSystemIssue = null;

    if (aiAnalysisFailed) {
      // Internal log (admin can debug)
      const sampleError =
        aiResults.find((r) => r.reasoning?.startsWith("Failed:"))?.reasoning ||
        "AI service unavailable";
      const cleanError = sampleError.replace("Failed: ", "");

      console.log(`>>> ⚠️ AI ANALYSIS FAILED: 0/${totalAttempted} images analyzed`);
      console.log(`>>>    Internal reason: ${cleanError}`);

      // Merchant-facing issue (friendly, no technical leak)
      aiSystemIssue = {
        scanId,
        shop,
        category: "service_unavailable",
        article: "Service Health",
        severity: "critical",
        title: "AI Analysis Service Temporarily Unavailable",
        description: `We couldn't complete the AI image analysis for your ${totalAttempted} product images at this time. This may be due to high traffic or temporary service maintenance. Your products were not checked for AI-generated content during this scan.`,
        evidence: JSON.stringify({
          totalImages: totalAttempted,
          analyzed: 0,
          internalNote: cleanError, // For admin debugging only
        }),
        suggestedFix:
          "Please re-run the scan in a few minutes. If this issue persists for more than an hour, contact support for assistance.",
        status: "open",
      };
    } else if (aiAnalysisDegraded) {
      const failedCount = totalAttempted - successfulAnalyses;
      const failureRate = Math.round((failedCount / totalAttempted) * 100);

      console.log(
        `>>> ⚠️ AI ANALYSIS DEGRADED: ${successfulAnalyses}/${totalAttempted} succeeded (${failureRate}% failed)`
      );

      aiSystemIssue = {
        scanId,
        shop,
        category: "service_degraded",
        article: "Service Health",
        severity: "high",
        title: "AI Analysis Partially Completed",
        description: `${failedCount} of your ${totalAttempted} product images couldn't be analyzed (${failureRate}% incomplete). Some AI-generated content may not have been detected during this scan. Re-running the scan when the service is fully available will give complete results.`,
        evidence: JSON.stringify({
          totalImages: totalAttempted,
          analyzed: successfulAnalyses,
          failed: failedCount,
          failureRate: `${failureRate}%`,
        }),
        suggestedFix:
          "Re-run the scan in a few minutes for complete results. If many images fail repeatedly, contact support.",
        status: "open",
      };
    } else if (totalAttempted > 0) {
      console.log(
        `>>> ✓ AI analysis healthy: ${successfulAnalyses}/${totalAttempted} succeeded`
      );
    }

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

    if (aiSystemIssue) {
      filteredIssues.push(aiSystemIssue);
      console.log(`>>> ⚠️ Added system issue: ${aiSystemIssue.title}`);
    }

    console.log(
      `>>> Total issues: ${filteredIssues.length} (${allIssues.length - filteredIssues.length} acknowledged-skipped${aiSystemIssue ? " + 1 system warning" : ""})`
    );

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