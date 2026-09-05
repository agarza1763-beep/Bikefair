import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { EditListingForm } from "./edit-listing-form";

export const metadata = { title: "Edit Listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/auth/sign-in?callbackUrl=/account/listings/${id}/edit`);

  const listing = await prisma.bikeListing.findUnique({ where: { id } });
  if (!listing || listing.status === "REMOVED") notFound();
  if (listing.sellerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-extrabold text-charcoal-900">
        Edit {listing.year} {listing.brand} {listing.model}
      </h1>
      <p className="mt-1 text-sm text-charcoal-500">Update components, price, or mark this listing sold. The fair value estimate recalculates automatically when you save.</p>

      <div className="mt-8">
        <EditListingForm
          listingId={listing.id}
          initial={{
            groupset: listing.groupset ?? "",
            brakeType: listing.brakeType ?? "",
            suspension: listing.suspension ?? "",
            wheelset: listing.wheelset ?? "",
            wheelsUpgraded: listing.wheelsUpgraded,
            wheelSize: listing.wheelSize ?? "",
            condition: listing.condition as "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
            mileageLevel: (listing.mileageLevel ?? "") as "" | "UNDER_100" | "UNDER_500" | "UNDER_1000" | "UNDER_5000" | "OVER_5000" | "UNKNOWN",
            description: listing.description,
            upgrades: listing.upgrades ?? "",
            askingPrice: String(listing.askingPrice / 100),
            originalMsrp: listing.originalMsrp ? String(listing.originalMsrp / 100) : "",
            status: listing.status === "SOLD" ? "SOLD" : "ACTIVE",
          }}
        />
      </div>
    </div>
  );
}
