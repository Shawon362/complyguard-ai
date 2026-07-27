import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  Text,
  TextField,
  Button,
  Banner,
  Box,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";

// ============================================================
// LOADER — read current banner settings from shop metafield
// ============================================================
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      shop {
        metafield(namespace: "complyguard", key: "banner_settings") {
          value
        }
      }
    }
  `);
  const data = await response.json();
  const raw = data?.data?.shop?.metafield?.value;

  let settings = {
    banner_text: "We use cookies to improve your experience and for analytics.",
    bg_color: "#1F2937",
    text_color: "#FFFFFF",
    accept_color: "#3B82F6",
  };
  if (raw) {
    try { settings = { ...settings, ...JSON.parse(raw) }; } catch (e) {}
  }

  return { settings };
};

// ============================================================
// ACTION — save banner settings to shop metafield
// ============================================================
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings = {
    banner_text: formData.get("banner_text") || "",
    bg_color: formData.get("bg_color") || "#1F2937",
    text_color: formData.get("text_color") || "#FFFFFF",
    accept_color: formData.get("accept_color") || "#3B82F6",
  };

  // Get shop id
  const shopRes = await admin.graphql(`query { shop { id } }`);
  const shopData = await shopRes.json();
  const shopId = shopData.data.shop.id;

  const response = await admin.graphql(`
    mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }
  `, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: "complyguard",
          key: "banner_settings",
          type: "json",
          value: JSON.stringify(settings),
        },
      ],
    },
  });

  const result = await response.json();
  const errors = result.data?.metafieldsSet?.userErrors;
  if (errors && errors.length > 0) {
    return { success: false, error: errors[0].message };
  }
  return { success: true };
};

// ============================================================
// COMPONENT
// ============================================================
export default function BannerSettings() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const saving = navigation.state === "submitting";

  const [text, setText] = useState(settings.banner_text);
  const [bg, setBg] = useState(settings.bg_color);
  const [textColor, setTextColor] = useState(settings.text_color);
  const [accept, setAccept] = useState(settings.accept_color);

  return (
    <Page title="Cookie Banner Settings" subtitle="Customize how your cookie banner looks on the storefront">
      <BlockStack gap="500">
        {actionData?.success && (
          <Banner tone="success" title="Settings saved">
            <p>Your cookie banner has been updated on the storefront.</p>
          </Banner>
        )}
        {actionData?.error && (
          <Banner tone="critical" title="Could not save">
            <p>{actionData.error}</p>
          </Banner>
        )}

        <Card>
          <Form method="post">
            <BlockStack gap="400">
              <TextField
                label="Banner text"
                value={text}
                onChange={setText}
                name="banner_text"
                multiline={3}
                autoComplete="off"
              />
              <TextField
                label="Background color"
                value={bg}
                onChange={setBg}
                name="bg_color"
                autoComplete="off"
                helpText="Hex code, e.g. #1F2937"
              />
              <TextField
                label="Text color"
                value={textColor}
                onChange={setTextColor}
                name="text_color"
                autoComplete="off"
                helpText="Hex code, e.g. #FFFFFF"
              />
              <TextField
                label="Accept button color"
                value={accept}
                onChange={setAccept}
                name="accept_color"
                autoComplete="off"
                helpText="Hex code, e.g. #3B82F6"
              />
              <Box>
                <Button submit variant="primary" loading={saving}>
                  Save settings
                </Button>
              </Box>
            </BlockStack>
          </Form>
        </Card>
      </BlockStack>
    </Page>
  );
}