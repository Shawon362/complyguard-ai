// ============================================================
// AI disclosure text to inject
// ============================================================
const AI_DISCLOSURE_TEXT = `

<h3>AI Technology Disclosure (EU AI Act Compliance)</h3>
<p>In accordance with the EU AI Act (Regulation 2024/1689, Article 50), we disclose the following:</p>
<ul>
  <li>This store may use AI-generated product images, which are clearly labeled when present.</li>
  <li>We may use automated recommendation systems and AI-powered chatbots for customer service.</li>
  <li>You can request information about any AI systems used in our customer interactions by contacting us.</li>
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