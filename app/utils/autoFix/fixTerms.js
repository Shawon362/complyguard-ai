// ============================================================
// Fix Terms of Service — Inject automated systems disclosure
// ============================================================
export async function fixTerms(admin) {
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
  const termsPolicy = policies.find((p) => p.type === "TERMS_OF_SERVICE");

  if (!termsPolicy) {
    return { 
      success: false, 
      message: "No Terms of Service exists. Please create one first in Shopify Settings." 
    };
  }

  // Skip if already has automated disclosure
  const currentBody = (termsPolicy.body || "").toLowerCase();
  if (currentBody.includes("automated") || currentBody.includes("artificial intelligence")) {
    return { 
      success: false, 
      message: "Terms of Service already contains automated systems disclosure" 
    };
  }

  // Disclosure text to inject
  const aiDisclosure = `

<h3>Automated Systems and Artificial Intelligence</h3>
<p>We use automated systems and artificial intelligence to provide product recommendations, personalized shopping experiences, and customer support. By using our service, you acknowledge the use of these automated systems in accordance with the EU AI Act.</p>
`;

  // Append to existing policy
  const updatedBody = (termsPolicy.body || "") + aiDisclosure;

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
        type: "TERMS_OF_SERVICE", 
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
    message: "Terms of Service updated with AI disclosure" 
  };
}