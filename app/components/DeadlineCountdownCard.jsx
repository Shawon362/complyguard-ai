

import { Card, BlockStack, Text, Divider } from "@shopify/polaris";

export default function DeadlineCountdownCard({ daysLeft }) {
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">Enforcement Deadline</Text>
        <Divider />
        <div style={{
          background: daysLeft <= 30
            ? "linear-gradient(135deg, #FEF2F2, #FEE2E2)"
            : daysLeft <= 90
              ? "linear-gradient(135deg, #FFFBEB, #FEF3C7)"
              : "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
          borderRadius: "12px", padding: "24px", textAlign: "center",
        }}>
          <div style={{
            fontSize: "56px", fontWeight: "900", lineHeight: "1",
            color: daysLeft <= 30 ? "#DC2626" : daysLeft <= 90 ? "#D97706" : "#0284C7",
          }}>
            {daysLeft}
          </div>
          <div style={{
            fontSize: "14px", fontWeight: "600", color: "#475569",
            marginTop: "8px", textTransform: "uppercase", letterSpacing: "1px",
          }}>
            Days Remaining
          </div>
          <div style={{
            marginTop: "16px", padding: "8px 16px",
            background: "rgba(255,255,255,0.7)", borderRadius: "8px", display: "inline-block",
          }}>
            <span style={{ fontSize: "13px", color: "#64748B" }}>
              EU AI Act Article 50 — August 2, 2026
            </span>
          </div>
        </div>
      </BlockStack>
    </Card>
  );
}