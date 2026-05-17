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
  Icon,
} from "@shopify/polaris";
import {
  PersonIcon,
  ChartLineIcon,
  AlertTriangleIcon,
  CalendarIcon,
} from "@shopify/polaris-icons";

// ============================================================
// LOADER — Lookup by merchant ID
// ============================================================
export const loader = async ({ params }) => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const merchantId = params.id;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    throw new Response("Merchant not found", { status: 404 });
  }

  const shop = merchant.shop;

  const scans = await prisma.scan.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const issues = await prisma.issue.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalScans = await prisma.scan.count({ where: { shop } });
  const openIssues = await prisma.issue.count({
    where: { shop, status: "open" },
  });
  const fixedIssues = await prisma.issue.count({
    where: { shop, status: "fixed" },
  });

  const rateLimit = await prisma.rateLimitOverride.findUnique({
    where: { shop },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthUsage = await prisma.apiUsage.aggregate({
    where: { shop, date: { gte: monthStart } },
    _sum: {
      callsCount: true,
      imagesProcessed: true,
      estimatedCost: true,
    },
  });

  return {
    merchant,
    scans,
    issues,
    counts: { totalScans, openIssues, fixedIssues },
    rateLimit,
    monthUsage: {
      apiCalls: monthUsage._sum.callsCount || 0,
      images: monthUsage._sum.imagesProcessed || 0,
      cost: monthUsage._sum.estimatedCost || 0,
    },
  };
};

// ============================================================
// ACTION — Save/Remove rate limit
// ============================================================
export const action = async ({ params, request }) => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;
  const { getAdminUser } = await import("../utils/admin/auth.server");

  const admin = await getAdminUser(request);
  if (!admin) return redirect("/admin/login");

  const merchantId = params.id;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });
  if (!merchant) {
    return { success: false, message: "Merchant not found" };
  }

  const shop = merchant.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save-rate-limit") {
    const dailyLimit = formData.get("dailyLimit");
    const monthlyLimit = formData.get("monthlyLimit");
    const notes = formData.get("notes") || "";

    await prisma.rateLimitOverride.upsert({
      where: { shop },
      update: {
        dailyApiLimit: dailyLimit ? parseInt(dailyLimit, 10) : null,
        monthlyApiLimit: monthlyLimit ? parseInt(monthlyLimit, 10) : null,
        notes,
        setByAdmin: admin.email,
      },
      create: {
        shop,
        dailyApiLimit: dailyLimit ? parseInt(dailyLimit, 10) : null,
        monthlyApiLimit: monthlyLimit ? parseInt(monthlyLimit, 10) : null,
        notes,
        setByAdmin: admin.email,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "set_rate_limit",
        targetShop: shop,
        details: JSON.stringify({ dailyLimit, monthlyLimit, notes }),
      },
    });

    return { success: true, message: "Rate limit updated successfully" };
  }

  if (intent === "remove-rate-limit") {
    await prisma.rateLimitOverride.deleteMany({ where: { shop } });
    await prisma.adminAuditLog.create({
      data: {
        adminEmail: admin.email,
        action: "remove_rate_limit",
        targetShop: shop,
      },
    });
    return { success: true, message: "Rate limit override removed" };
  }

  return { success: false, message: "Unknown action" };
};

