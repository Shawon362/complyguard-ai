import { Outlet, Link, useLocation, Form, useLoaderData } from "react-router";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import {
  HomeIcon,
  PersonIcon,
  ChartLineIcon,
  CashDollarIcon,
  SettingsIcon,
  ExitIcon,
  AlertDiamondIcon,
  KeyIcon
} from "@shopify/polaris-icons";

import adminStyles from "../styles/admin.css?url";
import { requireAdmin } from "../utils/admin/auth.server";

// CSS
export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: adminStyles },
];

// LOADER — skip auth for login page
export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.pathname === "/admin/login") {
    return { admin: null };
  }

  const admin = await requireAdmin(request);
  return { admin };
};

// NAV CONFIG
const NAV_MAIN = [
  { to: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/admin/merchants", label: "Merchants", icon: PersonIcon },
  { to: "/admin/usage", label: "API Usage", icon: ChartLineIcon },
  { to: "/admin/revenue", label: "Revenue", icon: CashDollarIcon },
];

const NAV_SYSTEM = [
  { to: "/admin/api-keys", label: "API Keys", icon: KeyIcon },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// COMPONENT
export default function AdminLayout() {
  const { admin } = useLoaderData();
  const location = useLocation();

  // ─── Login page: NO sidebar, just the login form ───
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  // ─── All other pages: Sidebar + Content ───
  const isActive = (path) => {
    if (path === "/admin/dashboard") {
      return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AppProvider i18n={enTranslations}>
      <div className="admin-shell">
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <Link to="/admin/dashboard" className="admin-sidebar-brand">
              <div className="admin-sidebar-brand-icon">
                <AlertDiamondIcon />
              </div>
              <div>
                <div className="admin-sidebar-brand-text">ComplyGuard AI</div>
                <div className="admin-sidebar-brand-subtext">Admin Panel</div>
              </div>
            </Link>
          </div>

          <nav className="admin-sidebar-nav">
            <div className="admin-sidebar-nav-label">Main</div>
            {NAV_MAIN.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`admin-nav-link ${isActive(item.to) ? "active" : ""}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="admin-sidebar-nav-label" style={{ marginTop: 16 }}>
              System
            </div>
            {NAV_SYSTEM.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`admin-nav-link ${isActive(item.to) ? "active" : ""}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-user-card">
              <div className="admin-user-avatar">{getInitials(admin?.name)}</div>
              <div className="admin-user-info">
                <div className="admin-user-name">{admin?.name || "Admin"}</div>
                <div className="admin-user-email">{admin?.email}</div>
              </div>
            </div>
            <Form method="POST" action="/admin/logout">
              <button type="submit" className="admin-logout-btn">
                <ExitIcon />
                <span>Sign out</span>
              </button>
            </Form>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="admin-main">
          <Outlet context={{ admin }} />
        </main>
      </div>
    </AppProvider>
  );
}