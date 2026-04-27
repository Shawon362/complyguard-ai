// ============================================================
// Fix Privacy Policy — Inject AI disclosure text
// ============================================================
export async function fixPrivacyPolicy(admin) {
  // Get current policy
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
      message: "No Privacy Policy exists. Please create one first in Shopify Settings." 
    };
  }

  // Skip if already has AI disclosure
  const currentBody = (privacyPolicy.body || "").toLowerCase();
  if (currentBody.includes("artificial intelligence") || currentBody.includes("ai-generated")) {
    return { 
      success: false, 
      message: "Privacy Policy already contains AI disclosure" 
    };
  }

  // AI disclosure text to inject
  const aiDisclosure = `

<h3>Use of Artificial Intelligence (AI)</h3>
<p>We use artificial intelligence (AI) technologies to enhance your shopping experience, including AI-generated product visualizations, automated product recommendations, and AI-powered customer support. These systems operate in accordance with the EU AI Act (Regulation 2024/1689). You have the right to request information about automated decision-making that affects you.</p>
`;

  // Append to existing policy
  const updatedBody = (privacyPolicy.body || "") + aiDisclosure;

  // Update via mutation
  const updateMutation = await admin.graphql(`
    mutation shopPolicyUpdate($shopPolicy: ShopPolicyInput!) {
      shopPolicyUpdate(shopPolicy: $shopPolicy) {
        shopPolicy { type body }
        userErrors { field message }
      }
    }
  `, {
    variables: {
      shopPolicy: { 
        type: "PRIVACY_POLICY", 
        body: updatedBody 
      },
    },
  });

  const updateResult = await updateMutation.json();
  const errors = updateResult.data?.shopPolicyUpdate?.userErrors;

  if (errors && errors.length > 0) {
    return { success: false, message: errors[0].message };
  }

  return { 
    success: true, 
    message: "Privacy Policy updated with AI disclosure" 
  };
}