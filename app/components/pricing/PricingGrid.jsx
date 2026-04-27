import { PLANS } from "./pricingData";
import PricingCard from "./PricingCard";

export default function PricingGrid() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "16px",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px 16px",
    }}>
      {PLANS.map((plan) => (
        <PricingCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}