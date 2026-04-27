import { useState } from "react";
import { useFetcher } from "react-router";
import {
  Card,
  BlockStack,
  Text,
  Box,
  InlineStack,
  Button,
  Badge,
  Banner,
  Icon,
} from "@shopify/polaris";
import { MagicIcon, CheckIcon } from "@shopify/polaris-icons";
import { Link } from "react-router";

// Categories that can be auto-fixed
const AUTO_FIXABLE = [
  "missing_alt_text",
  "ai_image_detected",
  "policy_no_ai_disclosure",
  "terms_no_automated_disclosure",
];

export default function AutoFixAllCard({ scan, planInfo }) {
  const fetcher = useFetcher();
  const [showResults, setShowResults] = useState(false);

  if (!scan || !scan.issues || scan.issues.length === 0) return null;

  const isFixing = fetcher.state === "submitting";
  const result = fetcher.data;

  // Count fixable vs manual issues
  const openIssues = scan.issues.filter(
    (i) => i.status === "open" || i.status === "pending"
  );
  const fixableCount = openIssues.filter((i) => AUTO_FIXABLE.includes(i.category)).length;
  const manualCount = openIssues.length - fixableCount;

  if (openIssues.length === 0) return null;

  const isFreePlan = planInfo?.plan === "free";

  const handleAutoFixAll = () => {
    if (isFreePlan) return;

    const formData = new FormData();
    formData.append("scanId", scan.id);
    fetcher.submit(formData, { method: "POST", action: "/app/auto-fix-all" });
    setShowResults(true);
  };

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack gap="300" blockAlign="center">
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5C6AC4 0%, #202E78 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <div style={{ width: "22px", height: "22px", "--p-color-icon": "#ffffff" }} >
                <Icon source={MagicIcon} tone="base" />
              </div>
            </div>
            <BlockStack gap="050">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h3" variant="headingMd">
                  Auto-Fix All Issues
                </Text>
                {isFreePlan && (
                  <Badge tone="info">Pro Feature</Badge>
                )}
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Automatically fix compliance issues with one click
              </Text>
            </BlockStack>
          </InlineStack>

          {/* Stats */}
          <InlineStack gap="600" blockAlign="center">
            <BlockStack gap="050">
              <Text as="p" variant="bodySm" tone="subdued">
                Auto-fixable
              </Text>
              <Text as="p" variant="heading2xl">
                <span style={{ color: "#00A47C" }}>{fixableCount}</span>
              </Text>
            </BlockStack>

            <BlockStack gap="050">
              <Text as="p" variant="bodySm" tone="subdued">
                Manual review
              </Text>
              <Text as="p" variant="heading2xl">
                <span style={{ color: "#6D7175" }}>{manualCount}</span>
              </Text>
            </BlockStack>

            <BlockStack gap="050">
              <Text as="p" variant="bodySm" tone="subdued">
                Total open
              </Text>
              <Text as="p" variant="heading2xl">
                {openIssues.length}
              </Text>
            </BlockStack>
          </InlineStack>

          {/* Free plan warning */}
          {isFreePlan && (
            <Box background="bg-surface-warning-subdued" padding="300" borderRadius="200">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Auto-Fix requires a paid plan
                </Text>
                <Text as="p" variant="bodySm">
                  Upgrade to Starter or Growth to use Auto-Fix and save hours of manual work.
                </Text>
                <div>
                  <Link to="/app/pricing" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="slim">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </BlockStack>
            </Box>
          )}

          {/* Result Banner */}
          {showResults && result && (
            <ResultBanner result={result} />
          )}

          {/* Action Button */}
          {!isFreePlan && fixableCount > 0 && (
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleAutoFixAll}
              loading={isFixing}
              disabled={isFixing}
            >
              {isFixing
                ? `Fixing ${fixableCount} issues...`
                : `🔧 Auto-Fix All (${fixableCount} issues)`}
            </Button>
          )}

          {!isFreePlan && fixableCount === 0 && (
            <Box background="bg-surface-info-subdued" padding="300" borderRadius="200">
              <Text as="p" variant="bodySm">
                No auto-fixable issues remaining. {manualCount} issues require manual review.
              </Text>
            </Box>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================
// Result Banner (shown after auto-fix completes)
// ============================================================
function ResultBanner({ result }) {
  if (!result) return null;

  if (result.requiresUpgrade) {
    return (
      <Banner tone="warning" title="Upgrade Required">
        <p>{result.message}</p>
      </Banner>
    );
  }

  if (!result.success) {
    return (
      <Banner tone="critical" title="Auto-Fix Failed">
        <p>{result.message}</p>
      </Banner>
    );
  }

  const { fixed, failed, notSupported } = result.results;

  return (
    <Banner tone="success" title="Auto-Fix Complete">
      <BlockStack gap="200">
        <p>{result.message}</p>
        {result.newGrade && (
          <p>
            New compliance grade: <strong>{result.newGrade}</strong> (Score: {result.newScore}/100)
          </p>
        )}
        <InlineStack gap="400">
          <Text as="span" variant="bodySm">
            ✅ Fixed: <strong>{fixed}</strong>
          </Text>
          {failed > 0 && (
            <Text as="span" variant="bodySm">
              ❌ Failed: <strong>{failed}</strong>
            </Text>
          )}
          {notSupported > 0 && (
            <Text as="span" variant="bodySm">
              📋 Manual: <strong>{notSupported}</strong>
            </Text>
          )}
        </InlineStack>
      </BlockStack>
    </Banner>
  );
}