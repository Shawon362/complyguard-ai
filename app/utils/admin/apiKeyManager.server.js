import OpenAI from "openai";

// ============================================================
// PROVIDER CONFIGURATIONS
// 
// ============================================================
import { PROVIDERS } from "./apiProviders";
export { PROVIDERS };
// ============================================================
// Get all active API keys, sorted by priority
// ============================================================
export async function getActiveKeys() {
  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  return await prisma.apiKey.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
  });
}

// ============================================================
// Get current primary API client
// Returns OpenAI SDK instance with active key
// 
// ============================================================
export async function getApiClient() {
  const activeKeys = await getActiveKeys();

  if (activeKeys.length === 0) {
    const envKey = process.env.OXYY_API_KEY;
    if (!envKey) {
      throw new Error(
        "No API keys configured. Add one via Admin → API Keys."
      );
    }
    return {
      client: new OpenAI({
        apiKey: envKey,
        baseURL: "https://api.oxyy.ai/v1",
      }),
      keyRecord: null,
      modelName: "gemini-2.5-flash",
      isFromEnv: true,
    };
  }

  const primaryKey = activeKeys[0];
  return {
    client: new OpenAI({
      apiKey: primaryKey.apiKey,
      baseURL: primaryKey.baseUrl || PROVIDERS[primaryKey.provider]?.defaultBaseUrl,
    }),
    keyRecord: primaryKey,
    modelName: primaryKey.modelName,
    isFromEnv: false,
  };
}

// ============================================================
// Execute AI call with automatic failover
// 
// Usage:
//   const result = await callWithFailover(async (client, model) => {
//     return await client.chat.completions.create({
//       model,
//       messages: [...],
//     });
//   });
// ============================================================
export async function callWithFailover(callFn) {
  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  const activeKeys = await getActiveKeys();

  // No keys in DB — try env fallback
  if (activeKeys.length === 0) {
    const { client, modelName } = await getApiClient();
    return await callFn(client, modelName);
  }

  // Try each key in priority order
  let lastError = null;

  for (const keyRecord of activeKeys) {
    const baseUrl =
      keyRecord.baseUrl || PROVIDERS[keyRecord.provider]?.defaultBaseUrl;

    if (!baseUrl) {
      console.warn(`>>> Skipping ${keyRecord.name}: no baseUrl`);
      continue;
    }

    try {
      const client = new OpenAI({
        apiKey: keyRecord.apiKey,
        baseURL: baseUrl,
      });

      const result = await callFn(client, keyRecord.modelName);

      // Success — track usage (non-blocking, fire and forget)
    prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: {
        totalCalls: { increment: 1 },
        lastUsedAt: new Date(),
    },
    }).catch((err) => {
    console.error(">>> Tracking update failed (non-critical):", err.message);
    });

    return result;

    } catch (error) {
      lastError = error;
      console.error(`>>> API call failed on ${keyRecord.name}:`, error.message);

    prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: {
        totalErrors: { increment: 1 },
        lastErrorAt: new Date(),
        lastErrorMessage: error.message?.substring(0, 500) || "Unknown error",
    },
    }).catch(() => {
    });

    // Continue to next key
    continue;
    }
  }

  // All keys failed
  throw new Error(
    `All API keys failed. Last error: ${lastError?.message || "Unknown"}`
  );
}

// ============================================================
// Test API key (validate it works)
// ============================================================
export async function testApiKey({ apiKey, baseUrl, modelName }) {
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });

    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: "Say 'OK' in one word." }],
      max_tokens: 10,
    });

    const responseTime = Date.now() - startTime;
    const responseText = response.choices[0]?.message?.content || "";

    return {
      success: true,
      responseTime,
      response: responseText.trim(),
      model: response.model || modelName,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Unknown error",
      errorCode: error.code || error.status || null,
    };
  }
}

// ============================================================
// Get health status of all keys (for dashboard)
// ============================================================
export async function getApiKeysHealth() {
  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  const keys = await prisma.apiKey.findMany({
    orderBy: { priority: "asc" },
  });

  return keys.map((key) => {
    const successRate =
      key.totalCalls > 0
        ? Math.round(((key.totalCalls - key.totalErrors) / key.totalCalls) * 100)
        : null;

    let status = "unknown";
    if (!key.isActive) {
      status = "inactive";
    } else if (key.lastErrorAt && key.lastUsedAt) {
      const errorRecent =
        new Date() - new Date(key.lastErrorAt) < 5 * 60 * 1000;
      const lastSuccess =
        new Date(key.lastUsedAt) > new Date(key.lastErrorAt);

      if (errorRecent && !lastSuccess) status = "error";
      else if (successRate !== null && successRate < 90) status = "warning";
      else status = "healthy";
    } else if (key.lastUsedAt) {
      status = "healthy";
    } else if (key.lastTestSuccess) {
      status = "healthy";
    }

    return {
      ...key,
      apiKey: maskKey(key.apiKey),
      successRate,
      status,
    };
  });
}

export function maskKey(key) {
  if (!key) return "";
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 6)}${"•".repeat(8)}${key.slice(-4)}`;
}