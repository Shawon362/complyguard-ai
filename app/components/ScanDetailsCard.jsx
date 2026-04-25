import { Card, BlockStack, Text, Divider, InlineStack } from "@shopify/polaris";

export default function ScanDetailsCard({ scan }) {
  if (!scan) return null;

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Scan Details</Text>
        <Divider />
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">Products scanned</Text>
          <Text as="p" variant="bodyMd">{scan.totalProducts}</Text>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">Images analyzed</Text>
          <Text as="p" variant="bodyMd">{scan.totalImages}</Text>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">Pages checked</Text>
          <Text as="p" variant="bodyMd">{scan.totalPages}</Text>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">Last scan</Text>
          <Text as="p" variant="bodyMd">
            {new Date(scan.completedAt || scan.createdAt).toLocaleString()}
          </Text>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}