import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const issueId = formData.get("issueId");
  const newStatus = formData.get("status");

  if (!issueId || !newStatus) {
    return { success: false, message: "Missing data" };
  }

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  try {
    await prisma.issue.update({
      where: { id: issueId },
      data: { status: newStatus },
    });
    return { success: true, message: `Issue marked as ${newStatus}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};