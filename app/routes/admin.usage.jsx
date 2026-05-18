import { useLoaderData } from "react-router";
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
  DataTable,
  EmptyState,
  Icon,
} from "@shopify/polaris";
import {
  ChartLineIcon,
  CashDollarIcon,
  ImageIcon,
  CalendarIcon,
} from "@shopify/polaris-icons";

// ============================================================
// CONFIG
// ============================================================
const COST_PER_IMAGE = 0.0001; // $0.0001 per image (Gemini Flash estimate)

// ============================================================
// LOADER
// ============================================================
export const loader = async () => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // === Today's API calls (from Scan.imagesProcessed) ===
  const todayResult = await prisma.scan.aggregate({
    where: { createdAt: { gte: todayStart } },
    _sum: { imagesProcessed: true },
    _count: true,
  });
  const todayApiCalls = todayResult._sum.imagesProcessed || 0;
  const todayScansCount = todayResult._count;

  // === Yesterday for comparison ===
  const yesterdayResult = await prisma.scan.aggregate({
    where: {
      createdAt: { gte: yesterdayStart, lt: todayStart },
    },
    _sum: { imagesProcessed: true },
  });
  const yesterdayApiCalls = yesterdayResult._sum.imagesProcessed || 0;

  // === This month ===
  const monthResult = await prisma.scan.aggregate({
    where: { createdAt: { gte: monthStart } },
    _sum: { imagesProcessed: true },
    _count: true,
  });
  const monthApiCalls = monthResult._sum.imagesProcessed || 0;
  const monthScansCount = monthResult._count;

  // === Last 30 days daily breakdown ===
  const dailyUsage = [];
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayData = await prisma.scan.aggregate({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
      _sum: { imagesProcessed: true },
    });

    dailyUsage.push({
      date: dayStart,
      count: dayData._sum.imagesProcessed || 0,
    });
  }

  // === Top consumers (this month) ===
  const topConsumersRaw = await prisma.scan.groupBy({
    by: ["shop"],
    where: { createdAt: { gte: monthStart } },
    _sum: { imagesProcessed: true },
    _count: true,
    orderBy: { _sum: { imagesProcessed: "desc" } },
    take: 10,
  });

  const topConsumers = await Promise.all(
    topConsumersRaw.map(async (item) => {
      const merchant = await prisma.merchant.findUnique({
        where: { shop: item.shop },
      });
      const apiCalls = item._sum.imagesProcessed || 0;
      return {
        shop: item.shop,
        merchantId: merchant?.id || null,
        plan: merchant?.plan || "unknown",
        scansCount: item._count,
        apiCalls,
        cost: apiCalls * COST_PER_IMAGE,
      };
    })
  );

  // Max for chart scaling
  const maxDailyCount = Math.max(...dailyUsage.map((d) => d.count), 1);

  return {
    today: {
      apiCalls: todayApiCalls,
      yesterday: yesterdayApiCalls,
      scansCount: todayScansCount,
    },
    month: {
      apiCalls: monthApiCalls,
      cost: monthApiCalls * COST_PER_IMAGE,
      scansCount: monthScansCount,
    },
    dailyUsage,
    topConsumers,
    maxDailyCount,
  };
};

// ============================================================
// HELPERS
// ============================================================
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function PlanBadge({ plan }) {
  const map = {
    free: { tone: undefined, label: "Free" },
    starter: { tone: "info", label: "Starter" },
    growth: { tone: "success", label: "Growth" },
    unknown: { tone: undefined, label: "Unknown" },
  };
  const v = map[plan] || map.unknown;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function getTrend(current, previous) {
  if (previous === 0) {
    return current > 0 ? { direction: "up", percent: 100 } : null;
  }
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change >= 0 ? "up" : "down",
    percent: Math.abs(Math.round(change)),
  };
}

