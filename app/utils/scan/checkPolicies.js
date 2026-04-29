// ============================================================
// Check store policies (Privacy, Terms, Refund)
// ============================================================
export async function checkPolicies(admin) {
  try {
    const response = await admin.graphql(`
      query {
        shop {
          shopPolicies {
            type
            body
          }
        }
      }
    `);

    const data = await response.json();
    const policies = data.data?.shop?.shopPolicies || [];

    const privacyPolicy = policies.find((p) => p.type === "PRIVACY_POLICY");
    const termsPolicy = policies.find((p) => p.type === "TERMS_OF_SERVICE");
    const refundPolicy = policies.find((p) => p.type === "REFUND_POLICY");

    return {
      privacy: !!privacyPolicy,
      privacyBody: privacyPolicy?.body || "",
      terms: !!termsPolicy,
      termsBody: termsPolicy?.body || "",
      refund: !!refundPolicy,
    };
  } catch (error) {
    console.error("Policy check failed:", error.message);
    return {
      privacy: false,
      privacyBody: "",
      terms: false,
      termsBody: "",
      refund: false,
    };
  }
}