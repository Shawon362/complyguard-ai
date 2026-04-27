import { Card, BlockStack, Text, Box, InlineStack, Button, Badge, ProgressBar } from "@shopify/polaris";
import { Link } from "react-router";

export default function PlanUsageCard({ planInfo }) {
  if (!planInfo) return null;

  const { planName, limit, used, remaining, canScan } = planInfo;
  const percentage = Math.min(100, (used / limit) * 100);

  const getProgressTone = () => {
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "primary";
  };

  return (
    <Card>
      <Box>
        <BlockStack gap="300">
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

          <ProgressBar progress={percentage} tone={getProgressTone()} size="small" />

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