// ============================================================
// Shopify Billing Utility
// Handles subscription create, verify, cancel
// ============================================================

// Plan configuration
export const BILLING_PLANS = {
  starter: {
    name: "Starter",
    price: 9.99,
    interval: "EVERY_30_DAYS",
    description: "3 scans/month, Auto-Fix, 1000 products",
  },
  growth: {
    name: "Growth",
    price: 29.99,
    interval: "EVERY_30_DAYS",
    description: "15 scans/month, Unlimited Auto-Fix, Priority support",
  },
};

// ============================================================
// Create Subscription — User clicks "Upgrade"
// Returns confirmationUrl to redirect user
// ============================================================
export async function createSubscription(admin, planKey, returnUrl) {
  const plan = BILLING_PLANS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan: ${planKey}`);
  }

  const isTestMode = process.env.NODE_ENV !== "production";

  const mutation = `
    mutation CreateSubscription(
      $name: String!
      $returnUrl: URL!
      $lineItems: [AppSubscriptionLineItemInput!]!
      $test: Boolean
    ) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        lineItems: $lineItems
        test: $test
      ) {
        confirmationUrl
        appSubscription {
          id
          name
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    name: `ComplyGuard AI — ${plan.name}`,
    returnUrl,
    test: isTestMode,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: plan.price, currencyCode: "USD" },
            interval: plan.interval,
          },
        },
      },
    ],
  };

  const response = await admin.graphql(mutation, { variables });
  const result = await response.json();

  const data = result.data?.appSubscriptionCreate;
  const errors = data?.userErrors || [];

  if (errors.length > 0) {
    throw new Error(`Billing error: ${errors[0].message}`);
  }

  return {
    confirmationUrl: data.confirmationUrl,
    subscriptionId: data.appSubscription?.id,
    test: isTestMode,
  };
}

// ============================================================
// Get Active Subscriptions — Check if user has active subscription
// ============================================================
export async function getActiveSubscriptions(admin) {
  const query = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          test
          createdAt
          currentPeriodEnd
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price { amount currencyCode }
                  interval
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const result = await response.json();

  return result.data?.currentAppInstallation?.activeSubscriptions || [];
}

// ============================================================
// Cancel Subscription
// ============================================================
export async function cancelSubscription(admin, subscriptionId) {
  const mutation = `
    mutation CancelSubscription($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: { id: subscriptionId },
  });
  const result = await response.json();

  const errors = result.data?.appSubscriptionCancel?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(`Cancel error: ${errors[0].message}`);
  }

  return result.data?.appSubscriptionCancel?.appSubscription;
}

// ============================================================
// Map subscription name to plan key
// ============================================================
export function getPlanKeyFromSubscriptionName(name) {
  if (!name) return "free";
  const lowered = name.toLowerCase();
  if (lowered.includes("starter")) return "starter";
  if (lowered.includes("growth")) return "growth";
  return "free";
}