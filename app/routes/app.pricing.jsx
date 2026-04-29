import { Page, BlockStack } from "@shopify/polaris";
import PricingHero from "../components/pricing/PricingHero";
import PricingGrid from "../components/pricing/PricingGrid";
import PricingComparison from "../components/pricing/PricingComparison";
import PricingFAQ from "../components/pricing/PricingFAQ";

export default function Pricing() {
  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <PricingHero />
        <PricingGrid />
        <PricingComparison />
        <PricingFAQ />
      </BlockStack>
    </Page>
  );
}