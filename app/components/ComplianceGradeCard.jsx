// ComplianceGradeCard.jsx
// Big A-F grade display with color-coded background

import { Card, BlockStack, Text, Divider, ProgressBar } from "@shopify/polaris";

export default function ComplianceGradeCard({ scan }) {
  const gradeConfig = {
    A: { color: "#059669", bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", label: "Fully Compliant" },
    B: { color: "#2563EB", bg: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", label: "Minor Gaps Found" },
    C: { color: "#D97706", bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", label: "Several Issues Detected" },
    D: { color: "#DC2626", bg: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", label: "Major Violations Found" },
    F: { color: "#DC2626", bg: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", label: "Serious Non-Compliance Risk" },
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Compliance Grade</Text>
        <Divider />

        {scan ? (
          <div style={{
            background: gradeConfig[scan.grade]?.bg,
            borderRadius: "12px", padding: "24px", textAlign: "center",
          }}>
            <div style={{
              fontSize: "80px", fontWeight: "900", lineHeight: "1",
              color: gradeConfig[scan.grade]?.color,
            }}>
              {scan.grade}
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: "#1E293B", marginTop: "8px" }}>
              {scan.score}<span style={{ fontSize: "18px", color: "#94A3B8", fontWeight: "400" }}>/100</span>
            </div>
            <div style={{ marginTop: "12px" }}>
              <ProgressBar progress={scan.score} size="small"
                tone={scan.score >= 75 ? "success" : scan.score >= 50 ? "highlight" : "critical"} />
            </div>
            <div style={{ marginTop: "12px", fontSize: "13px", color: "#64748B" }}>
              {gradeConfig[scan.grade]?.label}
            </div>
          </div>
        ) : (
          <div style={{
            background: "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
            borderRadius: "12px", padding: "32px", textAlign: "center",
          }}>
            <div style={{ fontSize: "64px", fontWeight: "800", color: "#CBD5E1", lineHeight: "1" }}>?</div>
            <div style={{ marginTop: "12px", fontSize: "14px", color: "#94A3B8" }}>
              Run your first scan to see your compliance grade
            </div>
          </div>
        )}
      </BlockStack>
    </Card>
  );
}