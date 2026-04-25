import { Card, BlockStack, Text, Divider, InlineStack, Button, ProgressBar } from "@shopify/polaris";

export default function ScannerCard({ onScan, isScanning, productCount, totalImages }) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Compliance Scanner</Text>
        <Divider />
        <Text as="p" variant="bodyMd">
          Scan all products, images, and policy pages in your store
          to detect EU AI Act Article 50 compliance violations.
        </Text>
        <InlineStack align="start">
          <Button
            variant="primary"
            size="large"
            onClick={onScan}
            loading={isScanning}
          >
            {isScanning ? "Scanning..." : "Scan Now"}
          </Button>
        </InlineStack>
        {isScanning && (
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" tone="subdued">
              Scanning {productCount} products, {totalImages} images,
              and policy pages...
            </Text>
            <ProgressBar progress={75} size="small" tone="primary" />
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}