// ============================================================
// Recalculate scan score after auto-fix
// ============================================================
export async function recalculateScore(prisma, scanId) {
  const remainingIssues = await prisma.issue.findMany({
    where: { 
      scanId, 
      status: { in: ["open", "pending"] } 
    },
  });

  // Count by severity
  const criticalCount = remainingIssues.filter((i) => i.severity === "critical").length;
  const highCount = remainingIssues.filter((i) => i.severity === "high").length;
  const mediumCount = remainingIssues.filter((i) => i.severity === "medium").length;
  const lowCount = remainingIssues.filter((i) => i.severity === "low").length;

  // Calculate new score
  let score = 100;
  if (criticalCount > 0) score -= 15 + Math.min((criticalCount - 1) * 8, 25);
  if (highCount > 0) score -= 10 + Math.min((highCount - 1) * 5, 15);
  if (mediumCount > 0) score -= 5 + Math.min((mediumCount - 1) * 3, 15);
  if (lowCount > 0) score -= 2 + Math.min((lowCount - 1) * 2, 8);
  if (score < 0) score = 0;

  // Determine grade
  const grade = 
    score >= 90 ? "A" : 
    score >= 75 ? "B" : 
    score >= 60 ? "C" : 
    score >= 40 ? "D" : "F";

  // Update scan in database
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      score,
      grade,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    },
  });

  return { score, grade, criticalCount, highCount, mediumCount, lowCount };
}