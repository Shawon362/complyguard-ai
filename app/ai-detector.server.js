import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OXYY_API_KEY,
  baseURL: "https://api.oxyy.ai/v1",
});

// ============================================================
// CACHE HELPERS — Image analysis cache
// ============================================================

const CACHE_VALID_DAYS = 30;

async function getCachedAnalysis(prisma, shop, imageUrl) {
  if (!prisma || !shop || !imageUrl) return null;

  try {
    const cached = await prisma.analyzedImage.findUnique({
      where: {
        shop_imageUrl: { shop, imageUrl },
      },
    });

    if (!cached) return null;

    const cacheAge = Date.now() - new Date(cached.analyzedAt).getTime();
    const maxAge = CACHE_VALID_DAYS * 24 * 60 * 60 * 1000;

    if (cacheAge > maxAge) {
      console.log(`>>> Cache expired for ${imageUrl.substring(0, 60)}... (re-analyzing)`);
      return null;
    }

    // Update lastSeenAt timestamp
    await prisma.analyzedImage.update({
      where: { id: cached.id },
      data: { lastSeenAt: new Date() },
    });

    console.log(`>>> Cache HIT: ${imageUrl.substring(0, 60)}...`);

    return {
      success: true,
      isAI: cached.isAI,
      confidence: cached.confidence,
      reasoning: cached.reasoning || "",
      hasPeople: cached.hasPeople,
      hasText: cached.hasText,
      hasAISigns: cached.hasAISigns,
      indicators: buildIndicators(cached.hasPeople, cached.hasText, cached.hasAISigns),
      fromCache: true,
    };
  } catch (error) {
    console.error("Cache lookup failed:", error.message);
    return null;
  }
}

// Save analysis result to cache
async function saveCacheResult(prisma, shop, imageUrl, result) {
  if (!prisma || !shop || !imageUrl || !result?.success) return;

  try {
    await prisma.analyzedImage.upsert({
      where: {
        shop_imageUrl: { shop, imageUrl },
      },
      update: {
        isAI: result.isAI || false,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || "",
        hasPeople: result.hasPeople || false,
        hasText: result.hasText || false,
        hasAISigns: result.hasAISigns || false,
        analyzedAt: new Date(),
        lastSeenAt: new Date(),
      },
      create: {
        shop,
        imageUrl,
        isAI: result.isAI || false,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || "",
        hasPeople: result.hasPeople || false,
        hasText: result.hasText || false,
        hasAISigns: result.hasAISigns || false,
      },
    });
  } catch (error) {
    console.error("Cache save failed:", error.message);
  }
}

// Build indicators array from boolean flags
function buildIndicators(hasPeople, hasText, hasAISigns) {
  const indicators = [];
  if (hasPeople) indicators.push("Contains people (verify if AI-generated)");
  if (hasAISigns) indicators.push("Possible AI signs detected");
  if (hasText) indicators.push("Contains text (verify authenticity)");
  return indicators;
}

// ============================================================
// ROBUST JSON PARSER — Handles Gemini's malformed responses
// ============================================================
function parseGeminiJSON(rawContent) {
  if (!rawContent) return null;

  let cleaned = rawContent.trim();

  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  cleaned = cleaned.replace(/^```json\n?/i, "").replace(/^```\n?/, "");
  cleaned = cleaned
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return parseTruncatedJSON(cleaned);
  }
  let jsonStr = jsonMatch[0];

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Continue
  }

  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Continue
  }

  return parseTruncatedJSON(jsonStr);
}

