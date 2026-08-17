import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  Text,
  Badge,
  InlineStack,
  Box,
  EmptyState,
  IndexTable,
  Banner,
  Button,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// ============================================================
// LOADER — fetch consent records for this shop
// ============================================================
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const { getPlanFeatures } = await import("../utils/planLimits");
  const features = await getPlanFeatures(prisma, shop);

  const recordsLimit = features.consentRecordsLimit === -1 ? undefined : features.consentRecordsLimit;
  const records = await prisma.consentLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: recordsLimit,
  });

  const total = await prisma.consentLog.count({ where: { shop } });
  const acceptedCount = await prisma.consentLog.count({ where: { shop, consentType: "accept_all" } });
  const rejectedCount = await prisma.consentLog.count({ where: { shop, consentType: "reject_all" } });
  const ccpaCount = await prisma.consentLog.count({ where: { shop, consentType: "ccpa_opt_out" } });
  const customCount = await prisma.consentLog.count({ where: { shop, consentType: "custom" } });

  const acceptRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

  return { records, total, acceptedCount, rejectedCount, ccpaCount, customCount, acceptRate, features };
};

// ============================================================
// COMPONENT
// ============================================================
export default function ConsentRecords() {
  const { records, total, acceptedCount, rejectedCount, ccpaCount, customCount, acceptRate, features } = useLoaderData();

  function handleExportCSV() {
    const headers = ["Record ID", "Date (UTC)", "Country", "Consent Type", "Necessary", "Analytics", "Marketing"];
    const rows = records.map((r) => [
      r.id,
      new Date(r.createdAt).toISOString(),
      r.country || "",
      r.consentType || "",
      r.necessary ? "Yes" : "No",
      r.analytics ? "Yes" : "No",
      r.marketing ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consent-records-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString();
  }

  function typeBadge(type) {
    if (type === "accept_all") return <Badge tone="success">Accepted all</Badge>;
    if (type === "reject_all") return <Badge tone="critical">Rejected all</Badge>;
    if (type === "ccpa_opt_out") return <Badge tone="warning">CCPA opt-out</Badge>;
    return <Badge tone="info">Custom</Badge>;
  }

  return (
    <Page
      title="Consent Records"
      subtitle="Proof-of-consent log for GDPR / CCPA compliance"
      primaryAction={{
        content: "Export CSV",
        onAction: handleExportCSV,
        disabled: records.length === 0,
      }}
      fullWidth
    >
      <BlockStack gap="500">
        {!features.consentAnalytics && (
          <Banner tone="info" title="Unlock consent analytics">
            <p>Upgrade to Starter or Growth to see accept rates, breakdowns, and full consent statistics.</p>
          </Banner>
        )}
        {features.consentAnalytics && (
        <InlineStack gap="400" wrap>
          <Box minWidth="150px">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Total consents</Text>
                <Text as="p" variant="headingLg">{total}</Text>
              </BlockStack>
            </Card>
          </Box>
          <Box minWidth="150px">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Accept rate</Text>
                <Text as="p" variant="headingLg">{acceptRate}%</Text>
              </BlockStack>
            </Card>
          </Box>
          <Box minWidth="150px">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Accepted all</Text>
                <Text as="p" variant="headingLg">{acceptedCount}</Text>
              </BlockStack>
            </Card>
          </Box>
          <Box minWidth="150px">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Rejected all</Text>
                <Text as="p" variant="headingLg">{rejectedCount}</Text>
              </BlockStack>
            </Card>
          </Box>
          <Box minWidth="150px">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">CCPA opt-out</Text>
                <Text as="p" variant="headingLg">{ccpaCount}</Text>
              </BlockStack>
            </Card>
          </Box>
          <Box minWidth="150px">
            <Card>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" tone="subdued">Custom</Text>
                <Text as="p" variant="headingLg">{customCount}</Text>
              </BlockStack>
            </Card>
          </Box>
        </InlineStack>
        )}

        {features.consentRecordsLimit !== -1 && total > features.consentRecordsLimit && (
          <Banner tone="warning" title={`Showing latest ${features.consentRecordsLimit} of ${total} records`}>
            <p>Upgrade to Growth for unlimited consent history and export.</p>
          </Banner>
        )}

        <Card padding="0">
          {records.length === 0 ? (
            <EmptyState
              heading="No consent records yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>When visitors interact with your cookie banner, their consent choices will appear here.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{ singular: "record", plural: "records" }}
              itemCount={records.length}
              selectable={false}
              headings={[
                { title: "Date" },
                { title: "Country" },
                { title: "Choice" },
                { title: "Analytics" },
                { title: "Marketing" },
              ]}
            >
              {records.map((r, index) => (
                <IndexTable.Row id={r.id} key={r.id} position={index}>
                  <IndexTable.Cell>{formatDate(r.createdAt)}</IndexTable.Cell>
                  <IndexTable.Cell>{r.country || "—"}</IndexTable.Cell>
                  <IndexTable.Cell>{typeBadge(r.consentType)}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {r.analytics ? <Badge tone="success">On</Badge> : <Badge>Off</Badge>}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {r.marketing ? <Badge tone="success">On</Badge> : <Badge>Off</Badge>}
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}