// ============================================================
// COMPONENTS
// ============================================================
function StatCard({ label, value, subtitle, trend, icon }) {
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
        {trend && (
          <Text
            as="p"
            variant="bodySm"
            tone={trend.direction === "up" ? "success" : "critical"}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.percent}% vs yesterday
          </Text>
        )}
        {subtitle && !trend && (
          <Text as="p" variant="bodySm" tone="subdued">
            {subtitle}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

function DailyChart({ dailyUsage, maxCount }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "4px",
        height: "160px",
        padding: "16px 0",
      }}
    >
      {dailyUsage.map((day, index) => {
        const heightPercent = (day.count / maxCount) * 100;
        return (
          <div
            key={index}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              minWidth: 0,
            }}
            title={`${formatDate(day.date)}: ${day.count} calls`}
          >
            <div
              style={{
                width: "100%",
                height: `${Math.max(heightPercent, 2)}%`,
                background:
                  day.count > 0
                    ? "var(--p-color-bg-fill-brand)"
                    : "var(--p-color-bg-surface-tertiary)",
                borderRadius: "3px 3px 0 0",
                transition: "all 0.2s",
                minHeight: "2px",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function AdminUsage() {
  const { today, month, dailyUsage, topConsumers, maxDailyCount } =
    useLoaderData();

  const todayTrend = getTrend(today.apiCalls, today.yesterday);

  const consumerRows = topConsumers.map((c) => [
    <Text as="span" variant="bodyMd" fontWeight="semibold" key={c.shop}>
      {c.shop}
    </Text>,
    <PlanBadge plan={c.plan} key={c.shop + "-p"} />,
    <Text as="span" variant="bodyMd" key={c.shop + "-s"}>
      {c.scansCount}
    </Text>,
    <Text as="span" variant="bodyMd" key={c.shop + "-a"}>
      {c.apiCalls.toLocaleString()}
    </Text>,
    <Text as="span" variant="bodyMd" tone="subdued" key={c.shop + "-c"}>
      ${c.cost.toFixed(4)}
    </Text>,
  ]);

  return (
    <Page
      title="API Usage"
      subtitle="Track AI API calls, costs, and consumption across all merchants"
      fullWidth
    >
      <Layout>
        {/* Stat Cards */}
        <Layout.Section>
          <div className="admin-stat-grid">
            <StatCard
              label="API Calls Today"
              value={today.apiCalls.toLocaleString()}
              trend={todayTrend}
              icon={ChartLineIcon}
            />
            <StatCard
              label="Scans Today"
              value={today.scansCount.toLocaleString()}
              subtitle={`${today.apiCalls > 0 ? Math.round(today.apiCalls / Math.max(today.scansCount, 1)) : 0} avg images/scan`}
              icon={CalendarIcon}
            />
            <StatCard
              label="This Month"
              value={month.apiCalls.toLocaleString()}
              subtitle={`${month.scansCount} scans completed`}
              icon={ImageIcon}
            />
            <StatCard
              label="Monthly Cost"
              value={`$${month.cost.toFixed(2)}`}
              subtitle={`Est. at $${COST_PER_IMAGE} per image`}
              icon={CashDollarIcon}
            />
          </div>
        </Layout.Section>

        {/* Daily Chart */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h3" variant="headingMd">
                    Daily API Calls (Last 30 Days)
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total:{" "}
                    {dailyUsage
                      .reduce((s, d) => s + d.count, 0)
                      .toLocaleString()}{" "}
                    calls
                  </Text>
                </BlockStack>
                <Text as="span" variant="bodySm" tone="subdued">
                  Peak: {maxDailyCount.toLocaleString()}
                </Text>
              </InlineStack>

              <Divider />

              <DailyChart dailyUsage={dailyUsage} maxCount={maxDailyCount} />

              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">
                  {formatDate(dailyUsage[0].date)}
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  {formatDate(dailyUsage[dailyUsage.length - 1].date)}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Top Consumers */}
        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  Top Consumers This Month
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Merchants using the most API calls
                </Text>
              </BlockStack>
            </Box>
            <Divider />
            {topConsumers.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No usage yet this month"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>API usage will appear here when merchants run scans.</p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "numeric", "numeric"]}
                headings={["Shop", "Plan", "Scans", "API Calls", "Est. Cost"]}
                rows={consumerRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>

        {/* Info Card */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                About These Metrics
              </Text>
              <Divider />
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>API Calls</strong> = Total images analyzed by AI (sum
                  of imagesProcessed from all scans).
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>Scans</strong> = Number of scan operations run by
                  merchants.
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>Est. Cost</strong> = Approximate at $
                  {COST_PER_IMAGE} per image. Actual cost depends on AI provider
                  pricing.
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  <strong>Provider</strong> = Currently using Gemini 2.5 Flash
                  via Oxyy API.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}