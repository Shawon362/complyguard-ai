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
  InlineStack,
  Layout,
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

  try {
    await admin.graphql(`
      mutation {
        metafieldDefinitionCreate(definition: {
          name: "Cookie Banner Settings"
          namespace: "complyguard"
          key: "banner_settings"
          type: "json"
          ownerType: SHOP
          access: { storefront: PUBLIC_READ }
        }) {
          createdDefinition { id }
          userErrors { field message }
        }
      }
    `);
  } catch (defError) {
    console.log(">>> Banner settings definition ensure (non-blocking):", defError.message);
  }

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
// Color field with picker + hex input
// ============================================================
function ColorField({ label, value, onChange, name }) {
  return (
    <BlockStack gap="150">
      <Text as="p" variant="bodyMd" fontWeight="medium">{label}</Text>
      <InlineStack gap="300" blockAlign="center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "48px",
            height: "38px",
            border: "1px solid #c9cccf",
            borderRadius: "8px",
            cursor: "pointer",
            padding: "2px",
            background: "#fff",
          }}
        />
        <Box minWidth="140px">
          <TextField
            label=""
            labelHidden
            value={value}
            onChange={onChange}
            name={name}
            autoComplete="off"
          />
        </Box>
        <div style={{
          width: "38px", height: "38px", borderRadius: "8px",
          background: value, border: "1px solid #e1e3e5",
        }} />
      </InlineStack>
    </BlockStack>
  );
}

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
    <Page title="Cookie Banner Settings" subtitle="Customize how your cookie banner looks on the storefront" fullWidth>
      <Form method="post">
        <Layout>
          {/* Left: Settings form */}
          <Layout.Section>
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
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Content</Text>
                  <TextField
                    label="Banner text"
                    value={text}
                    onChange={setText}
                    name="banner_text"
                    multiline={4}
                    autoComplete="off"
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Colors</Text>
                  <InlineStack gap="600" wrap>
                    <ColorField label="Background" value={bg} onChange={setBg} name="bg_color" />
                    <ColorField label="Text" value={textColor} onChange={setTextColor} name="text_color" />
                    <ColorField label="Accept button" value={accept} onChange={setAccept} name="accept_color" />
                  </InlineStack>
                </BlockStack>
              </Card>

              <Box>
                <Button submit variant="primary" loading={saving} size="large">
                  Save settings
                </Button>
              </Box>
            </BlockStack>
          </Layout.Section>

          {/* Right: Live preview */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Preview</Text>
                <div style={{
                  background: bg,
                  color: textColor,
                  padding: "16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: "12px" }}>
                    {text} <span style={{ textDecoration: "underline" }}>Learn more</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "7px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                      border: "1px solid " + textColor, color: textColor,
                    }}>Reject All</span>
                    <span style={{
                      padding: "7px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                      border: "1px solid " + textColor, color: textColor,
                    }}>Preferences</span>
                    <span style={{
                      padding: "7px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                      background: accept, color: "#fff",
                    }}>Accept All</span>
                  </div>
                </div>
                <Text as="p" variant="bodySm" tone="subdued">
                  This is how your banner will look. Click Save to apply it to your storefront.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
}