// Manual extraction for malformed/truncated JSON
function parseTruncatedJSON(text) {
  try {
    const result = {};

    const peopleMatch = text.match(/"hasPeople"\s*:\s*(true|false)/i);
    if (peopleMatch) result.hasPeople = peopleMatch[1].toLowerCase() === "true";

    const textMatch = text.match(/"hasText"\s*:\s*(true|false)/i);
    if (textMatch) result.hasText = textMatch[1].toLowerCase() === "true";

    const aiMatch = text.match(/"hasAISigns"\s*:\s*(true|false)/i);
    if (aiMatch) result.hasAISigns = aiMatch[1].toLowerCase() === "true";

    const obsMatch = text.match(/"observations"\s*:\s*"([^"]*)/);
    if (obsMatch) result.observations = obsMatch[1];

    // ── PRIMARY: hasAISigns explicitly found ──
    if (typeof result.hasAISigns === "boolean") {
      result.hasPeople = result.hasPeople ?? false;
      result.hasText = result.hasText ?? false;
      result.observations = result.observations || "Recovered from malformed JSON";
      return result;
    }

    // ── FALLBACK: Truncated before hasAISigns reached ──
    // If we got hasPeople OR hasText, the response was real but cut short
    // Default hasAISigns=false (safer — don't false-flag innocent images)
    if (typeof result.hasPeople === "boolean" || typeof result.hasText === "boolean") {
      console.log(">>> Recovered (truncated, defaulting hasAISigns=false)");
      return {
        hasPeople: result.hasPeople ?? false,
        hasText: result.hasText ?? false,
        hasAISigns: false,
        observations: "Response truncated — defaulted to no AI signs detected",
      };
    }
  } catch (e) {
    // Final fallback
  }

  return null;
}

async function imageToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { success: true, base64, contentType };
  } catch (error) {
    return { success: false };
  }
}

function optimizeUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("cdn.shopify.com")) {
      u.searchParams.set("width", "1200");
    }
    return u.toString();
  } catch { return url; }
}

async function analyzeImage(imageUrl) {
  try {
    const optimized = optimizeUrl(imageUrl);
    console.log(">>> Analyzing:", optimized.substring(0, 100));

    const imgData = await imageToBase64(optimized);
    if (!imgData.success) {
      return { success: false, isAI: false, confidence: 0, reasoning: "Download failed", indicators: [], needsReview: false };
    }

    const response = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this product image carefully. Return JSON only.

              You must distinguish between:
              - REAL photographs (including professional product photography with studio lighting)
              - ACTUAL AI-generated images (created by tools like Midjourney, DALL-E, Stable Diffusion)

              IMPORTANT: Professional product photos often have:
              - Smooth lighting (this is NORMAL, not AI)
              - Clean backgrounds (this is NORMAL, not AI)
              - Sharp focus and high quality (this is NORMAL, not AI)
              - Studio setup appearance (this is NORMAL, not AI)

              DO NOT flag as AI just because:
              - Image looks polished or professional
              - Studio photography setup
              - Clean white/colored background
              - High-quality product shots
              - Normal advertising photography

              ONLY flag as AI-generated if you see CLEAR signs:
              - Distorted or melted text/numbers (very common AI failure)
              - Unnaturally smooth/airbrushed skin (uncanny valley)
              - Extra/missing fingers or limbs
              - Impossible physics (objects floating, melting)
              - Surreal/dreamlike scenes that couldn't be photographed
              - Inconsistent lighting (shadows from multiple impossible directions)
              - Garbled details in background (AI struggles with backgrounds)
              - Identifiable AI art style (Midjourney/DALL-E aesthetic)

              Q1: Does this contain PEOPLE? (true/false)
              Q2: Does this contain visible TEXT? (true/false)
              Q3: Are there CLEAR signs of AI generation (not just "too polished")? (true/false)

              Return JSON only:
              {"hasPeople":true,"hasText":true,"hasAISigns":true,"observations":"specific reason if AI signs detected, OR 'real photograph' if no AI signs"}`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${imgData.contentType};base64,${imgData.base64}` },
          },
        ],
      }],
      temperature: 0,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    const result = parseGeminiJSON(content);

    if (!result) {
      console.log(">>> FAILED: Could not parse JSON, raw:", content.substring(0, 150));
      return {
        success: false,
        isAI: false,
        confidence: 0,
        reasoning: "JSON parse failed",
        indicators: [],
        needsReview: false,
      };
    }

    console.log(">>> Result:", JSON.stringify(result));
    const shouldFlag = result.hasAISigns;

    if (!shouldFlag) {
      console.log(">>> Real photo (no people, no AI signs)");
      return { 
        success: true, 
        isAI: false, 
        confidence: 0, 
        reasoning: "No suspicious indicators", 
        indicators: [],
        needsReview: false 
      };
    }

    // Flagged — needs merchant review
    const indicators = [];
    if (result.hasPeople) indicators.push("Contains people (verify if AI-generated)");
    if (result.hasAISigns) indicators.push("Possible AI signs detected");
    if (result.hasText) indicators.push("Contains text (verify authenticity)");

    console.log(">>> Flagged for merchant review");
    let confidence = 0.6;
    if (result.hasAISigns) confidence += 0.15;
    if (result.hasAISigns && result.hasPeople) confidence += 0.10;
    if (result.hasAISigns && result.hasText) confidence += 0.10;
    if (confidence > 0.95) confidence = 0.95;

    return {
      success: true,
      isAI: true,
      confidence,
      reasoning: result.observations || "Image needs merchant verification",
      indicators,
      needsReview: true,
    };
  } catch (error) {
    console.error(">>> FAILED:", error.message);
    return { success: false, isAI: false, confidence: 0, reasoning: "Failed: " + error.message, indicators: [], needsReview: false };
  }
}

