import { Text, Box, BlockStack } from "@shopify/polaris";

export default function PricingHero() {
  return (
    <Box padding="600">
      <BlockStack gap="200" align="center">
        <div style={{ textAlign: "center" }}>
          <Text as="h1" variant="heading2xl">
            Simple, transparent pricing
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodyLg" tone="subdued">
              Choose a plan that scales with your store
            </Text>
          </Box>
        </div>
      </BlockStack>
    </Box>
  );
}