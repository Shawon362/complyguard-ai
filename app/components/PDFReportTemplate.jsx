// ============================================================
// PDF Report Template — HTML/CSS based for beautiful design
// This component renders a hidden div, then html2canvas converts it
// ============================================================

export default function PDFReportTemplate({ scan, shopName, refProp }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A": return "#00A47C";
      case "B": return "#5C8D89";
      case "C": return "#F49342";
      case "D": return "#D72C0D";
      case "F": return "#8E1F0B";
      default: return "#6D7175";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "#D72C0D";
      case "high": return "#D72C0D";
      case "medium": return "#F49342";
      case "low": return "#5C6AC4";
      default: return "#6D7175";
    }
  };

  const totalIssues = scan.issues?.length || 0;
  const openIssues = scan.issues?.filter(
    (i) => i.status === "open" || i.status === "pending"
  ).length || 0;
  const fixedIssues = scan.issues?.filter((i) => i.status === "fixed").length || 0;

  // Sort issues by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...(scan.issues || [])].sort(
    (a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4)
  );

  // Checklist
  const checklist = [
    { item: "AI-generated images labeled clearly", status: !scan.issues?.some(i => i.category === "ai_image_detected") },
    { item: "Privacy Policy includes AI disclosure", status: !scan.issues?.some(i => i.category === "policy_no_ai_disclosure" || i.category === "no_privacy_policy") },
    { item: "Terms of Service mentions automated decisions", status: !scan.issues?.some(i => i.category === "terms_no_automated_disclosure") },
    { item: "All product images have alt-text", status: !scan.issues?.some(i => i.category === "missing_alt_text") },
    { item: "AI chatbots/apps disclosed", status: !scan.issues?.some(i => i.category === "ai_app_undisclosed") },
  ];

  return (
    <div
      ref={refProp}
      style={{
        width: "794px", // A4 width at 96 DPI
        background: "white",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        color: "#212B36",
        position: "absolute",
        left: "-9999px",
        top: 0,
      }}
    >
      {/* ═══════════════════════════════════════════ */}
      {/* PAGE 1: COVER */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{
        padding: "0",
        pageBreakAfter: "always",
        minHeight: "1100px",
        position: "relative",
      }}>
        {/* Header Banner */}
        <div style={{
          background: "linear-gradient(135deg, #5C6AC4 0%, #202E78 100%)",
          padding: "40px 60px",
          color: "white",
        }}>
          <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
            🛡️ ComplyGuard AI
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            EU AI Act Compliance Report
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: "60px" }}>
          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", color: "#6D7175", letterSpacing: "2px", marginBottom: "8px" }}>
              COMPLIANCE REPORT FOR
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>
              {shopName || "Your Store"}
            </div>
            <div style={{ fontSize: "13px", color: "#6D7175" }}>
              Scan Date: {formatDate(scan.completedAt || scan.createdAt)}
            </div>
            <div style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "monospace", marginTop: "4px" }}>
              Scan ID: {scan.id}
            </div>
          </div>

          {/* Big Grade Card */}
          <div style={{
            background: `linear-gradient(135deg, ${getGradeColor(scan.grade)} 0%, ${getGradeColor(scan.grade)}DD 100%)`,
            borderRadius: "20px",
            padding: "60px 40px",
            textAlign: "center",
            color: "white",
            marginBottom: "40px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", marginBottom: "16px", opacity: 0.9 }}>
              COMPLIANCE GRADE
            </div>
            <div style={{ fontSize: "140px", fontWeight: "800", lineHeight: "1", marginBottom: "16px" }}>
              {scan.grade || "—"}
            </div>
            <div style={{ fontSize: "42px", fontWeight: "700", marginBottom: "8px" }}>
              {scan.score || 0}<span style={{ fontSize: "24px", opacity: 0.7 }}>/100</span>
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9, letterSpacing: "1px" }}>
              COMPLIANCE SCORE
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "16px",
            marginBottom: "40px",
          }}>
            {[
              { label: "Products", value: scan.totalProducts || 0, color: "#5C6AC4" },
              { label: "Images", value: scan.totalImages || 0, color: "#00A47C" },
              { label: "Issues", value: totalIssues, color: "#F49342" },
              { label: "Open", value: openIssues, color: openIssues > 0 ? "#D72C0D" : "#00A47C" },
            ].map((stat, i) => (
              <div key={i} style={{
                background: "#F7F7F7",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "32px", fontWeight: "700", color: stat.color, marginBottom: "4px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "10px", color: "#6D7175", letterSpacing: "1px" }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Disclaimer */}
          <div style={{
            position: "absolute",
            bottom: "40px",
            left: "60px",
            right: "60px",
            fontSize: "9px",
            color: "#9CA3AF",
            fontStyle: "italic",
            lineHeight: "1.5",
            borderTop: "1px solid #E1E3E5",
            paddingTop: "16px",
          }}>
            This report is generated by ComplyGuard AI for compliance assessment purposes. It is not legal advice. For binding legal opinion, consult a qualified attorney specializing in EU AI Act and GDPR.
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PAGE 2: EXECUTIVE SUMMARY */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{
        padding: "60px",
        pageBreakAfter: "always",
        minHeight: "1100px",
      }}>
        {/* Header strip */}
        <div style={{
          background: "linear-gradient(90deg, #5C6AC4 0%, #202E78 100%)",
          height: "4px",
          marginBottom: "30px",
        }} />

        <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
          Executive Summary
        </div>
        <div style={{ fontSize: "13px", color: "#6D7175", marginBottom: "30px" }}>
          Overview of your store's EU AI Act compliance status
        </div>

        {/* Status Banner */}
        <div style={{
          background: scan.score >= 75 ? "#E8F5E9" : scan.score >= 50 ? "#FFF4E6" : "#FFEBEE",
          borderLeft: `4px solid ${scan.score >= 75 ? "#00A47C" : scan.score >= 50 ? "#F49342" : "#D72C0D"}`,
          padding: "20px 24px",
          borderRadius: "8px",
          marginBottom: "30px",
        }}>
          <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>
            {scan.score >= 75 ? "✓ Good Compliance Status" : scan.score >= 50 ? "⚠ Action Recommended" : "🚨 Urgent Action Required"}
          </div>
          <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.6" }}>
            Your store achieved a compliance grade of <strong>{scan.grade}</strong> with a score of <strong>{scan.score}/100</strong>.
            {totalIssues > 0
              ? ` ${totalIssues} compliance issues were detected, requiring your attention.`
              : " Excellent! No compliance issues detected."}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>
          Issue Severity Breakdown
        </div>

        <div style={{ marginBottom: "30px" }}>
          {[
            { label: "Critical", count: scan.criticalCount || 0, color: "#D72C0D" },
            { label: "High", count: scan.highCount || 0, color: "#D72C0D" },
            { label: "Medium", count: scan.mediumCount || 0, color: "#F49342" },
            { label: "Low", count: scan.lowCount || 0, color: "#5C6AC4" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #E1E3E5",
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: item.color,
                marginRight: "12px",
              }} />
              <div style={{ flex: 1, fontSize: "13px", fontWeight: "500" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: item.color }}>
                {item.count}
              </div>
            </div>
          ))}
        </div>

        {/* Key Recommendations */}
        <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>
          Top Recommendations
        </div>

        <div>
          {generateRecommendations(scan).map((rec, i) => (
            <div key={i} style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              padding: "12px 16px",
              background: "#F9FAFB",
              borderRadius: "8px",
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#5C6AC4",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: "12px", lineHeight: "1.6", color: "#374151" }}>
                {rec}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PAGE 3+: DETAILED ISSUES */}
      {/* ═══════════════════════════════════════════ */}
      {sortedIssues.length > 0 && (
        <div style={{
          padding: "60px",
          pageBreakAfter: "always",
          minHeight: "1100px",
        }}>
          <div style={{
            background: "linear-gradient(90deg, #5C6AC4 0%, #202E78 100%)",
            height: "4px",
            marginBottom: "30px",
          }} />

          <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
            Detailed Issues
          </div>
          <div style={{ fontSize: "13px", color: "#6D7175", marginBottom: "30px" }}>
            {sortedIssues.length} issues found • Sorted by severity
          </div>

          {sortedIssues.map((issue, i) => (
            <div key={i} style={{
              background: "white",
              border: "1px solid #E1E3E5",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
              borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{
                  background: getSeverityColor(issue.severity),
                  color: "white",
                  fontSize: "9px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  letterSpacing: "1px",
                }}>
                  {(issue.severity || "MEDIUM").toUpperCase()}
                </div>
                <div style={{ fontSize: "10px", color: "#6D7175" }}>
                  {issue.article}
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px", color: "#212B36" }}>
                {issue.title}
              </div>

              {/* Description */}
              <div style={{ fontSize: "11px", color: "#6D7175", lineHeight: "1.6", marginBottom: "12px" }}>
                {(issue.description || "").substring(0, 300)}
              </div>

              {/* Suggested Fix */}
              {issue.suggestedFix && (
                <div style={{
                  background: "#E8F5E9",
                  border: "1px solid #C8E6C9",
                  borderRadius: "6px",
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#00A47C", marginBottom: "4px" }}>
                    💡 SUGGESTED FIX
                  </div>
                  <div style={{ fontSize: "11px", color: "#212B36", lineHeight: "1.5" }}>
                    {(issue.suggestedFix || "").substring(0, 250)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL PAGE: CHECKLIST + DISCLAIMER */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{
        padding: "60px",
        minHeight: "1100px",
      }}>
        <div style={{
          background: "linear-gradient(90deg, #5C6AC4 0%, #202E78 100%)",
          height: "4px",
          marginBottom: "30px",
        }} />

        <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
          Compliance Checklist
        </div>
        <div style={{ fontSize: "13px", color: "#6D7175", marginBottom: "30px" }}>
          EU AI Act Article 50 requirements status
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: "40px" }}>
          {checklist.map((item, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 20px",
              background: item.status ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${item.status ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: "10px",
              marginBottom: "10px",
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: item.status ? "#00A47C" : "#D72C0D",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                {item.status ? "✓" : "✗"}
              </div>
              <div style={{ flex: 1, fontSize: "13px", fontWeight: "500" }}>
                {item.item}
              </div>
              <div style={{
                fontSize: "10px",
                fontWeight: "700",
                color: item.status ? "#00A47C" : "#D72C0D",
                letterSpacing: "1px",
              }}>
                {item.status ? "PASS" : "FAIL"}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer Box */}
        <div style={{
          background: "#FFF7ED",
          border: "1px solid #FED7AA",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
        }}>
          <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px", color: "#9A3412" }}>
            ⚠️ Important Disclaimer
          </div>
          <div style={{ fontSize: "11px", lineHeight: "1.7", color: "#374151" }}>
            This report is automatically generated based on the data available at the time of scan. It is intended for informational and self-assessment purposes only. ComplyGuard AI does not provide legal advice. The accuracy of compliance status depends on the merchant's verification of flagged items. For binding legal interpretation of EU AI Act compliance, consult a qualified attorney specializing in EU technology law.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          fontSize: "10px",
          color: "#9CA3AF",
          paddingTop: "20px",
          borderTop: "1px solid #E1E3E5",
        }}>
          Generated by <strong style={{ color: "#5C6AC4" }}>ComplyGuard AI</strong> on {formatDate(new Date())}
          <br />
          Visit complyguard.ai for more information
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helper: Generate recommendations
// ============================================================
function generateRecommendations(scan) {
  const recommendations = [];
  const issues = scan.issues || [];

  if (issues.some((i) => i.category === "no_privacy_policy")) {
    recommendations.push("Create a comprehensive Privacy Policy covering data collection, AI usage, and user rights. This is mandatory under both GDPR and EU AI Act.");
  }
  if (issues.some((i) => i.category === "policy_no_ai_disclosure")) {
    recommendations.push("Update your Privacy Policy to explicitly mention all AI tools used in your store, including AI-generated images and automated recommendations.");
  }
  if (issues.some((i) => i.category === "ai_image_detected")) {
    recommendations.push("Review all flagged AI-generated product images. Add clear disclosure labels and update alt-text to indicate AI-generated content.");
  }
  if (issues.some((i) => i.category === "missing_alt_text")) {
    recommendations.push("Add descriptive alt-text to all product images. This improves accessibility and helps with EU AI Act compliance for AI-generated content identification.");
  }
  if (issues.some((i) => i.category === "terms_no_automated_disclosure")) {
    recommendations.push("Update your Terms of Service to disclose use of automated decision-making systems, AI recommendations, and chatbots.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue regular compliance scans to maintain your excellent compliance status.");
    recommendations.push("Stay updated with EU AI Act enforcement developments leading up to August 2, 2026.");
  }

  return recommendations.slice(0, 5);
}