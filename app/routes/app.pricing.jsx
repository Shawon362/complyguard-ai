import { Page, BlockStack } from "@shopify/polaris";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

import PricingHero from "../components/pricing/PricingHero";
import PricingGrid from "../components/pricing/PricingGrid";
import PricingComparison from "../components/pricing/PricingComparison";
import PricingFAQ from "../components/pricing/PricingFAQ";

// ============================================================
// LOADER — Get current plan to show "Current Plan" badge
// ============================================================
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const merchant = await prisma.merchant.findUnique({ where: { shop } });
  const currentPlan = merchant?.plan || "free";

  return { currentPlan };
};

// ============================================================
// ACTION — Handle Upgrade button click
// ============================================================
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const planKey = formData.get("plan");

  if (!planKey || !["starter", "growth"].includes(planKey)) {
    return { success: false, error: "Invalid plan selected" };
  }

  try {
    const shopName = shop.replace(".myshopify.com", "");
    const pricingUrl = `https://admin.shopify.com/store/${shopName}/charges/complyguard-ai-1/pricing_plans`;
    console.log(`>>> Redirecting ${shop} to Managed Pricing page: ${pricingUrl}`);
    return {
      success: true,
      confirmationUrl: pricingUrl,
      planKey,
    };
  } catch (error) {
    console.error("Subscription create failed:", error);
    return {
      success: false,
      error: error.message || "Failed to create subscription. Please try again.",
    };
  }
};

// ============================================================
// UI
// ============================================================
export default function Pricing() {
  const { currentPlan } = useLoaderData();
  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <PricingHero />
        <PricingGrid currentPlan={currentPlan} />
        <PricingComparison />
        <PricingFAQ />
      </BlockStack>
    </Page>
  );
}