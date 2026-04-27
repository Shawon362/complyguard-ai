import { Card, BlockStack, Text, Divider, InlineStack, Badge, Box, Banner, Button } from "@shopify/polaris";
import { useState } from "react";
import { useFetcher } from "react-router";

const severityBadge = {
  critical: "critical",
  high: "critical",
  medium: "warning",
  low: "info",
};

// ============================================================
// What this means — clear explanation per issue type
// ============================================================
function getExplanation(category) {
  switch (category) {
    case "missing_alt_text":
      return "Alt-text describes images for screen readers and search engines. Under EU AI Act Article 50(4), missing alt-text on AI-generated images can lead to compliance violations as users cannot identify AI content.";
    case "ai_app_undisclosed":
      return "EU AI Act Article 50(1) requires disclosure of all AI tools used in customer-facing experiences. This includes chatbots, AI recommendations, AI content generation, and AI image tools. Each detected AI app needs explicit mention in your Privacy Policy.";
    case "ai_image_detected":
      return "EU AI Act Article 50(4) requires that AI-generated content must be clearly labeled. This image appears AI-generated and needs proper disclosure to comply with the regulation.";
    case "no_privacy_policy":
      return "GDPR (Article 13) and EU AI Act both require a Privacy Policy that discloses data collection and AI usage. Without one, your store cannot legally serve EU customers.";
    case "policy_no_ai_disclosure":
      return "EU AI Act Article 50(1) requires businesses using AI tools (chatbots, recommendations, AI images) to disclose this in their Privacy Policy. Your current policy is missing this disclosure.";
    case "terms_no_automated_disclosure":
      return "Terms of Service must mention automated decision-making systems if your store uses them. This includes AI-powered recommendations, automated pricing, or AI customer support.";
    default:
      return "This issue affects your EU AI Act compliance. Review the suggested fix below.";
  }
}

// ============================================================
// Generate Shopify Admin deep-link URL
// ============================================================
function getShopifyAdminUrl(issue, shopDomain) {
  const storeHandle = shopDomain?.replace(".myshopify.com", "") || "";
  const baseUrl = `https://admin.shopify.com/store/${storeHandle}`;

  switch (issue.category) {
    case "missing_alt_text":
    case "ai_image_detected": {
      try {
        const evidence = JSON.parse(issue.evidence || "{}");
        if (evidence.productTitle) {
          return `${baseUrl}/products?query=${encodeURIComponent(evidence.productTitle)}`;
        }
      } catch {}
      return `${baseUrl}/products`;
    }
    case "ai_app_undisclosed":
      return `${baseUrl}/apps`;
    case "no_privacy_policy":
    case "policy_no_ai_disclosure":
      return `${baseUrl}/settings/legal/privacy`;
    case "terms_no_automated_disclosure":
      return `${baseUrl}/settings/legal/terms-of-service`;
    default:
      return `${baseUrl}/settings/legal`;
  }
}

// ============================================================
// Generate ready-to-copy fix text
// ============================================================
function getCopyText(issue) {
  try {
    const evidence = JSON.parse(issue.evidence || "{}");

    switch (issue.category) {
      case "missing_alt_text":
        return `${evidence.productTitle} - product image showing details and features`;
      case "ai_image_detected":
        return `${evidence.productTitle} (AI-generated product image)`;
      case "ai_app_undisclosed": {
        const appName = evidence.appName || "AI app";
        return `Use of ${appName}: We use ${appName} on our store, which includes AI-powered features (${(evidence.aiFeatures || []).join(", ")}). This AI usage is disclosed in compliance with EU AI Act Article 50.`;
      }
      case "no_privacy_policy":
      case "policy_no_ai_disclosure":
        return `Use of Artificial Intelligence: We use artificial intelligence (AI) technologies to enhance your shopping experience, including AI-generated product visualizations, automated product recommendations, and AI-powered customer support. These systems operate in accordance with the EU AI Act (Regulation 2024/1689). You have the right to request information about automated decision-making that affects you.`;
      case "terms_no_automated_disclosure":
        return `Automated Systems and AI: We use automated systems and artificial intelligence to provide product recommendations, personalized shopping experiences, and customer support. By using our service, you acknowledge the use of these automated systems.`;
      default:
        return issue.suggestedFix || "";
    }
  } catch {
    return issue.suggestedFix || "";
  }
}

