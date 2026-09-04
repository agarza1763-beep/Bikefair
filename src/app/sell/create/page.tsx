import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SellWizard } from "./sell-wizard";
import { ProfilePhotoUploader } from "@/components/account/profile-photo-uploader";

export const metadata = { title: "Sell a Bike — BikeFair" };

export default async function SellCreatePage() {
  const user = await requireUser();
  const ownedShop = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id }, select: { isVerified: true } });
  const isShopSeller = !!ownedShop?.isVerified;

  if (!user.image) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Add a profile photo first</h1>
        <p className="mt-2 text-sm text-charcoal-500">
          A profile photo is required before you can list a bike — it helps buyers know who they're meeting up with.
        </p>
        <div className="mt-6 flex justify-center">
          <ProfilePhotoUploader currentImage={user.image} name={user.name ?? "?"} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <SellWizard isShopSeller={isShopSeller} />
    </div>
  );
}
