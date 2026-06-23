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
  { title: "Terms of Service — ComplyGuard AI" },
  {
    name: "description",
    content: "Terms of Service for ComplyGuard AI by Microters LLC.",
  },
];

export default function TermsOfService() {
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
            title="Terms of Service"
            subtitle="Last updated: June 2026"
          >
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <Section title="1. Acceptance of Terms">
                    <Text as="p" variant="bodyMd">
                      By installing or using ComplyGuard AI ("the App"),
                      provided by <strong>Microters LLC</strong> ("we," "our,"
                      "us"), you ("Merchant," "you") agree to these Terms of
                      Service. If you do not agree, do not use the App.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="2. Service Description">
                    <Text as="p" variant="bodyMd">
                      ComplyGuard AI is a Shopify app that:
                    </Text>
                    <BulletList
                      items={[
                        "Scans your store for compliance issues (GDPR, CCPA, EU AI Act)",
                        "Provides AI-powered analysis of products, images, and policies",
                        "Offers automated fixes for common compliance violations",
                        "Generates compliance reports and recommendations",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="3. Account and Access">
                    <SubSection title="3.1 Eligibility">
                      <BulletList
                        items={[
                          "You must have an active Shopify store",
                          "You must be authorized to install apps on the store",
                          "You must be 18 years or older",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="3.2 Account Responsibilities">
                      <BulletList
                        items={[
                          "Maintain accurate account information",
                          "Keep credentials secure",
                          "Notify us of unauthorized access immediately",
                          "One account per Shopify store",
                        ]}
                      />
                    </SubSection>
                  </Section>

                  <Divider />

                  <Section title="4. Subscription Plans and Billing">
                    <SubSection title="4.1 Plans">
                      <Text as="p" variant="bodyMd">
                        We offer three subscription tiers:
                      </Text>
                      <Box paddingBlockStart="200">
                        <BlockStack gap="200">
                          <PlanCard
                            name="Free Plan"
                            price="$0/month"
                            features={[
                              "1 scan per month",
                              "Up to 50 products",
                              "3 free auto-fixes",
                            ]}
                          />
                          <PlanCard
                            name="Starter Plan"
                            price="$9.99/month"
                            features={[
                              "3 scans per month",
                              "Up to 1,000 products",
                              "Unlimited auto-fixes",
                              "PDF reports",
                            ]}
                          />
                          <PlanCard
                            name="Growth Plan"
                            price="$29.99/month"
                            features={[
                              "15 scans per month",
                              "Unlimited products",
                              "Priority support",
                              "All Starter features",
                            ]}
                          />
                        </BlockStack>
                      </Box>
                    </SubSection>
                    <SubSection title="4.2 Billing">
                      <BulletList
                        items={[
                          "Billing is processed through Shopify Billing API",
                          "Charges appear on your Shopify invoice",
                          "Monthly recurring subscription",
                          "No hidden fees",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="4.3 Plan Changes">
                      <BulletList
                        items={[
                          "Upgrade anytime — immediate access",
                          "Downgrade — effective next billing cycle",
                          "Cancellation — anytime, no penalty",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="4.4 Refunds">
                      <BulletList
                        items={[
                          "7-day money-back guarantee for first-time subscribers",
                          "Pro-rated refunds not provided for partial months",
                          "Refund requests: info@shopiters.com",
                        ]}
                      />
                    </SubSection>
                  </Section>

                  <Divider />

                  <Section title="5. Acceptable Use">
                    <Text as="p" variant="bodyMd">
                      You agree NOT to:
                    </Text>
                    <BulletList
                      items={[
                        "Use the App for illegal purposes",
                        "Reverse engineer or attempt to extract source code",
                        "Resell, sublicense, or redistribute the App",
                        "Submit false or misleading information",
                        "Attempt to bypass usage limits or quotas",
                        "Use the App to harm Shopify, other merchants, or end consumers",
                        "Violate any applicable laws or regulations",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="6. Intellectual Property">
                    <SubSection title="6.1 Our Property">
                      <BulletList
                        items={[
                          "ComplyGuard AI, including all code, designs, and AI models, is owned by Microters LLC",
                          "All trademarks, logos, and brand assets are our property",
                          "AI-generated compliance reports retain our copyright",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="6.2 Your Property">
                      <BulletList
                        items={[
                          "You retain ownership of your store data and content",
                          "We do not claim rights to your products or branding",
                          "Generated reports about your store belong to you",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="6.3 License">
                      <BulletList
                        items={[
                          "We grant you a non-exclusive, non-transferable license to use the App during your active subscription",
                          "License terminates immediately upon uninstallation or breach of these Terms",
                        ]}
                      />
                    </SubSection>
                  </Section>

                  <Divider />

                  <Section title="7. AI Disclaimer">
                    <Text as="p" variant="bodyMd">
                      ComplyGuard AI uses artificial intelligence to identify
                      potential compliance issues. Please understand:
                    </Text>
                    <BulletList
                      items={[
                        "AI analysis is a recommendation, not legal advice",
                        "We do not guarantee 100% accuracy in compliance detection",
                        "You are responsible for verifying compliance with applicable laws",
                        "Consult a qualified attorney for legal compliance decisions",
                        "AI may produce false positives or miss certain issues",
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      We continuously improve our AI models but cannot guarantee
                      perfection.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="8. Service Availability">
                    <BulletList
                      items={[
                        "We aim for 99% uptime but do not guarantee uninterrupted service",
                        "Scheduled maintenance will be notified in advance",
                        "Emergency maintenance may occur without notice",
                        "Service interruptions do not entitle you to refunds unless exceeding 7 consecutive days",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="9. Data and Privacy">
                    <Text as="p" variant="bodyMd">
                      Your use of the App is also governed by our Privacy
                      Policy, available at{" "}
                      <PolarisLink url="/privacy">
                        https://api.shopiters.com/privacy
                      </PolarisLink>
                    </Text>
                    <Text as="p" variant="bodyMd">
                      By using the App, you acknowledge and agree to our data
                      practices as described in the Privacy Policy.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="10. Third-Party Services">
                    <Text as="p" variant="bodyMd">
                      The App integrates with third-party services including:
                    </Text>
                    <BulletList
                      items={[
                        "Shopify Platform (your store)",
                        "Oxyy AI (AI processing)",
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      We are not responsible for third-party service
                      availability or actions.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="11. Limitation of Liability">
                    <Text as="p" variant="bodyMd">
                      To the maximum extent permitted by law:
                    </Text>
                    <BulletList
                      items={[
                        "Our total liability is limited to fees paid in the 12 months preceding the claim",
                        "We are not liable for indirect, incidental, or consequential damages",
                        "We are not liable for lost profits, data, or business opportunities",
                        "We are not liable for compliance violations or related penalties",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="12. Indemnification">
                    <Text as="p" variant="bodyMd">
                      You agree to indemnify and hold Microters LLC harmless
                      from claims arising from:
                    </Text>
                    <BulletList
                      items={[
                        "Your violation of these Terms",
                        "Your misuse of the App",
                        "Your violation of applicable laws",
                        "Content you upload to your store",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="13. Termination">
                    <SubSection title="13.1 By You">
                      <BulletList
                        items={[
                          "Uninstall the App from your Shopify admin",
                          "Subscription ends at current billing period",
                          "Data deletion within 48 hours",
                        ]}
                      />
                    </SubSection>
                    <SubSection title="13.2 By Us">
                      <Text as="p" variant="bodyMd">
                        We may terminate or suspend your access if:
                      </Text>
                      <BulletList
                        items={[
                          "You violate these Terms",
                          "Payment fails repeatedly",
                          "You misuse the service",
                          "Required by law",
                        ]}
                      />
                      <Text as="p" variant="bodyMd">
                        We will provide notice when possible.
                      </Text>
                    </SubSection>
                  </Section>

                  <Divider />

                  <Section title="14. Modifications to Terms">
                    <Text as="p" variant="bodyMd">
                      We may update these Terms. Material changes will be:
                    </Text>
                    <BulletList
                      items={[
                        "Notified via email",
                        'Posted with updated "Last Updated" date',
                        "In-app notification",
                      ]}
                    />
                    <Text as="p" variant="bodyMd">
                      Continued use after changes constitutes acceptance. If you
                      disagree with changes, uninstall the App.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="15. Governing Law">
                    <Text as="p" variant="bodyMd">
                      These Terms are governed by the laws of the State of
                      Delaware, USA, without regard to conflict of law
                      principles. Any disputes shall be resolved in Delaware
                      courts.
                    </Text>
                    <Text as="p" variant="bodyMd">
                      For EU/UK users, mandatory consumer protection laws of
                      your country of residence also apply.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="16. Dispute Resolution">
                    <BulletList
                      items={[
                        "Attempt informal resolution first (email info@shopiters.com)",
                        "Mediation before litigation when possible",
                        "Class action waiver applies where legally permitted",
                      ]}
                    />
                  </Section>

                  <Divider />

                  <Section title="17. Severability">
                    <Text as="p" variant="bodyMd">
                      If any provision is found unenforceable, the remaining
                      provisions continue in effect.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="18. Entire Agreement">
                    <Text as="p" variant="bodyMd">
                      These Terms, along with our Privacy Policy, constitute
                      the entire agreement between you and Microters LLC
                      regarding ComplyGuard AI.
                    </Text>
                  </Section>

                  <Divider />

                  <Section title="19. Contact">
                    <Text as="p" variant="bodyMd">
                      Questions about these Terms?
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Microters LLC
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Email:{" "}
                        <PolarisLink url="mailto:info@shopiters.com">
                          info@shopiters.com
                        </PolarisLink>
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Subject: Terms Inquiry
                      </Text>
                    </Box>
                  </Section>

                  <Divider />

                  <Box paddingBlockStart="400">
                    <Text as="p" variant="bodySm" tone="subdued">
                      By installing ComplyGuard AI, you confirm that you have
                      read, understood, and agree to these Terms of Service.
                    </Text>
                  </Box>
                </BlockStack>
              </Box>
            </Card>

            <Box paddingBlockStart="500" paddingBlockEnd="800">
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                © 2026 Microters LLC · ComplyGuard AI ·{" "}
                <PolarisLink url="/privacy">Privacy Policy</PolarisLink>
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

function PlanCard({ name, price, features }) {
  return (
    <Box
      padding="400"
      background="bg-surface-secondary"
      borderRadius="200"
      borderWidth="025"
      borderColor="border"
    >
      <BlockStack gap="200">
        <Box>
          <Text as="span" variant="headingMd">
            {name}
          </Text>{" "}
          <Text as="span" variant="bodyMd" tone="subdued">
            — {price}
          </Text>
        </Box>
        <BulletList items={features} />
      </BlockStack>
    </Box>
  );
}