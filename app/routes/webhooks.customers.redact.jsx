import { authenticate } from "../shopify.server";

// ============================================================
// GDPR: customers/redact
// Triggered when a customer requests their data be deleted
// 
// ComplyGuard AI Context:
// We do NOT store customer personal data (email, name, address).
// We only scan product data. So we acknowledge and log.
// ============================================================
export const action = async ({ request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`🗑️ GDPR Webhook: ${topic} for ${shop}`);

    const customerId = payload?.customer?.id;
    const customerEmail = payload?.customer?.email;
    const ordersToRedact = payload?.orders_to_redact || [];

    console.log(
      `Customer redact request: customer_id=${customerId}, ` +
        `email=${customerEmail}, orders=${ordersToRedact.length}`
    );

    // ComplyGuard AI does not store customer personal data.
    // We only process product images and store-level compliance data.
    // No customer data to delete.
    console.log(
      "ℹComplyGuard AI does not store customer personal data. " +
        "No customer-specific deletion required."
    );

    // Audit log (for compliance documentation)
    try {
      const prismaModule = await import("../db.server");
      const prisma = prismaModule.default;

      // If you want to keep an audit trail of these requests
      // (optional but recommended for compliance documentation)
      // Uncomment the lines below if you have a ComplianceLog model:
      
      // await prisma.complianceLog.create({
      //   data: {
      //     shop,
      //     topic: "customers/redact",
      //     customerId: String(customerId || ""),
      //     customerEmail: customerEmail || "",
      //     payload: JSON.stringify(payload),
      //     processedAt: new Date(),
      //   },
      // }).catch(e => console.error("Audit log failed:", e));
    } catch (dbError) {
      console.error("Audit logging failed:", dbError);
      // Don't fail the webhook just because audit log failed
    }

    // Required: Return 200 within 5 seconds
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ customers/redact webhook error:", error);
    return new Response(null, { status: 401 });
  }
};