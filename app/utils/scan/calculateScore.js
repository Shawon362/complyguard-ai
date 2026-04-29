// ============================================================
// Calculate compliance score from issues
// ============================================================
export function calculateScore(issues) {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  let score = 100;
  if (criticalCount > 0) score -= 15 + Math.min((criticalCount - 1) * 8, 25);
  if (highCount > 0) score -= 10 + Math.min((highCount - 1) * 5, 15);
  if (mediumCount > 0) score -= 5 + Math.min((mediumCount - 1) * 3, 15);
  if (lowCount > 0) score -= 2 + Math.min((lowCount - 1) * 2, 8);
  if (score < 0) score = 0;

  const grade =
    score >= 90 ? "A" :
    score >= 75 ? "B" :
    score >= 60 ? "C" :
    score >= 40 ? "D" : "F";

  return { score, grade, criticalCount, highCount, mediumCount, lowCount };
}