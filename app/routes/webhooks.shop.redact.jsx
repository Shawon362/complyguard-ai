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
    const shopId = payload?.shop_id;

    console.log(`Shop redact request: shop=${shopDomain}, id=${shopId}`);

    const prismaModule = await import("../db.server");
    const prisma = prismaModule.default;

    // ── Delete ALL data for this shop in parallel (faster) ──
    try {
      const startTime = Date.now();

      const [issues, scans, merchant, sessions] = await Promise.all([
        // 1. Compliance issues
        prisma.issue.deleteMany({
          where: { shop: shopDomain },
        }),

        // 2. Scan history
        prisma.scan.deleteMany({
          where: { shop: shopDomain },
        }),

        // 3. Merchant record
        prisma.merchant.deleteMany({
          where: { shop: shopDomain },
        }),

        // 4. Shopify sessions
        prisma.session.deleteMany({
          where: { shop: shopDomain },
        }),
      ]);

      const duration = Date.now() - startTime;

      console.log("✅ Shop data deleted:");
      console.log(`   - Issues:    ${issues.count}`);
      console.log(`   - Scans:     ${scans.count}`);
      console.log(`   - Merchant:  ${merchant.count}`);
      console.log(`   - Sessions:  ${sessions.count}`);
      console.log(`   - Duration:  ${duration}ms`);
      console.log(`✅ Complete data erasure for: ${shopDomain}`);
    } catch (dbError) {
      console.error("❌ Database deletion failed:", dbError);
      console.error(`⚠️ MANUAL CLEANUP REQUIRED for shop: ${shopDomain}`);
    }

    // Required: 200 OK within 5 seconds
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ shop/redact webhook error:", error);
    return new Response(null, { status: 401 });
  }
};