import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BikeCard } from "@/components/bike/bike-card";
import { toBikeCardData } from "@/server/queries/listings";
import { getRecognizedBrandNames } from "@/server/queries/brands";

export const metadata = { title: "Saved Bikes — BikeFair" };

export default async function SavedPage() {
  const user = await requireUser();
  const recognizedBrandNames = await getRecognizedBrandNames();
  const saved = await prisma.savedListing.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          valuations: { where: { isCurrent: true }, take: 1 },
          seller: { select: { name: true, verificationLevel: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Saved Bikes</h1>
      {saved.length === 0 ? (
        <p className="mt-8 text-center text-charcoal-500">You haven't saved any bikes yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => (
            <BikeCard key={s.id} bike={toBikeCardData(s.listing, recognizedBrandNames)} />
          ))}
        </div>
      )}
    </div>
  );
}
