import { fixAltText } from "./fixAltText";
import { fixAIImage } from "./fixAIImage";
import { fixPrivacyPolicy } from "./fixPrivacyPolicy";
import { fixTerms } from "./fixTerms";

// ============================================================
// Categories that can be auto-fixed
// ============================================================
export const AUTO_FIXABLE_CATEGORIES = [
  "missing_alt_text",
  "ai_image_detected",
  "policy_no_ai_disclosure",
  "terms_no_automated_disclosure",
];

// ============================================================
// Check if an issue can be auto-fixed
// ============================================================
export function canAutoFix(category) {
  return AUTO_FIXABLE_CATEGORIES.includes(category);
}

// ============================================================
// Dispatch issue to correct fix function
// ============================================================
export async function dispatchFix(admin, issue) {
  let evidence = {};
  try {
    evidence = JSON.parse(issue.evidence || "{}");
  } catch {}

  switch (issue.category) {
    case "missing_alt_text":
      return await fixAltText(admin, evidence);

    case "ai_image_detected":
      return await fixAIImage(admin, evidence);

    case "policy_no_ai_disclosure":
      return await fixPrivacyPolicy(admin);

    case "terms_no_automated_disclosure":
      return await fixTerms(admin);

    default:
      return { 
        success: false, 
        message: "This issue type cannot be auto-fixed",
        notSupported: true,
      };
  }
}