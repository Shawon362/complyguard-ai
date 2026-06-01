import {
  AppProvider,
  Page,
  Card,
  BlockStack,
  Text,
  Box,
  Divider,
  Link as PolarisLink,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const meta = () => [
  { title: "Privacy Policy — ComplyGuard AI" },
  {
    name: "description",
    content:
      "Privacy Policy for ComplyGuard AI by Microters LLC. GDPR and CCPA compliant.",
  },
];

export default function PrivacyPolicy() {
  return (
    <AppProvider i18n={enTranslations}>
      <div
        style={{
          minHeight: "100vh",
          background: "#f6f6f7",
          padding: "40px 16px",
        }}
      >
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <Page
            backAction={{ content: "Home", url: "/" }}
            title="Privacy Policy"
            subtitle="Last updated: June 2026"
          >
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <Section title="1. Introduction">
                    <Text as="p" variant="bodyMd">
                      ComplyGuard AI ("we," "our," "us") is operated by{" "}
                      <strong>Microters LLC</strong>, a USA-registered company.
                      This Privacy Policy explains how we collect, use, store,
                      and protect information when you use ComplyGuard AI (the
                      "App") through the Shopify App Store.
                    </Text>
                    <Text as="p" variant="bodyMd">
                      By installing or using the App, you agree to this Privacy
                      Policy.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="2. Information We Collect">
                    <Text as="p" variant="bodyMd">
                      When you install ComplyGuard AI, we collect:
                    </Text>
                    <SubSection title="2.1 Shop Information">
                      <BulletList
                        items={[
                          "Shop domain (e.g., your-store.myshopify.com)",
                          "Shop owner email",
                          "Shop name and basic configuration",
                          "Subscription plan details",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="2.2 Product Data">
                      <BulletList
                        items={[
                          "Product titles, descriptions, and metadata",
                          "Product images and media URLs",
                          "Product categories and tags",
                          "Inventory information (read-only)",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="2.3 Compliance Scan Data">
                      <BulletList
                        items={[
                          "Scan results and timestamps",
                          "Identified compliance issues",
                          "Auto-fix actions performed",
                          "Generated compliance reports",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="2.4 Usage Data">
                      <BulletList
                        items={[
                          "Login times and frequency",
                          "Features accessed",
                          "Scan history",
                          "Error logs (for debugging)",
                        ]}
                      />
                    </SubSection>
                    <Box paddingBlockStart="300">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        We do NOT collect:
                      </Text>
                      <BulletList
                        items={[
                          "Customer personal data (unless explicitly approved via Protected Customer Data scope)",
                          "Payment card information (handled by Shopify Billing)",
                          "Browsing behavior outside the App",
                        ]}
                      />
                    </Box>
                  </Section>

                  <Divider />

                  <Section title="3. How We Use Your Information">
                    <Text as="p" variant="bodyMd">
                      We use collected information to:
                    </Text>
                    <BulletList
                      items={[
                        "Perform AI-powered compliance scans on your products and content",
                        "Identify GDPR, CCPA, and EU AI Act compliance issues",
                        "Provide automated fixes and recommendations",
                        "Generate compliance reports (PDF)",
                        "Send service-related notifications",
                        "Improve our AI models (using anonymized data only)",
                        "Provide customer support",
                        "Comply with legal obligations",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="4. Third-Party Services">
                    <Text as="p" variant="bodyMd">
                      To provide AI-powered analysis, we share necessary data
                      with:
                    </Text>
                    <SubSection title="4.1 AI Processing Partners">
                      <BulletList
                        items={[
                          "Oxyy AI (api.oxyy.ai) — for image analysis and content review",
                          "Data sent: Product images, descriptions for compliance review",
                          "Data retention: Not stored by AI partners after processing",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="4.2 Infrastructure Partners">
                      <BulletList
                        items={[
                          "CloudPanel hosting — for application hosting (data encrypted at rest)",
                          "Shopify — for OAuth authentication and billing",
                        ]}
                      />
                    </SubSection>
                    <Text as="p" variant="bodyMd">
                      We do not sell, rent, or trade your data to third parties
                      for marketing purposes.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="5. Data Storage and Security">
                    <BulletList
                      items={[
                        "All data is encrypted in transit (HTTPS/TLS 1.2+)",
                        "Data at rest is encrypted using industry-standard methods",
                        "Access to merchant data is restricted to authorized personnel",
                        "We maintain audit logs of all data access",
                        "Regular security reviews and updates",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="6. Data Retention">
                    <BulletList
                      items={[
                        "Active accounts: Data retained while subscription is active",
                        "Uninstallation: All merchant data is deleted within 48 hours of uninstallation (via Shopify webhook)",
                        "Anonymized analytics: May be retained indefinitely for service improvement",
                        "Legal requirements: Some data may be retained longer if required by law",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="7. Your Rights (GDPR & CCPA)">
                    <Text as="p" variant="bodyMd">
                      You have the right to:
                    </Text>
                    <BulletList
                      items={[
                        "Access: Request a copy of your data",
                        "Correction: Update incorrect information",
                        "Deletion: Request data deletion (right to be forgotten)",
                        "Portability: Export your data in a machine-readable format",
                        "Objection: Object to certain processing activities",
                        "Restriction: Limit how we use your data",
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      To exercise these rights, email:{" "}
                      <PolarisLink url="mailto:support@tryoxyy.com">
                        support@tryoxyy.com
                      </PolarisLink>
                    </Text>
                    <Text as="p" variant="bodyMd">
                      We will respond within 30 days as required by GDPR.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="8. GDPR Compliance">
                    <Text as="p" variant="bodyMd">
                      We comply with the EU General Data Protection Regulation:
                    </Text>
                    <BulletList
                      items={[
                        "Lawful basis for processing: Legitimate interest (compliance services)",
                        "Data Protection Officer contact: support@tryoxyy.com",
                        "EU representative: Available upon request",
                        "Right to lodge complaints with supervisory authorities",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="9. CCPA Compliance">
                    <Text as="p" variant="bodyMd">
                      For California residents:
                    </Text>
                    <BulletList
                      items={[
                        "We do not sell personal information",
                        "You have the right to know what data we collect",
                        "You have the right to deletion",
                        "You have the right to non-discrimination for exercising rights",
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      Contact:{" "}
                      <PolarisLink url="mailto:support@tryoxyy.com">
                        support@tryoxyy.com
                      </PolarisLink>
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="10. International Data Transfers">
                    <Text as="p" variant="bodyMd">
                      Your data may be processed in:
                    </Text>
                    <BulletList
                      items={[
                        "United States (Microters LLC operations)",
                        "Bangladesh (development team)",
                        "AI processing partner locations",
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      All transfers comply with applicable data protection laws.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="11. Cookies and Tracking">
                    <Text as="p" variant="bodyMd">
                      The App uses essential session cookies for authentication.
                      We do not use tracking cookies or third-party advertising
                      trackers.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="12. Children's Privacy">
                    <Text as="p" variant="bodyMd">
                      The App is not intended for users under 16 years of age.
                      We do not knowingly collect data from minors.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="13. Changes to This Policy">
                    <Text as="p" variant="bodyMd">
                      We may update this Privacy Policy. Material changes will
                      be notified via:
                    </Text>
                    <BulletList
                      items={[
                        "Email to your registered address",
                        "In-app notification",
                        'Update to "Last Updated" date above',
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      Continued use after changes constitutes acceptance.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="14. Contact Us">
                    <Text as="p" variant="bodyMd">
                      For privacy questions or concerns:
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Microters LLC
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Email:{" "}
                        <PolarisLink url="mailto:support@tryoxyy.com">
                          support@tryoxyy.com
                        </PolarisLink>
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Subject: Privacy Inquiry
                      </Text>
                    </Box>
                    <Text as="p" variant="bodyMd">
                      We aim to respond within 24 business hours.
                    </Text>
                  </Section>

                  <Divider />

                  <Box paddingBlockStart="400">
                    <Text as="p" variant="bodySm" tone="subdued">
                      This Privacy Policy is provided in English. Translated
                      versions are available upon request.
                    </Text>
                  </Box>
                </BlockStack>
              </Box>
            </Card>

            <Box paddingBlockStart="500" paddingBlockEnd="800">
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                © 2026 Microters LLC · ComplyGuard AI ·{" "}
                <PolarisLink url="/terms">Terms of Service</PolarisLink>
              </Text>
            </Box>
          </Page>
        </div>
      </div>
    </AppProvider>
  );
}

// ============================================================
// Helper Components
// ============================================================

function Section({ title, children }) {
  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingLg">
        {title}
      </Text>
      {children}
    </BlockStack>
  );
}

function SubSection({ title, children }) {
  return (
    <Box paddingBlockStart="300">
      <BlockStack gap="200">
        <Text as="h3" variant="headingMd">
          {title}
        </Text>
        {children}
      </BlockStack>
    </Box>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ paddingLeft: "20px", margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: "6px" }}>
          <Text as="span" variant="bodyMd">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  );
}