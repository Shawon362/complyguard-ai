import { useState } from "react";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  useOutletContext,
  Form,
  redirect,
} from "react-router";
import {
  Page,
  Card,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Box,
  Divider,
  TextField,
  Button,
  Banner,
  DataTable,
  EmptyState,
  Modal,
  Icon,
} from "@shopify/polaris";
import {
  SettingsIcon,
  KeyIcon,
  PersonIcon,
  ClockIcon,
  AlertTriangleIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";

import bcrypt from "bcryptjs";

// ============================================================
// LOADER
// ============================================================
export const loader = async () => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  // All admin users
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  // Recent audit logs
  const auditLogs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // System stats
  const totalMerchants = await prisma.merchant.count();
  const totalScans = await prisma.scan.count();
  const totalIssues = await prisma.issue.count();
  const totalImages = await prisma.analyzedImage.count();
  const activeOverrides = await prisma.rateLimitOverride.count();

  // API config (from env, but we'll just show status)
  const apiConfig = {
    provider: "Gemini 2.5 Flash via Oxyy API",
    keyConfigured: !!process.env.OXYY_API_KEY,
    keyMasked: process.env.OXYY_API_KEY
      ? process.env.OXYY_API_KEY.slice(0, 8) + "..." + process.env.OXYY_API_KEY.slice(-4)
      : "Not configured",
  };

  return {
    admins,
    auditLogs,
    stats: {
      totalMerchants,
      totalScans,
      totalIssues,
      totalImages,
      activeOverrides,
    },
    apiConfig,
  };
};

// ============================================================
// ACTION — Handle admin add/delete
// ============================================================
export const action = async ({ request }) => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;
  const { getAdminUser } = await import("../utils/admin/auth.server");

  const admin = await getAdminUser(request);
  if (!admin) return redirect("/admin/login");

  const formData = await request.formData();
  const intent = formData.get("intent");

  // === Add new admin ===
  if (intent === "add-admin") {
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const name = formData.get("name")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !name || !password) {
      return { success: false, message: "All fields are required" };
    }

    if (password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters" };
    }

    if (!email.includes("@")) {
      return { success: false, message: "Invalid email" };
    }

    // Check duplicate
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });
    if (existing) {
      return { success: false, message: "Admin with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.adminUser.create({
      data: { email, name, passwordHash, role: "admin" },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "add_admin",
        details: JSON.stringify({ newAdminEmail: email, newAdminName: name }),
      },
    });

    return { success: true, message: `Admin '${name}' added successfully` };
  }

  // === Delete admin ===
  if (intent === "delete-admin") {
    const adminId = formData.get("adminId");

    if (!adminId) {
      return { success: false, message: "Admin ID required" };
    }

    // Don't allow self-delete
    if (adminId === admin.id) {
      return { success: false, message: "You cannot delete your own account" };
    }

    // Don't allow if it's the last admin
    const totalAdmins = await prisma.adminUser.count();
    if (totalAdmins <= 1) {
      return { success: false, message: "Cannot delete the last admin account" };
    }

    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!targetAdmin) {
      return { success: false, message: "Admin not found" };
    }

    await prisma.adminUser.delete({ where: { id: adminId } });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "delete_admin",
        details: JSON.stringify({ deletedAdminEmail: targetAdmin.email }),
      },
    });

    return { success: true, message: `Admin '${targetAdmin.name}' deleted` };
  }

  return { success: false, message: "Unknown action" };
};

// ============================================================
// HELPERS
// ============================================================
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(date) {
  if (!date) return "Never";
  const ms = Date.now() - new Date(date).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(date);
}

