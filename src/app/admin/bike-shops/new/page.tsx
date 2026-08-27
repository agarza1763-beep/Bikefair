import { ShopForm } from "../shop-form";

export const metadata = { title: "Admin — New Bike Shop" };

export default function NewBikeShopPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">New Bike Shop</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        Creates a participating bike shop profile. Mark it "Verified" for it to appear as a meetup option in conversations and on the public /bike-shops page.
      </p>
      <div className="mt-6">
        <ShopForm />
      </div>
    </div>
  );
}