export async function analyzeImages(images, shop = null, prisma = null, onProgress = null) {
  const results = [];
  const BATCH_SIZE = 3;
  let cacheHits = 0;
  let freshAnalyses = 0;

  console.log(`>>> Batch analysis: ${images.length} images (shop: ${shop || "no-cache"})`);

  // ── Step 1: Separate cached vs uncached images ──
  const uncachedImages = [];
  const cachedResults = [];

  if (shop && prisma) {
    for (const image of images) {
      const cached = await getCachedAnalysis(prisma, shop, image.url);
      if (cached) {
        cachedResults.push({
          ...cached,
          imageUrl: image.url,
          productTitle: image.productTitle,
        });
        cacheHits++;

        // Report progress for cached results
        if (onProgress) {
          try {
            await onProgress(cachedResults.length, images.length);
          } catch (e) {
            // Silent fail
          }
        }

        if (cached.isAI) {
          console.log(`>>> Cached: Flagged ${image.productTitle}`);
        }
      } else {
        uncachedImages.push(image);
      }
    }
  } else {
    uncachedImages.push(...images);
  }

  // Add cached results immediately
  results.push(...cachedResults);

  console.log(`>>> Cache: ${cacheHits} hits, ${uncachedImages.length} need fresh analysis`);
  for (let i = 0; i < uncachedImages.length; i += BATCH_SIZE) {
    const batch = uncachedImages.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (image) => {
      try {
        const result = await analyzeImage(image.url);
        const fullResult = {
          ...result,
          imageUrl: image.url,
          productTitle: image.productTitle,
        };

        if (shop && prisma && result.success) {
          await saveCacheResult(prisma, shop, image.url, result);
        }

        return fullResult;
      } catch (error) {
        return {
          success: false,
          isAI: false,
          confidence: 0,
          reasoning: "Skipped",
          indicators: [],
          needsReview: false,
          imageUrl: image.url,
          productTitle: image.productTitle,
        };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    freshAnalyses += batch.length;

    console.log(`>>> ${results.length}/${images.length} done. Flagged: ${results.filter(r => r.isAI).length}`);

    if (onProgress) {
    try {
      await onProgress(results.length, images.length);
    } catch (e) {
      console.error("Progress callback failed:", e.message);
    }
    }

    if (i + BATCH_SIZE < uncachedImages.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`>>> Cache stats: ${cacheHits} hits, ${freshAnalyses} fresh`);
  console.log(`>>> FINAL: Flagged ${results.filter(r => r.isAI).length}/${results.length}`);

  return results;
}