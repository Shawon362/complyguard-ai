import { authenticate } from "../shopify.server";

// ============================================================
// Acknowledge Issue Endpoint
// User says: "I'll handle this manually, stop showing it"
// ============================================================
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const formData = await request.formData();
  const issueId = formData.get("issueId");
  const category = formData.get("category");

  if (!issueId || !category) {
    return { success: false, error: "Missing issueId or category" };
  }

  try {
    // Mark this issue as user_acknowledged
    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: "user_acknowledged",
        acknowledgedAt: new Date(),
        acknowledgedNote: "User chose to handle this manually",
      },
    });

    console.log(`✅ Issue acknowledged: ${updated.title} | shop: ${shop}`);

    return {
      success: true,
      message: "Issue acknowledged. Future scans will skip this for 30 days.",
      issueId: updated.id,
      category: updated.category,
    };
  } catch (error) {
    console.error("Acknowledge failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};