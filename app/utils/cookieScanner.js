// ============================================================
// Cookie / Tracker Scanner
// Fetches storefront HTML and detects known tracking scripts.
// ============================================================

const TRACKERS = [
  { name: "Google Analytics", category: "Analytics", signatures: ["google-analytics.com", "gtag(", "ga('create'", "googletagmanager.com/gtag"] },
  { name: "Google Tag Manager", category: "Analytics", signatures: ["googletagmanager.com/gtm", "dataLayer.push"] },
  { name: "Facebook Pixel", category: "Marketing", signatures: ["connect.facebook.net", "fbq(", "facebook-jssdk"] },
  { name: "TikTok Pixel", category: "Marketing", signatures: ["analytics.tiktok.com", "ttq.load", "ttq.track"] },
  { name: "Pinterest Tag", category: "Marketing", signatures: ["pintrk(", "pinterest.com/ct"] },
  { name: "Snapchat Pixel", category: "Marketing", signatures: ["sc-static.net", "snaptr("] },
  { name: "Microsoft Clarity", category: "Analytics", signatures: ["clarity.ms", "clarity("] },
  { name: "Hotjar", category: "Analytics", signatures: ["hotjar.com", "hj("] },
  { name: "Klaviyo", category: "Marketing", signatures: ["klaviyo.com", "klaviyo.js", "_learnq"] },
  { name: "Twitter/X Pixel", category: "Marketing", signatures: ["static.ads-twitter.com", "twq("] },
  { name: "LinkedIn Insight", category: "Marketing", signatures: ["snap.licdn.com", "_linkedin_partner_id"] },
  { name: "Criteo", category: "Marketing", signatures: ["criteo.com", "criteo_q"] },
];

// ============================================================
// Scan a storefront URL for known trackers
// ============================================================
export async function scanStoreForTrackers(storeUrl) {
  const url = storeUrl.startsWith("http") ? storeUrl : "https://" + storeUrl;

  let html = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ComplyGuardBot/1.0)" },
    });
    html = await res.text();
  } catch (error) {
    return { success: false, error: "Could not reach store: " + error.message, trackers: [] };
  }

  const found = [];
  for (const tracker of TRACKERS) {
    const match = tracker.signatures.some((sig) => html.indexOf(sig) !== -1);
    if (match) {
      found.push({ name: tracker.name, category: tracker.category });
    }
  }

  return {
    success: true,
    trackers: found,
    scannedUrl: url,
    scannedAt: new Date().toISOString(),
  };
}