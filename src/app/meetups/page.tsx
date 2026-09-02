import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MEETUP_TYPE_LABELS, type MeetupType } from "@/lib/constants";

export const metadata = { title: "Meetups — BikeFair" };

export default async function MeetupsPage() {
  const user = await requireUser();

  const meetups = await prisma.meetup.findMany({
    where: { conversation: { OR: [{ buyerId: user.id }, { sellerId: user.id }] } },
    orderBy: { createdAt: "desc" },
    include: { conversation: { include: { listing: true } }, bikeShop: true, safeExchangeLocation: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Meetups</h1>
      <p className="mt-1 text-sm text-charcoal-500">All meetups you've proposed or agreed to, across your conversations.</p>

      {meetups.length === 0 ? (
        <p className="mt-8 text-center text-charcoal-500">No meetups yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {meetups.map((m) => (
            <Link key={m.id} href={`/messages/${m.conversationId}`} className="block rounded-2xl border border-charcoal-100 bg-white p-4 hover:border-green-600">
              <div className="flex items-center justify-between">
                <p className="font-medium text-charcoal-900">{m.conversation.listing.title}</p>
                <span className="rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">{m.status.toLowerCase()}</span>
              </div>
              <p className="mt-1 text-sm text-charcoal-500">
                {MEETUP_TYPE_LABELS[m.type as MeetupType]} — {m.bikeShop?.name ?? m.safeExchangeLocation?.name ?? m.locationName}
              </p>
              {m.scheduledAt && <p className="text-xs text-charcoal-400">{new Date(m.scheduledAt).toLocaleString()}</p>}
              {m.type === "BIKE_SHOP" && (
                <p className="mt-2 text-xs text-charcoal-400">
                  The participating bicycle shop is only a meeting location. It is not a party to this transaction and is not responsible for the bicycle, buyer, seller,
                  payment, condition, or outcome.
                </p>
              )}
              {m.type === "LAW_ENFORCEMENT" && (
                <p className="mt-2 text-xs text-charcoal-400">
                  This agency is only a meeting location. BikeFair does not employ, dispatch, or pay police officers, and does not represent any law enforcement
                  agency as a business partner — confirm current availability and rules directly with the agency.
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
