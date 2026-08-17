import { Banner } from "@shopify/polaris";

export default function DeadlineBanner({ daysLeft }) {
  return (
    <Banner
      title={daysLeft <= 0
        ? "EU AI Act Article 50 is now in effect"
        : `EU AI Act Article 50 Enforcement: ${daysLeft} days remaining`}
      tone={daysLeft <= 0 ? "critical" : "warning"}
    >
      <p>
        {daysLeft <= 0
          ? "EU AI Act Article 50 is now enforced. Fines up to €15M or 3% of global revenue. Scan your store now to ensure compliance."
          : "Starting August 2, 2026, EU AI Act Article 50 will be enforced. Fines up to €15M or 3% of global revenue. Scan your store now to ensure compliance."}
      </p>
    </Banner>
  );
}