"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, MapPin, Handshake, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessageAction } from "@/server/actions/messaging";
import { respondToOfferAction, withdrawOfferAction } from "@/server/actions/offers";
import { proposeMeetupAction, confirmMeetupAction, cancelMeetupAction } from "@/server/actions/meetups";
import { confirmTransactionAction } from "@/server/actions/transactions";
import { blockUserAction } from "@/server/actions/messaging";
import { MEETUP_TYPE_LABELS, MEETUP_STATUSES, formatCents, type MeetupType } from "@/lib/constants";

const QUICK_MESSAGES = ["Is this still available?", "Would you accept a lower offer?", "Can we meet at a participating bike shop?", "Can you provide the serial number?"];

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}
interface Offer {
  id: string;
  amount: number;
  status: string;
  buyerId: string;
}
interface Meetup {
  id: string;
  type: string;
  locationName: string;
  status: string;
  scheduledAt: string | null;
  bikeShopName: string | null;
}
interface BikeShop {
  id: string;
  name: string;
  city: string;
  state: string;
  offersInspection: boolean;
}
interface TransactionInfo {
  id: string;
  status: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
}

export function ConversationThread({
  conversationId,
  currentUserId,
  isBuyer,
  messages,
  offers,
  meetups,
  transaction,
  bikeShops,
  otherUserId,
}: {
  conversationId: string;
  currentUserId: string;
  isBuyer: boolean;
  messages: Message[];
  offers: Offer[];
  meetups: Meetup[];
  transaction: TransactionInfo | null;
  bikeShops: BikeShop[];
  otherUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [meetupForm, setMeetupForm] = useState({ type: "PUBLIC" as MeetupType, bikeShopId: "", locationName: "", address: "", city: "", state: "", scheduledAt: "", inspectionRequested: false, notes: "" });

  void MEETUP_STATUSES;

  function send(text: string) {
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await sendMessageAction(conversationId, text);
      if (!res.ok) return setError(res.error);
      setBody("");
      router.refresh();
    });
  }

  function respondOffer(offerId: string, accept: boolean) {
    startTransition(async () => {
      const res = await respondToOfferAction(offerId, accept);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  function withdraw(offerId: string) {
    startTransition(async () => {
      const res = await withdrawOfferAction(offerId);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  function submitMeetup() {
    startTransition(async () => {
      const res = await proposeMeetupAction(conversationId, meetupForm);
      if (!res.ok) return setError(res.error);
      setShowMeetupForm(false);
      router.refresh();
    });
  }

  function confirmMeetup(id: string) {
    startTransition(async () => {
      await confirmMeetupAction(id);
      router.refresh();
    });
  }
  function cancelMeetup(id: string) {
    startTransition(async () => {
      await cancelMeetupAction(id);
      router.refresh();
    });
  }

  function confirmDone() {
    startTransition(async () => {
      const res = await confirmTransactionAction(conversationId);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  function block() {
    if (!confirm("Block this user? You won't be able to message each other anymore.")) return;
    startTransition(async () => {
      await blockUserAction(otherUserId);
      router.push("/messages");
    });
  }

  const myConfirmed = transaction ? (isBuyer ? transaction.buyerConfirmed : transaction.sellerConfirmed) : false;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-charcoal-100 bg-white p-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.senderId === currentUserId ? "bg-green-700 text-white" : "bg-charcoal-100 text-charcoal-900"}`}>
                {m.body}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="py-6 text-center text-sm text-charcoal-400">No messages yet.</p>}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_MESSAGES.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full border border-charcoal-200 px-3 py-1 text-xs text-charcoal-600 hover:border-green-600">
              {q}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input className="input" placeholder="Type a message…" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(body)} />
          <Button onClick={() => send(body)} disabled={isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button onClick={block} className="mt-3 flex items-center gap-1 text-xs text-charcoal-400 hover:text-red-500">
          <ShieldAlert className="h-3.5 w-3.5" /> Block this user
        </button>
      </div>

      {offers.length > 0 && (
        <div className="rounded-2xl border border-charcoal-100 bg-white p-4">
          <h3 className="font-display text-sm font-bold text-charcoal-900">Offers</h3>
          <ul className="mt-2 space-y-2">
            {offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-lg bg-charcoal-50 px-3 py-2 text-sm">
                <span>
                  {formatCents(o.amount)} <span className="text-charcoal-400">({o.status.toLowerCase()})</span>
                </span>
                {o.status === "PENDING" && !isBuyer && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respondOffer(o.id, true)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respondOffer(o.id, false)}>
                      Decline
                    </Button>
                  </div>
                )}
                {o.status === "PENDING" && isBuyer && (
                  <Button size="sm" variant="ghost" onClick={() => withdraw(o.id)}>
                    Withdraw
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-charcoal-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-charcoal-900">Meetup</h3>
          <Button size="sm" variant="outline" onClick={() => setShowMeetupForm((s) => !s)}>
            <MapPin className="h-4 w-4" /> Propose Meetup
          </Button>
        </div>

        {showMeetupForm && (
          <div className="mt-3 space-y-3 rounded-xl bg-charcoal-50 p-3">
            <select className="input" value={meetupForm.type} onChange={(e) => setMeetupForm({ ...meetupForm, type: e.target.value as MeetupType })}>
              <option value="PUBLIC">Public Meetup</option>
              <option value="BIKE_SHOP">Participating Bike Shop</option>
              <option value="LAW_ENFORCEMENT">Law-Enforcement-Supported Location</option>
            </select>
            {meetupForm.type === "BIKE_SHOP" && (
              <select className="input" value={meetupForm.bikeShopId} onChange={(e) => setMeetupForm({ ...meetupForm, bikeShopId: e.target.value, locationName: bikeShops.find((s) => s.id === e.target.value)?.name ?? "" })}>
                <option value="">Select a bike shop…</option>
                {bikeShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.city}, {s.state}
                    {s.offersInspection ? " (inspection available)" : ""}
                  </option>
                ))}
              </select>
            )}
            {meetupForm.type !== "BIKE_SHOP" && (
              <input className="input" placeholder="Location name (e.g. Central Park, Main St. Police Station lobby)" value={meetupForm.locationName} onChange={(e) => setMeetupForm({ ...meetupForm, locationName: e.target.value })} />
            )}
            <input className="input" type="datetime-local" value={meetupForm.scheduledAt} onChange={(e) => setMeetupForm({ ...meetupForm, scheduledAt: e.target.value })} />
            {meetupForm.type === "BIKE_SHOP" && bikeShops.find((s) => s.id === meetupForm.bikeShopId)?.offersInspection && (
              <label className="flex items-center gap-2 text-sm text-charcoal-700">
                <input type="checkbox" checked={meetupForm.inspectionRequested} onChange={(e) => setMeetupForm({ ...meetupForm, inspectionRequested: e.target.checked })} />
                Request optional professional inspection (separate fee — shop-provided, not a BikeFair service)
              </label>
            )}
            <Button size="sm" onClick={submitMeetup} disabled={!meetupForm.locationName}>
              Propose
            </Button>
          </div>
        )}

        <ul className="mt-3 space-y-2">
          {meetups.map((m) => (
            <li key={m.id} className="rounded-lg bg-charcoal-50 px-3 py-2 text-sm">
              <p className="font-medium text-charcoal-900">
                {MEETUP_TYPE_LABELS[m.type as MeetupType]} — {m.bikeShopName ?? m.locationName}
              </p>
              <p className="text-xs text-charcoal-500">
                {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "No time set"} · {m.status.toLowerCase()}
              </p>
              {m.status === "PROPOSED" && (
                <div className="mt-1 flex gap-2">
                  <Button size="sm" onClick={() => confirmMeetup(m.id)}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cancelMeetup(m.id)}>
                    Cancel
                  </Button>
                </div>
              )}
            </li>
          ))}
          {meetups.length === 0 && <p className="text-sm text-charcoal-400">No meetup proposed yet.</p>}
        </ul>
      </div>

      <div className="rounded-2xl border border-charcoal-100 bg-white p-4">
        <h3 className="font-display text-sm font-bold text-charcoal-900">Transaction</h3>
        <p className="mt-1 text-xs text-charcoal-500">
          Exchange payment and the bicycle in person, offline. Once you've completed the exchange, confirm it here so both accounts get an accurate transaction record.
        </p>
        {transaction?.status === "COMPLETED" ? (
          <p className="mt-2 text-sm font-medium text-green-700">✓ Transaction completed and recorded.</p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <Button onClick={confirmDone} disabled={myConfirmed} variant={myConfirmed ? "outline" : "secondary"}>
              <Handshake className="h-4 w-4" /> {myConfirmed ? "Waiting on other party…" : "Mark Transaction Completed"}
            </Button>
            <span className="text-xs text-charcoal-400">
              Buyer: {transaction?.buyerConfirmed ? "confirmed" : "pending"} · Seller: {transaction?.sellerConfirmed ? "confirmed" : "pending"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
