// ============================================================
// Plans Data
// ============================================================
export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Try out compliance scanning",
    cta: "Current Plan",
    popular: false,
    features: [
      { text: "1 scan per month", included: true },
      { text: "50 products per scan", included: true },
      { text: "50 AI image analyses", included: true },
      { text: "View detected issues", included: true },
      { text: "Compliance grade", included: true },
      { text: "3 free Auto-Fixes per scan", included: true },
      { text: "Unlimited Auto-Fix", included: false },
      { text: "PDF report", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    period: "month",
    description: "For active stores",
    cta: "Upgrade",
    popular: true,
    features: [
      { text: "3 scans per month", included: true },
      { text: "1,000 products per scan", included: true },
      { text: "1,000 AI image analyses", included: true },
      { text: "View detected issues", included: true },
      { text: "Compliance grade", included: true },
      { text: "Unlimited Auto-Fix", included: true },
      { text: "PDF report export", included: true },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 29.99,
    period: "month",
    description: "For serious brands",
    cta: "Upgrade",
    popular: false,
    features: [
      { text: "15 scans per month", included: true },
      { text: "Unlimited products", included: true },
      { text: "Unlimited AI image analyses", included: true },
      { text: "View detected issues", included: true },
      { text: "Compliance grade", included: true },
      { text: "Unlimited Auto-Fix", included: true },
      { text: "PDF report export", included: true },
      { text: "Priority email support", included: true },
    ],
  },
];

// ============================================================
// FAQs
// ============================================================
export const FAQS = [
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. Changes take effect immediately.",
  },
  {
    q: "How do free Auto-Fixes work?",
    a: "On the Free plan, you can use Auto-Fix on your top 3 most critical issues per scan — completely free. This lets you experience the magic of one-click fixes before deciding to upgrade. To fix all issues automatically, upgrade to Starter or Growth.",
  },
  {
    q: "What happens if I have more than 50 products on the Free plan?",
    a: "On the Free plan, scans cover the first 50 products in your catalog. Upgrade to Starter or Growth to scan more products at once.",
  },
  {
    q: "Is 'Unlimited' really unlimited?",
    a: "Growth plan covers practically unlimited products and images for the vast majority of stores. For very large catalogs (5000+ products), please contact us for custom enterprise pricing.",
  },
  {
    q: "What if I exceed my scan limit?",
    a: "You'll get a notification before hitting the limit. Upgrade anytime to continue.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, 7-day money-back guarantee on all paid plans.",
  },
];