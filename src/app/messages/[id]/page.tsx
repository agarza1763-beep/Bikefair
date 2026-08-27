import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";
import { ConversationThread } from "./conversation-thread";
import { markConversationReadAction } from "@/server/actions/messaging";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
      offers: { orderBy: { createdAt: "desc" } },
      meetups: { orderBy: { createdAt: "desc" }, include: { bikeShop: true } },
    },
  });

  if (!conversation || (conversation.buyerId !== user.id && conversation.sellerId !== user.id)) notFound();

  const transaction = await prisma.transaction.findUnique({ where: { listingId: conversation.listingId } });
  const isBuyer = conversation.buyerId === user.id;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;

  markConversationReadAction(id).catch(() => {});

  const bikeShops = await prisma.bikeShop.findMany({ where: { isVerified: true }, select: { id: true, name: true, city: true, state: true, offersInspection: true } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-charcoal-100 bg-white p-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
          {conversation.listing.images[0] && <Image src={conversation.listing.images[0].url} alt="" fill className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/bike/${conversation.listingId}`} className="truncate font-medium text-charcoal-900 hover:underline">
            {conversation.listing.title}
          </Link>
          <p className="text-sm text-charcoal-500">with {otherUser.name}</p>
        </div>
        <p className="font-semibold text-charcoal-700">{formatCents(conversation.listing.askingPrice)}</p>
      </div>

      <ConversationThread
        conversationId={conversation.id}
        currentUserId={user.id}
        isBuyer={isBuyer}
        messages={conversation.messages.map((m) => ({ id: m.id, senderId: m.senderId, senderName: m.sender.name, body: m.body, createdAt: m.createdAt.toISOString() }))}
        offers={conversation.offers.map((o) => ({ id: o.id, amount: o.amount, status: o.status, buyerId: o.buyerId }))}
        meetups={conversation.meetups.map((m) => ({
          id: m.id,
          type: m.type,
          locationName: m.locationName,
          status: m.status,
          scheduledAt: m.scheduledAt?.toISOString() ?? null,
          bikeShopName: m.bikeShop?.name ?? null,
        }))}
        transaction={transaction ? { id: transaction.id, status: transaction.status, buyerConfirmed: !!transaction.buyerConfirmedAt, sellerConfirmed: !!transaction.sellerConfirmedAt } : null}
        bikeShops={bikeShops}
        otherUserId={otherUser.id}
      />
    </div>
  );
}
