import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShopForm } from "../shop-form";
import { OwnerLinker } from "./owner-linker";

export const metadata = { title: "Admin — Edit Bike Shop" };

export default async function EditBikeShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await prisma.bikeShop.findUnique({ where: { id } });
  if (!shop) notFound();

  const users = await prisma.user.findMany({ where: { role: "USER" }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Edit Bike Shop</h1>
      <div className="mt-6">
        <ShopForm
          initial={{
            id: shop.id,
            name: shop.name,
            description: shop.description ?? "",
            address: shop.address,
            city: shop.city,
            state: shop.state,
            zip: shop.zip ?? "",
            phone: shop.phone ?? "",
            email: shop.email ?? "",
            website: shop.website ?? "",
            offersInspection: shop.offersInspection,
            inspectionFee: shop.inspectionFeeCents ? (shop.inspectionFeeCents / 100).toString() : "",
            isVerified: shop.isVerified,
            hours: shop.hoursJson ? JSON.parse(shop.hoursJson) : {},
          }}
        />
      </div>

      <div className="mt-6 card p-6">
        <h2 className="font-display text-sm font-bold text-charcoal-900">Shop owner account (dealer login)</h2>
        <p className="mt-1 text-sm text-charcoal-500">
          Link this shop to a BikeFair user account so the shop can sign in and list its own inventory as a seller. The account must already exist — have the shop
          create a regular account first (via Sign Up), then link it here.
        </p>
        <OwnerLinker bikeShopId={shop.id} currentOwnerId={shop.ownerUserId} users={users} />
      </div>
    </div>
  );
}
