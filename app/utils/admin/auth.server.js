import bcrypt from "bcryptjs";
import { createCookieSessionStorage, redirect } from "react-router";

// ============================================================
// Session Storage Configuration
// ============================================================
const sessionSecret = process.env.ADMIN_SESSION_SECRET || "default-secret-change-me";

const adminSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__admin_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
});

// ============================================================
// Verify Login (Email + Password)
// Returns: AdminUser object or null
// ============================================================
export async function verifyAdminLogin(email, password) {
  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin) {
    return null;
  }

  // Compare password with stored hash
  const isValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isValid) {
    return null;
  }

  // Update last login time
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  return admin;
}

// ============================================================
// Create Login Session (Set Cookie)
// ============================================================
export async function createAdminSession(adminId, redirectTo) {
  const session = await adminSessionStorage.getSession();
  session.set("adminId", adminId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await adminSessionStorage.commitSession(session),
    },
  });
}

// ============================================================
// Get Current Admin User from Session
// Returns: AdminUser or null
// ============================================================
export async function getAdminUser(request) {
  const session = await adminSessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const adminId = session.get("adminId");

  if (!adminId) {
    return null;
  }

  const prismaModule = await import("../../db.server");
  const prisma = prismaModule.default;

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
  });

  return admin;
}

// ============================================================
// Require Admin User (Protect Routes)
// Redirects to /admin/login if not logged in
// ============================================================
export async function requireAdmin(request) {
  const admin = await getAdminUser(request);

  if (!admin) {
    throw redirect("/admin/login");
  }

  return admin;
}

// ============================================================
// Logout (Clear Session)
// ============================================================
export async function logoutAdmin(request) {
  const session = await adminSessionStorage.getSession(
    request.headers.get("Cookie")
  );

  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await adminSessionStorage.destroySession(session),
    },
  });
}