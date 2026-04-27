
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
          images(first: 10) {
            nodes {
              url
              altText
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
  products.forEach((product) => {
    totalImages += product.images.nodes.length;
  });

  const lastScan = await prisma.scan.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
    include: {
      issues: { orderBy: { severity: "asc" } },
    },
  });

  const { checkScanLimit } = await import("../utils/planLimits");
  const planInfo = await checkScanLimit(prisma, shop);

  return {
    shop: shopInfo,
    productCount: products.length,
    totalImages,
    lastScan,
    needsOnboarding,
    onboardingStep: merchant.onboardingStep || 0,
    planInfo,
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

   const formData = await request.clone().formData();
  const actionType = formData.get("actionType");

  // ── Plan Limit Check (only for scan, not for onboarding actions) ──
  if (!actionType || actionType === "scan") {
    const { checkScanLimit } = await import("../utils/planLimits");
    const limitCheck = await checkScanLimit(prisma, shop);

    if (!limitCheck.canScan) {
      console.log(`⛔ Scan blocked - limit exceeded for ${shop} (${limitCheck.used}/${limitCheck.limit})`);
      return {
        success: false,
        limitExceeded: true,
        planInfo: limitCheck,
        message: `You've used all ${limitCheck.limit} scans for this month on the ${limitCheck.planName} plan. Upgrade to scan more.`,
      };
    }

    console.log(`✅ Scan allowed - ${limitCheck.used + 1}/${limitCheck.limit} for ${shop}`);
  }

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

  // Fetch products
  const productResponse = await admin.graphql(`
    query {
      products(first: 50) {
        nodes {
          id
          title
          handle
          images(first: 10) {
            nodes { url, altText }
          }
        }
      }
    }
  `);
  const productData = await productResponse.json();
  const products = productData.data.products.nodes;

  let totalImages = 0;
  products.forEach((p) => { totalImages += p.images.nodes.length; });

  const scan = await prisma.scan.create({
    data: {
      shop, status: "running",
      totalProducts: products.length, totalImages, totalPages: 3,
    },
  });

  const issues = [];

  // ── Policy Checks ─
  let privacyBody = "";
  let termsBody = "";
  let refundBody = "";
  let policyExists = { privacy: false, terms: false, refund: false };

  try {
    const policyResponse = await admin.graphql(`
      query {
        shop {
          shopPolicies {
            type
            body
            url
          }
        }
      }
    `);
    const pd = await policyResponse.json();
    const policies = pd.data?.shop?.shopPolicies || [];

    for (const policy of policies) {
      if (policy.type === "PRIVACY_POLICY") {
        privacyBody = policy.body || "";
        policyExists.privacy = true;
      }
      if (policy.type === "TERMS_OF_SERVICE") {
        termsBody = policy.body || "";
        policyExists.terms = true;
      }
      if (policy.type === "REFUND_POLICY") {
        refundBody = policy.body || "";
        policyExists.refund = true;
      }
    }
    console.log("Policies found:", { privacy: policyExists.privacy, terms: policyExists.terms, refund: policyExists.refund });
  } catch (e) {
    console.log("Policy query failed:", e.message);
  }

  const aiKeywords = ["artificial intelligence", "AI", "machine learning", "automated decision", "AI-generated", "algorithm"];
  const hasAIDisclosure = aiKeywords.some((kw) => privacyBody.toLowerCase().includes(kw.toLowerCase()));

  // CHECK: Privacy Policy exists
  if (!policyExists.privacy) {
    issues.push({
      scanId: scan.id, shop,
      category: "no_privacy_policy",
      article: "GDPR + EU AI Act",
      severity: "critical",
      title: "No Privacy Policy found",
      description: "Your store has no Privacy Policy. Mandatory under GDPR and EU AI Act.",
      evidence: "{}",
      fixAvailable: true,
      fixAction: "create_policy",
      suggestedFix: "Go to Shopify Admin → Settings → Policies → Privacy Policy and create a comprehensive policy.",
    });
  } else if (!hasAIDisclosure && privacyBody.length > 100) {
    // Policy exists but missing AI disclosure (only flag if policy has substantial content)
    issues.push({
      scanId: scan.id, shop,
      category: "policy_no_ai_disclosure",
      article: "EU AI Act Article 50(1)",
      severity: "high",
      title: "Privacy Policy missing AI disclosure",
      description: "Your Privacy Policy does not mention AI or automated decision-making. Under EU AI Act Article 50, if your store uses AI tools, you must disclose this.",
      evidence: "{}",
      fixAvailable: true,
      fixAction: "add_policy_text",
      suggestedFix: 'Add to Privacy Policy:\n\n"We use AI technologies including AI-generated product images and automated recommendations, in accordance with the EU AI Act."',
    });
  }
  if (termsBody.length > 0) {
    const hasAutomated = ["automated", "algorithm", "AI", "machine learning"].some((kw) => termsBody.toLowerCase().includes(kw.toLowerCase()));
    if (!hasAutomated) {
      issues.push({ scanId: scan.id, shop, category: "terms_no_automated_disclosure", article: "EU AI Act Article 50(1)", severity: "medium", title: "Terms of Service missing automated decision disclosure", description: "Your Terms of Service does not mention automated decision-making.", evidence: "{}", fixAvailable: true, fixAction: "add_terms_text", suggestedFix: 'Add: "We use automated systems and AI for product recommendations and personalized experiences."' });
    }
  }

  // ── AI Apps Detection ──
  try {
    const { KNOWN_AI_APPS, getAIAppSeverity, generateAIAppFix } = await import("../ai-apps-database");
    const detectedApps = new Map();

    // ── Method 1: Script Tags ──
    try {
      const scriptResp = await admin.graphql(`
        query { scriptTags(first: 50) { nodes { src } } }
      `);
      const scriptData = await scriptResp.json();
      const scriptTags = scriptData.data?.scriptTags?.nodes || [];

      for (const tag of scriptTags) {
        const src = (tag.src || "").toLowerCase();
        for (const aiApp of KNOWN_AI_APPS) {
          const handleNorm = aiApp.handle.replace(/-/g, "");
          const nameNorm = aiApp.name.toLowerCase().replace(/[\s.]/g, "");
          if (src.includes(aiApp.handle) || src.includes(handleNorm) || src.includes(nameNorm)) {
            detectedApps.set(aiApp.handle, { app: aiApp, source: "script_tag" });
          }
        }
      }
      console.log(`>>> Script tags scanned: ${scriptTags.length}, detected: ${detectedApps.size}`);
    } catch (e) {
      console.log("ScriptTags query failed:", e.message);
    }

    // ── Method 2: Theme Files (App Embed Blocks) ──
    try {
      const themeResp = await admin.graphql(`
        query {
          themes(first: 1, roles: MAIN) {
            nodes {
              id
              files(filenames: ["config/settings_data.json"], first: 1) {
                nodes {
                  body { ... on OnlineStoreThemeFileBodyText { content } }
                }
              }
            }
          }
        }
      `);
      const themeData = await themeResp.json();
      const themeFiles = themeData.data?.themes?.nodes?.[0]?.files?.nodes || [];
      const settingsContent = (themeFiles[0]?.body?.content || "").toLowerCase();

      for (const aiApp of KNOWN_AI_APPS) {
        const handleNorm = aiApp.handle.replace(/-/g, "");
        const nameNorm = aiApp.name.toLowerCase().replace(/[\s.]/g, "");
        if (settingsContent.includes(aiApp.handle) || settingsContent.includes(handleNorm) || settingsContent.includes(nameNorm)) {
          if (!detectedApps.has(aiApp.handle)) {
            detectedApps.set(aiApp.handle, { app: aiApp, source: "theme_embed" });
          }
        }
      }
      console.log(`>>> Theme settings scanned, total detected: ${detectedApps.size}`);
    } catch (e) {
      console.log("Theme query failed:", e.message);
    }

    // ── Method 3: Storefront HTML (last resort fallback) ──
    try {
      const storefrontUrl = `https://${shop}/?_pf=1`; // bypass password if possible
      console.log(`>>> Fetching storefront: ${storefrontUrl}`);

      const fetchResp = await fetch(storefrontUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 ComplyGuard Scanner" },
      }).catch((err) => {
        console.log("Fetch error:", err.message);
        return null;
      });

      if (!fetchResp) {
        console.log(">>> Storefront fetch returned null");
      } else {
        console.log(`>>> Storefront response status: ${fetchResp.status}`);
        const html = await fetchResp.text();
        console.log(`>>> Storefront HTML length: ${html.length} chars`);

        const htmlLower = html.toLowerCase();

        // Save HTML snippets for debugging
        const tidioCheck = htmlLower.includes("tidio");
        const widgetCheck = htmlLower.includes("widget.tidio");
        const chatCheck = htmlLower.includes("chat") || htmlLower.includes("chatbot");
        console.log(`>>> Debug: contains "tidio"=${tidioCheck}, "widget.tidio"=${widgetCheck}, "chat"=${chatCheck}`);

        // If password protected, log that
        if (htmlLower.includes("password") && htmlLower.includes("enter using password")) {
          console.log(">>> ⚠️ Store is PASSWORD PROTECTED — cannot scan storefront");
        }

        // Search for AI apps
        let storefrontDetected = 0;
        for (const aiApp of KNOWN_AI_APPS) {
          const searchTerms = [
            aiApp.handle,
            aiApp.handle.replace(/-/g, ""),
            aiApp.name.toLowerCase().replace(/[\s.]/g, ""),
            aiApp.name.toLowerCase(),
          ];

          const found = searchTerms.some((term) => term && htmlLower.includes(term));
          if (found) {
            console.log(`>>> ✓ MATCHED: ${aiApp.name} (handle: ${aiApp.handle})`);
            if (!detectedApps.has(aiApp.handle)) {
              detectedApps.set(aiApp.handle, { app: aiApp, source: "storefront_html" });
              storefrontDetected++;
            }
          }
        }
        console.log(`>>> Storefront HTML scan complete. New detections: ${storefrontDetected}, Total: ${detectedApps.size}`);
      }
    } catch (e) {
      console.log("Storefront fetch failed:", e.message);
    }

    // ── Generate Issues ──
    for (const [handle, { app: aiApp, source }] of detectedApps) {
      issues.push({
        scanId: scan.id,
        shop,
        category: "ai_app_undisclosed",
        article: "EU AI Act Article 50(1)",
        severity: getAIAppSeverity(aiApp.riskLevel),
        title: `AI app detected: ${aiApp.name}`,
        description: `${aiApp.name} (${aiApp.category.replace("_", " ")}) is installed on your store. ${aiApp.disclosureRequired}\n\nUnder EU AI Act Article 50, AI tools used in customer-facing experiences must be disclosed in your Privacy Policy.\n\nDetected via: ${source.replace("_", " ")}`,
        evidence: JSON.stringify({
          appHandle: aiApp.handle,
          appName: aiApp.name,
          category: aiApp.category,
          aiFeatures: aiApp.aiFeatures,
          riskLevel: aiApp.riskLevel,
          detectionSource: source,
        }),
        fixAvailable: true,
        fixAction: "add_app_disclosure",
        suggestedFix: generateAIAppFix(aiApp),
      });
    }

    console.log(`>>> FINAL: ${detectedApps.size} AI apps detected`);
  } catch (e) {
    console.log("AI apps detection failed:", e.message);
  }
  // ── Missing Alt-text ──
  for (const product of products) {
    for (const image of product.images.nodes) {
      if (!image.altText || image.altText.trim() === "") {
        issues.push({ scanId: scan.id, shop, category: "missing_alt_text", article: "EU AI Act Article 50(4)", severity: "medium", title: `Missing alt-text: "${product.title}"`, description: `Product "${product.title}" has an image without alt-text.`, evidence: JSON.stringify({ productTitle: product.title, imageUrl: image.url }), fixAvailable: true, fixAction: "add_alt_text", suggestedFix: `Add alt-text: "${product.title} (AI-generated product visualization)"` });
      }
    }
  }

  // ── AI Image Detection (max 10 images, single pass) ──
  const allImages = [];
  for (const product of products) {
    for (const image of product.images.nodes) {
      allImages.push({ url: image.url, productTitle: product.title });
    }
  }

  const imagesToAnalyze = allImages.slice(0, 10);
  if (imagesToAnalyze.length > 0) {
    const { analyzeImages } = await import("../ai-detector.server");
    const aiResults = await analyzeImages(imagesToAnalyze);

    for (const result of aiResults) {
      if (result.success && result.isAI && result.confidence >= 0.55) {
        issues.push({
          scanId: scan.id,
          shop,
          category: "ai_image_detected",
          article: "EU AI Act Article 50(4)",
          severity: result.confidence >= 0.85 ? "critical" : result.confidence >= 0.7 ? "high" : "medium",
          title: `AI-generated image detected: "${result.productTitle}"`,
          description: `This image was flagged as potentially AI-generated and requires your review.\n\nWhy flagged: ${result.reasoning}\n\n${result.indicators?.length > 0 ? "Indicators: " + result.indicators.join(", ") + ".\n\n" : ""}📋 ACTION REQUIRED: As the store owner, please confirm whether this image is AI-generated:\n\n• If YES (AI-generated) → Apply the suggested fix below for EU AI Act compliance\n• If NO (real photo) → You can dismiss this warning\n\n⚖️ EU AI Act Article 50(4): AI-generated images must be clearly labeled. Non-compliance can result in fines up to €7.5M or 1.5% of annual global turnover. ComplyGuard AI uses automated detection — final verification is your responsibility as the merchant.`,
          evidence: JSON.stringify({ imageUrl: result.imageUrl, confidence: result.confidence, productTitle: result.productTitle }),
          fixAvailable: true,
          fixAction: "add_ai_disclosure",
          suggestedFix: `Required actions for EU AI Act compliance:\n\n1. Add alt-text: "${result.productTitle} (AI-generated product image)"\n\n2. Add visible disclaimer near the image: "This image was generated using artificial intelligence"\n\n3. Update product description to include: "Product images on this page include AI-generated visualizations. Actual product may vary."\n\n4. Optional: Add schema.org markup — creditText: "AI-generated product visualization"`,
        });
      }
    }
  }

  // ── Save + Score ──
  if (issues.length > 0) await prisma.issue.createMany({ data: issues });

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  let score = 100;
  if (criticalCount > 0) score -= 15 + Math.min((criticalCount - 1) * 8, 25);
  if (highCount > 0) score -= 10 + Math.min((highCount - 1) * 5, 15);
  if (mediumCount > 0) score -= 5 + Math.min((mediumCount - 1) * 3, 15);
  if (lowCount > 0) score -= 2 + Math.min((lowCount - 1) * 2, 8);
  if (score < 0) score = 0;
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  await prisma.scan.update({ where: { id: scan.id }, data: { status: "completed", grade, score, criticalCount, highCount, mediumCount, lowCount, completedAt: new Date() } });

  const completedScan = await prisma.scan.findUnique({ where: { id: scan.id }, include: { issues: { orderBy: { severity: "asc" } } } });

  return { success: true, scan: completedScan };
};

// ============================================================
// UI COMPONENT — Dashboard Layout
// ============================================================
export default function ComplyGuardDashboard() {
  const { shop, productCount, totalImages, lastScan, needsOnboarding, onboardingStep, planInfo } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const isScanning = navigation.state === "submitting";
  const currentScan = actionData?.scan || lastScan;

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
              <StoreOverviewCard
                shopName={shop.name}
                productCount={productCount}
                totalImages={totalImages}
              />
              {/* Download PDF Report Button */}
              {currentScan && currentScan.status === "completed" && (
                <Card>
                  <Box padding="400">
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

              <ScannerCard
                onScan={handleScan}
                isScanning={isScanning}
                productCount={productCount}
                totalImages={totalImages}
              />
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