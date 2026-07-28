import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  Box,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// ============================================================
// LOADER — check plan + get store domain
// ============================================================
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const { getPlanFeatures } = await import("../utils/planLimits");
  const features = await getPlanFeatures(prisma, shop);

  return { features, shop };
};

// ============================================================
// ACTION — run the scan (Growth only)
// ============================================================
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const prismaModule = await import("../db.server");
  const prisma = prismaModule.default;

  const { getPlanFeatures } = await import("../utils/planLimits");
  const features = await getPlanFeatures(prisma, shop);

  if (!features.cookieScanner) {
    return { success: false, error: "Cookie scanner is available on the Growth plan." };
  }

  const { scanStoreForTrackers } = await import("../utils/cookieScanner");
  const result = await scanStoreForTrackers(shop);

  return { result };
};

// ============================================================
// COMPONENT
// ============================================================
export default function CookieScanner() {
  const { features } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const scanning = navigation.state === "submitting";

  const result = actionData?.result;

  function categoryTone(cat) {
    if (cat === "Marketing") return "warning";
    if (cat === "Analytics") return "info";
    return undefined;
  }

  return (
    <Page title="Cookie Scanner" subtitle="Detect tracking scripts running on your storefront" fullWidth>
      <BlockStack gap="500">
        {!features.cookieScanner && (
          <Banner tone="info" title="Cookie Scanner is a Growth feature">
            <p>Upgrade to the Growth plan to scan your storefront for tracking scripts like Google Analytics, Facebook Pixel, TikTok, and more.</p>
          </Banner>
        )}

        {features.cookieScanner && (
          <Card>
            <BlockStack gap="400">
              <Text as="p" variant="bodyMd">
                Scan your storefront to see which tracking and analytics scripts are active. This helps you disclose them correctly in your cookie banner and privacy policy.
              </Text>
              <Form method="post">
                <Button submit variant="primary" loading={scanning} size="large">
                  {scanning ? "Scanning..." : "Scan My Store"}
                </Button>
              </Form>
            </BlockStack>
          </Card>
        )}

        {actionData?.error && (
          <Banner tone="warning" title="Scan not available">
            <p>{actionData.error}</p>
          </Banner>
        )}

        {result && result.success && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">Scan Results</Text>
                <Badge tone="success">{`${result.trackers.length} found`}</Badge>
              </InlineStack>

              {result.trackers.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No known tracking scripts detected on your homepage. If you add analytics or ad pixels later, re-scan to keep your disclosures accurate.
                </Text>
              ) : (
                <BlockStack gap="300">
                  {result.trackers.map((t, i) => (
                    <Box key={i} padding="300" background="bg-surface-secondary" borderRadius="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="span" variant="bodyMd" fontWeight="medium">{t.name}</Text>
                        <Badge tone={categoryTone(t.category)}>{t.category}</Badge>
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              )}

              <Text as="p" variant="bodySm" tone="subdued">
                Scanned {result.scannedUrl}
              </Text>
            </BlockStack>
          </Card>
        )}

        {result && !result.success && (
          <Banner tone="critical" title="Scan failed">
            <p>{result.error}</p>
          </Banner>
        )}
      </BlockStack>
    </Page>
  );
}