import {
  useLoaderData,
  useActionData,
  useSubmit,
  useNavigation,
  redirect,
} from "react-router";
import { Page, Layout, Card, BlockStack, Box, Button, InlineStack, Text, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { downloadComplianceReport } from "../utils/generatePDF";
import PlanUsageCard from "../components/PlanUsageCard";
import AutoFixAllCard from "../components/AutoFixAllCard";
import { useState, useEffect } from "react";
import ScanProgressCard from "../components/ScanProgressCard";

// ── Components Import ──
import DeadlineBanner from "../components/DeadlineBanner";
import StoreOverviewCard from "../components/StoreOverviewCard";
import ScannerCard from "../components/ScannerCard";
import IssuesList from "../components/IssuesList";
import ComplianceGradeCard from "../components/ComplianceGradeCard";
import IssueSummaryCard from "../components/IssueSummaryCard";
import ScanDetailsCard from "../components/ScanDetailsCard";
import DeadlineCountdownCard from "../components/DeadlineCountdownCard";
import OnboardingFlow from "../components/OnboardingFlow";

// ============================================================
// LOADER — page load হলে data fetch করে
// ============================================================
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  // Check onboarding status FIRST
  let merchant = await prisma.merchant.findUnique({ where: { shop } });
  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: { shop, onboardingStep: 0 },
    });
  }
  const needsOnboarding = !merchant.onboardingDone;

  // Continue with normal loading
  const response = await admin.graphql(`
    query {
      products(first: 50) {
        nodes {
          id
          title
          handle
          media(first: 10) {
            nodes {
              ... on MediaImage {
                alt
                image { url }
              }
            }
          }
        }
      }
      shop {
        name
        myshopifyDomain
      }
    }
  `);

  const data = await response.json();
  const products = data.data.products.nodes;
  const shopInfo = data.data.shop;

  let totalImages = 0;
  products.forEach((p) => {
    totalImages += p.media.nodes.filter(m => m.image).length;
  });

  const lastScan = await prisma.scan.findFirst({
    where: { shop, status: "completed" },
    orderBy: { createdAt: "desc" },
    include: {
      issues: {
        where: { status: { in: ["open", "pending"] } },
        orderBy: { severity: "asc" },
      },
    },
  });

  // Check if there's a currently running scan (for resume on page reload)
  const runningScan = await prisma.scan.findFirst({
    where: { shop, status: { in: ["pending", "running"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, currentPhase: true, progress: true },
  });

  const { checkScanLimit } = await import("../utils/planLimits");
  const planInfo = await checkScanLimit(prisma, shop);

  return {
    shop: shopInfo,
    productCount: products.length,
    totalImages,
    lastScan,
    runningScan,
    needsOnboarding,
    onboardingStep: merchant.onboardingStep || 0,
    planInfo,
  };
};

// ============================================================
// ACTION — Scan trigger (async, fire-and-forget)
// ============================================================
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const formData = await request.clone().formData();
  const actionType = formData.get("actionType");

  if (actionType === "complete_onboarding") {
    await prisma.merchant.update({
      where: { shop },
      data: { onboardingDone: true, onboardingStep: 3 },
    });
    return { success: true, onboardingComplete: true };
  }

  if (actionType === "update_onboarding_step") {
    const step = parseInt(formData.get("step") || "0");
    await prisma.merchant.update({
      where: { shop },
      data: { onboardingStep: step },
    });
    return { success: true };
  }

  // Plan limit check
  const { checkScanLimit } = await import("../utils/planLimits");
  const limitCheck = await checkScanLimit(prisma, shop);

  if (!limitCheck.canScan) {
    console.log(`⛔ Scan blocked - limit exceeded for ${shop}`);
    return {
      success: false,
      limitExceeded: true,
      planInfo: limitCheck,
      message: `You've used all ${limitCheck.limit} scans for this month on the ${limitCheck.planName} plan. Upgrade to scan more.`,
    };
  }

  console.log(`✅ Scan allowed - ${limitCheck.used + 1}/${limitCheck.limit} for ${shop}`);

  const existingRunning = await prisma.scan.findFirst({
    where: {
      shop,
      status: { in: ["pending", "running"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingRunning) {
    console.log(`⏳ Scan already in progress: ${existingRunning.id}`);
    return {
      success: true,
      scanInProgress: true,
      scanId: existingRunning.id,
      message: "A scan is already in progress",
    };
  }

  const scan = await prisma.scan.create({
    data: {
      shop,
      status: "running",
      currentPhase: "queued",
      progress: 0,
    },
  });

  console.log(`✅ Scan record created: ${scan.id}`);

  // Fire-and-forget background scan
  (async () => {
    try {
      const { runBackgroundScan } = await import("../utils/scan");
      await runBackgroundScan({
        scanId: scan.id,
        shop,
        admin,
        prisma,
      });
    } catch (error) {
      console.error("Background scan failed to start:", error);
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: "failed",
          currentPhase: "failed",
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
    }
  })();

  console.log(`⚡ Scan dispatched to background. Returning to client.`);
  return {
    success: true,
    scanStarted: true,
    scanId: scan.id,
  };
};

// ============================================================
// UI COMPONENT — Dashboard Layout
// ============================================================
export default function ComplyGuardDashboard() {
  const { shop, productCount, totalImages, lastScan, runningScan, needsOnboarding, onboardingStep, planInfo } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  // ============================================================
  // SCAN POLLING STATE
  // ============================================================
  const [pollingScanId, setPollingScanId] = useState(runningScan?.id || null);
  const [progressData, setProgressData] = useState(runningScan || null);

  // When scan starts via action, capture scanId
  useEffect(() => {
    if (actionData?.scanStarted && actionData?.scanId) {
      console.log("Scan started, beginning polling:", actionData.scanId);
      setPollingScanId(actionData.scanId);
      setProgressData({
        status: "running",
        currentPhase: "queued",
        progress: 0,
        imagesProcessed: 0,
        imagesTotal: 0,
      });
    }

    if (actionData?.scanInProgress && actionData?.scanId) {
      console.log("Scan already in progress, resuming polling:", actionData.scanId);
      setPollingScanId(actionData.scanId);
    }
  }, [actionData]);

  // Poll scan status every 3 seconds
  useEffect(() => {
    if (!pollingScanId) return;

    const pollScan = async () => {
      try {
        const response = await fetch(`/app/scan-status?scanId=${pollingScanId}`);
        const data = await response.json();

        if (data?.scan) {
          setProgressData(data.scan);

          if (data.scan.status === "completed" || data.scan.status === "failed") {
            console.log("Scan finished:", data.scan.status);
            setPollingScanId(null);

            // 1.5 sec delay then reload to show results
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }
    };

    pollScan();
    const interval = setInterval(pollScan, 3000);

    return () => clearInterval(interval);
  }, [pollingScanId]);

  const isScanning = !!pollingScanId;
  const currentScan = lastScan;

  const handleDownloadPDF = () => {
    if (!currentScan) return;
    downloadComplianceReport(currentScan, shop.name);
  };

  const deadline = new Date("2026-08-02T00:00:00Z");
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  const handleScan = () => submit({}, { method: "POST" });

  if (needsOnboarding) {
    return (
      <Page title="ComplyGuard AI" fullWidth>
        <OnboardingFlow initialStep={onboardingStep} />
      </Page>
    );
  }

  return (
    <Page title="ComplyGuard AI" fullWidth>
      <BlockStack gap="500">
        <DeadlineBanner daysLeft={daysLeft} />

        {actionData?.limitExceeded && (
          <Banner tone="critical" title="Scan Limit Reached">
            <p>{actionData.message}</p>
          </Banner>
        )}

        <Layout>
          {/* Left Column */}
          <Layout.Section>
            <BlockStack gap="500">
              <PlanUsageCard planInfo={planInfo} />

              {/* Scan Progress Card (shown only during scanning) */}
              {isScanning && progressData && (
                <ScanProgressCard scan={progressData} />
              )}

              <StoreOverviewCard
                shopName={shop.name}
                productCount={productCount}
                totalImages={totalImages}
              />

              {/* Download PDF Report Button */}
              {currentScan && currentScan.status === "completed" && (
                <Card>
                  <Box>
                    <InlineStack gap="300" align="space-between" blockAlign="center" wrap={false}>
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingSm">
                          📄 Compliance Report
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Download a professional PDF report for legal review
                        </Text>
                      </BlockStack>
                      <Button
                        variant="primary"
                        onClick={handleDownloadPDF}
                      >
                        Download PDF Report
                      </Button>
                    </InlineStack>
                  </Box>
                </Card>
              )}

              {!isScanning && (
                <ScannerCard
                  onScan={handleScan}
                  isScanning={isScanning}
                  productCount={productCount}
                  totalImages={totalImages}
                />
              )}

              <AutoFixAllCard scan={currentScan} planInfo={planInfo} />
              <IssuesList issues={currentScan?.issues} shopDomain={shop.myshopifyDomain} />
            </BlockStack>
          </Layout.Section>

          {/* Right Column */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <ComplianceGradeCard scan={currentScan} />
              <IssueSummaryCard scan={currentScan} />
              <ScanDetailsCard scan={currentScan} />
              <DeadlineCountdownCard daysLeft={daysLeft} />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}