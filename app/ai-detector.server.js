import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OXYY_API_KEY,
  baseURL: "https://api.oxyy.ai/v1",
});

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
            text: `Analyze this product image and answer 3 questions. JSON only.
                    Q1: Does this image contain PEOPLE (human faces/bodies)? (true/false)
                    Q2: Does this image contain visible TEXT? (true/false)
                    Q3: Looking at the image, do you see ANY signs that suggest it could be AI-generated? Signs include:
                    - Unusual smoothness in skin or hair
                    - Slightly distorted text or labels
                    - Background elements that look soft/dreamy
                    - Overall "too perfect" rendered look
                    - Surreal or impossible scenes
                    (true if you see ANY suspicious sign, false if it looks clearly real)

                    Return JSON:
                    {"hasPeople":true,"hasText":true,"hasAISigns":true,"observations":"brief description of what you see"}`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${imgData.contentType};base64,${imgData.base64}` },
          },
        ],
      }],
      temperature: 0,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);
    console.log(">>> Result:", JSON.stringify(result));
    const shouldFlag = result.hasPeople || result.hasAISigns;

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
    return {
      success: true,
      isAI: true,
      confidence: result.hasAISigns ? 0.7 : 0.5,
      reasoning: result.observations || "Image needs merchant verification",
      indicators,
      needsReview: true,
    };
  } catch (error) {
    console.error(">>> FAILED:", error.message);
    return { success: false, isAI: false, confidence: 0, reasoning: "Failed: " + error.message, indicators: [], needsReview: false };
  }
}

export async function analyzeImages(images) {
  const results = [];
  const BATCH_SIZE = 3;

  console.log(`>>> Batch analysis: ${images.length} images`);

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (image) => {
      try {
        const result = await analyzeImage(image.url);
        return { ...result, imageUrl: image.url, productTitle: image.productTitle };
      } catch (error) {
        return { success: false, isAI: false, confidence: 0, reasoning: "Skipped", indicators: [], needsReview: false, imageUrl: image.url, productTitle: image.productTitle };
      }
    });
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    console.log(`>>> ${results.length}/${images.length} done. Flagged: ${results.filter(r => r.isAI).length}`);
    if (i + BATCH_SIZE < images.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`>>> FINAL: Flagged ${results.filter(r => r.isAI).length}/${results.length}`);
  return results;
}