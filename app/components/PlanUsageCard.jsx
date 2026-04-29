import { Card, BlockStack, Text, Box, InlineStack, Button, Badge, ProgressBar, Divider } from "@shopify/polaris";
import { Link } from "react-router";

export default function PlanUsageCard({ planInfo }) {
  if (!planInfo) return null;

  const { 
    planName, 
    limit, 
    used, 
    remaining, 
    canScan,
    displayMaxProducts,
    displayMaxImages,
  } = planInfo;
  
  const percentage = Math.min(100, (used / limit) * 100);

  const getProgressTone = () => {
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "primary";
  };

  return (
    <Card>
      <Box>
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h3" variant="headingSm">
                  {planName} Plan
                </Text>
                <Badge tone={canScan ? "success" : "critical"}>
                  {canScan ? "Active" : "Limit Reached"}
                </Badge>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {used} of {limit} scans used this month
              </Text>
            </BlockStack>

            {planName !== "Growth" && (
              <Link to="/app/pricing" style={{ textDecoration: "none" }}>
                <Button size="slim" variant="primary">
                  Upgrade
                </Button>
              </Link>
            )}
          </InlineStack>

          {/* Progress Bar */}
          <ProgressBar progress={percentage} tone={getProgressTone()} size="small" />

          <Divider />

          {/* Plan Capabilities */}
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
              Plan capabilities
            </Text>
            
            <InlineStack gap="600" wrap>
              <BlockStack gap="050">
                <Text as="p" variant="bodySm" tone="subdued">
                  Products per scan
                </Text>
                <Text as="p" variant="headingMd">
                  {displayMaxProducts}
                </Text>
              </BlockStack>

              <BlockStack gap="050">
                <Text as="p" variant="bodySm" tone="subdued">
                  AI image analysis
                </Text>
                <Text as="p" variant="headingMd">
                  {displayMaxImages}
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>

          {/* Limit Reached Warning */}
          {!canScan && (
            <Box background="bg-surface-critical-subdued" borderRadius="200">
              <Text as="p" variant="bodySm">
                You've reached your scan limit for this month. <Link to="/app/pricing">Upgrade your plan</Link> to continue scanning.
              </Text>
            </Box>
          )}

          {canScan && remaining === 1 && (
            <Box background="bg-surface-warning" padding="300" borderRadius="200">
              <Text as="p" variant="bodySm">
                Only 1 scan left this month. <Link to="/app/pricing">Upgrade for more</Link>.
              </Text>
            </Box>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}