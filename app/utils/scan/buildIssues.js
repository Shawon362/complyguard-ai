// ============================================================
// Build all issues from scan data
// ============================================================
export async function buildIssues({
  scanId,
  shop,
  products,
  policies,
  aiApps,
  aiResults,
  allImages,
}) {
  const issues = [];

  // Run each issue check
  issues.push(...checkPrivacyPolicy(scanId, shop, policies));
  issues.push(...checkTermsOfService(scanId, shop, policies));
  issues.push(...checkMissingAltText(scanId, shop, products));
  issues.push(...checkAIImages(scanId, shop, aiResults, allImages));
  issues.push(...checkAIApps(scanId, shop, aiApps));

  return issues;
}

// ============================================================
// Check 1: Privacy Policy
// ============================================================
function checkPrivacyPolicy(scanId, shop, policies) {
  const issues = [];

  // No Privacy Policy at all
  if (!policies.privacy) {
    issues.push({
      scanId, shop,
      category: "no_privacy_policy",
      article: "EU AI Act Article 50 / GDPR Article 13",
      severity: "critical",
      title: "No Privacy Policy found",
      description: "Your store does not have a Privacy Policy. This is mandatory under GDPR and required for EU AI Act compliance.",
      evidence: JSON.stringify({}),
      suggestedFix: "Create a Privacy Policy in Shopify Settings > Policies. Include AI usage disclosures.",
      status: "open",
    });
    return issues;
  }

  // Privacy exists — check for AI disclosure
  const lower = policies.privacyBody.toLowerCase();
  const hasAI =
    lower.includes("artificial intelligence") ||
    lower.includes("ai-generated") ||
    lower.includes("ai system");

  if (!hasAI) {
    issues.push({
      scanId, shop,
      category: "policy_no_ai_disclosure",
      article: "EU AI Act Article 50",
      severity: "high",
      title: "Privacy Policy missing AI disclosure",
      description: "Your Privacy Policy does not mention AI usage. EU AI Act requires disclosure of AI systems used in your store.",
      evidence: JSON.stringify({}),
      suggestedFix: "Add a section to your Privacy Policy disclosing use of AI for product images, recommendations, or chatbots.",
      status: "open",
    });
  }

  return issues;
}

// ============================================================
// Check 2: Terms of Service
// ============================================================
function checkTermsOfService(scanId, shop, policies) {
  const issues = [];

  // Skip if no Terms (already covered if needed)
  if (!policies.terms) return issues;

  const lower = policies.termsBody.toLowerCase();
  const hasAutomated =
    lower.includes("automated") ||
    lower.includes("artificial intelligence");

  if (!hasAutomated) {
    issues.push({
      scanId, shop,
      category: "terms_no_automated_disclosure",
      article: "EU AI Act Article 50",
      severity: "medium",
      title: "Terms of Service missing automated systems disclosure",
      description: "Your Terms of Service does not disclose use of automated systems or AI.",
      evidence: JSON.stringify({}),
      suggestedFix: "Add a section to Terms disclosing automated decision-making, AI recommendations, and chatbots.",
      status: "open",
    });
  }

  return issues;
}

// ============================================================
// Check 3: Missing Alt-text
// ============================================================
function checkMissingAltText(scanId, shop, products) {
  const issues = [];

  for (const product of products) {
    for (const mediaItem of product.media.nodes) {
      if (!mediaItem.image) continue;

      const altText = (mediaItem.alt || "").trim();
      if (altText !== "") continue;

      issues.push({
        scanId, shop,
        category: "missing_alt_text",
        article: "EU AI Act Article 50(4)",
        severity: "medium",
        title: `Missing alt-text: "${product.title}"`,
        description: `Product "${product.title}" has an image without alt-text.`,
        evidence: JSON.stringify({
          productTitle: product.title,
          imageUrl: mediaItem.image.url,
        }),
        suggestedFix: `Add alt-text: "${product.title} (AI-generated product visualization)"`,
        status: "open",
      });
    }
  }

  return issues;
}

// ============================================================
// Check 4: AI Image Detection (with skip logic)
// ============================================================
function checkAIImages(scanId, shop, aiResults, allImages) {
  const issues = [];

  for (const result of aiResults) {
    if (!result.success || !result.isAI || result.confidence < 0.70) continue;

    const matchingImage = allImages.find((img) => img.url === result.imageUrl);
    const altText = (matchingImage?.altText || "").toLowerCase();

    const alreadyDisclosed =
      altText.includes("ai-generated") ||
      altText.includes("artificial intelligence") ||
      altText.includes("ai generated");

    if (alreadyDisclosed) {
      console.log(`>>> Skipped (compliant): ${result.productTitle}`);
      continue;
    }

    issues.push({
      scanId, shop,
      category: "ai_image_detected",
      article: "EU AI Act Article 50(4)",
      severity: "high",
      title: `AI-generated image detected: "${result.productTitle}"`,
      description: `This image was flagged as potentially AI-generated. ${result.reasoning} Indicators: ${(result.indicators || []).join(", ")}.

📋 ACTION REQUIRED: Confirm whether this image is AI-generated. If yes, apply the suggested fix below for EU AI Act compliance. If no, dismiss this warning.

⚖️ EU AI Act Article 50(4): AI-generated images must be clearly labeled.`,
      evidence: JSON.stringify({
        imageUrl: result.imageUrl,
        productTitle: result.productTitle,
        confidence: result.confidence,
        indicators: result.indicators,
      }),
      suggestedFix: `Required actions for EU AI Act compliance: 1. Add alt-text: "${result.productTitle} (AI-generated product image)" 2. Add visible disclaimer near the image 3. Update product description to include AI disclosure 4. Optional: Add schema.org markup`,
      status: "open",
    });
  }

  return issues;
}

// ============================================================
// Check 5: AI Apps (chatbots, recommenders)
// ============================================================
function checkAIApps(scanId, shop, aiApps) {
  const issues = [];

  for (const app of aiApps) {
    const severity =
      app.riskLevel === "high" ? "high" :
      app.riskLevel === "low" ? "low" : "medium";

    const fixText = `Add to your Privacy Policy:

"We use ${app.name} (${(app.aiFeatures || []).join(", ")}) to enhance customer experience. ${app.disclosureRequired || ""}

This use of AI complies with EU AI Act Article 50 disclosure requirements."`;

    issues.push({
      scanId, shop,
      category: "ai_app_undisclosed",
      article: "EU AI Act Article 50",
      severity,
      title: `AI app detected: ${app.name}`,
      description: `${app.name} is installed on your store. ${app.disclosureRequired || "EU AI Act requires AI tool disclosure."}\n\nDetected via: ${(app.source || "unknown").replace("_", " ")}`,
      evidence: JSON.stringify({
        appName: app.name,
        handle: app.handle,
        category: app.category,
        aiFeatures: app.aiFeatures,
        source: app.source,
      }),
      suggestedFix: fixText,
      status: "open",
    });
  }

  return issues;
}