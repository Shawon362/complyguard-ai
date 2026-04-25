
import { Card, BlockStack, Text, Divider, InlineStack, Badge } from "@shopify/polaris";

export default function IssueSummaryCard({ scan }) {
  if (!scan) return null;

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Issue Summary</Text>
        <Divider />
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd">Critical</Text>
          <Badge tone="critical">{scan.criticalCount}</Badge>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd">High</Text>
          <Badge tone="critical">{scan.highCount}</Badge>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd">Medium</Text>
          <Badge tone="warning">{scan.mediumCount}</Badge>
        </InlineStack>
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd">Low</Text>
          <Badge tone="info">{scan.lowCount}</Badge>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}