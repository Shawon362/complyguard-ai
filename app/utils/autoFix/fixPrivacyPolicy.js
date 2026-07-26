// ============================================================
// AI disclosure text to inject
// ============================================================
const AI_DISCLOSURE_TEXT = `
<h3>How We Use Artificial Intelligence (EU AI Act & GDPR Compliance)</h3>
<p>In accordance with the EU AI Act (Regulation 2024/1689, Article 50) and GDPR, we disclose how we use AI:</p>
<ul>
  <li><strong>AI-generated content:</strong> Some product images may be AI-generated. These are clearly labeled where present.</li>
  <li><strong>Automated systems:</strong> We may use AI for product recommendations, personalized search, and customer service chatbots.</li>
  <li><strong>Data we process:</strong> AI features may use your browsing behavior, purchase history, cart activity, and general location to personalize your experience.</li>
  <li><strong>The logic:</strong> Our recommendation systems analyze products you view and purchase to suggest similar or complementary items.</li>
  <li><strong>Your rights (GDPR Article 22):</strong> You have the right to opt out of AI-driven personalization and automated profiling, to request human review, and to contest automated decisions that significantly affect you.</li>
  <li><strong>How to opt out:</strong> To opt out of AI personalization or request information about our AI systems, please contact us using the details in this policy.</li>
  <li><strong>Data retention:</strong> AI-related data is retained only as long as necessary for the purposes described and in line with our general data retention practices.</li>
</ul>
<p>For more information about the EU AI Act, visit <a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj" target="_blank">EUR-Lex</a>.</p>
`;

// ============================================================
// Fix Privacy Policy — Add AI disclosure
// ============================================================
export async function fixPrivacyPolicy(admin) {
  try {
    // ── Step 1: Get current Privacy Policy ──
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
    const privacyPolicy = policies.find((p) => p.type === "PRIVACY_POLICY");

    if (!privacyPolicy) {
      return {
        success: false,
        manual: true,
        message: "No Privacy Policy found. Please create one in Shopify Admin first.",
        manualInstructions: getManualInstructions(),
      };
    }

    const currentBody = privacyPolicy.body || "";

    // Check if already has AI disclosure
    const hasAI =
      currentBody.toLowerCase().includes("ai-generated") ||
      currentBody.toLowerCase().includes("artificial intelligence") ||
      currentBody.toLowerCase().includes("ai system");

    if (hasAI) {
      return {
        success: true,
        message: "Privacy Policy already has AI disclosure (skipped)",
      };
    }

    // ── Step 2: Try to update via API ──
    const newBody = currentBody + AI_DISCLOSURE_TEXT;

    const updateMutation = await admin.graphql(`
      mutation updatePolicy($shopPolicy: ShopPolicyInput!) {
        shopPolicyUpdate(shopPolicy: $shopPolicy) {
          shopPolicy { id }
          userErrors { field, message }
        }
      }
    `, {
      variables: {
        shopPolicy: {
          type: "PRIVACY_POLICY",
          body: newBody,
        },
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
          message: "Privacy Policy is on automatic management. Manual action required.",
          manualInstructions: getManualInstructions(),
          disclosureText: AI_DISCLOSURE_TEXT.trim(),
        };
      }

      return {
        success: false,
        message: `Failed to update: ${errorMessage}`,
      };
    }

    return {
      success: true,
      message: "AI disclosure added to Privacy Policy",
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
        disclosureText: AI_DISCLOSURE_TEXT.trim(),
      };
    }

    return {
      success: false,
      message: `Privacy Policy fix failed: ${errMsg}`,
    };
  }
}

// ============================================================
// Manual instructions for users
// ============================================================
function getManualInstructions() {
  return {
    steps: [
      "Open Shopify Admin → Settings → Policies",
      "Click 'Privacy Policy'",
      "If 'Automatic management' is ON, toggle it OFF",
      "Paste the AI disclosure text below at the end of your policy",
      "Click 'Save'",
    ],
    settingsUrl: "/admin/settings/legal",
    disclosureText: AI_DISCLOSURE_TEXT.trim(),
  };
}