// ============================================================
// Known AI Apps Database
// Each app needs disclosure under EU AI Act Article 50
// ============================================================

export const KNOWN_AI_APPS = [
  {
    handle: "tidio",
    name: "Tidio",
    category: "chatbot",
    aiFeatures: ["AI chatbot", "Lyro AI assistant"],
    riskLevel: "high",
    disclosureRequired: "Chatbot must clearly identify as AI to users",
  },
  {
    handle: "gorgias",
    name: "Gorgias",
    category: "chatbot",
    aiFeatures: ["AI agent", "Auto-responses"],
    riskLevel: "high",
    disclosureRequired: "AI customer support agent must be disclosed",
  },
  {
    handle: "reamaze",
    name: "Re:amaze",
    category: "chatbot",
    aiFeatures: ["AI responses", "Chatbot automation"],
    riskLevel: "high",
    disclosureRequired: "AI-powered support must be disclosed",
  },
  {
    handle: "crisp",
    name: "Crisp",
    category: "chatbot",
    aiFeatures: ["MagicReply AI", "Chatbot"],
    riskLevel: "high",
    disclosureRequired: "AI chat features must be disclosed",
  },
  {
    handle: "shopify-inbox",
    name: "Shopify Inbox",
    category: "chatbot",
    aiFeatures: ["Quick replies AI"],
    riskLevel: "medium",
    disclosureRequired: "Automated reply features should be disclosed",
  },
  {
    handle: "tawk",
    name: "Tawk.to",
    category: "chatbot",
    aiFeatures: ["AI Assist"],
    riskLevel: "medium",
    disclosureRequired: "AI assist feature must be disclosed",
  },
  {
    handle: "zendesk",
    name: "Zendesk",
    category: "chatbot",
    aiFeatures: ["Answer Bot AI"],
    riskLevel: "high",
    disclosureRequired: "AI-powered answers must be disclosed",
  },
  {
    handle: "intercom",
    name: "Intercom",
    category: "chatbot",
    aiFeatures: ["Fin AI Agent"],
    riskLevel: "high",
    disclosureRequired: "Fin AI agent must identify as AI",
  },

  // ── AI RECOMMENDATIONS (automated decisions) ──
  {
    handle: "klaviyo-email-marketing",
    name: "Klaviyo",
    category: "ai_recommendations",
    aiFeatures: ["AI segmentation", "Predictive analytics"],
    riskLevel: "medium",
    disclosureRequired: "AI-driven email targeting must be disclosed",
  },
  {
    handle: "searchanise",
    name: "Searchanise",
    category: "ai_recommendations",
    aiFeatures: ["AI search", "Personalized results"],
    riskLevel: "medium",
    disclosureRequired: "AI-powered search results must be disclosed",
  },
  {
    handle: "rebuy",
    name: "Rebuy",
    category: "ai_recommendations",
    aiFeatures: ["AI personalization"],
    riskLevel: "medium",
    disclosureRequired: "AI recommendations must be disclosed in Privacy Policy",
  },
  {
    handle: "wiser",
    name: "Wiser",
    category: "ai_recommendations",
    aiFeatures: ["AI product recommendations"],
    riskLevel: "medium",
    disclosureRequired: "AI-driven product recommendations must be disclosed",
  },
  {
    handle: "limespot",
    name: "LimeSpot Personalizer",
    category: "ai_recommendations",
    aiFeatures: ["AI personalization engine"],
    riskLevel: "medium",
    disclosureRequired: "AI personalization must be disclosed",
  },
  {
    handle: "nosto",
    name: "Nosto",
    category: "ai_recommendations",
    aiFeatures: ["AI product recommendations", "Personalization"],
    riskLevel: "medium",
    disclosureRequired: "AI personalization must be disclosed",
  },

  // ── AI WRITING (content generation) ──
  {
    handle: "shopify-magic",
    name: "Shopify Magic",
    category: "ai_writing",
    aiFeatures: ["AI product descriptions", "AI emails"],
    riskLevel: "medium",
    disclosureRequired: "AI-generated content must be disclosed",
  },
  {
    handle: "jasper",
    name: "Jasper AI",
    category: "ai_writing",
    aiFeatures: ["AI content generation"],
    riskLevel: "medium",
    disclosureRequired: "AI-written content must be marked",
  },
  {
    handle: "copy-ai",
    name: "Copy.ai",
    category: "ai_writing",
    aiFeatures: ["AI copywriting"],
    riskLevel: "medium",
    disclosureRequired: "AI-generated copy must be disclosed",
  },

  // ── AI IMAGES (image generation) ──
  {
    handle: "shopify-collabs",
    name: "Shopify Collabs",
    category: "ai_images",
    aiFeatures: ["AI image creation"],
    riskLevel: "high",
    disclosureRequired: "AI-generated images must be labeled",
  },
  {
    handle: "claid",
    name: "Claid.ai",
    category: "ai_images",
    aiFeatures: ["AI image enhancement", "Background removal"],
    riskLevel: "medium",
    disclosureRequired: "AI-edited images should be disclosed",
  },
  {
    handle: "pixelcut",
    name: "Pixelcut",
    category: "ai_images",
    aiFeatures: ["AI image editing"],
    riskLevel: "medium",
    disclosureRequired: "AI-edited product images should be disclosed",
  },

  // ── REVIEWS / SOCIAL PROOF ──
  {
    handle: "judgeme",
    name: "Judge.me",
    category: "ai_recommendations",
    aiFeatures: ["AI review summarization"],
    riskLevel: "low",
    disclosureRequired: "AI review summaries should be marked",
  },
  {
    handle: "loox",
    name: "Loox",
    category: "ai_recommendations",
    aiFeatures: ["AI review insights"],
    riskLevel: "low",
    disclosureRequired: "AI review features should be disclosed",
  },

  // ── EMAIL MARKETING ──
  {
    handle: "omnisend",
    name: "Omnisend",
    category: "ai_recommendations",
    aiFeatures: ["AI subject line", "Send time AI"],
    riskLevel: "low",
    disclosureRequired: "AI email optimization should be disclosed",
  },
  {
    handle: "privy",
    name: "Privy",
    category: "ai_recommendations",
    aiFeatures: ["AI popup optimization"],
    riskLevel: "low",
    disclosureRequired: "AI optimization should be disclosed",
  },
];

