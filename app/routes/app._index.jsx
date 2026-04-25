
import {
  useLoaderData,
  useActionData,
  useSubmit,
  useNavigation,
  redirect,
} from "react-router";
import { Page, Layout, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

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

  return {
    shop: shopInfo,
    productCount: products.length,
    totalImages,
    lastScan,
    needsOnboarding,
    onboardingStep: merchant.onboardingStep || 0,
  };
};

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
  const { shop, productCount, totalImages, lastScan, needsOnboarding, onboardingStep } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const isScanning = navigation.state === "submitting";
  const currentScan = actionData?.scan || lastScan;

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

        <Layout>
          {/* Left Column */}
          <Layout.Section>
            <BlockStack gap="500">
              <StoreOverviewCard
                shopName={shop.name}
                productCount={productCount}
                totalImages={totalImages}
              />
              <ScannerCard
                onScan={handleScan}
                isScanning={isScanning}
                productCount={productCount}
                totalImages={totalImages}
              />
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