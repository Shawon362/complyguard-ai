import { Card, BlockStack, Text, Button, InlineStack, Box, Badge, Icon } from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";

export default function PricingCard({ plan }) {
  const handleClick = () => {
    if (plan.id === "free") return;
    alert(`Upgrade to ${plan.name} - Billing integration coming soon!`);
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

            {/* CTA Button */}
            <Button
              variant={plan.popular ? "primary" : "secondary"}
              size="large"
              fullWidth
              onClick={handleClick}
              disabled={plan.id === "free"}
            >
              {plan.cta}
            </Button>

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