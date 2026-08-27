import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/constants";

export const metadata = { title: "Messages — BikeFair" };

export default async function MessagesPage() {
  const user = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Messages</h1>

      {conversations.length === 0 ? (
        <p className="mt-8 text-center text-charcoal-500">No conversations yet. Message a seller from any bike listing to get started.</p>
      ) : (
        <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white">
          {conversations.map((c) => {
            const otherUser = c.buyerId === user.id ? c.seller : c.buyer;
            const lastMessage = c.messages[0];
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-charcoal-50">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-charcoal-50">
                  {c.listing.images[0] && <Image src={c.listing.images[0].url} alt="" fill className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-charcoal-900">{c.listing.title}</p>
                  <p className="truncate text-sm text-charcoal-500">
                    {lastMessage ? (lastMessage.senderId === user.id ? "You" : otherUser.name) : "No messages"}: {lastMessage?.body ?? "No messages yet"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-charcoal-700">{formatCents(c.listing.askingPrice)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
