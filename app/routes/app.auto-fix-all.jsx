import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const formData = await request.formData();
  const scanId = formData.get("scanId");

  if (!scanId) {
    return { success: false, error: "Missing scanId" };
  }

  // ── Get plan info ──
  const { PLAN_LIMITS } = await import("../utils/planLimits");
  const merchant = await prisma.merchant.findUnique({ where: { shop } });
  const userPlan = merchant?.plan || "free";
  const planConfig = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

  const isFreePlan = !planConfig.autoFix;
  const freeAutoFixCount = planConfig.freeAutoFixCount || 0;

  // ── Get scan with issues ──
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      issues: {
        where: { status: { in: ["open", "pending"] } },
      },
    },
  });

  if (!scan) {
    return { success: false, error: "Scan not found" };
  }

  // ── SEVERITY SORTING (Critical → High → Medium → Low) ──
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...scan.issues].sort((a, b) => {
    return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
  });

  // ── Determine which issues to fix ──
  let issuesToFix = [];
  let limitInfo = null;

  if (isFreePlan) {
    // Free plan logic
    const alreadyUsed = scan.freeAutoFixesUsed || 0;
    const remaining = freeAutoFixCount - alreadyUsed;

    if (remaining <= 0) {
      return {
        success: false,
        limitReached: true,
        message: `You've used all ${freeAutoFixCount} free auto-fixes for this scan. Upgrade to Starter or Growth for unlimited Auto-Fix.`,
        used: alreadyUsed,
        limit: freeAutoFixCount,
      };
    }

    // Take only top N by severity (where N = remaining free fixes)
    issuesToFix = sortedIssues.slice(0, remaining);

    limitInfo = {
      isFreePlan: true,
      totalIssues: sortedIssues.length,
      fixingNow: issuesToFix.length,
      previouslyUsed: alreadyUsed,
      maxAllowed: freeAutoFixCount,
      remainingAfter: remaining - issuesToFix.length,
    };
  } else {
    // Paid plan — fix all
    issuesToFix = sortedIssues;
    limitInfo = {
      isFreePlan: false,
      totalIssues: sortedIssues.length,
      fixingNow: issuesToFix.length,
    };
  }

  console.log(`>>> Auto-Fix: Plan=${userPlan}, Fixing ${issuesToFix.length}/${sortedIssues.length} issues`);

  // ── Process each fix ──
  const { dispatchFix } = await import("../utils/autoFix");
  const results = { fixed: 0, failed: 0, manual: 0, details: [] };

  for (const issue of issuesToFix) {
    try {
      console.log(`>>> Attempting fix: ${issue.title} | category: ${issue.category} | severity: ${issue.severity}`);
      
      const fixResult = await dispatchFix(admin, issue);
      
      console.log(`>>> Fix result:`, JSON.stringify(fixResult));

      if (fixResult.success) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: {
            status: "fixed",
            fixedAt: new Date(),
            fixDetails: JSON.stringify(fixResult.details || {}),
          },
        });

        results.fixed++;
        results.details.push({
          title: issue.title,
          status: "fixed",
          message: fixResult.message || "Fixed successfully",
        });

        console.log(`✅ Fixed: ${issue.title}`);
      } else if (fixResult.manual) {
        results.manual++;
        results.details.push({
          issueId: issue.id,
          title: issue.title,
          category: issue.category,
          status: "manual",
          message: fixResult.message || "Manual action required",
          manualInstructions: fixResult.manualInstructions || null,
          disclosureText: fixResult.disclosureText || null,
        });

        await prisma.issue.update({
          where: { id: issue.id },
          data: {
            status: "manual_required",
            fixDetails: JSON.stringify({
              manual: true,
              instructions: fixResult.manualInstructions,
              disclosureText: fixResult.disclosureText,
            }),
          },
        });
      } else {
        results.failed++;
        results.details.push({
          title: issue.title,
          status: "failed",
          message: fixResult.message || "Fix failed",
        });
      }
    } catch (error) {
      console.error(`❌ EXCEPTION fixing ${issue.title}:`, error.message);
      console.error(`Stack:`, error.stack);
      results.failed++;
      results.details.push({
        title: issue.title,
        status: "failed",
        message: error.message,
      });
    }
  }

  // ── Update scan: increment freeAutoFixesUsed ──
  if (isFreePlan && results.fixed > 0) {
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        freeAutoFixesUsed: { increment: results.fixed },
      },
    });
  }

  // ── Recalculate score ──
  const { recalculateScore } = await import("../utils/autoFix/recalculateScore");
  const newScoreData = await recalculateScore(prisma, scanId);

  console.log(`>>> Auto-Fix Complete: ${results.fixed} fixed, ${results.failed} failed, ${results.manual} manual. New grade: ${newScoreData.grade}`);

  return {
    success: true,
    results,
    newScore: newScoreData,
    limitInfo,
  };
};