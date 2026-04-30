import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { getActiveSubscriptions, getPlanKeyFromSubscriptionName } from "../utils/billing.server";

// ============================================================
// LOADER — Handle Shopify return after subscription approval
// ============================================================
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const planKey = url.searchParams.get("plan");
  const chargeId = url.searchParams.get("charge_id");

  console.log(`>>> Billing callback: shop=${shop}, plan=${planKey}, chargeId=${chargeId}`);

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  try {
    // Verify subscription is active in Shopify
    const subscriptions = await getActiveSubscriptions(admin);

    console.log(`>>> Active subscriptions: ${subscriptions.length}`);

    const activeSubscription = subscriptions.find(
      (sub) => sub.status === "ACTIVE"
    );

    if (!activeSubscription) {
      console.log(`>>> No active subscription found - user may have declined`);
      return redirect(`/app/pricing?status=declined`);
    }

    const detectedPlan = getPlanKeyFromSubscriptionName(activeSubscription.name);
    const finalPlan = planKey || detectedPlan;

    console.log(`>>> Subscription verified: ${activeSubscription.name} → plan=${finalPlan}`);

    // Update merchant's plan in database
    await prisma.merchant.update({
      where: { shop },
      data: {
        plan: finalPlan,
        planStartDate: new Date(),
      },
    });

    console.log(`✅ Plan updated for ${shop}: ${finalPlan}`);

    return redirect(`/app?upgraded=${finalPlan}`);
  } catch (error) {
    console.error("Billing callback error:", error);
    return redirect(`/app/pricing?status=error&msg=${encodeURIComponent(error.message)}`);
  }
};

// ============================================================
// Default export (route component)
// Required by React Router but loader handles redirect
// ============================================================
export default function BillingCallback() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <p>Processing your subscription...</p>
    </div>
  );
}