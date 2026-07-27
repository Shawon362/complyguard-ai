// ============================================================
// Public API — Receive cookie consent from storefront banner
// Saves to ConsentLog table (GDPR proof-of-consent)
// ============================================================
import prisma from "../db.server";

// Handle CORS preflight
export const loader = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
};

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await request.json();
    const shop = body.shop || "unknown";

    const country =
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-shopify-country") ||
      body.country ||
      null;

    await prisma.consentLog.create({
      data: {
        shop: shop,
        necessary: true,
        analytics: body.analytics === true,
        marketing: body.marketing === true,
        consentType: body.consentType || "custom",
        country: country,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.log(">>> Consent log error:", error.message);
    return jsonResponse({ error: "Failed to log consent" }, 500);
  }
};

// Helper: CORS headers (allow storefront to call)
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Helper: JSON response with CORS
function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}