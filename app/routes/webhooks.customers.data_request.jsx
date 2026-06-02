import { authenticate } from "../shopify.server";

// ============================================================
// GDPR: customers/data_request
// Triggered when a customer requests their stored data
// 
// ComplyGuard AI Context:
// We do NOT store customer personal data. We only process
// product/shop data. So this request returns "no data found".
// We have 30 days to formally respond.
// ============================================================
export const action = async ({ request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`GDPR Webhook: ${topic} for ${shop}`);

    const customerId = payload?.customer?.id;
    const customerEmail = payload?.customer?.email;
    const ordersRequested = payload?.orders_requested || [];

    console.log(
      `📋 Data request: customer_id=${customerId}, ` +
        `email=${customerEmail}, orders=${ordersRequested.length}`
    );

    // ComplyGuard AI Privacy Policy:
    // We do not collect, store, or process customer personal data.
    // Our app analyzes product images and store-level data only.
    console.log(
      "ℹData request acknowledged. ComplyGuard AI does not " +
        "store customer personal data — nothing to return."
    );

    // Optional: Audit log for compliance tracking
    try {
      const prismaModule = await import("../db.server");
      const prisma = prismaModule.default;
      
      // Uncomment if you implement a ComplianceLog model:
      // await prisma.complianceLog.create({
      //   data: {
      //     shop,
      //     topic: "customers/data_request",
      //     customerId: String(customerId || ""),
      //     customerEmail: customerEmail || "",
      //     payload: JSON.stringify(payload),
      //     processedAt: new Date(),
      //   },
      // }).catch(e => console.error("Audit log failed:", e));
    } catch (dbError) {
      console.error("Audit logging failed:", dbError);
    }

    // Required: 200 OK within 5 seconds
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ customers/data_request webhook error:", error);
    return new Response(null, { status: 401 });
  }
};