function ActionBadge({ action }) {
  const map = {
    set_rate_limit: { tone: "info", label: "Set limit" },
    remove_rate_limit: { tone: undefined, label: "Remove limit" },
    add_admin: { tone: "success", label: "Add admin" },
    delete_admin: { tone: "critical", label: "Delete admin" },
  };
  const v = map[action] || { tone: undefined, label: action };
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

// ============================================================
// INFO ROW
// ============================================================
function InfoRow({ label, value }) {
  return (
    <InlineStack align="space-between" blockAlign="center">
      <Text as="span" variant="bodyMd" tone="subdued">
        {label}
      </Text>
      <Text as="span" variant="bodyMd">
        {value}
      </Text>
    </InlineStack>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AdminSettings() {
  const { admins, auditLogs, stats, apiConfig } = useLoaderData();
  const { admin: currentAdmin } = useOutletContext();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Add admin form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Close modal on success
  if (actionData?.success && showAddModal) {
    setShowAddModal(false);
    setNewEmail("");
    setNewName("");
    setNewPassword("");
  }

  // Build admin table rows
  const adminRows = admins.map((a) => [
    <Text as="span" variant="bodyMd" fontWeight="semibold" key={a.id}>
      {a.name}
    </Text>,
    <Text as="span" variant="bodyMd" tone="subdued" key={a.id + "-e"}>
      {a.email}
    </Text>,
    <Badge tone={a.role === "admin" ? "success" : undefined} key={a.id + "-r"}>
      {a.role}
    </Badge>,
    <Text as="span" variant="bodyMd" tone="subdued" key={a.id + "-l"}>
      {getRelativeTime(a.lastLogin)}
    </Text>,
    a.id === currentAdmin.id ? (
      <Badge tone="info" key={a.id + "-y"}>You</Badge>
    ) : (
      <Button
        size="slim"
        tone="critical"
        variant="plain"
        icon={DeleteIcon}
        onClick={() => setDeleteTarget(a)}
        key={a.id + "-d"}
      >
        Remove
      </Button>
    ),
  ]);

  // Build audit log rows
  const auditRows = auditLogs.map((log) => [
    <Text as="span" variant="bodyMd" tone="subdued" key={log.id}>
      {getRelativeTime(log.createdAt)}
    </Text>,
    <Text as="span" variant="bodyMd" key={log.id + "-e"}>
      {log.adminEmail}
    </Text>,
    <ActionBadge action={log.action} key={log.id + "-a"} />,
    <Text as="span" variant="bodyMd" tone="subdued" key={log.id + "-t"}>
      {log.targetShop || "—"}
    </Text>,
  ]);

  return (
    <Page
      title="Settings"
      subtitle="Manage admin users, API configuration, and system settings"
      fullWidth
    >
      <Layout>
        {/* Success/Error Banner */}
        {actionData && (
          <Layout.Section>
            <Banner
              tone={actionData.success ? "success" : "critical"}
              onDismiss={() => {}}
            >
              {actionData.message}
            </Banner>
          </Layout.Section>
        )}

        {/* System Stats + API Config */}
        <Layout.Section>
          <div className="admin-two-col">
            {/* System Stats */}
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={SettingsIcon} tone="base" />
                  <Text as="h3" variant="headingMd">
                    System Statistics
                  </Text>
                </InlineStack>
                <Divider />
                <BlockStack gap="300">
                  <InfoRow
                    label="Total merchants"
                    value={stats.totalMerchants.toLocaleString()}
                  />
                  <InfoRow
                    label="Total scans"
                    value={stats.totalScans.toLocaleString()}
                  />
                  <InfoRow
                    label="Issues found"
                    value={stats.totalIssues.toLocaleString()}
                  />
                  <InfoRow
                    label="Images analyzed"
                    value={stats.totalImages.toLocaleString()}
                  />
                  <InfoRow
                    label="Active rate limit overrides"
                    value={
                      stats.activeOverrides > 0 ? (
                        <Badge tone="info">{stats.activeOverrides}</Badge>
                      ) : (
                        "0"
                      )
                    }
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            {/* API Configuration */}
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={KeyIcon} tone="base" />
                  <Text as="h3" variant="headingMd">
                    API Configuration
                  </Text>
                </InlineStack>
                <Divider />
                <BlockStack gap="300">
                  <InfoRow label="Provider" value={apiConfig.provider} />
                  <InfoRow
                    label="API Key Status"
                    value={
                      apiConfig.keyConfigured ? (
                        <Badge tone="success">Configured</Badge>
                      ) : (
                        <Badge tone="critical">Missing</Badge>
                      )
                    }
                  />
                  <InfoRow label="Key (masked)" value={apiConfig.keyMasked} />
                </BlockStack>
                <Box paddingBlockStart="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    To change API key: Update <code>OXYY_API_KEY</code> in your
                    .env file and restart the server.
                  </Text>
                </Box>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        {/* Admin Users Management */}
        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={PersonIcon} tone="base" />
                    <Text as="h3" variant="headingMd">
                      Admin Users
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Manage who can access the admin dashboard
                  </Text>
                </BlockStack>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                  Add Admin
                </Button>
              </InlineStack>
            </Box>
            <Divider />
            {admins.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No admins"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Add your first admin to get started.</p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Name", "Email", "Role", "Last Login", "Actions"]}
                rows={adminRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>

        {/* Audit Log */}
        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={ClockIcon} tone="base" />
                <BlockStack gap="100">
                  <Text as="h3" variant="headingMd">
                    Audit Log
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Recent admin actions (last 20)
                  </Text>
                </BlockStack>
              </InlineStack>
            </Box>
            <Divider />
            {auditLogs.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No actions yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Admin activity will appear here.</p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["When", "Admin", "Action", "Target"]}
                rows={auditRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>

        {/* Danger Zone */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={AlertTriangleIcon} tone="critical" />
                <Text as="h3" variant="headingMd">
                  Danger Zone
                </Text>
              </InlineStack>
              <Divider />
              <Banner tone="warning">
                <Text as="p" variant="bodyMd">
                  Emergency controls and dangerous operations. Use with caution.
                </Text>
              </Banner>
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Emergency Stop, Database Reset, and other dangerous operations
                  will be added here in future updates.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Add Admin Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Admin"
        primaryAction={{
          content: "Add Admin",
          onAction: () => {
            document
              .getElementById("add-admin-form")
              .requestSubmit();
          },
          loading: isSubmitting,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowAddModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Form method="POST" id="add-admin-form">
            <input type="hidden" name="intent" value="add-admin" />
            <BlockStack gap="400">
              <TextField
                label="Full name"
                name="name"
                value={newName}
                onChange={setNewName}
                placeholder="John Doe"
                requiredIndicator
                autoComplete="name"
              />
              <TextField
                label="Email address"
                name="email"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                placeholder="admin@example.com"
                requiredIndicator
                autoComplete="email"
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                helpText="Minimum 8 characters"
                requiredIndicator
                autoComplete="new-password"
              />
            </BlockStack>
          </Form>
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Admin"
        primaryAction={{
          content: "Remove",
          destructive: true,
          onAction: () => {
            document
              .getElementById("delete-admin-form")
              .requestSubmit();
            setDeleteTarget(null);
          },
          loading: isSubmitting,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteTarget(null),
          },
        ]}
      >
        <Modal.Section>
          {deleteTarget && (
            <Form method="POST" id="delete-admin-form">
              <input type="hidden" name="intent" value="delete-admin" />
              <input type="hidden" name="adminId" value={deleteTarget.id} />
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd">
                  Are you sure you want to remove <strong>{deleteTarget.name}</strong>{" "}
                  ({deleteTarget.email}) from admin access?
                </Text>
                <Banner tone="warning">
                  <Text as="p" variant="bodyMd">
                    They will no longer be able to access the admin dashboard.
                    This action will be logged in the audit log.
                  </Text>
                </Banner>
              </BlockStack>
            </Form>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}