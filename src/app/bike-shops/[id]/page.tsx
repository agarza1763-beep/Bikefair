import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Phone, Globe, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";

export default async function BikeShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await prisma.bikeShop.findUnique({ where: { id } });
  if (!shop) notFound();

  const hours = shop.hoursJson ? (JSON.parse(shop.hoursJson) as Record<string, string>) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-3xl font-extrabold text-charcoal-900">{shop.name}</h1>
        {shop.isVerified && <BadgeCheck className="h-7 w-7 text-green-600" />}
      </div>
      <p className="mt-1 flex items-center gap-1 text-charcoal-500">
        <MapPin className="h-4 w-4" /> {shop.address}, {shop.city}, {shop.state} {shop.zip}
      </p>

      {shop.description && <p className="mt-4 text-sm leading-relaxed text-charcoal-700">{shop.description}</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold text-charcoal-900">Contact</h2>
          <div className="mt-2 space-y-1.5 text-sm text-charcoal-600">
            {shop.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {shop.phone}
              </p>
            )}
            {shop.website && (
              <p className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> {shop.website}
              </p>
            )}
          </div>
        </div>

        {hours && (
          <div className="card p-5">
            <h2 className="font-display text-sm font-bold text-charcoal-900">Hours</h2>
            <div className="mt-2 space-y-1 text-sm text-charcoal-600">
              {Object.entries(hours).map(([day, h]) => (
                <div key={day} className="flex justify-between">
                  <span>{day}</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {shop.offersInspection && (
        <div className="mt-6 card p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-charcoal-900">
            <Wrench className="h-4 w-4 text-green-700" /> Optional Professional Inspection
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            This shop offers an independent, professional pre-purchase inspection for {shop.inspectionFeeCents ? formatCents(shop.inspectionFeeCents) : "a fee"}, separate
            from any BikeFair meetup. Request it when proposing a meetup with this shop in your conversation.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-xl bg-charcoal-50 p-4 text-xs text-charcoal-500">
        This shop is a designated meetup location only, unless you've separately requested and paid for its inspection service. It is not a party to any transaction and
        is not responsible for the bicycle, buyer, seller, payment, ownership, condition, or outcome of any transaction.
      </div>
    </div>
  );
}
