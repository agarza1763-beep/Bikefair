import { getAllFees } from "@/lib/fees";
import { FeeRow } from "./fee-row";

export const metadata = { title: "Admin — Fees" };

export default async function AdminFeesPage() {
  const fees = await getAllFees();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Marketplace Fees</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        These are website fees for using BikeFair — entirely separate from the bicycle's purchase price, which BikeFair never processes. Percentage fees are entered in
        basis points (300 = 3.00%).
      </p>

      <div className="mt-6 card divide-y divide-charcoal-50 p-2">
        {fees.map((f) => (
          <FeeRow key={f.type} fee={{ type: f.type, name: f.name, amountCents: f.amountCents, isPercentage: f.isPercentage, isActive: f.isActive, description: f.description ?? "" }} />
        ))}
      </div>
    </div>
  );
}
