import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SellWizard } from "./sell-wizard";

export const metadata = { title: "Sell a Bike — BikeFair" };

export default async function SellCreatePage() {
  const user = await currentUser();
  const ownedShop = user ? await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id }, select: { isVerified: true } }) : null;
  const isShopSeller = !!ownedShop?.isVerified;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <SellWizard isShopSeller={isShopSeller} />
    </div>
  );
}
