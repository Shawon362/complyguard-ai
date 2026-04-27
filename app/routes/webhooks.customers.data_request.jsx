import { authenticate } from "../shopify.server";
export const action = async ({ request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`📥 GDPR Webhook: ${topic} for ${shop}`);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const customerId = payload?.customer?.id;
    const customerEmail = payload?.customer?.email;

    const prismaModule = await import("../db.server");
    const prisma = prismaModule.default;

    try {
      console.log(`✅ Data request acknowledged for customer ${customerId} (${customerEmail}) on shop ${shop}`);
      console.log("📌 Note: ComplyGuard AI does not collect or store any customer personal data.");
    } catch (dbError) {
      console.error("Database log failed:", dbError);
    }

    // Shopify expects 200 OK response
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ customers/data_request webhook error:", error);
    return new Response(null, { status: 401 });
  }
};