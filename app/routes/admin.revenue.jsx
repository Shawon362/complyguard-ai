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
  ProgressBar,
  DataTable,
  EmptyState,
  Icon,
} from "@shopify/polaris";
import {
  CashDollarIcon,
  ChartLineIcon,
  PersonIcon,
  CalendarIcon,
} from "@shopify/polaris-icons";

// ============================================================
// PLAN PRICING CONFIG
// ============================================================
const PLAN_PRICES = {
  free: 0,
  starter: 9.99,
  growth: 29.99,
};

const PLAN_LABELS = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
};

// ============================================================
// LOADER
// ============================================================
export const loader = async () => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  // === Plan distribution ===
  const merchantsByPlan = await prisma.merchant.groupBy({
    by: ["plan"],
    _count: true,
  });

  const planCounts = { free: 0, starter: 0, growth: 0 };
  merchantsByPlan.forEach((p) => {
    if (planCounts.hasOwnProperty(p.plan)) {
      planCounts[p.plan] = p._count;
    }
  });

  const totalMerchants =
    planCounts.free + planCounts.starter + planCounts.growth;
  const paidMerchants = planCounts.starter + planCounts.growth;
  const freeMerchants = planCounts.free;

  // === Revenue calculations ===
  const mrr =
    planCounts.starter * PLAN_PRICES.starter +
    planCounts.growth * PLAN_PRICES.growth;

  const arr = mrr * 12;

  const arpu = paidMerchants > 0 ? mrr / paidMerchants : 0;

  // Revenue per plan
  const revenueByPlan = {
    starter: planCounts.starter * PLAN_PRICES.starter,
    growth: planCounts.growth * PLAN_PRICES.growth,
  };

  // === Conversion rate ===
  const conversionRate =
    totalMerchants > 0
      ? Math.round((paidMerchants / totalMerchants) * 100)
      : 0;

  // === Plan upgrade dates (growth tracking) ===
  // Get merchants by their plan start dates
  const now = new Date();
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  const newPaidThisMonth = await prisma.merchant.count({
    where: {
      plan: { in: ["starter", "growth"] },
      planStartDate: { gte: last30Days },
    },
  });

  const newSignupsThisMonth = await prisma.merchant.count({
    where: {
      createdAt: { gte: last30Days },
    },
  });

  // === Recent paid merchants ===
  const recentPaidMerchants = await prisma.merchant.findMany({
    where: {
      plan: { in: ["starter", "growth"] },
    },
    orderBy: { planStartDate: "desc" },
    take: 10,
  });

  return {
    counts: {
      total: totalMerchants,
      free: freeMerchants,
      paid: paidMerchants,
      starter: planCounts.starter,
      growth: planCounts.growth,
    },
    revenue: {
      mrr,
      arr,
      arpu,
      byPlan: revenueByPlan,
    },
    metrics: {
      conversionRate,
      newPaidThisMonth,
      newSignupsThisMonth,
    },
    recentPaidMerchants,
  };
};

