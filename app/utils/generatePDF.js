import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs || pdfFonts.pdfMake?.vfs;

// ============================================================
// Color palette
// ============================================================
const COLORS = {
  primary: "#5C6AC4",
  primaryDark: "#202E78",
  success: "#00A47C",
  warning: "#F49342",
  critical: "#D72C0D",
  text: "#212B36",
  textLight: "#6D7175",
  textMuted: "#9CA3AF",
  bgLight: "#F7F7F7",
  borderLight: "#E1E3E5",
  white: "#FFFFFF",
};

const SEVERITY_COLOR = {
  critical: COLORS.critical,
  high: COLORS.critical,
  medium: COLORS.warning,
  low: COLORS.primary,
};

const GRADE_COLOR = {
  A: COLORS.success,
  B: "#5C8D89",
  C: COLORS.warning,
  D: COLORS.critical,
  F: "#8E1F0B",
};

// ============================================================
// SVG ICONS — Vector quality, scales perfectly
// ============================================================
const ICONS = {
  shield: (color = COLORS.white) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>`,

  alertTriangle: (color = COLORS.warning) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,

  check: (color = COLORS.success) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,

  x: (color = COLORS.critical) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,

  bulb: (color = COLORS.success) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>`,

  package: (color = COLORS.primary) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,

  image: (color = COLORS.success) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,

  alertOctagon: (color = COLORS.warning) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,

  inbox: (color = COLORS.critical) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>`,

  thumbsUp: (color = COLORS.success) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>`,

  alertCircle: (color = COLORS.warning) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,

  fire: (color = COLORS.critical) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>`,
};

// ============================================================
// Helpers
// ============================================================
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateRecommendations(scan) {
  const recs = [];
  const issues = scan.issues || [];

  if (issues.some((i) => i.category === "no_privacy_policy")) {
    recs.push("Create a comprehensive Privacy Policy covering data collection, AI usage, and user rights. This is mandatory under both GDPR and EU AI Act.");
  }
  if (issues.some((i) => i.category === "policy_no_ai_disclosure")) {
    recs.push("Update your Privacy Policy to explicitly mention all AI tools used in your store, including AI-generated images and automated recommendations.");
  }
  if (issues.some((i) => i.category === "ai_image_detected")) {
    recs.push("Review all flagged AI-generated product images. Add clear disclosure labels and update alt-text to indicate AI-generated content.");
  }
  if (issues.some((i) => i.category === "missing_alt_text")) {
    recs.push("Add descriptive alt-text to all product images. This improves accessibility and helps with EU AI Act compliance for AI-generated content identification.");
  }
  if (issues.some((i) => i.category === "terms_no_automated_disclosure")) {
    recs.push("Update your Terms of Service to disclose use of automated decision-making systems, AI recommendations, and chatbots.");
  }
  if (recs.length === 0) {
    recs.push("Continue regular compliance scans to maintain your excellent compliance status.");
    recs.push("Stay updated with EU AI Act enforcement developments leading up to August 2, 2026.");
  }
  return recs.slice(0, 5);
}

// ============================================================
// PAGE 1: Cover Page
// ============================================================
function buildCoverPage(scan, shopName) {
  const totalIssues = scan.issues?.length || 0;
  const openIssues = scan.issues?.filter((i) => i.status === "open" || i.status === "pending").length || 0;
  const gradeColor = GRADE_COLOR[scan.grade] || COLORS.textLight;

  return [
    // ── Header banner with shield icon ──
    {
      table: {
        widths: [40, "*"],
        body: [[
          {
            svg: ICONS.shield(COLORS.white),
            fit: [40, 40],
            margin: [0, 0, 0, 0],
            border: [false, false, false, false],
            fillColor: COLORS.primary,
          },
          {
            text: [
              { text: "ComplyGuard AI\n", fontSize: 22, bold: true, color: COLORS.white },
              { text: "EU AI Act Compliance Report", fontSize: 11, color: COLORS.white },
            ],
            margin: [12, 4, 0, 0],
            border: [false, false, false, false],
            fillColor: COLORS.primary,
          },
        ]],
      },
      layout: {
        defaultBorder: false,
        paddingTop: () => 22,
        paddingBottom: () => 22,
        paddingLeft: () => 30,
        paddingRight: () => 30,
        fillColor: () => COLORS.primary,
      },
      margin: [-40, -40, -40, 30],
    },

    // ── Store Info ──
    {
      text: "COMPLIANCE REPORT FOR",
      fontSize: 9,
      color: COLORS.textLight,
      characterSpacing: 2,
      margin: [0, 0, 0, 4],
    },
    {
      text: shopName || "Your Store",
      fontSize: 26,
      bold: true,
      color: COLORS.text,
      margin: [0, 0, 0, 6],
    },
    {
      text: `Scan Date: ${formatDate(scan.completedAt || scan.createdAt)}`,
      fontSize: 10,
      color: COLORS.textLight,
      margin: [0, 0, 0, 2],
    },
    {
      text: `Scan ID: ${scan.id}`,
      fontSize: 8,
      color: COLORS.textMuted,
      margin: [0, 0, 0, 35],
    },

    // ── Big Grade Card ──
    {
      table: {
        widths: ["*"],
        body: [[{
          stack: [
            { text: "COMPLIANCE GRADE", fontSize: 9, color: COLORS.white, alignment: "center", characterSpacing: 3, margin: [0, 0, 0, 6] },
            { text: scan.grade || "—", fontSize: 110, bold: true, color: COLORS.white, alignment: "center", margin: [0, 0, 0, 4] },
            {
              text: [
                { text: `${scan.score || 0}`, fontSize: 32, bold: true, color: COLORS.white },
                { text: "/100", fontSize: 18, color: COLORS.white },
              ],
              alignment: "center",
              margin: [0, 0, 0, 4],
            },
            { text: "COMPLIANCE SCORE", fontSize: 10, color: COLORS.white, alignment: "center", characterSpacing: 2, margin: [0, 0, 0, 0] },
          ],
          fillColor: gradeColor,
          margin: [0, 24, 0, 24],
          border: [false, false, false, false],
        }]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 25],
    },

    // ── 4 Stat boxes with icons ──
    {
      columns: [
        statBox(scan.totalProducts || 0, "PRODUCTS", COLORS.primary, ICONS.package(COLORS.primary)),
        statBox(scan.totalImages || 0, "IMAGES", COLORS.success, ICONS.image(COLORS.success)),
        statBox(totalIssues, "ISSUES", COLORS.warning, ICONS.alertOctagon(COLORS.warning)),
        statBox(openIssues, "OPEN", openIssues > 0 ? COLORS.critical : COLORS.success, ICONS.inbox(openIssues > 0 ? COLORS.critical : COLORS.success)),
      ],
      columnGap: 8,
    },

    { text: "", pageBreak: "after" },
  ];
}

function statBox(value, label, color, iconSvg) {
  return {
    table: {
      widths: ["*"],
      body: [[{
        stack: [
          { svg: iconSvg, fit: [22, 22], alignment: "center", margin: [0, 0, 0, 6] },
          { text: String(value), fontSize: 24, bold: true, color, alignment: "center", margin: [0, 0, 0, 2] },
          { text: label, fontSize: 8, color: COLORS.textLight, alignment: "center", characterSpacing: 1 },
        ],
        fillColor: COLORS.bgLight,
        margin: [0, 12, 0, 12],
        border: [false, false, false, false],
      }]],
    },
    layout: "noBorders",
  };
}

// ============================================================
// PAGE 2: Executive Summary
// ============================================================
function buildSummaryPage(scan) {
  const totalIssues = scan.issues?.length || 0;
  const status = scan.score >= 75 ? "good" : scan.score >= 50 ? "warning" : "critical";
  const statusColor = status === "good" ? COLORS.success : status === "warning" ? COLORS.warning : COLORS.critical;
  const statusBg = status === "good" ? "#E8F5E9" : status === "warning" ? "#FFF4E6" : "#FFEBEE";
  const statusIcon = status === "good" ? ICONS.thumbsUp(statusColor) : status === "warning" ? ICONS.alertCircle(statusColor) : ICONS.fire(statusColor);
  const statusText = status === "good" ? "Good Compliance Status" : status === "warning" ? "Action Recommended" : "Urgent Action Required";

  return [
    sectionHeader("Executive Summary", "Overview of your store's EU AI Act compliance status"),

    // ── Status banner ──
    {
      table: {
        widths: [20, "*"],
        body: [[
          {
            svg: statusIcon,
            fit: [16, 16],
            margin: [0, 2, 0, 0],
            border: [false, false, false, false],
          },
          {
            stack: [
              { text: statusText, fontSize: 12, bold: true, color: COLORS.text, margin: [0, 0, 0, 4] },
              {
                text: [
                  "Your store achieved a compliance grade of ",
                  { text: scan.grade || "—", bold: true },
                  " with a score of ",
                  { text: `${scan.score || 0}/100`, bold: true },
                  ". ",
                  totalIssues > 0
                    ? `${totalIssues} compliance issues were detected, requiring your attention.`
                    : "Excellent! No compliance issues detected.",
                ],
                fontSize: 10,
                color: COLORS.text,
                lineHeight: 1.5,
              },
            ],
            border: [false, false, false, false],
          },
        ]],
      },
      layout: {
        defaultBorder: false,
        fillColor: () => statusBg,
        paddingTop: () => 14,
        paddingBottom: () => 14,
        paddingLeft: () => 16,
        paddingRight: () => 16,
        vLineWidth: (i) => (i === 0 ? 4 : 0),
        vLineColor: () => statusColor,
      },
      margin: [0, 0, 0, 25],
    },

    // ── Severity Breakdown ──
    { text: "Issue Severity Breakdown", fontSize: 14, bold: true, color: COLORS.text, margin: [0, 0, 0, 12] },
    severityRow("Critical", scan.criticalCount || 0, COLORS.critical),
    severityRow("High", scan.highCount || 0, COLORS.critical),
    severityRow("Medium", scan.mediumCount || 0, COLORS.warning),
    severityRow("Low", scan.lowCount || 0, COLORS.primary),

    { text: "", margin: [0, 20, 0, 0] },

    // ── Top Recommendations ──
    { text: "Top Recommendations", fontSize: 14, bold: true, color: COLORS.text, margin: [0, 0, 0, 12] },
    ...generateRecommendations(scan).map((rec, i) => recommendationRow(i + 1, rec)),

    { text: "", pageBreak: "after" },
  ];
}

function severityRow(label, count, color) {
  return {
    table: {
      widths: [16, "*", "auto"],
      body: [[
        { text: "●", color, fontSize: 14, alignment: "center", border: [false, false, false, true], borderColor: [null, null, null, COLORS.borderLight] },
        { text: label, fontSize: 11, color: COLORS.text, margin: [0, 4, 0, 4], border: [false, false, false, true], borderColor: [null, null, null, COLORS.borderLight] },
        { text: String(count), fontSize: 16, bold: true, color, alignment: "right", margin: [0, 2, 0, 2], border: [false, false, false, true], borderColor: [null, null, null, COLORS.borderLight] },
      ]],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: (i, node) => (i === node.table.body.length ? 0.5 : 0),
      hLineColor: () => COLORS.borderLight,
    },
  };
}

function recommendationRow(num, text) {
  return {
    table: {
      widths: [24, "*"],
      body: [[
        {
          stack: [{
            table: {
              widths: [18],
              body: [[{
                text: String(num),
                color: COLORS.white,
                fontSize: 9,
                bold: true,
                alignment: "center",
                fillColor: COLORS.primary,
                border: [false, false, false, false],
                margin: [0, 3, 0, 3],
              }]],
            },
            layout: "noBorders",
          }],
          border: [false, false, false, false],
        },
        {
          text,
          fontSize: 10,
          color: COLORS.text,
          lineHeight: 1.5,
          margin: [0, 3, 0, 0],
          border: [false, false, false, false],
        },
      ]],
    },
    layout: {
      defaultBorder: false,
      paddingTop: () => 10,
      paddingBottom: () => 10,
      paddingLeft: () => 12,
      paddingRight: () => 12,
      fillColor: () => "#F9FAFB",
    },
    margin: [0, 0, 0, 8],
  };
}

// ============================================================
// PAGE 3+: Detailed Issues
// ============================================================
function buildIssuesPage(scan) {
  const issues = scan.issues || [];
  if (issues.length === 0) return [];

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...issues].sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));

  return [
    sectionHeader("Detailed Issues", `${sorted.length} issues found • Sorted by severity`),
    ...sorted.map((issue) => issueCard(issue)),
    { text: "", pageBreak: "after" },
  ];
}

function issueCard(issue) {
  const sev = (issue.severity || "medium").toLowerCase();
  const sevColor = SEVERITY_COLOR[sev] || COLORS.warning;

  const content = [
    // Severity badge + Article
    {
      columns: [
        {
          width: "auto",
          table: {
            body: [[{
              text: sev.toUpperCase(),
              color: COLORS.white,
              fontSize: 8,
              bold: true,
              characterSpacing: 1,
              fillColor: sevColor,
              border: [false, false, false, false],
              margin: [8, 3, 8, 3],
            }]],
          },
          layout: "noBorders",
        },
        {
          width: "*",
          text: issue.article || "",
          fontSize: 9,
          color: COLORS.textLight,
          margin: [8, 5, 0, 0],
        },
      ],
      margin: [0, 0, 0, 8],
    },

    // Title
    {
      text: issue.title || "Issue",
      fontSize: 13,
      bold: true,
      color: COLORS.text,
      margin: [0, 0, 0, 6],
    },

    // Description
    {
      text: issue.description || "",
      fontSize: 9,
      color: COLORS.textLight,
      lineHeight: 1.5,
      margin: [0, 0, 0, issue.suggestedFix ? 10 : 0],
    },
  ];

  // Suggested fix box with bulb icon
  if (issue.suggestedFix) {
    content.push({
      table: {
        widths: [16, "*"],
        body: [[
          {
            svg: ICONS.bulb(COLORS.success),
            fit: [12, 12],
            margin: [0, 1, 0, 0],
            border: [false, false, false, false],
            fillColor: "#E8F5E9",
          },
          {
            stack: [
              {
                text: "SUGGESTED FIX",
                fontSize: 8,
                bold: true,
                color: COLORS.success,
                characterSpacing: 1,
                margin: [0, 0, 0, 4],
              },
              {
                text: issue.suggestedFix,
                fontSize: 9,
                color: COLORS.text,
                lineHeight: 1.5,
              },
            ],
            border: [false, false, false, false],
            fillColor: "#E8F5E9",
          },
        ]],
      },
      layout: {
        defaultBorder: false,
        fillColor: () => "#E8F5E9",
        paddingTop: () => 10,
        paddingBottom: () => 10,
        paddingLeft: () => 12,
        paddingRight: () => 12,
      },
    });
  }

  return {
    unbreakable: true,
    table: {
      widths: ["*"],
      body: [[{
        stack: content,
        fillColor: COLORS.white,
        margin: [16, 14, 16, 14],
        border: [true, true, true, true],
        borderColor: [sevColor, COLORS.borderLight, COLORS.borderLight, COLORS.borderLight],
      }]],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0.5 : 0),
      vLineWidth: (i, node) => (i === 0 ? 4 : i === node.table.widths.length ? 0.5 : 0),
      hLineColor: () => COLORS.borderLight,
      vLineColor: (i) => (i === 0 ? sevColor : COLORS.borderLight),
    },
    margin: [0, 0, 0, 12],
  };
}

// ============================================================
// FINAL PAGE: Compliance Checklist + Disclaimer
// ============================================================
function buildChecklistPage(scan) {
  const checklist = [
    { item: "AI-generated images labeled clearly", status: !scan.issues?.some(i => i.category === "ai_image_detected") },
    { item: "Privacy Policy includes AI disclosure", status: !scan.issues?.some(i => i.category === "policy_no_ai_disclosure" || i.category === "no_privacy_policy") },
    { item: "Terms of Service mentions automated decisions", status: !scan.issues?.some(i => i.category === "terms_no_automated_disclosure") },
    { item: "All product images have alt-text", status: !scan.issues?.some(i => i.category === "missing_alt_text") },
    { item: "AI chatbots/apps disclosed", status: !scan.issues?.some(i => i.category === "ai_app_undisclosed") },
  ];

  return [
    sectionHeader("Compliance Checklist", "EU AI Act Article 50 requirements status"),
    ...checklist.map(item => checklistRow(item)),

    { text: "", margin: [0, 24, 0, 0] },

    // ── Disclaimer Box with icon ──
    {
      table: {
        widths: [22, "*"],
        body: [[
          {
            svg: ICONS.alertTriangle("#9A3412"),
            fit: [18, 18],
            margin: [0, 1, 0, 0],
            border: [false, false, false, false],
            fillColor: "#FFF7ED",
          },
          {
            stack: [
              {
                text: "Important Disclaimer",
                fontSize: 12,
                bold: true,
                color: "#9A3412",
                margin: [0, 0, 0, 6],
              },
              {
                text: "This report is automatically generated based on the data available at the time of scan. It is intended for informational and self-assessment purposes only. ComplyGuard AI does not provide legal advice. The accuracy of compliance status depends on the merchant's verification of flagged items. For binding legal interpretation of EU AI Act compliance, consult a qualified attorney specializing in EU technology law.",
                fontSize: 10,
                color: COLORS.text,
                lineHeight: 1.6,
              },
            ],
            border: [false, false, false, false],
            fillColor: "#FFF7ED",
          },
        ]],
      },
      layout: {
        defaultBorder: false,
        fillColor: () => "#FFF7ED",
        paddingTop: () => 14,
        paddingBottom: () => 14,
        paddingLeft: () => 16,
        paddingRight: () => 16,
      },
      margin: [0, 0, 0, 20],
    },

    // ── Bottom branding ──
    {
      text: [
        { text: "Generated by ", fontSize: 10, color: COLORS.textLight },
        { text: "ComplyGuard AI", fontSize: 10, bold: true, color: COLORS.primary },
        { text: ` on ${formatDate(new Date())}\n`, fontSize: 10, color: COLORS.textLight },
        { text: "Visit complyguard.ai for more information", fontSize: 9, color: COLORS.textMuted },
      ],
      alignment: "center",
      margin: [0, 16, 0, 0],
    },
  ];
}

function checklistRow(item) {
  const bg = item.status ? "#F0FDF4" : "#FEF2F2";
  const dotColor = item.status ? COLORS.success : COLORS.critical;
  const iconSvg = item.status ? ICONS.check(COLORS.white) : ICONS.x(COLORS.white);
  const label = item.status ? "PASS" : "FAIL";

  return {
    table: {
      widths: [32, "*", "auto"],
      body: [[
        {
          svg: iconSvg,
          fit: [16, 16],
          alignment: "center",
          fillColor: dotColor,
          margin: [0, 6, 0, 6],
          border: [false, false, false, false],
        },
        {
          text: item.item,
          fontSize: 11,
          color: COLORS.text,
          margin: [10, 8, 0, 0],
          border: [false, false, false, false],
        },
        {
          text: label,
          fontSize: 9,
          bold: true,
          color: dotColor,
          characterSpacing: 1,
          margin: [0, 9, 8, 0],
          border: [false, false, false, false],
        },
      ]],
    },
    layout: {
      defaultBorder: false,
      fillColor: () => bg,
    },
    margin: [0, 0, 0, 8],
  };
}

// ============================================================
// Section Header (reused)
// ============================================================
function sectionHeader(title, subtitle) {
  return [
    { canvas: [{ type: "rect", x: 0, y: 0, w: 60, h: 3, color: COLORS.primary }], margin: [0, 0, 0, 16] },
    { text: title, fontSize: 22, bold: true, color: COLORS.text, margin: [0, 0, 0, 4] },
    { text: subtitle, fontSize: 11, color: COLORS.textLight, margin: [0, 0, 0, 24] },
  ];
}

// ============================================================
// MAIN: Generate & Download
// ============================================================
export function downloadComplianceReport(scan, shopName) {
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50],

    content: [
      ...buildCoverPage(scan, shopName),
      ...buildSummaryPage(scan),
      ...buildIssuesPage(scan),
      ...buildChecklistPage(scan),
    ],

    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "ComplyGuard AI", fontSize: 8, color: COLORS.textMuted, margin: [40, 15, 0, 0] },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: COLORS.textMuted, alignment: "right", margin: [0, 15, 40, 0] },
      ],
    }),

    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: COLORS.text,
    },
  };

  const filename = `ComplyGuard-Report-${new Date().toISOString().split("T")[0]}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}

// Backward compatible
export async function downloadComplianceReportFromHTML(elementRef, scan) {
  downloadComplianceReport(scan, "Your Store");
}