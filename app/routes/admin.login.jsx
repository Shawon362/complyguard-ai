import { useState } from "react";
import {
  Form,
  useActionData,
  useNavigation,
  redirect,
} from "react-router";
import {
  AppProvider,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  Text,
  Icon,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { LockIcon } from "@shopify/polaris-icons";

import adminStyles from "../styles/admin.css?url";
import {
  verifyAdminLogin,
  createAdminSession,
  getAdminUser,
} from "../utils/admin/auth.server";

// CSS
export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: adminStyles },
];

// LOADER
export const loader = async ({ request }) => {
  const admin = await getAdminUser(request);
  if (admin) return redirect("/admin/dashboard");
  return null;
};

// ACTION
export const action = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const admin = await verifyAdminLogin(email, password);
  if (!admin) {
    return { error: "Invalid email or password" };
  }

  return createAdminSession(admin.id, "/admin/dashboard");
};

// UI
export default function AdminLogin() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AppProvider i18n={enTranslations}>
      <div className="admin-login-page">
        <div className="admin-login-wrapper">
          <Card>
            <BlockStack gap="600">
              {/* Header */}
              <BlockStack gap="200" inlineAlign="center">
                <div className="admin-login-icon">
                  <Icon source={LockIcon} tone="textInverse" />
                </div>
                <Text as="h1" variant="headingLg">
                  Admin Dashboard
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Sign in to manage your application
                </Text>
              </BlockStack>

              {/* Form */}
              <Form method="POST">
                <FormLayout>
                  {actionData?.error && (
                    <Banner tone="critical">{actionData.error}</Banner>
                  )}

                  <TextField
                    label="Email address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    placeholder="admin@example.com"
                    autoFocus
                    disabled={isSubmitting}
                    requiredIndicator
                  />

                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    requiredIndicator
                  />

                  <Button
                    submit
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    size="large"
                  >
                    Sign in
                  </Button>
                </FormLayout>
              </Form>

              {/* Footer */}
              <BlockStack inlineAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Restricted access. Authorized personnel only.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          <div className="admin-login-footer">
            <Text as="p" variant="bodySm" tone="subdued">
              Microters LLC · ComplyGuard AI Admin
            </Text>
          </div>
        </div>
      </div>
    </AppProvider>
  );
}