// ============================================================
// HELPERS
// ============================================================
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(date) {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
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

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ label, value, subtitle, icon, tone }) {
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
        <Text as="p" variant="heading2xl" tone={tone}>
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

// ============================================================
// PLAN REVENUE ROW
// ============================================================
function PlanRevenueRow({ name, count, price, revenue, totalRevenue, color }) {
  const percent =
    totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;

  return (
    <BlockStack gap="200">
      <InlineStack align="space-between">
        <InlineStack gap="200" blockAlign="center">
          <Text as="span" variant="bodyMd" fontWeight="medium">
            {name}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            ({count} × ${price})
          </Text>
        </InlineStack>
        <InlineStack gap="200" blockAlign="center">
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {formatCurrency(revenue)}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {percent}%
          </Text>
        </InlineStack>
      </InlineStack>
      <ProgressBar progress={percent} tone={color} size="small" />
    </BlockStack>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function AdminRevenue() {
  const { counts, revenue, metrics, recentPaidMerchants } = useLoaderData();

  // Recent paid merchants table
  const recentRows = recentPaidMerchants.map((m) => [
    <Text as="span" variant="bodyMd" fontWeight="semibold" key={m.id}>
      {m.shop}
    </Text>,
    <PlanBadge plan={m.plan} key={m.id + "-p"} />,
    <Text as="span" variant="bodyMd" key={m.id + "-r"}>
      {formatCurrency(PLAN_PRICES[m.plan])}/mo
    </Text>,
    <Text as="span" variant="bodyMd" tone="subdued" key={m.id + "-d"}>
      {formatDate(m.planStartDate)}
    </Text>,
    <Text as="span" variant="bodyMd" tone="subdued" key={m.id + "-s"}>
      {daysSince(m.planStartDate) || "—"}
    </Text>,
  ]);

  return (
    <Page
      title="Revenue"
      subtitle="Monitor business performance, MRR, and growth metrics"
      fullWidth
    >
      <Layout>
        {/* Top Stat Cards */}
        <Layout.Section>
          <div className="admin-stat-grid">
            <StatCard
              label="Monthly Recurring Revenue"
              value={formatCurrency(revenue.mrr)}
              subtitle={`${counts.paid} paying customers`}
              icon={CashDollarIcon}
              tone="success"
            />
            <StatCard
              label="Annual Run Rate"
              value={formatCurrency(revenue.arr)}
              subtitle="At current MRR"
              icon={ChartLineIcon}
            />
            <StatCard
              label="Avg Revenue Per User"
              value={formatCurrency(revenue.arpu)}
              subtitle="Per paying customer"
              icon={PersonIcon}
            />
            <StatCard
              label="Conversion Rate"
              value={`${metrics.conversionRate}%`}
              subtitle={`${counts.paid} of ${counts.total} merchants`}
              icon={CalendarIcon}
            />
          </div>
        </Layout.Section>

        {/* Revenue Breakdown + Plan Distribution */}
        <Layout.Section>
          <div className="admin-two-col">
            {/* Revenue by Plan */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Revenue Breakdown
                </Text>
                <Divider />
                {revenue.mrr === 0 ? (
                  <Box padding="400">
                    <EmptyState
                      heading="No revenue yet"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>Revenue will appear when merchants upgrade to paid plans.</p>
                    </EmptyState>
                  </Box>
                ) : (
                  <BlockStack gap="500">
                    <PlanRevenueRow
                      name="Starter"
                      count={counts.starter}
                      price={PLAN_PRICES.starter}
                      revenue={revenue.byPlan.starter}
                      totalRevenue={revenue.mrr}
                      color="primary"
                    />
                    <PlanRevenueRow
                      name="Growth"
                      count={counts.growth}
                      price={PLAN_PRICES.growth}
                      revenue={revenue.byPlan.growth}
                      totalRevenue={revenue.mrr}
                      color="success"
                    />
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        Total MRR
                      </Text>
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        {formatCurrency(revenue.mrr)}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Customer Distribution
                </Text>
                <Divider />
                <BlockStack gap="500">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        Free Users
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Not paying
                      </Text>
                    </BlockStack>
                    <Text as="span" variant="headingLg" tone="subdued">
                      {counts.free}
                    </Text>
                  </InlineStack>

                  <Divider />

                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        Starter
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        ${PLAN_PRICES.starter}/month each
                      </Text>
                    </BlockStack>
                    <Text as="span" variant="headingLg">
                      {counts.starter}
                    </Text>
                  </InlineStack>

                  <Divider />

                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        Growth
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        ${PLAN_PRICES.growth}/month each
                      </Text>
                    </BlockStack>
                    <Text as="span" variant="headingLg" tone="success">
                      {counts.growth}
                    </Text>
                  </InlineStack>

                  <Divider />

                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      Total
                    </Text>
                    <Text as="span" variant="headingLg" fontWeight="bold">
                      {counts.total}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        {/* Growth Metrics */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Last 30 Days Activity
              </Text>
              <Divider />
              <div className="admin-stat-grid">
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    New Signups
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {metrics.newSignupsThisMonth}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Merchants installed in last 30 days
                  </Text>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    New Paid Subscriptions
                  </Text>
                  <Text as="p" variant="heading2xl" tone="success">
                    {metrics.newPaidThisMonth}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Upgraded to paid in last 30 days
                  </Text>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Recent Conversion Rate
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {metrics.newSignupsThisMonth > 0
                      ? Math.round(
                          (metrics.newPaidThisMonth /
                            metrics.newSignupsThisMonth) *
                            100
                        )
                      : 0}
                    %
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Of new signups, how many paid
                  </Text>
                </BlockStack>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Recent Paid Customers */}
        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  Recent Paid Customers
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Latest merchants on paid plans
                </Text>
              </BlockStack>
            </Box>
            <Divider />
            {recentPaidMerchants.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading="No paid customers yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Paid subscriptions will appear here when merchants upgrade.</p>
                </EmptyState>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text", "text"]}
                headings={[
                  "Shop",
                  "Plan",
                  "Revenue",
                  "Subscribed",
                  "Customer Since",
                ]}
                rows={recentRows}
                hideScrollIndicator
              />
            )}
          </Card>
        </Layout.Section>

        {/* Pricing Reference */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Pricing Reference
              </Text>
              <Divider />
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd">
                    Free Plan
                  </Text>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    $0/month
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd">
                    Starter Plan
                  </Text>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    ${PLAN_PRICES.starter}/month
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd">
                    Growth Plan
                  </Text>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    ${PLAN_PRICES.growth}/month
                  </Text>
                </InlineStack>
              </BlockStack>
              <Text as="p" variant="bodySm" tone="subdued">
                To update prices: Edit{" "}
                <code>PLAN_PRICES</code> in{" "}
                <code>app/routes/admin.revenue.jsx</code>
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}