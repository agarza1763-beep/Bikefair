import { SellWizard } from "./sell-wizard";

export const metadata = { title: "Sell a Bike — BikeFair" };

export default function SellCreatePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <SellWizard />
    </div>
  );
}
