import { authenticate } from "../shopify.server";
import { dispatchFix, canAutoFix } from "../utils/autoFix";
import { recalculateScore } from "../utils/autoFix/recalculateScore";

// ============================================================
// AUTO-FIX ALL — Bulk fix all fixable issues in a scan
// ============================================================
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const scanId = formData.get("scanId");

  if (!scanId) {
    return { success: false, message: "Missing scan ID" };
  }

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  // ── Plan Check ──
  const merchant = await prisma.merchant.findUnique({ where: { shop } });
  const plan = merchant?.plan || "free";

  if (plan === "free") {
    return {
      success: false,
      message: "Auto-Fix is only available on Starter and Growth plans. Please upgrade.",
      requiresUpgrade: true,
    };
  }

  // ── Get all open issues ──
  const issues = await prisma.issue.findMany({
    where: {
      scanId,
      shop,
      status: { in: ["open", "pending"] },
    },
  });

  if (issues.length === 0) {
    return { success: false, message: "No issues to fix" };
  }

  console.log(`>>> Auto-Fix All: Processing ${issues.length} issues`);

  // ── Track results ──
  const results = {
    fixed: 0,
    failed: 0,
    notSupported: 0,
    details: [],
  };

  // ── Process each issue ──
  for (const issue of issues) {
    // Skip if not auto-fixable
    if (!canAutoFix(issue.category)) {
      results.notSupported++;
      results.details.push({
        title: issue.title,
        status: "manual",
        message: "Requires manual action",
      });
      continue;
    }

    try {
      const result = await dispatchFix(admin, issue);

      if (result.success) {
        // Mark as fixed in database
        await prisma.issue.update({
          where: { id: issue.id },
          data: { status: "fixed" },
        });

        results.fixed++;
        results.details.push({
          title: issue.title,
          status: "fixed",
          message: result.message,
        });
        console.log(`✅ Fixed: ${issue.title}`);
      } else {
        results.failed++;
        results.details.push({
          title: issue.title,
          status: "failed",
          message: result.message || "Unknown error",
        });
        console.log(`❌ Failed: ${issue.title} - ${result.message}`);
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        title: issue.title,
        status: "failed",
        message: error.message,
      });
      console.error(`Error fixing ${issue.title}:`, error);
    }
  }

  // ── Recalculate score ──
  const newScoreData = await recalculateScore(prisma, scanId);

  console.log(
    `>>> Auto-Fix Complete: ${results.fixed} fixed, ${results.failed} failed, ${results.notSupported} manual. New grade: ${newScoreData.grade}`
  );

  return {
    success: true,
    message: `Auto-Fix complete: ${results.fixed} fixed, ${results.failed} failed, ${results.notSupported} require manual action`,
    results,
    newScore: newScoreData.score,
    newGrade: newScoreData.grade,
  };
};