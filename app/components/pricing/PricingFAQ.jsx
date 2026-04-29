import { Card, BlockStack, Text, Box, Divider } from "@shopify/polaris";
import { FAQS } from "./pricingData";

export default function PricingFAQ() {
  return (
    <Card>
      <Box>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Frequently asked questions
          </Text>

          <Divider />

          <BlockStack gap="400">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================
// Single FAQ Item
// ============================================================
function FAQItem({ question, answer }) {
  return (
    <BlockStack gap="100">
      <Text as="h3" variant="headingSm">
        {question}
      </Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        {answer}
      </Text>
    </BlockStack>
  );
}