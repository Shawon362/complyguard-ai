import { authenticate } from "../shopify.server";

// ============================================================
// Webhook: app_subscriptions/update
// ============================================================
export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`>>> Webhook received: ${topic} for ${shop}`);
  console.log(`>>> Payload:`, JSON.stringify(payload, null, 2));

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  try {
    // Extract subscription details from payload
    const subscription = payload?.app_subscription;
    if (!subscription) {
      console.log(">>> No subscription data in payload");
      return new Response("OK", { status: 200 });
    }

    const { name, status, admin_graphql_api_id } = subscription;
    
    console.log(`>>> Subscription: name="${name}", status="${status}"`);

    // Determine plan from subscription name
    let newPlan = "free";
    if (status === "ACTIVE") {
      const lowered = (name || "").toLowerCase();
      if (lowered.includes("starter")) newPlan = "starter";
      else if (lowered.includes("growth")) newPlan = "growth";
    }

    const inactiveStatuses = ["CANCELLED", "EXPIRED", "FROZEN", "DECLINED"];
    if (inactiveStatuses.includes(status)) {
      newPlan = "free";
    }

    // Update merchant plan
    const updated = await prisma.merchant.update({
      where: { shop },
      data: {
        plan: newPlan,
        planStartDate: status === "ACTIVE" ? new Date() : null,
      },
    });

    console.log(`✅ Webhook updated plan for ${shop}: ${newPlan} (status: ${status})`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(">>> Webhook processing error:", error);
    return new Response("Error", { status: 500 });
  }
};