// ============================================================
// HELPERS
// ============================================================
function formatDate(date) {
  if (!date) return "Never";
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

function daysSince(date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function PlanBadge({ plan }) {
  const map = {
    free: { tone: undefined, label: "Free" },
    starter: { tone: "info", label: "Starter" },
    growth: { tone: "success", label: "Growth" },
  };
  const v = map[plan] || map.free;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function SeverityBadge({ severity }) {
  const map = {
    critical: { tone: "critical", label: "Critical" },
    high: { tone: "warning", label: "High" },
    medium: { tone: "attention", label: "Medium" },
    low: { tone: undefined, label: "Low" },
  };
  const v = map[severity] || { tone: undefined, label: severity };
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function ScanStatusBadge({ status }) {
  const map = {
    completed: { tone: "success", label: "Completed" },
    running: { tone: "info", label: "Running" },
    failed: { tone: "critical", label: "Failed" },
    pending: { tone: undefined, label: "Pending" },
  };
  const v = map[status] || { tone: undefined, label: status };
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function StatCard({ label, value, subtitle, icon }) {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="bodySm" tone="subdued">
            {label}
          </Text>
          {icon && (
            <Box background="bg-surface-secondary" padding="150" borderRadius="200">
              <Icon source={icon} tone="base" />
            </Box>
          )}
        </InlineStack>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
        {subtitle && (
          <Text as="p" variant="bodySm" tone="subdued">
            {subtitle}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

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
// MAIN
// ============================================================
export default function MerchantDetail() {
  const { merchant, scans, issues, counts, rateLimit, monthUsage } =
    useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [dailyLimit, setDailyLimit] = useState(
    rateLimit?.dailyApiLimit?.toString() || ""
  );
  const [monthlyLimit, setMonthlyLimit] = useState(
    rateLimit?.monthlyApiLimit?.toString() || ""
  );
  const [notes, setNotes] = useState(rateLimit?.notes || "");

  const scanRows = scans.map((s) => [
    <Text as="span" variant="bodyMd" key={s.id}>
      {formatDateTime(s.createdAt)}
    </Text>,
    <ScanStatusBadge status={s.status} key={s.id + "-s"} />,
    <Text as="span" variant="bodyMd" key={s.id + "-g"}>
      {s.grade ? `${s.grade} (${s.score})` : "—"}
    </Text>,
    <Text as="span" variant="bodyMd" key={s.id + "-i"}>
      {s.imagesProcessed}/{s.imagesTotal}
    </Text>,
    <Text as="span" variant="bodyMd" tone="subdued" key={s.id + "-c"}>
      {s.criticalCount + s.highCount} found
    </Text>,
  ]);

  const issueRows = issues.map((i) => [
    <SeverityBadge severity={i.severity} key={i.id + "-sev"} />,
    <Text as="span" variant="bodyMd" key={i.id}>
      {i.title}
    </Text>,
    <Text as="span" variant="bodyMd" tone="subdued" key={i.id + "-cat"}>
      {i.category}
    </Text>,
    <Badge
      tone={
        i.status === "fixed"
          ? "success"
          : i.status === "acknowledged"
          ? "info"
          : undefined
      }
      key={i.id + "-st"}
    >
      {i.status}
    </Badge>,
    <Text as="span" variant="bodyMd" tone="subdued" key={i.id + "-d"}>
      {formatDate(i.createdAt)}
    </Text>,
  ]);

  return (
    <Page
      title={merchant.shop}
      subtitle={`Member since ${formatDate(merchant.createdAt)}`}
      backAction={{ content: "Merchants", url: "/admin/merchants" }}
      titleMetadata={<PlanBadge plan={merchant.plan} />}
      fullWidth
    >
      <Layout>
        {actionData?.success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => {}}>
              {actionData.message}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <div className="admin-stat-grid">
            <StatCard
              label="Current Plan"
              value={merchant.plan.charAt(0).toUpperCase() + merchant.plan.slice(1)}
              subtitle={
                merchant.planStartDate
                  ? `Since ${formatDate(merchant.planStartDate)}`
                  : "—"
              }
              icon={PersonIcon}
            />
            <StatCard
              label="Total Scans"
              value={counts.totalScans}
              subtitle={
                scans[0]
                  ? `Last: ${daysSince(scans[0].createdAt)} ago`
                  : "Never scanned"
              }
              icon={ChartLineIcon}
            />
            <StatCard
              label="Open Issues"
              value={counts.openIssues}
              subtitle={`${counts.fixedIssues} fixed`}
              icon={AlertTriangleIcon}
            />
            <StatCard
              label="API Calls (Month)"
              value={monthUsage.apiCalls}
              subtitle={`$${monthUsage.cost.toFixed(2)} estimated`}
              icon={CalendarIcon}
            />
          </div>
        </Layout.Section>

        <Layout.Section>
          <div className="admin-two-col">
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Account Information
                </Text>
                <Divider />
                <BlockStack gap="300">
                  <InfoRow label="Shop URL" value={merchant.shop} />
                  <InfoRow
                    label="Store Name"
                    value={merchant.storeName || "—"}
                  />
                  <InfoRow
                    label="Plan"
                    value={<PlanBadge plan={merchant.plan} />}
                  />
                  <InfoRow
                    label="Onboarding"
                    value={
                      merchant.onboardingDone ? (
                        <Badge tone="success">Complete</Badge>
                      ) : (
                        <Badge tone="warning">
                          {`Step ${merchant.onboardingStep}/5`}
                        </Badge>
                      )
                    }
                  />
                  <InfoRow
                    label="Joined"
                    value={formatDate(merchant.createdAt)}
                  />
                  <InfoRow
                    label="Last Updated"
                    value={formatDate(merchant.updatedAt)}
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">
                    Rate Limit Override
                  </Text>
                  {rateLimit && <Badge tone="info">Custom limit active</Badge>}
                </InlineStack>
                <Divider />
                <Text as="p" variant="bodySm" tone="subdued">
                  Set custom API limits for this merchant. Leave blank to use
                  plan defaults.
                </Text>

                <Form method="POST">
                  <input type="hidden" name="intent" value="save-rate-limit" />
                  <BlockStack gap="300">
                    <TextField
                      label="Daily API limit"
                      type="number"
                      name="dailyLimit"
                      value={dailyLimit}
                      onChange={setDailyLimit}
                      placeholder="e.g. 1000"
                      helpText="Max API calls per day"
                      autoComplete="off"
                      min={0}
                    />
                    <TextField
                      label="Monthly API limit"
                      type="number"
                      name="monthlyLimit"
                      value={monthlyLimit}
                      onChange={setMonthlyLimit}
                      placeholder="e.g. 30000"
                      helpText="Max API calls per month"
                      autoComplete="off"
                      min={0}
                    />
                    <TextField
                      label="Notes"
                      name="notes"
                      value={notes}
                      onChange={setNotes}
                      placeholder="e.g. VIP customer, increased limit"
                      multiline={2}
                      autoComplete="off"
                    />
                    <InlineStack gap="200">
                      <Button submit variant="primary" loading={isSubmitting}>
                        Save Limit
                      </Button>
                      {rateLimit && (
                        <Button
                          submit
                          tone="critical"
                          variant="plain"
                          name="intent"
                          value="remove-rate-limit"
                        >
                          Remove Override
                        </Button>
                      )}
                    </InlineStack>
                  </BlockStack>
                </Form>

                {rateLimit && rateLimit.setByAdmin && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    Last updated by {rateLimit.setByAdmin} on{" "}
                    {formatDate(rateLimit.updatedAt)}
                  </Text>
                )}
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <Text as="h3" variant="headingMd">
                Recent Scans
              </Text>
            </Box>
            <Divider />
            {scans.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No scans yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>This merchant hasn't run any scans yet.</p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Date", "Status", "Grade", "Images", "Critical/High"]}
                rows={scanRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <Text as="h3" variant="headingMd">
                Recent Issues
              </Text>
            </Box>
            <Divider />
            {issues.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No issues found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>This merchant has no compliance issues.</p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Severity", "Title", "Category", "Status", "Date"]}
                rows={issueRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}