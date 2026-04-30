import { Card, BlockStack, Text, Box, Button, InlineStack, Badge, Banner, ProgressBar, Divider } from "@shopify/polaris";
import { MagicIcon } from "@shopify/polaris-icons";
import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { Link } from "react-router";

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AutoFixAllCard({ scan, planInfo }) {
  // ─── ALL HOOKS FIRST (Rules of Hooks) ───
  const fetcher = useFetcher();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      const hasManualCases = (fetcher.data.results?.details || []).some(
        (d) => d.status === "manual"
      );
      if (hasManualCases) return;

      const timer = setTimeout(() => {
        window.location.reload();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data, fetcher.state]);

  // ─── EARLY RETURNS (after all hooks) ───
  if (!scan || !planInfo) return null;

  const issues = scan.issues || [];
  const openIssues = issues.filter(
    (i) => i.status === "open" || i.status === "pending"
  );

  if (openIssues.length === 0) return null;

  // ─── DERIVED VALUES ───
  const isFreePlan = !planInfo.autoFix;
  const freeAutoFixCount = planInfo.freeAutoFixCount || 0;
  const alreadyUsed = scan.freeAutoFixesUsed || 0;
  const remaining = freeAutoFixCount - alreadyUsed;
  const limitReached = isFreePlan && remaining <= 0;

  const isLoading = fetcher.state === "submitting";
  const fetcherData = fetcher.data;

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...openIssues].sort((a, b) => {
    return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
  });

  const previewIssues = isFreePlan
    ? sortedIssues.slice(0, remaining)
    : sortedIssues;

  const handleAutoFixAll = () => {
    if (isFreePlan && limitReached) return;

    const formData = new FormData();
    formData.append("scanId", scan.id);
    fetcher.submit(formData, { method: "POST", action: "/app/auto-fix-all" });
    setShowResults(true);
  };

  // ─── RESULT VIEWS ───
  if (showResults && fetcherData?.success) {
    return <SuccessView data={fetcherData} isFreePlan={isFreePlan} />;
  }

  if (showResults && fetcherData?.limitReached) {
    return <LimitReachedView message={fetcherData.message} />;
  }

  // ─── MAIN VIEW ───
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <InlineStack gap="200" blockAlign="center">
                <div style={{ 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #5C6AC4 0%, #202E78 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: "18px" }}>⚡</span>
                </div>
                <Text as="h3" variant="headingMd">
                  Auto-Fix Issues
                </Text>
                {isFreePlan ? (
                  <Badge tone="info">Free: {remaining}/{freeAutoFixCount} left</Badge>
                ) : (
                  <Badge tone="success">Unlimited</Badge>
                )}
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {openIssues.length} compliance issues detected
              </Text>
            </BlockStack>
          </InlineStack>

          {/* Free Plan Counter */}
          {isFreePlan && (
            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    Free auto-fixes this scan
                  </Text>
                  <Text as="p" variant="bodySm">
                    {alreadyUsed} of {freeAutoFixCount} used
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={(alreadyUsed / freeAutoFixCount) * 100}
                  tone={limitReached ? "critical" : "primary"}
                  size="small"
                />
              </BlockStack>
            </Box>
          )}

          {/* Limit Reached Warning */}
          {limitReached && (
            <Banner tone="warning" title="Free auto-fixes used">
              <Text as="p" variant="bodySm">
                You've used all {freeAutoFixCount} free auto-fixes for this scan.{" "}
                <Link to="/app/pricing" style={{ fontWeight: 600 }}>
                  Upgrade to fix all remaining {openIssues.length} issues
                </Link>.
              </Text>
            </Banner>
          )}

          {/* Preview */}
          {!limitReached && previewIssues.length > 0 && (
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                {isFreePlan
                  ? `Top ${previewIssues.length} issues will be fixed (by severity):`
                  : `All ${previewIssues.length} issues will be fixed:`}
              </Text>
              <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                <BlockStack gap="100">
                  {previewIssues.slice(0, 5).map((issue, i) => (
                    <InlineStack key={i} gap="200" blockAlign="center">
                      <Badge tone={getSeverityTone(issue.severity)} size="small">
                        {issue.severity}
                      </Badge>
                      <Text as="span" variant="bodySm" truncate>
                        {issue.title}
                      </Text>
                    </InlineStack>
                  ))}
                  {previewIssues.length > 5 && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      ...and {previewIssues.length - 5} more
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </BlockStack>
          )}

          <Divider />

          {/* Action Buttons */}
          <InlineStack gap="200" align="space-between">
            <BlockStack gap="050">
              {isFreePlan && !limitReached && (
                <Text as="p" variant="bodySm" tone="subdued">
                  💡 Free plan: {remaining} auto-fix{remaining !== 1 ? "es" : ""} left this scan
                </Text>
              )}
              {!isFreePlan && (
                <Text as="p" variant="bodySm" tone="subdued">
                  ✨ All issues will be fixed automatically
                </Text>
              )}
            </BlockStack>

            <InlineStack gap="200">
              {limitReached ? (
                <Link to="/app/pricing">
                  <Button variant="primary" tone="success" icon={MagicIcon}>
                    Upgrade for Unlimited Auto-Fix
                  </Button>
                </Link>
              ) : (
                <>
                  {isFreePlan && (
                    <Link to="/app/pricing">
                      <Button>Upgrade for Unlimited</Button>
                    </Link>
                  )}
                  <Button
                    variant="primary"
                    tone="success"
                    icon={MagicIcon}
                    onClick={handleAutoFixAll}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {isFreePlan
                      ? `Fix ${previewIssues.length} Issue${previewIssues.length !== 1 ? "s" : ""} Now (Free)`
                      : `Fix All ${openIssues.length} Issues`}
                  </Button>
                </>
              )}
            </InlineStack>
          </InlineStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================
// SUCCESS VIEW (no hooks)
// ============================================================
function SuccessView({ data, isFreePlan }) {
  const { results, newScore, limitInfo } = data;
  const remainingAfter = limitInfo?.remainingAfter ?? 0;

  const manualCases = (results?.details || []).filter((d) => d.status === "manual");

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Banner */}
          <Banner
            tone={results.fixed > 0 ? "success" : "info"}
            title={results.fixed > 0 ? "Auto-Fix Complete!" : "Auto-Fix Results"}
          >
            <BlockStack gap="200">
              {results.fixed > 0 && (
                <Text as="p">
                  ✅ {results.fixed} issue{results.fixed !== 1 ? "s" : ""} fixed automatically
                </Text>
              )}
              {results.manual > 0 && (
                <Text as="p" tone="subdued">
                  📋 {results.manual} issue{results.manual !== 1 ? "s" : ""} require manual action (see below)
                </Text>
              )}
              {results.failed > 0 && (
                <Text as="p" tone="subdued">
                  ⚠️ {results.failed} could not be fixed automatically
                </Text>
              )}
              {newScore && results.fixed > 0 && (
                <Text as="p" fontWeight="semibold">
                  New compliance grade: {newScore.grade} ({newScore.score}/100)
                </Text>
              )}
            </BlockStack>
          </Banner>

          {/* Manual Cases */}
          {manualCases.map((mc, i) => (
            <ManualActionView key={i} data={mc} />
          ))}

          {/* Free upgrade prompt */}
          {isFreePlan && remainingAfter <= 0 && limitInfo?.totalIssues > limitInfo?.fixingNow && (
            <Banner tone="info" title="Want to fix all issues?">
              <Text as="p">
                You have {limitInfo.totalIssues - limitInfo.fixingNow} more issues remaining.{" "}
                <Link to="/app/pricing" style={{ fontWeight: 600 }}>
                  Upgrade to Starter ($9.99/mo) for unlimited Auto-Fix
                </Link>.
              </Text>
            </Banner>
          )}

          {/* Reload notice */}
          {results.fixed > 0 && manualCases.length === 0 && (
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              Refreshing dashboard...
            </Text>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================
// MANUAL ACTION VIEW (no hooks - uses inline alert)
// ============================================================
function ManualActionView({ data }) {
  if (!data || !data.manualInstructions) return null;

  const { issueId, title, manualInstructions, disclosureText } = data;

  const handleCopy = async () => {
    if (!disclosureText) return;
    try {
      await navigator.clipboard.writeText(disclosureText);
      alert("✅ Disclosure text copied! Now paste it in your Privacy Policy.");
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed. Please select the text manually.");
    }
  };

  const handleAcknowledge = async () => {
    if (!issueId) {
      alert("Cannot acknowledge: missing issue ID");
      return;
    }

    const confirmMsg = 
      "Are you sure you've handled this manually?\n\n" +
      "Future scans will skip this issue for 30 days.\n\n" +
      "Click OK to confirm, or Cancel to keep it.";

    if (!window.confirm(confirmMsg)) return;

    try {
      const formData = new FormData();
      formData.append("issueId", issueId);
      formData.append("category", data.category || "");

      const response = await fetch("/app/issue-acknowledge", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Issue acknowledged! Future scans will skip this.");
        window.location.reload();
      } else {
        alert("Failed to acknowledge: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Acknowledge failed:", err);
      alert("Failed to acknowledge. Please try again.");
    }
  };

  return (
    <Box
      background="bg-surface-warning"
      padding="400"
      borderRadius="200"
      borderColor="border-warning"
      borderWidth="025"
    >
      <BlockStack gap="300">
        {/* Header */}
        <InlineStack gap="200" blockAlign="center">
          <span style={{ fontSize: "20px" }}>📋</span>
          <Text as="h3" variant="headingSm">
            Manual Action Required: {title}
          </Text>
        </InlineStack>

        <Text as="p" variant="bodySm">
          We couldn't auto-update this because Shopify's automatic policy management is enabled.
          You have two options:
        </Text>

        {/* Steps */}
        {manualInstructions.steps && (
          <Box background="bg-surface" padding="300" borderRadius="200">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" fontWeight="semibold">
                Option 1: Fix it manually (recommended)
              </Text>
              <BlockStack gap="100">
                {manualInstructions.steps.map((step, i) => (
                  <InlineStack key={i} gap="200" blockAlign="start">
                    <Text as="span" variant="bodySm" fontWeight="semibold">
                      {i + 1}.
                    </Text>
                    <Text as="span" variant="bodySm">
                      {step}
                    </Text>
                  </InlineStack>
                ))}
              </BlockStack>
            </BlockStack>
          </Box>
        )}

        {/* Disclosure Text */}
        {disclosureText && (
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" fontWeight="semibold">
              Copy this disclosure text:
            </Text>
            <Box
              background="bg-surface-secondary"
              padding="300"
              borderRadius="200"
              borderColor="border"
              borderWidth="025"
            >
              <pre style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                fontSize: "12px",
                margin: 0,
                maxHeight: "150px",
                overflow: "auto",
                color: "#333",
              }}>
                {disclosureText}
              </pre>
            </Box>
            <InlineStack gap="200">
              <Button onClick={handleCopy} variant="secondary">
                📋 Copy Disclosure Text
              </Button>
              {manualInstructions.settingsUrl && (
                <Button
                  url={`https://admin.shopify.com${manualInstructions.settingsUrl}`}
                  external
                  variant="primary"
                >
                  Open Policy Settings →
                </Button>
              )}
            </InlineStack>
          </BlockStack>
        )}

        {/* Acknowledge Section */}
        <Divider />
        
        <Box background="bg-surface" padding="300" borderRadius="200">
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" fontWeight="semibold">
              Option 2: Already handled?
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              If you've already added AI disclosure to your policy through your legal team
              or another method, click below to skip this issue in future scans (for 30 days).
            </Text>
            <InlineStack>
              <Button onClick={handleAcknowledge} variant="tertiary">
                ✓ I've Handled This Manually
              </Button>
            </InlineStack>
          </BlockStack>
        </Box>
      </BlockStack>
    </Box>
  );
}

// ============================================================
// LIMIT REACHED VIEW (no hooks)
// ============================================================
function LimitReachedView({ message }) {
  return (
    <Card>
      <Box padding="400">
        <Banner tone="warning" title="Free Auto-Fix Limit Reached">
          <BlockStack gap="200">
            <Text as="p">{message}</Text>
            <Box paddingBlockStart="200">
              <Link to="/app/pricing">
                <Button variant="primary" tone="success" icon={MagicIcon}>
                  Upgrade Now
                </Button>
              </Link>
            </Box>
          </BlockStack>
        </Banner>
      </Box>
    </Card>
  );
}

// ============================================================
// HELPER
// ============================================================
function getSeverityTone(severity) {
  switch (severity) {
    case "critical": return "critical";
    case "high": return "warning";
    case "medium": return "attention";
    case "low": return "info";
    default: return "info";
  }
}