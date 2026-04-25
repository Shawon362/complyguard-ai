import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { getScanStatus } from "../scan-runner.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const scanId = url.searchParams.get("scanId");

  if (!scanId) {
    return { status: "error", message: "No scanId provided" };
  }

  // Check in-memory status first
  const memoryStatus = getScanStatus(scanId);
  if (memoryStatus.status === "running") {
    return { status: "running", progress: memoryStatus.progress };
  }

  // Check database
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
  });

  if (!scan) {
    return { status: "not_found" };
  }

  return { status: scan.status, grade: scan.grade, score: scan.score };
};