import { Banner } from "@shopify/polaris";

export default function DeadlineBanner({ daysLeft }) {
  return (
    <Banner
      title={`EU AI Act Article 50 Enforcement: ${daysLeft} days remaining`}
      tone="warning"
    >
      <p>
        Starting August 2, 2026, EU AI Act Article 50 will be enforced.
        Fines up to €7.5M or 1.5% of global revenue.
        Scan your store now to ensure compliance.
      </p>
    </Banner>
  );
}