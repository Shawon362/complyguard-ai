// ============================================================
// PROVIDER CONFIGURATIONS (Client + Server safe)
// ============================================================
export const PROVIDERS = {
  oxyy: {
    label: "Oxyy",
    defaultBaseUrl: "https://api.oxyy.ai/v1",
    defaultModel: "gemini-2.5-flash",
    docsUrl: "https://oxyy.ai/docs",
  },
  openai: {
    label: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    docsUrl: "https://platform.openai.com/docs",
  },
  gemini: {
    label: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    docsUrl: "https://ai.google.dev/",
  },
  anthropic: {
    label: "Anthropic Claude",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-20241022",
    docsUrl: "https://docs.anthropic.com",
  },
  groq: {
    label: "Groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    docsUrl: "https://console.groq.com/docs",
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    defaultBaseUrl: "",
    defaultModel: "",
    docsUrl: "",
  },
};