// ============================================================
// Get button label based on issue category
// ============================================================
function getActionLabel(category) {
  switch (category) {
    case "missing_alt_text":
    case "ai_image_detected":
      return "Open Product in Shopify";
    case "ai_app_undisclosed":
      return "View Installed Apps";
    case "no_privacy_policy":
    case "policy_no_ai_disclosure":
      return "Open Privacy Policy";
    case "terms_no_automated_disclosure":
      return "Open Terms of Service";
    default:
      return "Open in Shopify";
  }
}

// ============================================================
// Single Issue Card with Fix Buttons + Status Buttons
// ============================================================
function IssueCard({ issue, shopDomain }) {
  const [copied, setCopied] = useState(false);
  const fetcher = useFetcher();
  const isUpdating = fetcher.state === "submitting";

  const adminUrl = getShopifyAdminUrl(issue, shopDomain);
  const copyText = getCopyText(issue);
  const actionLabel = getActionLabel(issue.category);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleOpenAdmin = () => {
    window.open(adminUrl, "_blank");
  };

  const handleMarkFixed = () => {
    const formData = new FormData();
    formData.append("issueId", issue.id);
    formData.append("status", "fixed");
    fetcher.submit(formData, { method: "POST", action: "/app/update-issue" });
  };

  const handleDismiss = () => {
    const formData = new FormData();
    formData.append("issueId", issue.id);
    formData.append("status", "dismissed");
    fetcher.submit(formData, { method: "POST", action: "/app/update-issue" });
  };

  // Image preview from evidence
  let imageUrl = null;
  let productTitle = null;
  try {
    const evidence = JSON.parse(issue.evidence || "{}");
    imageUrl = evidence.imageUrl;
    productTitle = evidence.productTitle;
  } catch {}

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack gap="200" align="start">
          <Badge tone={severityBadge[issue.severity]}>
            {issue.severity.toUpperCase()}
          </Badge>
          <Text as="h3" variant="headingSm">{issue.title}</Text>
        </InlineStack>

        <Text as="p" variant="bodyMd">{issue.description}</Text>

        {imageUrl && (
          <div style={{
            marginTop: "8px",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            overflow: "hidden",
            maxWidth: "200px",
          }}>
            <img
              src={imageUrl}
              alt={productTitle || "Product image"}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        )}

        <Box background="bg-surface-secondary" padding="300" borderRadius="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Regulation: {issue.article}
          </Text>
        </Box>

        {/* What this means */}
        <Box background="bg-surface-info" padding="300" borderRadius="200">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              📚 What this means:
            </Text>
            <Text as="p" variant="bodySm">{getExplanation(issue.category)}</Text>
          </BlockStack>
        </Box>

        {issue.suggestedFix && (
          <Box background="bg-surface-success" padding="300" borderRadius="200">
            <BlockStack gap="100">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                💡 Suggested Fix:
              </Text>
              <Text as="p" variant="bodySm">{issue.suggestedFix}</Text>
            </BlockStack>
          </Box>
        )}

        {/* ── Action Buttons ── */}
        <InlineStack gap="200" align="start" wrap>
          <Button onClick={handleOpenAdmin} variant="primary" size="slim">
            🔗 {actionLabel}
          </Button>

          {copyText && (
            <Button onClick={handleCopy} size="slim">
              {copied ? "✅ Copied!" : "📋 Copy Fix Text"}
            </Button>
          )}

          <Button onClick={handleMarkFixed} size="slim" tone="success" loading={isUpdating}>
            ✅ Mark as Fixed
          </Button>

          <Button onClick={handleDismiss} size="slim" tone="critical" loading={isUpdating}>
            ✖️ Dismiss
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function IssuesList({ issues, shopDomain }) {
  // Filter only pending issues (hide fixed/dismissed)
  const pendingIssues = issues?.filter(i => !i.status || i.status === "open" || i.status === "pending") || [];

  if (pendingIssues.length === 0 && issues && issues.length > 0) {
    return (
      <Banner title="All issues resolved!" tone="success">
        <p>You have addressed all EU AI Act compliance issues. Excellent work!</p>
      </Banner>
    );
  }

  if (issues && issues.length === 0) {
    return (
      <Banner title="No issues found!" tone="success">
        <p>Your store has no EU AI Act compliance issues. Excellent work!</p>
      </Banner>
    );
  }

  if (!issues) return null;

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Detected Issues ({pendingIssues.length})
        </Text>
        <Divider />

        {pendingIssues.map((issue, index) => (
          <IssueCard
            key={issue.id || index}
            issue={issue}
            shopDomain={shopDomain}
          />
        ))}
      </BlockStack>
    </Card>
  );
}