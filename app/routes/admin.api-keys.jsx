import { useState } from "react";
import {
  useLoaderData,
  useActionData,
  useNavigation,
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
  Select,
  Icon,
} from "@shopify/polaris";
import {
  KeyIcon,
  DeleteIcon,
  EditIcon,
} from "@shopify/polaris-icons";

import { PROVIDERS } from "../utils/admin/apiProviders";
import {
  getApiKeysHealth,
  testApiKey,
  invalidateKeysCache,
} from "../utils/admin/apiKeyManager.server";

// ============================================================
// LOADER
// ============================================================
export const loader = async () => {
  const keys = await getApiKeysHealth();
  return { keys };
};

// ============================================================
// ACTION
// ============================================================
export const action = async ({ request }) => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;
  const { getAdminUser } = await import("../utils/admin/auth.server");

  const admin = await getAdminUser(request);
  if (!admin) return redirect("/admin/login");

  const formData = await request.formData();
  const intent = formData.get("intent");

  // === TEST KEY ===
  if (intent === "test") {
    const apiKey = formData.get("apiKey");
    const provider = formData.get("provider");
    const baseUrl = formData.get("baseUrl") || PROVIDERS[provider]?.defaultBaseUrl;
    const modelName = formData.get("modelName") || PROVIDERS[provider]?.defaultModel;

    if (!apiKey || !baseUrl || !modelName) {
      return { intent: "test", success: false, message: "All fields required for test" };
    }

    const result = await testApiKey({ apiKey, baseUrl, modelName });

    return {
      intent: "test",
      ...result,
      message: result.success
        ? `✓ Test passed! Response: "${result.response}" (${result.responseTime}ms)`
        : `✗ Test failed: ${result.error}`,
    };
  }

  // === TEST ALL KEYS ===
  if (intent === "test-all") {
    const allKeys = await prisma.apiKey.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" },
    });

    const results = await Promise.all(
      allKeys.map(async (key) => {
        const baseUrl = key.baseUrl || PROVIDERS[key.provider]?.defaultBaseUrl;
        const testResult = await testApiKey({
          apiKey: key.apiKey,
          baseUrl,
          modelName: key.modelName,
        });
        return {
          id: key.id,
          name: key.name,
          modelName: key.modelName,
          success: testResult.success,
          response: testResult.response || null,
          responseTime: testResult.responseTime || null,
          error: testResult.error || null,
        };
      })
    );

    const passed = results.filter((r) => r.success).length;

    return {
      intent: "test-all",
      success: true,
      results,
      message: `Tested ${results.length} keys: ${passed} passed, ${results.length - passed} failed`,
    };
  }

  // === CREATE ===
  if (intent === "create") {
    const name = formData.get("name");
    const provider = formData.get("provider");
    const apiKey = formData.get("apiKey");
    const baseUrl = formData.get("baseUrl") || PROVIDERS[provider]?.defaultBaseUrl || "";
    const modelName = formData.get("modelName") || PROVIDERS[provider]?.defaultModel || "";
    const priority = parseInt(formData.get("priority"), 10) || 100;
    const notes = formData.get("notes") || "";

    if (!name || !provider || !apiKey || !baseUrl || !modelName) {
      return { intent: "create", success: false, message: "All required fields must be filled" };
    }

    const created = await prisma.apiKey.create({
      data: {
        name,
        provider,
        apiKey,
        baseUrl,
        modelName,
        priority,
        notes,
        isActive: true,
        createdBy: admin.email,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "create_api_key",
        details: JSON.stringify({ keyId: created.id, name, provider }),
      },
    });
    invalidateKeysCache();

    return { intent: "create", success: true, message: `API Key "${name}" added successfully` };
  }

  // === UPDATE ===
  if (intent === "update") {
    const id = formData.get("id");
    const name = formData.get("name");
    const provider = formData.get("provider");
    const apiKey = formData.get("apiKey");
    const baseUrl = formData.get("baseUrl");
    const modelName = formData.get("modelName");
    const priority = parseInt(formData.get("priority"), 10) || 100;
    const notes = formData.get("notes") || "";

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return { intent: "update", success: false, message: "Key not found" };
    }

    // Only update apiKey if user provided a new one
    const updateData = {
      name, provider, baseUrl, modelName, priority, notes,
    };
    if (apiKey && apiKey !== "********" && !apiKey.includes("•")) {
      updateData.apiKey = apiKey;
    }

    await prisma.apiKey.update({ where: { id }, data: updateData });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "update_api_key",
        details: JSON.stringify({ keyId: id, name }),
      },
    });
    invalidateKeysCache();
    return { intent: "update", success: true, message: `API Key "${name}" updated` };
  }

  // === TOGGLE ACTIVE ===
  if (intent === "toggle") {
    const id = formData.get("id");
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return { success: false, message: "Key not found" };

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: !key.isActive },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: key.isActive ? "disable_api_key" : "enable_api_key",
        details: JSON.stringify({ keyId: id, name: key.name }),
      },
    });
    invalidateKeysCache();
    return {
      intent: "toggle",
      success: true,
      message: `API Key ${key.isActive ? "disabled" : "enabled"}`,
    };
  }

  // === DELETE ===
  if (intent === "delete") {
    const id = formData.get("id");
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return { success: false, message: "Key not found" };

    await prisma.apiKey.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "delete_api_key",
        details: JSON.stringify({ name: key.name, provider: key.provider }),
      },
    });
    invalidateKeysCache();
    return { intent: "delete", success: true, message: `API Key "${key.name}" deleted` };
  }

  return { success: false, message: "Unknown action" };
};

