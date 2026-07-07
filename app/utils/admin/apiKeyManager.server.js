import OpenAI from "openai";
import { PROVIDERS } from "./apiProviders";
export { PROVIDERS };

// ============================================================
// PERFORMANCE CACHING
// - Active keys cached for 30 seconds (reduces DB queries)
// ============================================================
let _keysCache = null;
let _keysCacheExpiry = 0;
const KEYS_CACHE_TTL = 30 * 1000;

const _clientCache = new Map();
const _failureTracker = new Map();
const FAILURE_THRESHOLD = 3;
const SKIP_DURATION = 60 * 1000;

export function invalidateKeysCache() {
  _keysCache = null;
  _keysCacheExpiry = 0;
  _clientCache.clear();
  console.log(">>> API keys cache cleared");
}

function shouldSkipKey(keyId) {
  const failure = _failureTracker.get(keyId);
  if (!failure) return false;

  if (failure.count >= FAILURE_THRESHOLD) {
    const timeSinceLastFail = Date.now() - failure.lastFailAt;
    if (timeSinceLastFail < SKIP_DURATION) {
      return true;
    }
    _failureTracker.delete(keyId);
  }
  return false;
}

function trackFailure(keyId) {
  const existing = _failureTracker.get(keyId) || { count: 0, lastFailAt: 0 };
  _failureTracker.set(keyId, {
    count: existing.count + 1,
    lastFailAt: Date.now(),
  });
}

function trackSuccess(keyId) {
  _failureTracker.delete(keyId);
}

// ============================================================
// SMART RETRY
// ============================================================
function shouldRetry(error) {
  const status = error?.status || error?.response?.status;
  const code = error?.code;

  if (status === 429) return { retry: true, waitMs: 2000 };
  if (status === 503) return { retry: true, waitMs: 1000 };
  if (code === "ETIMEDOUT" || code === "ECONNRESET") {
    return { retry: true, waitMs: 1000 };
  }

  return { retry: false };
}

async function callWithSmartRetry(client, modelName, callFn) {
  const MAX_RETRIES = 2;
  let attempt = 0;
  let lastError = null;

  while (attempt <= MAX_RETRIES) {
    try {
      return await callFn(client, modelName);
    } catch (error) {
      lastError = error;
      const decision = shouldRetry(error);

      if (!decision.retry || attempt === MAX_RETRIES) {
        throw error;
      }

      attempt++;
      console.log(
        `>>> Smart retry ${attempt}/${MAX_RETRIES} after ${decision.waitMs}ms (${error.message?.substring(0, 60)})`
      );
      await new Promise((r) => setTimeout(r, decision.waitMs));
    }
  }

  throw lastError;
}

// ============================================================
// Get all active API keys (with 30s cache)
// ============================================================
export async function getActiveKeys() {
  if (_keysCache && Date.now() < _keysCacheExpiry) {
    return _keysCache;
  }

  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  const keys = await prisma.apiKey.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
  });

  _keysCache = keys;
  _keysCacheExpiry = Date.now() + KEYS_CACHE_TTL;

  return keys;
}

// ============================================================
// Get current primary API client
// ============================================================
export async function getApiClient() {
  const activeKeys = await getActiveKeys();

  if (activeKeys.length === 0) {
    const envKey = process.env.OXYY_API_KEY;
    if (!envKey) {
      throw new Error("No API keys configured. Add one via Admin → API Keys.");
    }
    return {
      client: new OpenAI({
        apiKey: envKey,
        baseURL: "https://api.oxyy.ai/v1",
        timeout: 20000,
        maxRetries: 0,
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
      timeout: 20000,
      maxRetries: 0,
    }),
    keyRecord: primaryKey,
    modelName: primaryKey.modelName,
    isFromEnv: false,
  };
}

// ============================================================
// Execute AI call with automatic failover + smart retry
// ============================================================
export async function callWithFailover(callFn) {
  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  const activeKeys = await getActiveKeys();

  if (activeKeys.length === 0) {
    const anyKey = await prisma.apiKey.findFirst();

    if (anyKey) {
      throw new Error(
        "No active API keys. All keys are disabled in Admin → API Keys. Please enable at least one."
      );
    }

    const envKey = process.env.OXYY_API_KEY;
    if (!envKey) {
      throw new Error(
        "No API keys configured. Add one via Admin → API Keys."
      );
    }

    const client = new OpenAI({
      apiKey: envKey,
      baseURL: "https://api.oxyy.ai/v1",
      timeout: 20000,
      maxRetries: 0,
    });
    return await callWithSmartRetry(client, "gemini-2.5-flash", callFn);
  }

  let lastError = null;

  for (const keyRecord of activeKeys) {
    if (shouldSkipKey(keyRecord.id)) {
      console.log(
        `>>> Skipping ${keyRecord.name} (cooldown after repeated failures)`
      );
      continue;
    }

    const baseUrl =
      keyRecord.baseUrl || PROVIDERS[keyRecord.provider]?.defaultBaseUrl;

    if (!baseUrl) {
      console.warn(`>>> Skipping ${keyRecord.name}: no baseUrl`);
      continue;
    }

    try {
      // Reuse cached client (faster initialization)
      let client = _clientCache.get(keyRecord.id);
      if (!client) {
        client = new OpenAI({
          apiKey: keyRecord.apiKey,
          baseURL: baseUrl,
          timeout: 20000,
          maxRetries: 0,
        });
        _clientCache.set(keyRecord.id, client);
      }

      // Use smart retry (handles 429/503 intelligently)
      const result = await callWithSmartRetry(
        client,
        keyRecord.modelName,
        callFn
      );

      // Success — reset failure counter
      trackSuccess(keyRecord.id);
      prisma.apiKey
        .update({
          where: { id: keyRecord.id },
          data: {
            totalCalls: { increment: 1 },
            lastUsedAt: new Date(),
          },
        })
        .catch((err) => {
          console.error(">>> Tracking update failed (non-critical):", err.message);
        });

      return result;
    } catch (error) {
      lastError = error;
      console.error(`>>> API call failed on ${keyRecord.name}:`, error.message);

      trackFailure(keyRecord.id);

      prisma.apiKey
        .update({
          where: { id: keyRecord.id },
          data: {
            totalErrors: { increment: 1 },
            lastErrorAt: new Date(),
            lastErrorMessage:
              error.message?.substring(0, 500) || "Unknown error",
          },
        })
        .catch(() => {});

      continue;
    }
  }

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
      timeout: 60000,
      maxRetries: 0,
    });

    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: "Reply with the word: OK" }],
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
      const lastSuccess = new Date(key.lastUsedAt) > new Date(key.lastErrorAt);

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