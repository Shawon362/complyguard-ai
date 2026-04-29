// ============================================================
// Scan storefront for AI apps (chatbots, recommenders)
// ============================================================
export async function scanAIApps(admin, shop) {
  const detectedApps = [];

  try {
    const { KNOWN_AI_APPS } = await import("../../ai-apps-database");
    try {
      const scriptResp = await admin.graphql(`
        query { scriptTags(first: 50) { nodes { src } } }
      `);
      const scriptData = await scriptResp.json();
      const scriptTags = scriptData.data?.scriptTags?.nodes || [];

      for (const tag of scriptTags) {
        const src = (tag.src || "").toLowerCase();
        for (const aiApp of KNOWN_AI_APPS) {
          const handleNorm = aiApp.handle.replace(/-/g, "");
          const nameNorm = aiApp.name.toLowerCase().replace(/[\s.]/g, "");
          if (src.includes(aiApp.handle) || src.includes(handleNorm) || src.includes(nameNorm)) {
            if (!detectedApps.find((a) => a.handle === aiApp.handle)) {
              detectedApps.push({ ...aiApp, source: "script_tag" });
            }
          }
        }
      }
      console.log(`>>> Script tags scanned: ${scriptTags.length}, detected: ${detectedApps.length}`);
    } catch (e) {
      console.log(">>> ScriptTags query failed:", e.message);
    }

    // ── Method 2: Theme settings ──
    try {
      const themeResp = await admin.graphql(`
        query {
          themes(first: 1, roles: MAIN) {
            nodes {
              id
              files(filenames: ["config/settings_data.json"], first: 1) {
                nodes {
                  body { ... on OnlineStoreThemeFileBodyText { content } }
                }
              }
            }
          }
        }
      `);
      const themeData = await themeResp.json();
      const themeFiles = themeData.data?.themes?.nodes?.[0]?.files?.nodes || [];
      const settingsContent = (themeFiles[0]?.body?.content || "").toLowerCase();

      for (const aiApp of KNOWN_AI_APPS) {
        const handleNorm = aiApp.handle.replace(/-/g, "");
        const nameNorm = aiApp.name.toLowerCase().replace(/[\s.]/g, "");
        if (settingsContent.includes(aiApp.handle) || settingsContent.includes(handleNorm) || settingsContent.includes(nameNorm)) {
          if (!detectedApps.find((a) => a.handle === aiApp.handle)) {
            detectedApps.push({ ...aiApp, source: "theme_embed" });
          }
        }
      }
      console.log(`>>> Theme scanned, total: ${detectedApps.length}`);
    } catch (e) {
      console.log(">>> Theme query failed:", e.message);
    }

    // ── Method 3: Storefront HTML (fallback) ──
    try {
      const storefrontUrl = `https://${shop}/?_pf=1`;
      console.log(`>>> Fetching storefront: ${storefrontUrl}`);

      const response = await fetch(storefrontUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 ComplyGuardBot" },
      });

      console.log(`>>> Storefront response status: ${response.status}`);

      if (response.ok) {
        const html = await response.text();
        const htmlLower = html.toLowerCase();
        console.log(`>>> Storefront HTML length: ${html.length} chars`);

        for (const aiApp of KNOWN_AI_APPS) {
          const searchTerms = [
            aiApp.handle,
            aiApp.handle.replace(/-/g, ""),
            aiApp.name.toLowerCase().replace(/[\s.]/g, ""),
            aiApp.name.toLowerCase(),
          ];

          const found = searchTerms.some((term) => term && htmlLower.includes(term));
          if (found && !detectedApps.find((a) => a.handle === aiApp.handle)) {
            detectedApps.push({ ...aiApp, source: "storefront_html" });
          }
        }
      }
    } catch (error) {
      console.log(">>> Storefront fetch failed:", error.message);
    }
  } catch (error) {
    console.error(">>> AI app scan failed:", error.message);
  }

  console.log(`>>> FINAL: ${detectedApps.length} AI apps detected`);
  return detectedApps;
}