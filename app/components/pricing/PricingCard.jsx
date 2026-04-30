import { Card, BlockStack, Text, Button, InlineStack, Box, Badge, Icon } from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { useFetcher } from "react-router";
import { useEffect } from "react";

export default function PricingCard({ plan, currentPlan = "free" }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.confirmationUrl) {
      window.top.location.href = fetcher.data.confirmationUrl;
    }
  }, [fetcher.data]);

  const isCurrentPlan = currentPlan === plan.id;
  const isFreePlan = plan.id === "free";

  const renderButton = () => {
    if (isFreePlan) {
      return (
        <Button variant="secondary" size="large" fullWidth disabled>
          {currentPlan === "free" ? "Current Plan" : "Free Plan"}
        </Button>
      );
    }

    if (isCurrentPlan) {
      return (
        <Button variant="secondary" tone="success" size="large" fullWidth disabled>
          ✓ Current Plan
        </Button>
      );
    }

    return (
      <fetcher.Form method="POST" action="/app/pricing">
        <input type="hidden" name="plan" value={plan.id} />
        <Button
          submit
          variant={plan.popular ? "primary" : "secondary"}
          size="large"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Redirecting..." : plan.cta}
        </Button>
      </fetcher.Form>
    );
  };

  return (
    <div style={{
      position: "relative",
      height: "100%",
    }}>
      {plan.popular && (
        <div style={{
          position: "absolute",
          top: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
        }}>
          <Badge tone="info">Most Popular</Badge>
        </div>
      )}

      <Card
        background={plan.popular ? "bg-surface-selected" : "bg-surface"}
      >
        <Box padding="500">
          <BlockStack gap="500">
            {/* Header */}
            <BlockStack gap="100">
              <Text as="h3" variant="headingMd">
                {plan.name}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {plan.description}
              </Text>
            </BlockStack>

            {/* Price */}
            <InlineStack gap="100" blockAlign="baseline">
              <Text as="p" variant="heading2xl">
                ${plan.price}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                /{plan.period}
              </Text>
            </InlineStack>

            {/* CTA Button (smart based on currentPlan) */}
            {renderButton()}

            {/* Error display if subscription create failed */}
            {fetcher.data?.error && (
              <Box background="bg-surface-critical-subdued" padding="300" borderRadius="200">
                <Text as="p" variant="bodySm" tone="critical">
                  {fetcher.data.error}
                </Text>
              </Box>
            )}

            {/* Features */}
            <BlockStack gap="200">
              {plan.features.map((feature, i) => (
                <FeatureRow key={i} feature={feature} />
              ))}
            </BlockStack>
          </BlockStack>
        </Box>
      </Card>
    </div>
  );
}

// ============================================================
// Single Feature Row
// ============================================================
function FeatureRow({ feature }) {
  return (
    <InlineStack gap="200" blockAlign="center" wrap={false}>
      <div style={{ width: "16px", height: "16px", flexShrink: 0 }}>
        <Icon
          source={feature.included ? CheckIcon : XIcon}
          tone={feature.included ? "#212B36" : "subdued"}
        />
      </div>
      <Text as="p" variant="bodySm">
        <span style={{ color: feature.included ? "#212B36" : "#9CA3AF" }}>
          {feature.text}
        </span>
      </Text>
      {feature.badge && (
        <Badge tone="info" size="small">{feature.badge}</Badge>
      )}
    </InlineStack>
  );
}