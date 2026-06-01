import { useLoaderData, useOutletContext } from "react-router";
import {
  Page,
  Card,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  DataTable,
  EmptyState,
  ProgressBar,
  Box,
  Divider,
  Icon,
} from "@shopify/polaris";
import {
  PersonIcon,
  CashDollarIcon,
  ChartLineIcon,
  LightbulbIcon,
} from "@shopify/polaris-icons";

// LOADER
export const loader = async ({ request }) => {
  // admin already authenticated by parent admin.jsx
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const totalMerchants = await prisma.merchant.count();

  const merchantsByPlan = await prisma.merchant.groupBy({
    by: ["plan"],
    _count: true,
  });

  const planCounts = { free: 0, starter: 0, growth: 0 };
  merchantsByPlan.forEach((p) => {
    planCounts[p.plan] = p._count;
  });

  const activeSubscriptions = planCounts.starter + planCounts.growth;
  const monthlyRevenue =
    planCounts.starter * 9.99 + planCounts.growth * 29.99;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayScans = await prisma.scan.count({
    where: { createdAt: { gte: todayStart } },
  });

  const recentMerchants = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    stats: {
      totalMerchants,
      activeSubscriptions,
      monthlyRevenue: monthlyRevenue.toFixed(2),
      todayScans,
      planCounts,
    },
    recentMerchants,
  };
};

// HELPERS
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function StatCard({ label, value, icon }) {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="bodySm" tone="subdued">
            {label}
          </Text>
          <Box background="bg-surface-secondary" padding="150" borderRadius="200">
            <Icon source={icon} tone="base" />
          </Box>
        </InlineStack>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}

function PlanRow({ name, count, total, tone }) {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <BlockStack gap="150">
      <InlineStack align="space-between">
        <Text as="span" variant="bodyMd" fontWeight="medium">
          {name}
        </Text>
        <Text as="span" variant="bodyMd" tone="subdued">
          {count} ({percent}%)
        </Text>
      </InlineStack>
      <ProgressBar progress={percent} tone={tone} size="small" />
    </BlockStack>
  );
}

// MAIN
export default function AdminDashboard() {
  const { stats, recentMerchants } = useLoaderData();
  const { admin } = useOutletContext();
  const tableRows = recentMerchants.map((m) => [
    <Text as="span" variant="bodyMd" fontWeight="medium" key={m.id}>
      {m.shop}
    </Text>,
    <PlanBadge plan={m.plan} key={m.id + "-p"} />,
    <Text as="span" variant="bodyMd" tone="subdued" key={m.id + "-d"}>
      {formatDate(m.createdAt)}
    </Text>,
  ]);

  return (
    <Page
      title={`Welcome back, ${admin.name.split(" ")[0]}`}
      subtitle="Here's what's happening with ComplyGuard AI today."
      fullWidth
    >
      <Layout fluid>
        {/* Stat Cards */}
        <Layout.Section>
          <div className="admin-stat-grid">
            <StatCard label="Total Merchants" value={stats.totalMerchants} icon={PersonIcon} />
            <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} icon={LightbulbIcon} />
            <StatCard label="Monthly Revenue" value={`$${stats.monthlyRevenue}`} icon={CashDollarIcon} />
            <StatCard label="Scans Today" value={stats.todayScans} icon={ChartLineIcon} />
          </div>
        </Layout.Section>

        {/* Plan + Recent */}
        <Layout.Section>
          <div className="admin-two-col">
            {/* Plan Distribution */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Plan Distribution</Text>
                <Divider />
                <BlockStack gap="400">
                  <PlanRow name="Free" count={stats.planCounts.free} total={stats.totalMerchants} tone="primary" />
                  <PlanRow name="Starter" count={stats.planCounts.starter} total={stats.totalMerchants} tone="primary" />
                  <PlanRow name="Growth" count={stats.planCounts.growth} total={stats.totalMerchants} tone="success" />
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Recent Signups */}
            <Card padding="0">
              <Box padding="400">
                <Text as="h3" variant="headingMd">Recent Signups</Text>
              </Box>
              <Divider />
              {recentMerchants.length === 0 ? (
                <Box padding="800">
                  <EmptyState
                    heading="No merchants yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>When merchants install your app, they'll appear here.</p>
                  </EmptyState>
                </Box>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text"]}
                  headings={["Shop", "Plan", "Joined"]}
                  rows={tableRows}
                  hideScrollIndicator
                />
              )}
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}