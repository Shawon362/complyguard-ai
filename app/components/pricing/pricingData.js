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
      { text: "View detected issues", included: true },
      { text: "Compliance grade", included: true },
      { text: "Auto-Fix", included: false },
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
      { text: "View detected issues", included: true },
      { text: "Compliance grade", included: true },
      { text: "Auto-Fix", included: true, badge: "Coming Soon" },
      { text: "PDF report", included: true },
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
      { text: "View detected issues", included: true },
      { text: "Compliance grade", included: true },
      { text: "Auto-Fix", included: true, badge: "Coming Soon" },
      { text: "PDF report + priority support", included: true },
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
    q: "What is Auto-Fix?",
    a: "One-click application of recommended disclaimers and fixes to your store. Launching soon.",
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