// ============================================================
// HELPERS
// ============================================================
function StatusBadge({ status }) {
  const map = {
    healthy: { tone: "success", label: "Healthy" },
    warning: { tone: "warning", label: "Warning" },
    error: { tone: "critical", label: "Error" },
    inactive: { tone: undefined, label: "Inactive" },
    unknown: { tone: "info", label: "Not tested" },
  };
  const v = map[status] || map.unknown;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function formatDateTime(date) {
  if (!date) return "Never";
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
  return formatDateTime(date);
}

// ============================================================
// MAIN
// ============================================================
export default function ApiKeysPage() {
  const { keys } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    provider: "oxyy",
    apiKey: "",
    baseUrl: "",
    modelName: "",
    priority: "100",
    notes: "",
  });

  // Test result state
  const testResult =
    actionData?.intent === "test"
      ? actionData
      : null;

  // Test All results (map: keyId → result)
  const testAllResults = {};
  if (actionData?.intent === "test-all" && actionData.results) {
    for (const r of actionData.results) {
      testAllResults[r.id] = r;
    }
  }

  // Close modal on successful save
  const shouldCloseModal =
    actionData?.success &&
    (actionData.intent === "create" || actionData.intent === "update");

  if (shouldCloseModal && (showAddModal || editingKey)) {
    setTimeout(() => {
      setShowAddModal(false);
      setEditingKey(null);
      setFormData({
        name: "",
        provider: "oxyy",
        apiKey: "",
        baseUrl: "",
        modelName: "",
        priority: "100",
        notes: "",
      });
    }, 100);
  }

  // Provider options for Select
  const providerOptions = Object.entries(PROVIDERS).map(([key, p]) => ({
    label: p.label,
    value: key,
  }));

  // Open edit modal
  const handleEdit = (key) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      provider: key.provider,
      apiKey: "", // Don't pre-fill (security)
      baseUrl: key.baseUrl || "",
      modelName: key.modelName,
      priority: key.priority.toString(),
      notes: key.notes || "",
    });
  };

  // Handle provider change → auto-fill defaults
  const handleProviderChange = (value) => {
    const defaults = PROVIDERS[value];
    setFormData({
      ...formData,
      provider: value,
      baseUrl: defaults?.defaultBaseUrl || "",
      modelName: defaults?.defaultModel || "",
    });
  };

  // Build table rows
  const tableRows = keys.map((key) => [
    <BlockStack gap="050" key={key.id + "-n"}>
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {key.name}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        Priority: {key.priority}
      </Text>
    </BlockStack>,
    <Badge tone="info" key={key.id + "-p"}>
      {PROVIDERS[key.provider]?.label || key.provider}
    </Badge>,
    <Text as="span" variant="bodyMd" key={key.id + "-k"} fontWeight="medium">
      <code style={{ fontSize: "12px" }}>{key.apiKey}</code>
    </Text>,
    <BlockStack gap="100" key={key.id + "-s"}>
      <StatusBadge status={key.status} />
      {testAllResults[key.id] && (
        <Badge tone={testAllResults[key.id].success ? "success" : "critical"}>
          {testAllResults[key.id].success
            ? `✓ ${testAllResults[key.id].response || "OK"}`
            : "✗ Failed"}
        </Badge>
      )}
    </BlockStack>,
    <BlockStack gap="050" key={key.id + "-u"}>
      <Text as="span" variant="bodyMd">
        {key.totalCalls.toLocaleString()} calls
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {key.totalErrors > 0 ? `${key.totalErrors} errors` : "No errors"}
        {key.successRate !== null && ` · ${key.successRate}%`}
      </Text>
    </BlockStack>,
    <Text as="span" variant="bodySm" tone="subdued" key={key.id + "-l"}>
      {getRelativeTime(key.lastUsedAt)}
    </Text>,
    <InlineStack gap="100" key={key.id + "-a"}>
      <Form method="POST">
        <input type="hidden" name="intent" value="toggle" />
        <input type="hidden" name="id" value={key.id} />
        <Button size="slim" variant="plain" submit>
          {key.isActive ? "Disable" : "Enable"}
        </Button>
      </Form>
      <Button
        size="slim"
        variant="plain"
        icon={EditIcon}
        onClick={() => handleEdit(key)}
      >
        Edit
      </Button>
      <Button
        size="slim"
        variant="plain"
        tone="critical"
        icon={DeleteIcon}
        onClick={() => setDeleteTarget(key)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="API Keys"
      subtitle="Manage AI provider API keys with automatic failover"
      primaryAction={{
        content: "Add API Key",
        onAction: () => setShowAddModal(true),
      }}
      fullWidth
    >
      <Layout>
        {actionData?.message && actionData.intent !== "test" && (
          <Layout.Section>
            <Banner
              tone={actionData.success ? "success" : "critical"}
              onDismiss={() => {}}
            >
              {actionData.message}
            </Banner>
          </Layout.Section>
        )}

        {/* Info Banner */}
        <Layout.Section>
          <Banner tone="info">
            <Text as="p" variant="bodyMd">
              Keys are used in <strong>priority order</strong> (lower = higher
              priority). If a key fails, the system automatically tries the next
              one. Add multiple keys for redundancy.
            </Text>
          </Banner>
        </Layout.Section>

        {/* Keys Table */}
        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={KeyIcon} tone="base" />
                    <Text as="h3" variant="headingMd">
                      Configured Keys
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {keys.filter((k) => k.isActive).length} active of {keys.length} total
                  </Text>
                </BlockStack>
                <InlineStack gap="200">
                  <Form method="POST">
                    <input type="hidden" name="intent" value="test-all" />
                    <Button
                      submit
                      loading={isSubmitting && navigation.formData?.get("intent") === "test-all"}
                      disabled={keys.filter((k) => k.isActive).length === 0}
                    >
                      Test All Models
                    </Button>
                  </Form>
                  <Button onClick={() => setShowAddModal(true)} variant="primary">
                    Add API Key
                  </Button>
                </InlineStack>
              </InlineStack>
            </Box>
            <Divider />
            {keys.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No API keys configured"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  action={{
                    content: "Add your first API key",
                    onAction: () => setShowAddModal(true),
                  }}
                >
                  <p>
                    Add API keys from supported providers (Oxyy, OpenAI, Gemini,
                    Anthropic, Groq) to enable AI scanning with automatic failover.
                  </p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                ]}
                headings={[
                  "Name",
                  "Provider",
                  "Key",
                  "Status",
                  "Usage",
                  "Last Used",
                  "Actions",
                ]}
                rows={tableRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>

        {/* Help Card */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                How Failover Works
              </Text>
              <Divider />
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>1.</strong> System tries keys in priority order (1, 2, 3...)
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>2.</strong> If primary key fails, automatically tries next active key
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>3.</strong> All errors are logged for monitoring
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>4.</strong> If all keys fail, scan returns clear error message
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Add/Edit Modal */}
      <Modal
        open={showAddModal || !!editingKey}
        onClose={() => {
          setShowAddModal(false);
          setEditingKey(null);
        }}
        title={editingKey ? "Edit API Key" : "Add New API Key"}
        primaryAction={{
          content: editingKey ? "Update" : "Add Key",
          onAction: () => {
            document.getElementById("api-key-form").requestSubmit();
          },
          loading: isSubmitting && actionData?.intent !== "test",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowAddModal(false);
              setEditingKey(null);
            },
          },
        ]}
        large
      >
        <Modal.Section>
          <Form method="POST" id="api-key-form">
            <input
              type="hidden"
              name="intent"
              value={editingKey ? "update" : "create"}
            />
            {editingKey && (
              <input type="hidden" name="id" value={editingKey.id} />
            )}

            <BlockStack gap="400">
              {/* Test Result Banner */}
              {testResult && (
                <Banner tone={testResult.success ? "success" : "critical"}>
                  {testResult.message}
                </Banner>
              )}

              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                placeholder="e.g. Oxyy Primary, OpenAI Backup"
                requiredIndicator
                autoComplete="off"
                helpText="Descriptive name for this key"
              />

              <Select
                label="Provider"
                name="provider"
                options={providerOptions}
                value={formData.provider}
                onChange={handleProviderChange}
              />

              <TextField
                label="API Key"
                name="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(v) => setFormData({ ...formData, apiKey: v })}
                placeholder={
                  editingKey
                    ? "Leave blank to keep current key"
                    : "sk-... or your provider key"
                }
                requiredIndicator={!editingKey}
                autoComplete="off"
              />

              <TextField
                label="Base URL"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={(v) => setFormData({ ...formData, baseUrl: v })}
                placeholder="https://api.example.com/v1"
                helpText="OpenAI-compatible API endpoint"
                requiredIndicator
                autoComplete="off"
              />

              <TextField
                label="Model Name"
                name="modelName"
                value={formData.modelName}
                onChange={(v) => setFormData({ ...formData, modelName: v })}
                placeholder="e.g. gemini-2.5-flash, gpt-4o-mini"
                requiredIndicator
                autoComplete="off"
              />

              <TextField
                label="Priority"
                name="priority"
                type="number"
                value={formData.priority}
                onChange={(v) => setFormData({ ...formData, priority: v })}
                helpText="Lower number = higher priority (1 = primary, 100 = backup)"
                min={1}
                max={1000}
                autoComplete="off"
              />

              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={(v) => setFormData({ ...formData, notes: v })}
                placeholder="e.g. Production key, Test account"
                multiline={2}
                autoComplete="off"
              />

              <Divider />

              {/* Test button - separate form to avoid main submit */}
              <Box>
                <Text as="p" variant="bodySm" tone="subdued">
                  Test this key before saving to verify it works.
                </Text>
                <Box paddingBlockStart="200">
                  <Button
                    onClick={() => {
                      const testForm = new FormData();
                      testForm.set("intent", "test");
                      testForm.set("apiKey", formData.apiKey);
                      testForm.set("provider", formData.provider);
                      testForm.set("baseUrl", formData.baseUrl);
                      testForm.set("modelName", formData.modelName);

                      // Submit via fetch
                      fetch("/admin/api-keys", {
                        method: "POST",
                        body: testForm,
                      })
                        .then((r) => r.text())
                        .then(() => window.location.reload());
                    }}
                    loading={isSubmitting && actionData?.intent === "test"}
                    disabled={
                      !formData.apiKey || !formData.baseUrl || !formData.modelName
                    }
                  >
                    Test Key
                  </Button>
                </Box>
              </Box>
            </BlockStack>
          </Form>
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete API Key"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: () => {
            document.getElementById("delete-form").requestSubmit();
            setDeleteTarget(null);
          },
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
            <Form method="POST" id="delete-form">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={deleteTarget.id} />
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd">
                  Are you sure you want to delete{" "}
                  <strong>{deleteTarget.name}</strong>?
                </Text>
                <Banner tone="warning">
                  <Text as="p" variant="bodyMd">
                    This action cannot be undone. Make sure other active keys
                    exist before deleting.
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