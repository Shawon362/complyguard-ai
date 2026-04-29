import { Card, BlockStack, Text, Box, ProgressBar, InlineStack, Icon } from "@shopify/polaris";
import { ClockIcon } from "@shopify/polaris-icons";

// ============================================================
// Phase labels for user-friendly display
// ============================================================
const PHASE_LABELS = {
  queued: "Preparing scan...",
  fetching_products: "Fetching your products...",
  checking_policies: "Checking store policies...",
  scanning_apps: "Scanning installed apps...",
  analyzing_images: "Analyzing product images with AI...",
  saving_results: "Finalizing results...",
  completed: "Scan complete!",
  failed: "Scan failed",
};

export default function ScanProgressCard({ scan }) {
  if (!scan) return null;

  const phase = scan.currentPhase || "queued";
  const phaseLabel = PHASE_LABELS[phase] || "Processing...";
  const progress = scan.progress || 0;

  // Image analysis sub-progress
  const showImageProgress = 
    phase === "analyzing_images" && 
    scan.imagesTotal > 0;

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack gap="300" blockAlign="center">
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #5C6AC4 0%, #202E78 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <SpinnerIcon />
            </div>
            <BlockStack gap="050">
              <Text as="h3" variant="headingMd">
                Scanning in progress
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {phaseLabel}
              </Text>
            </BlockStack>
          </InlineStack>

          {/* Main Progress Bar */}
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="p" variant="bodySm" tone="subdued">
                Overall progress
              </Text>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                {progress}%
              </Text>
            </InlineStack>
            <ProgressBar progress={progress} tone="primary" size="medium" />
          </BlockStack>

          {/* Image Sub-progress (only during AI analysis) */}
          {showImageProgress && (
            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    AI Image Analysis
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {scan.imagesProcessed} of {scan.imagesTotal} images
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={(scan.imagesProcessed / scan.imagesTotal) * 100}
                  tone="success"
                  size="small"
                />
              </BlockStack>
            </Box>
          )}

          {/* Helpful Tip */}
          <Box background="bg-surface-info-subdued" padding="300" borderRadius="200">
            <InlineStack gap="200" blockAlign="start" wrap={false}>
              <div style={{ width: "16px", height: "16px", marginTop: "2px", flexShrink: 0 }}>
                <Icon source={ClockIcon} tone="info" />
              </div>
              <Text as="p" variant="bodySm">
                You can leave this page — your scan continues running in the background. Return anytime to check progress.
              </Text>
            </InlineStack>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================
// Animated spinner icon
// ============================================================
function SpinnerIcon() {
  return (
    <div style={{
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderTop: "3px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}