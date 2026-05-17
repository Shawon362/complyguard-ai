import { logoutAdmin } from "../utils/admin/auth.server";

// ============================================================
// ACTION — Logout (POST request)
// ============================================================
export const action = async ({ request }) => {
  return logoutAdmin(request);
};

// ============================================================
// LOADER — Also support GET request for logout link
// ============================================================
export const loader = async ({ request }) => {
  return logoutAdmin(request);
};