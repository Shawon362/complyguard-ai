import { useLoaderData, Link } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  Text,
  Badge,
  InlineStack,
  Box,
  Divider,
  EmptyState,
  Icon,
  Layout,
} from "@shopify/polaris";
import {
  ChartLineIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CheckIcon,
  ProductIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

// ============================================================
// LOADER
// ============================================================
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const scans = await prisma.scan.findMany({
    where: { shop, status: "completed" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      issues: { select: { id: true, status: true } },
    },
  });

  return { scans, shop };
};

// ============================================================
// Helper: Grade color
// ============================================================
function getGradeColor(grade) {
  switch (grade) {
    case "A": return "#00A47C";
    case "B": return "#5C8D89";
    case "C": return "#F49342";
    case "D": return "#D72C0D";
    case "F": return "#8E1F0B";
    default: return "#6D7175";
  }
}

// ============================================================
// Helper: Format date
// ============================================================
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// Helper: Time ago
// ============================================================
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ============================================================
// Reusable: Stat Block
// ============================================================
function StatBlock({ icon, label, value, valueColor, suffix }) {
  return (
    <BlockStack gap="100">
      <InlineStack gap="150" blockAlign="center">
        <div style={{ width: "16px", height: "16px" }}>
          <Icon source={icon} tone="subdued" />
        </div>
        <Text as="p" variant="bodySm" tone="subdued">
          {label}
        </Text>
      </InlineStack>
      <InlineStack gap="200" blockAlign="center">
        <Text as="p" variant="heading2xl">
          <span style={{ color: valueColor || "inherit" }}>{value}</span>
        </Text>
        {suffix}
      </InlineStack>
    </BlockStack>
  );
}

// ============================================================
// UI
// ============================================================
export default function ScanHistory() {
  const { scans } = useLoaderData();

  // Empty state
  if (!scans || scans.length === 0) {
    return (
      <Page title="Scan History" fullWidth>
        <Card>
          <EmptyState
            heading="No scans yet"
            action={{ content: "Run your first scan", url: "/app" }}
            image=""
          >
            <p>
              Run your first compliance scan from the dashboard to see results here.
            </p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  // Calculate stats
  const totalScans = scans.length;
  const latestScan = scans[0];
  const previousScan = scans[1];

  const scoreChange = previousScan
    ? latestScan.score - previousScan.score
    : 0;

  const trendIcon = scoreChange > 0
    ? ArrowUpIcon
    : scoreChange < 0
    ? ArrowDownIcon
    : ArrowRightIcon;

  const trendColor = scoreChange > 0
    ? "#00A47C"
    : scoreChange < 0
    ? "#D72C0D"
    : "#6D7175";

  const openIssuesLatest = latestScan.issues?.filter(
    (i) => i.status === "open" || i.status === "pending"
  ).length || 0;

  return (
    <Page title="Scan History" subtitle={`${totalScans} compliance scans`} fullWidth>
      <BlockStack gap="500">
        {/* Stats Overview */}
        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <div style={{ width: "20px", height: "20px" }}>
                  <Icon source={ChartLineIcon} tone="base" />
                </div>
                <Text as="h2" variant="headingMd">
                  Compliance Trend
                </Text>
              </InlineStack>
              <Divider />

              <InlineStack gap="800" wrap>
                <StatBlock
                  icon={ChartLineIcon}
                  label="Latest Score"
                  value={latestScan.score || 0}
                  suffix={
                    <div style={{
                      padding: "4px 10px",
                      borderRadius: "100px",
                      background: getGradeColor(latestScan.grade),
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}>
                      {latestScan.grade || "—"}
                    </div>
                  }
                />

                {previousScan && (
                  <StatBlock
                    icon={trendIcon}
                    label="Change from last scan"
                    value={`${scoreChange > 0 ? "+" : ""}${scoreChange}`}
                    valueColor={trendColor}
                  />
                )}

                <StatBlock
                  icon={CalendarIcon}
                  label="Total Scans"
                  value={totalScans}
                />

                <StatBlock
                  icon={AlertTriangleIcon}
                  label="Open Issues"
                  value={openIssuesLatest}
                  valueColor={openIssuesLatest > 0 ? "#D72C0D" : "#00A47C"}
                />
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>

        {/* Scan List */}
        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                All Scans
              </Text>
              <Divider />

              <BlockStack gap="300">
                {scans.map((scan, index) => {
                  const openIssues = scan.issues?.filter(
                    (i) => i.status === "open" || i.status === "pending"
                  ).length || 0;
                  const fixedIssues = scan.issues?.filter((i) => i.status === "fixed").length || 0;

                  return (
                    <Link
                      key={scan.id}
                      to={`/app/history/${scan.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          padding: "20px",
                          background: "white",
                          border: "1px solid #E1E3E5",
                          borderRadius: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#5C6AC4";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(92, 106, 196, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#E1E3E5";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <InlineStack
                          gap="400"
                          blockAlign="center"
                          align="space-between"
                          wrap={false}
                        >
                          {/* Left: Grade Circle */}
                          <InlineStack gap="400" blockAlign="center">
                            <div style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: getGradeColor(scan.grade),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "24px",
                              fontWeight: "700",
                              flexShrink: 0,
                            }}>
                              {scan.grade || "—"}
                            </div>

                            <BlockStack gap="100">
                              <InlineStack gap="200" blockAlign="center">
                                <Text as="h3" variant="headingMd">
                                  Score: {scan.score || 0}/100
                                </Text>
                                {index === 0 && (
                                  <Badge tone="success">Latest</Badge>
                                )}
                              </InlineStack>
                              <InlineStack gap="150" blockAlign="center">
                                <div style={{ width: "14px", height: "14px" }}>
                                  <Icon source={CalendarIcon} tone="subdued" />
                                </div>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {formatDate(scan.completedAt || scan.createdAt)} • {timeAgo(scan.createdAt)}
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </InlineStack>

                          {/* Right: Issue Stats */}
                          <InlineStack gap="600" blockAlign="center">
                            <BlockStack gap="050" align="center">
                              <InlineStack gap="100" blockAlign="center">
                                <div style={{ width: "14px", height: "14px" }}>
                                  <Icon source={AlertTriangleIcon} tone="subdued" />
                                </div>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Open
                                </Text>
                              </InlineStack>
                              <Text as="p" variant="headingLg">
                                <span style={{ color: openIssues > 0 ? "#D72C0D" : "#00A47C" }}>
                                  {openIssues}
                                </span>
                              </Text>
                            </BlockStack>

                            <BlockStack gap="050" align="center">
                              <InlineStack gap="100" blockAlign="center">
                                <div style={{ width: "14px", height: "14px" }}>
                                  <Icon source={CheckIcon} tone="subdued" />
                                </div>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Fixed
                                </Text>
                              </InlineStack>
                              <Text as="p" variant="headingLg">
                                <span style={{ color: "#00A47C" }}>{fixedIssues}</span>
                              </Text>
                            </BlockStack>

                            <BlockStack gap="050" align="center">
                              <InlineStack gap="100" blockAlign="center">
                                <div style={{ width: "14px", height: "14px" }}>
                                  <Icon source={ProductIcon} tone="subdued" />
                                </div>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Products
                                </Text>
                              </InlineStack>
                              <Text as="p" variant="headingLg">
                                {scan.totalProducts || 0}
                              </Text>
                            </BlockStack>

                            <div style={{ width: "20px", height: "20px" }}>
                              <Icon source={ArrowRightIcon} tone="subdued" />
                            </div>
                          </InlineStack>
                        </InlineStack>
                      </div>
                    </Link>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}