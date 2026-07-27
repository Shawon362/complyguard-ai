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

  const records = await prisma.consentLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = await prisma.consentLog.count({ where: { shop } });

  return { records, total };
};

// ============================================================
// COMPONENT
// ============================================================
export default function ConsentRecords() {
  const { records, total } = useLoaderData();

  function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString();
  }

  function typeBadge(type) {
    if (type === "accept_all") return <Badge tone="success">Accepted all</Badge>;
    if (type === "reject_all") return <Badge tone="critical">Rejected all</Badge>;
    return <Badge tone="info">Custom</Badge>;
  }

  return (
    <Page title="Consent Records" subtitle="Proof-of-consent log for GDPR / CCPA compliance" fullWidth>
      <BlockStack gap="500">
        <Card>
          <Box padding="400">
            <InlineStack gap="200" align="start">
              <Text as="p" variant="bodyMd">
                Total consent records stored: <Text as="span" fontWeight="bold">{total}</Text>
              </Text>
            </InlineStack>
          </Box>
        </Card>

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
                { title: "Choice" },
                { title: "Analytics" },
                { title: "Marketing" },
              ]}
            >
              {records.map((r, index) => (
                <IndexTable.Row id={r.id} key={r.id} position={index}>
                  <IndexTable.Cell>{formatDate(r.createdAt)}</IndexTable.Cell>
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