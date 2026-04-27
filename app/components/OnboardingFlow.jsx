import { useState } from "react";
import { useSubmit } from "react-router";
import {
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Box,
  Icon,
} from "@shopify/polaris";

import {
  ShieldCheckMarkIcon,
  AlertTriangleIcon,
  CalendarIcon,
  ImageIcon,
  ChatIcon,
  PageIcon,
  ChartLineIcon,
  SearchIcon,
  ClipboardIcon,
  MagicIcon,
  TargetIcon,
  CashDollarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@shopify/polaris-icons";

// ============================================================
// Reusable: Big Icon Circle (for hero sections)
// ============================================================
function BigIconCircle({ icon: IconComponent, gradient, shadow }) {
  return (
    <div style={{
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      background: gradient,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 24px",
      boxShadow: shadow,
    }}>
      <IconComponent
        style={{
          width: "60px",
          height: "60px",
          fill: "#5C6AC4",
        }}
      />
    </div>
  );
}

// ============================================================
// Reusable: Small Icon Box (for feature cards)
// ============================================================
function SmallIconBox({ icon: IconComponent, bgColor }) {
  return (
    <div style={{
      width: "44px",
      height: "44px",
      borderRadius: "10px",
      background: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <IconComponent
        style={{
          width: "24px",
          height: "24px",
          fill: "#5C6AC4",
        }}
      />
    </div>
  );
}

// ============================================================
// Reusable: Medium Icon Box (for requirement cards)
// ============================================================
function MediumIconBox({ icon: IconComponent }) {
  return (
    <div style={{
      width: "56px",
      height: "56px",
      borderRadius: "12px",
      background: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <IconComponent
        style={{
          width: "30px",
          height: "30px",
          fill: "#5C6AC4",
        }}
      />
    </div>
  );
}

export default function OnboardingFlow({ initialStep = 0 }) {
  const submit = useSubmit();
  const [currentStep, setCurrentStep] = useState(initialStep);

  const totalSteps = 3;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    const formData = new FormData();
    formData.append("actionType", "update_onboarding_step");
    formData.append("step", nextStep.toString());
    submit(formData, { method: "POST", replace: true });
  };

  const handleFinish = () => {
    const formData = new FormData();
    formData.append("actionType", "complete_onboarding");
    submit(formData, { method: "POST", replace: true });
  };

  return (
    <Box>
      <div>
        <BlockStack gap="600">
          {/* Progress Indicator */}
          <Box paddingBlockEnd="200">
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #5C6AC4 0%, #202E78 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}>
                    {currentStep + 1}
                  </div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Step {currentStep + 1} of {totalSteps}
                  </Text>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  {Math.round(progress)}% complete
                </Text>
              </InlineStack>
              <div style={{
                height: "6px",
                background: "#E4E5E7",
                borderRadius: "100px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #5C6AC4 0%, #00A47C 100%)",
                  transition: "width 0.4s ease",
                  borderRadius: "100px",
                }} />
              </div>
            </BlockStack>
          </Box>

          {/* ── Step 0: Welcome ── */}
          {currentStep === 0 && (
            <Card>
              <Box padding="800">
                <BlockStack gap="600">
                  <div style={{ textAlign: "center" }}>
                    <BigIconCircle
                      icon={ShieldCheckMarkIcon}
                      gradient="linear-gradient(135deg, #E3E5FF 0%, #D4F4E2 100%)"
                      shadow="0 8px 24px rgba(92, 106, 196, 0.15)"
                    />
                    <div style={{ marginBottom: "12px" }}>
                      <Text as="h1" variant="heading3xl">
                        Welcome to ComplyGuard AI
                      </Text>
                    </div>
                    <Text as="p" variant="headingMd" tone="subdued">
                      Your shield against EU AI Act compliance penalties
                    </Text>
                  </div>

                  <Box
                    background="bg-surface-secondary"
                    padding="500"
                    borderRadius="300"
                  >
                    <BlockStack gap="400">
                      <InlineStack gap="300" blockAlign="center">
                        <SmallIconBox icon={AlertTriangleIcon} bgColor="#FFF3E0" />
                        <Text as="h3" variant="headingMd">
                          Why this matters for your store
                        </Text>
                      </InlineStack>

                      <Text as="p" variant="bodyMd">
                        The EU AI Act is the world's first comprehensive AI regulation.
                        Starting <Text as="span" fontWeight="semibold">August 2, 2026</Text>, all e-commerce stores selling
                        to EU customers must comply with strict AI disclosure requirements.
                      </Text>

                      <div style={{
                        background: "#FFEBEE",
                        padding: "16px",
                        borderRadius: "8px",
                        borderLeft: "4px solid #D72C0D",
                      }}>
                        <InlineStack gap="200" blockAlign="center">
                          <div style={{ width: "20px", height: "20px" }}>
                            <Icon source={CashDollarIcon} tone="critical" />
                          </div>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            Non-compliance penalties: Up to €7.5M or 1.5% of annual global turnover
                          </Text>
                        </InlineStack>
                      </div>
                    </BlockStack>
                  </Box>

                  <InlineStack align="end" gap="300">
                    <Button variant="primary" size="large" onClick={handleNext} icon={ArrowRightIcon}>
                      Get Started
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          )}

          {/* ── Step 1: What is EU AI Act ── */}
          {currentStep === 1 && (
            <Card>
              <Box padding="800">
                <BlockStack gap="600">
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 14px",
                      background: "#FFEBEE",
                      borderRadius: "100px",
                      marginBottom: "16px",
                    }}>
                      <div style={{ width: "16px", height: "16px" }}>
                        <Icon source={CalendarIcon} tone="critical" />
                      </div>
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        Enforcement: August 2, 2026
                      </Text>
                    </div>
                    <Text as="h2" variant="heading2xl">
                      EU AI Act Article 50
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyLg" tone="subdued">
                        Three key requirements every e-commerce store must meet
                      </Text>
                    </Box>
                  </div>

                  <BlockStack gap="400">
                    {/* Card 1: Images */}
                    <div style={{
                      padding: "20px",
                      background: "linear-gradient(135deg, #F0F7FF 0%, #E3E5FF 100%)",
                      borderRadius: "12px",
                      border: "1px solid #C5CAE9",
                    }}>
                      <InlineStack gap="400" blockAlign="start" wrap={false}>
                        <MediumIconBox icon={ImageIcon} />
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingMd">
                            AI-Generated Images Must Be Labeled
                          </Text>
                          <Text as="p" variant="bodyMd">
                            Any product image created by AI tools must include a clear
                            disclosure that it is AI-generated.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </div>

                    {/* Card 2: Chatbots */}
                    <div style={{
                      padding: "20px",
                      background: "linear-gradient(135deg, #FFF4E6 0%, #FFE0B2 100%)",
                      borderRadius: "12px",
                      border: "1px solid #FFCC80",
                    }}>
                      <InlineStack gap="400" blockAlign="start" wrap={false}>
                        <MediumIconBox icon={ChatIcon} />
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingMd">
                            Chatbots Must Identify as AI
                          </Text>
                          <Text as="p" variant="bodyMd">
                            AI-powered customer support chatbots must clearly inform users
                            they are talking to an AI, not a human agent.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </div>

                    {/* Card 3: Privacy */}
                    <div style={{
                      padding: "20px",
                      background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                      borderRadius: "12px",
                      border: "1px solid #A5D6A7",
                    }}>
                      <InlineStack gap="400" blockAlign="start" wrap={false}>
                        <MediumIconBox icon={PageIcon} />
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingMd">
                            Privacy Policy Must Disclose AI Usage
                          </Text>
                          <Text as="p" variant="bodyMd">
                            Your Privacy Policy must explicitly mention all AI tools used,
                            including AI-generated images, recommendations, and automated decisions.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </div>
                  </BlockStack>

                  <InlineStack align="space-between">
                    <Button onClick={() => setCurrentStep(0)} icon={ArrowLeftIcon}>
                      Back
                    </Button>
                    <Button variant="primary" size="large" onClick={handleNext} icon={ArrowRightIcon}>
                      Continue
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          )}

          {/* ── Step 2: How ComplyGuard Helps ── */}
          {currentStep === 2 && (
            <Card>
              <Box padding="800">
                <BlockStack gap="600">
                  <div style={{ textAlign: "center" }}>
                    <BigIconCircle
                      icon={ChartLineIcon}
                      gradient="linear-gradient(135deg, #D4F4E2 0%, #E3E5FF 100%)"
                      shadow="0 8px 24px rgba(0, 164, 124, 0.15)"
                    />
                    <Text as="h2" variant="heading2xl">
                      How ComplyGuard AI Helps
                    </Text>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyLg" tone="subdued">
                        Automated compliance scanning with one-click fixes
                      </Text>
                    </Box>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}>
                    {/* Feature 1 */}
                    <div style={{
                      padding: "20px",
                      background: "white",
                      borderRadius: "12px",
                      border: "1px solid #E1E3E5",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}>
                      <BlockStack gap="200">
                        <SmallIconBox icon={SearchIcon} bgColor="#E3E5FF" />
                        <Text as="h3" variant="headingSm">
                          Smart Image Scanner
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Automatically detects AI-generated content in your product images
                        </Text>
                      </BlockStack>
                    </div>

                    {/* Feature 2 */}
                    <div style={{
                      padding: "20px",
                      background: "white",
                      borderRadius: "12px",
                      border: "1px solid #E1E3E5",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}>
                      <BlockStack gap="200">
                        <SmallIconBox icon={ClipboardIcon} bgColor="#FFF4E6" />
                        <Text as="h3" variant="headingSm">
                          Policy Analysis
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Reviews your Privacy Policy and Terms for AI disclosure compliance
                        </Text>
                      </BlockStack>
                    </div>

                    {/* Feature 3 */}
                    <div style={{
                      padding: "20px",
                      background: "white",
                      borderRadius: "12px",
                      border: "1px solid #E1E3E5",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}>
                      <BlockStack gap="200">
                        <SmallIconBox icon={MagicIcon} bgColor="#E8F5E9" />
                        <Text as="h3" variant="headingSm">
                          One-Click Fixes
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Ready-to-use fix text and direct links to resolve issues fast
                        </Text>
                      </BlockStack>
                    </div>

                    {/* Feature 4 */}
                    <div style={{
                      padding: "20px",
                      background: "white",
                      borderRadius: "12px",
                      border: "1px solid #E1E3E5",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}>
                      <BlockStack gap="200">
                        <SmallIconBox icon={ChartLineIcon} bgColor="#FFEBEE" />
                        <Text as="h3" variant="headingSm">
                          Compliance Grade
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Get an A-F grade showing your store's compliance status
                        </Text>
                      </BlockStack>
                    </div>
                  </div>

                  <div style={{
                    background: "linear-gradient(135deg, #5C6AC4 0%, #202E78 100%)",
                    padding: "24px",
                    borderRadius: "12px",
                    color: "white",
                    textAlign: "center",
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}>
                      <div style={{ width: "24px", height: "24px" }}>
                        <Icon source={TargetIcon} />
                      </div>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <Text as="h3" variant="headingLg">
                        <span style={{ color: "white" }}>Ready to scan your store?</span>
                      </Text>
                    </div>
                    <Text as="p" variant="bodyMd">
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>
                        Click below to access your dashboard and run your first compliance scan
                      </span>
                    </Text>
                  </div>

                  <InlineStack align="space-between">
                    <Button onClick={() => setCurrentStep(1)} icon={ArrowLeftIcon}>
                      Back
                    </Button>
                    <Button variant="primary" size="large" onClick={handleFinish} icon={ArrowRightIcon}>
                      Get Started
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          )}
        </BlockStack>
      </div>
    </Box>
  );
}