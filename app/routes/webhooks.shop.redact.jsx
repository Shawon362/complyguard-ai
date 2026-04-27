import { authenticate } from "../shopify.server";

// ============================================================
// GDPR: shop/redact
// Triggered 48 hours after merchant uninstalls the app
// We MUST delete ALL data for this shop
// ============================================================
export const action = async ({ request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`🗑️ GDPR Webhook: ${topic} for ${shop}`);

    const shopDomain = payload?.shop_domain || shop;

    const prismaModule = await import("../db.server");
    const prisma = prismaModule.default;

    // ── DELETE ALL data for this shop ──
    try {
      // 1. Delete all Issues for this shop
      const deletedIssues = await prisma.issue.deleteMany({
        where: { shop: shopDomain },
      });
      console.log(`Deleted ${deletedIssues.count} issues`);

      // 2. Delete all Scans for this shop
      const deletedScans = await prisma.scan.deleteMany({
        where: { shop: shopDomain },
      });
      console.log(`Deleted ${deletedScans.count} scans`);

      // 3. Delete Merchant record
      const deletedMerchant = await prisma.merchant.deleteMany({
        where: { shop: shopDomain },
      });
      console.log(`Deleted ${deletedMerchant.count} merchant records`);

      // 4. Delete Shopify Sessions
      const deletedSessions = await prisma.session.deleteMany({
        where: { shop: shopDomain },
      });
      console.log(`Deleted ${deletedSessions.count} sessions`);

      console.log(`✅ All data deleted for shop: ${shopDomain}`);
    } catch (dbError) {
      console.error("❌ Database deletion failed:", dbError);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ shop/redact webhook error:", error);
    return new Response(null, { status: 401 });
  }
};