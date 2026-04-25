import { Card, BlockStack, Text, Divider, InlineStack } from "@shopify/polaris";

export default function StoreOverviewCard({ shopName, productCount, totalImages }) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Store Overview</Text>
        <Divider />
        <InlineStack gap="800" align="start">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd" tone="subdued">Store</Text>
            <Text as="p" variant="headingSm">{shopName}</Text>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd" tone="subdued">Products</Text>
            <Text as="p" variant="headingSm">{productCount}</Text>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd" tone="subdued">Images</Text>
            <Text as="p" variant="headingSm">{totalImages}</Text>
          </BlockStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}