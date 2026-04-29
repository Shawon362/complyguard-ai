import { authenticate } from "../shopify.server";

// ============================================================
// Scan Status Endpoint — GET /app/scan-status?scanId=xxx
// ============================================================
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const scanId = url.searchParams.get("scanId");

  if (!scanId) {
    return { error: "Missing scanId" };
  }

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: {
      id: true,
      shop: true,
      status: true,
      currentPhase: true,
      progress: true,
      imagesProcessed: true,
      imagesTotal: true,
      totalProducts: true,
      score: true,
      grade: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  });

  if (!scan) {
    return { error: "Scan not found" };
  }

  // Verify shop ownership
  if (scan.shop !== shop) {
    return { error: "Unauthorized" };
  }

  return { scan };
};