// ============================================================
// Helper: Match installed app to known AI app
// ============================================================
export function matchAIApp(installedAppHandle, installedAppName) {
  const handle = (installedAppHandle || "").toLowerCase();
  const name = (installedAppName || "").toLowerCase();

  // Try exact handle match
  const handleMatch = KNOWN_AI_APPS.find(
    (app) => handle.includes(app.handle) || app.handle.includes(handle)
  );
  if (handleMatch) return handleMatch;

  // Try name match
  const nameMatch = KNOWN_AI_APPS.find(
    (app) => name.includes(app.name.toLowerCase()) || app.name.toLowerCase().includes(name)
  );
  return nameMatch || null;
}

// ============================================================
// Helper: Get category-specific severity
// ============================================================
export function getAIAppSeverity(riskLevel) {
  switch (riskLevel) {
    case "high": return "high";
    case "medium": return "medium";
    case "low": return "low";
    default: return "medium";
  }
}

// ============================================================
// Helper: Generate fix text for AI app issue
// ============================================================
export function generateAIAppFix(app) {
  return `Add to your Privacy Policy:

"We use ${app.name} (${app.aiFeatures.join(", ")}) to enhance customer experience. ${app.disclosureRequired}

This use of AI complies with EU AI Act Article 50 disclosure requirements."

Additionally:
${app.category === "chatbot" ? '• Add a clear notice in chat: "You are talking to an AI assistant"' : ""}
${app.category === "ai_recommendations" ? '• Disclose AI personalization in your Terms of Service' : ""}
${app.category === "ai_writing" ? '• Mark AI-generated product descriptions appropriately' : ""}
${app.category === "ai_images" ? '• Label AI-generated/edited images in product pages' : ""}`;
}