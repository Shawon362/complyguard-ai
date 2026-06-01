import { useState, useCallback } from "react";
import { useLoaderData, useSearchParams, Link } from "react-router";
import {
  Page,
  Card,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Box,
  TextField,
  Button,
  EmptyState,
  IndexTable,
  Icon,
  useBreakpoints,
} from "@shopify/polaris";
import { SearchIcon, ViewIcon } from "@shopify/polaris-icons";

import { checkScanLimit } from "../utils/planLimits";

// ============================================================
// LOADER
// ============================================================
export const loader = async ({ request }) => {
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const planFilter = url.searchParams.get("plan") || "";

  const where = {};
  if (search) {
    where.shop = { contains: search };
  }
  if (planFilter && planFilter !== "all") {
    where.plan = planFilter;
  }

  const merchants = await prisma.merchant.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const merchantsWithStats = await Promise.all(
    merchants.map(async (m) => {
      const scanCount = await prisma.scan.count({ where: { shop: m.shop } });
      const issueCount = await prisma.issue.count({
        where: { shop: m.shop, status: "open" },
      });
      const lastScan = await prisma.scan.findFirst({
        where: { shop: m.shop },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      const limitInfo = await checkScanLimit(prisma, m.shop);

      return {
        ...m,
        scanCount,
        openIssues: issueCount,
        lastScanDate: lastScan?.createdAt || null,
        quotaUsed: limitInfo.used,
        quotaLimit: limitInfo.limit,
        canScan: limitInfo.canScan,
        isOverride: limitInfo.isOverride,
      };
    })
  );

  const totals = {
    all: await prisma.merchant.count(),
    free: await prisma.merchant.count({ where: { plan: "free" } }),
    starter: await prisma.merchant.count({ where: { plan: "starter" } }),
    growth: await prisma.merchant.count({ where: { plan: "growth" } }),
  };

  return {
    merchants: merchantsWithStats,
    totals,
    search,
    planFilter,
  };
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

function getDaysAgo(date) {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
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
// MOBILE: Merchant Card Component
// ============================================================
function MerchantCard({ merchant, isLast }) {
  const detailUrl = `/admin/merchants/${merchant.id}`;

  return (
    <Box
      padding="400"
      borderBlockEndWidth={isLast ? "0" : "025"}
      borderColor="border"
    >
      <BlockStack gap="300">
        {/* Header: Shop name + Plan badge */}
        <InlineStack align="space-between" blockAlign="start" gap="200" wrap={false}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link
              to={detailUrl}
              style={{
                color: "var(--p-color-text-link, #005bd3)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
                wordBreak: "break-word",
              }}
            >
              {merchant.shop}
            </Link>
          </div>
          <PlanBadge plan={merchant.plan} />
        </InlineStack>

        {/* Stats: 3 columns */}
        <InlineStack gap="400" wrap={false}>
          <StatBlock label="Scans" value={merchant.scanCount} />
          <StatBlock
            label="Open Issues"
            value={merchant.openIssues}
            isWarning={merchant.openIssues > 0}
          />
          <StatBlock
            label="Quota"
            value={`${merchant.quotaUsed}/${merchant.quotaLimit}`}
            isCritical={!merchant.canScan}
          />
        </InlineStack>

        {/* Badges row (if any) */}
        {(merchant.isOverride || !merchant.canScan) && (
          <InlineStack gap="100" wrap>
            {merchant.isOverride && (
              <Badge tone="info" size="small">Custom limit</Badge>
            )}
            {!merchant.canScan && (
              <Badge tone="critical" size="small">At limit</Badge>
            )}
          </InlineStack>
        )}

        {/* Footer: Dates + View button */}
        <InlineStack align="space-between" blockAlign="center" gap="200" wrap>
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Last activity: {getDaysAgo(merchant.lastScanDate)}
            </Text>
            <Text as="span" variant="bodySm" tone="subdued">
              Joined: {formatDate(merchant.createdAt)}
            </Text>
          </BlockStack>
          <Link to={detailUrl} style={{ textDecoration: "none" }}>
            <Button size="slim" icon={ViewIcon}>
              View
            </Button>
          </Link>
        </InlineStack>
      </BlockStack>
    </Box>
  );
}

function StatBlock({ label, value, isCritical, isWarning }) {
  return (
    <BlockStack gap="050">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Text
        as="span"
        variant="bodyMd"
        fontWeight="semibold"
        tone={isCritical ? "critical" : isWarning ? "caution" : undefined}
      >
        {value}
      </Text>
    </BlockStack>
  );
}

// ============================================================
// COMPONENT
// ============================================================
export default function AdminMerchants() {
  const { merchants, totals, search, planFilter } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);

  // 🆕 Detect mobile breakpoint
  const { mdDown } = useBreakpoints();

  const handleSearchChange = useCallback(
    (value) => {
      setSearchInput(value);
      clearTimeout(window.__merchantSearchTimer);
      window.__merchantSearchTimer = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }
        setSearchParams(params);
      }, 400);
    },
    [searchParams, setSearchParams]
  );

  const handlePlanFilter = (plan) => {
    const params = new URLSearchParams(searchParams);
    if (plan === "all") {
      params.delete("plan");
    } else {
      params.set("plan", plan);
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const hasFilters = search || planFilter;

  const resourceName = {
    singular: "merchant",
    plural: "merchants",
  };

  // Desktop table rows (Column order FIXED to match headers)
  const rowMarkup = merchants.map((merchant, index) => {
    const detailUrl = `/admin/merchants/${merchant.id}`;

    return (
      <IndexTable.Row id={merchant.id} key={merchant.id} position={index}>
        {/* 1. Shop */}
        <IndexTable.Cell>
          <Link
            to={detailUrl}
            style={{
              color: "var(--p-color-text-link, #005bd3)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {merchant.shop}
          </Link>
        </IndexTable.Cell>

        {/* 2. Plan */}
        <IndexTable.Cell>
          <PlanBadge plan={merchant.plan} />
        </IndexTable.Cell>

        {/* 3. Scans */}
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {merchant.scanCount}
          </Text>
        </IndexTable.Cell>

        {/* 4. Open Issues */}
        <IndexTable.Cell>
          {merchant.openIssues > 0 ? (
            <Badge tone="warning">{`${merchant.openIssues} open`}</Badge>
          ) : (
            <Text as="span" variant="bodyMd" tone="subdued">
              0
            </Text>
          )}
        </IndexTable.Cell>

        {/* 5. Quota (FIXED — was in wrong position) */}
        <IndexTable.Cell>
          <InlineStack gap="100" blockAlign="center" wrap={false}>
            <Text
              as="span"
              variant="bodyMd"
              tone={!merchant.canScan ? "critical" : undefined}
              fontWeight={!merchant.canScan ? "semibold" : undefined}
            >
              {merchant.quotaUsed}/{merchant.quotaLimit}
            </Text>
            {merchant.isOverride && (
              <Badge tone="info" size="small">Custom</Badge>
            )}
            {!merchant.canScan && (
              <Badge tone="critical" size="small">At limit</Badge>
            )}
          </InlineStack>
        </IndexTable.Cell>

        {/* 6. Last Activity */}
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" tone="subdued">
            {getDaysAgo(merchant.lastScanDate)}
          </Text>
        </IndexTable.Cell>

        {/* 7. Joined */}
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" tone="subdued">
            {formatDate(merchant.createdAt)}
          </Text>
        </IndexTable.Cell>

        {/* 8. View button */}
        <IndexTable.Cell>
          <Link to={detailUrl}>
            <Button size="slim" icon={ViewIcon}>
              View
            </Button>
          </Link>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const filterChips = [
    { key: "all", label: "All", count: totals.all },
    { key: "free", label: "Free", count: totals.free },
    { key: "starter", label: "Starter", count: totals.starter },
    { key: "growth", label: "Growth", count: totals.growth },
  ];

  const currentFilter = planFilter || "all";

  return (
    <Page
      title="Merchants"
      subtitle={`${totals.all} total merchants installed your app`}
      fullWidth
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {/* Search + Filter Bar */}
            <Box padding="400" borderBlockEndWidth="025" borderColor="border">
              <BlockStack gap="300">
                <TextField
                  label="Search merchants"
                  labelHidden
                  placeholder="Search by shop name..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  prefix={<Icon source={SearchIcon} />}
                  clearButton
                  onClearButtonClick={() => handleSearchChange("")}
                  autoComplete="off"
                />

                {/* 🆕 wrap={true} → mobile-এ chips wrap হবে */}
                <InlineStack gap="200" align="start" blockAlign="center" wrap>
                  <Text as="span" variant="bodySm" tone="subdued">
                    Plan:
                  </Text>
                  {filterChips.map((chip) => (
                    <Button
                      key={chip.key}
                      size="slim"
                      variant={
                        currentFilter === chip.key ? "primary" : "tertiary"
                      }
                      onClick={() => handlePlanFilter(chip.key)}
                    >
                      {chip.label} ({chip.count})
                    </Button>
                  ))}

                  {hasFilters && (
                    <Button
                      size="slim"
                      variant="plain"
                      onClick={handleClearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </InlineStack>
              </BlockStack>
            </Box>

            {/* Conditional: Empty / Mobile Cards / Desktop Table */}
            {merchants.length === 0 ? (
              <Box padding="800">
                <EmptyState
                  heading={
                    hasFilters
                      ? "No merchants match your filters"
                      : "No merchants yet"
                  }
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    {hasFilters
                      ? "Try adjusting your search or filters."
                      : "When merchants install your app, they'll appear here."}
                  </p>
                  {hasFilters && (
                    <Box paddingBlockStart="300">
                      <Button onClick={handleClearFilters}>
                        Clear filters
                      </Button>
                    </Box>
                  )}
                </EmptyState>
              </Box>
            ) : mdDown ? (
              /* 🆕 MOBILE: Card list */
              <BlockStack gap="0">
                {merchants.map((merchant, idx) => (
                  <MerchantCard
                    key={merchant.id}
                    merchant={merchant}
                    isLast={idx === merchants.length - 1}
                  />
                ))}
              </BlockStack>
            ) : (
              /* DESKTOP: Index table */
              <IndexTable
                resourceName={resourceName}
                itemCount={merchants.length}
                selectable={false}
                headings={[
                  { title: "Shop" },
                  { title: "Plan" },
                  { title: "Scans" },
                  { title: "Open Issues" },
                  { title: "Quota" },
                  { title: "Last Activity" },
                  { title: "Joined" },
                  { title: "" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}