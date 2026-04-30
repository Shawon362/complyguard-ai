// ============================================================
// AI disclosure text for Terms of Service
// ============================================================
const AI_TERMS_TEXT = `

<h3>Automated Systems and AI Disclosure</h3>
<p>By using this store, you acknowledge and accept that:</p>
<ul>
  <li>We may use automated decision-making systems and AI for product recommendations, search results, and personalized experiences.</li>
  <li>Customer service may involve AI-powered chatbots; you can request human assistance at any time.</li>
  <li>Some product images may be AI-generated and will be labeled accordingly.</li>
  <li>You have the right to know about any automated systems affecting your shopping experience.</li>
</ul>
<p>This disclosure is provided in compliance with the EU AI Act (Regulation 2024/1689, Article 50).</p>
`;

// ============================================================
// Fix Terms of Service — Add automated systems disclosure
// ============================================================
export async function fixTerms(admin) {
  try {
    // ── Step 1: Get current Terms ──
    const policyQuery = await admin.graphql(`
      query {
        shop {
          shopPolicies {
            type
            body
          }
        }
      }
    `);

    const policyData = await policyQuery.json();
    const policies = policyData.data?.shop?.shopPolicies || [];
    const termsPolicy = policies.find((p) => p.type === "TERMS_OF_SERVICE");

    if (!termsPolicy) {
      return {
        success: false,
        manual: true,
        message: "No Terms of Service found. Please create one in Shopify Admin first.",
        manualInstructions: getManualInstructions(),
      };
    }

    const currentBody = termsPolicy.body || "";

    // Check if already has automated/AI disclosure
    const hasAutomated =
      currentBody.toLowerCase().includes("automated") ||
      currentBody.toLowerCase().includes("artificial intelligence") ||
      currentBody.toLowerCase().includes("ai system");

    if (hasAutomated) {
      return {
        success: true,
        message: "Terms already has automated systems disclosure (skipped)",
      };
    }

    // ── Step 2: Try to update via API ──
    const newBody = currentBody + AI_TERMS_TEXT;

    const updateMutation = await admin.graphql(`
      mutation updatePolicy($type: ShopPolicyType!, $body: String!) {
        shopPolicyUpdate(shopPolicy: { type: $type, body: $body }) {
          shopPolicy { id }
          userErrors { field, message }
        }
      }
    `, {
      variables: {
        type: "TERMS_OF_SERVICE",
        body: newBody,
      },
    });

    const updateResult = await updateMutation.json();
    const errors = updateResult.data?.shopPolicyUpdate?.userErrors;

    // ── Step 3: Handle "automatic management" gracefully ──
    if (errors && errors.length > 0) {
      const errorMessage = errors[0].message || "";

      if (errorMessage.toLowerCase().includes("automatic management")) {
        return {
          success: false,
          manual: true,
          message: "Terms of Service is on automatic management. Manual action required.",
          manualInstructions: getManualInstructions(),
          disclosureText: AI_TERMS_TEXT.trim(),
        };
      }

      return {
        success: false,
        message: `Failed to update: ${errorMessage}`,
      };
    }

    return {
      success: true,
      message: "Automated systems disclosure added to Terms",
    };

  } catch (error) {
    const errMsg = error.message || "";

    if (errMsg.toLowerCase().includes("automatic management") ||
        errMsg.toLowerCase().includes("access denied")) {
      return {
        success: false,
        manual: true,
        message: errMsg,
        manualInstructions: getManualInstructions(),
        disclosureText: AI_TERMS_TEXT.trim(),
      };
    }

    return {
      success: false,
      message: `Terms fix failed: ${errMsg}`,
    };
  }
}

// ============================================================
// Manual instructions
// ============================================================
function getManualInstructions() {
  return {
    steps: [
      "Open Shopify Admin → Settings → Policies",
      "Click 'Terms of Service'",
      "If 'Automatic management' is ON, toggle it OFF",
      "Paste the disclosure text below at the end of your terms",
      "Click 'Save'",
    ],
    settingsUrl: "/admin/settings/legal",
    disclosureText: AI_TERMS_TEXT.trim(),
  };
}