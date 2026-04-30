import { Card, Box, BlockStack, Text, Divider, Icon } from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { PLANS } from "./pricingData";

// ============================================================
// Feature comparison data
// ============================================================
const COMPARISON_FEATURES = [
  { name: "Scans per month", values: ["1", "3", "15"] },
  { name: "Products per scan", values: ["50", "1,000", "Unlimited"] },
  { name: "AI image analyses", values: ["50", "1,000", "Unlimited"] },
  { name: "View detected issues", values: [true, true, true] },
  { name: "Compliance grade (A–F)", values: [true, true, true] },
  { name: "Privacy Policy check", values: [true, true, true] },
  { name: "AI image detection", values: [true, true, true] },
  { name: "Free Auto-Fixes per scan", values: ["3", "Unlimited", "Unlimited"] },
  { name: "PDF report export", values: [false, true, true] },
  { name: "Priority support", values: [false, false, true] },
];
export default function PricingComparison() {
  return (
    <Card>
      <Box>
        <BlockStack gap="400">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              Compare all features
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              See exactly what's included in each plan
            </Text>
          </BlockStack>

          <Divider />

          <ComparisonTable features={COMPARISON_FEATURES} />
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================
// Table Component
// ============================================================
function ComparisonTable({ features }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "600px",
      }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #E1E3E5" }}>
            <th style={{
              padding: "14px 12px",
              textAlign: "left",
              fontSize: "13px",
              color: "#6D7175",
              fontWeight: "600",
            }}>
              Feature
            </th>
            {PLANS.map((plan) => (
              <th key={plan.id} style={{
                padding: "14px 12px",
                textAlign: "center",
                minWidth: "120px",
              }}>
                <BlockStack gap="050" align="center">
                  <Text as="p" variant="headingSm">
                    {plan.name}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    ${plan.price}/{plan.period}
                  </Text>
                </BlockStack>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, i) => (
            <FeatureRow key={i} feature={feature} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Single Feature Row
// ============================================================
function FeatureRow({ feature }) {
  return (
    <tr style={{ borderBottom: "1px solid #F0F0F0" }}>
      <td style={{
        padding: "14px 12px",
        fontSize: "13px",
        color: "#212B36",
        fontWeight: "500",
      }}>
        {feature.name}
      </td>
      {feature.values.map((value, j) => (
        <td key={j} style={{ padding: "14px 12px", textAlign: "center" }}>
          {typeof value === "boolean" ? (
            <BoolCell value={value} />
          ) : (
            <Text as="span" variant="bodyMd" fontWeight="medium">
              {value}
            </Text>
          )}
        </td>
      ))}
    </tr>
  );
}

// ============================================================
// Boolean Cell (✓ or ✗)
// ============================================================
function BoolCell({ value }) {
  return (
    <div style={{
      display: "inline-flex",
      width: "20px",
      height: "20px",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Icon
        source={value ? CheckIcon : XIcon}
        tone={value ? "success" : "subdued"}
      />
    </div>
  );
}