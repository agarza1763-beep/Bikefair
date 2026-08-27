"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Flag, MessageCircle, HandCoins, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startConversationAction } from "@/server/actions/messaging";
import { makeOfferAction } from "@/server/actions/offers";
import { toggleSavedListingAction } from "@/server/actions/saved";
import { submitReportAction } from "@/server/actions/reports";
import { REPORT_TYPES, REPORT_TYPE_LABELS, formatCents } from "@/lib/constants";

const QUICK_MESSAGES = ["Is this still available?", "Would you accept a lower offer?", "Can we meet at a participating bike shop?", "Can you provide the serial number?"];

export function ListingActions({ listingId, isOwnListing, initiallySaved, askingPriceCents }: { listingId: string; isOwnListing: boolean; initiallySaved: boolean; askingPriceCents: number }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "message" | "offer" | "report">("none");
  const [saved, setSaved] = useState(initiallySaved);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [offerAmount, setOfferAmount] = useState(() => (askingPriceCents / 100).toString());
  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>("MISREPRESENTATION");
  const [reportDesc, setReportDesc] = useState("");
  const [sent, setSent] = useState(false);

  function requireAuth() {
    if (!session?.user) {
      router.push(`/auth/sign-in?callbackUrl=/bike/${listingId}`);
      return false;
    }
    return true;
  }

  function toggleSave() {
    if (!requireAuth()) return;
    setSaved((s) => !s);
    startTransition(async () => {
      await toggleSavedListingAction(listingId);
    });
  }

  function sendMessage(text: string) {
    if (!requireAuth() || !text.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await startConversationAction(listingId, text);
      if (!res.ok) return setError(res.error);
      router.push(`/messages/${res.data!.conversationId}`);
    });
  }

  function sendOffer() {
    if (!requireAuth()) return;
    setError(null);
    startTransition(async () => {
      const convo = await startConversationAction(listingId, `Hi, I'd like to make an offer on this bike.`);
      if (!convo.ok) return setError(convo.error);
      const offer = await makeOfferAction(convo.data!.conversationId, Number(offerAmount));
      if (!offer.ok) return setError(offer.error);
      router.push(`/messages/${convo.data!.conversationId}`);
    });
  }

  function sendReport() {
    if (!requireAuth() || !reportDesc.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await submitReportAction({ type: reportType, description: reportDesc, listingId });
      if (!res.ok) return setError(res.error);
      setSent(true);
    });
  }

  if (isOwnListing) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setPanel(panel === "message" ? "none" : "message")} className="w-full">
          <MessageCircle className="h-4 w-4" /> Message Seller
        </Button>
        <Button variant="outline" onClick={() => setPanel(panel === "offer" ? "none" : "offer")} className="w-full">
          <HandCoins className="h-4 w-4" /> Make an Offer
        </Button>
        <Button variant={saved ? "accent" : "outline"} onClick={toggleSave} className="w-full">
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save Bike"}
        </Button>
        <Button variant="ghost" onClick={() => setPanel(panel === "report" ? "none" : "report")} className="w-full border border-charcoal-200">
          <Flag className="h-4 w-4" /> Report Listing
        </Button>
      </div>
      <Button variant="ghost" onClick={() => sendMessage("Can we meet at a participating bike shop?")} className="w-full border border-charcoal-200">
        <MapPin className="h-4 w-4" /> Arrange Meetup
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {panel === "message" && (
        <div className="rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_MESSAGES.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} className="rounded-full border border-charcoal-200 bg-white px-3 py-1 text-xs text-charcoal-700 hover:border-green-600">
                {q}
              </button>
            ))}
          </div>
          <textarea className="textarea" rows={3} placeholder="Write a message to the seller…" value={body} onChange={(e) => setBody(e.target.value)} />
          <Button size="sm" className="mt-2" disabled={isPending} onClick={() => sendMessage(body)}>
            Send
          </Button>
        </div>
      )}

      {panel === "offer" && (
        <div className="rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
          <label className="label">Your offer</label>
          <div className="flex items-center gap-2">
            <span className="text-charcoal-500">$</span>
            <input className="input" type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} />
          </div>
          <p className="mt-1 text-xs text-charcoal-500">Asking price: {formatCents(askingPriceCents)}</p>
          <Button size="sm" className="mt-2" disabled={isPending} onClick={sendOffer}>
            Send Offer
          </Button>
        </div>
      )}

      {panel === "report" && (
        <div className="rounded-xl border border-charcoal-100 bg-charcoal-50 p-4">
          {sent ? (
            <p className="text-sm text-green-700">Thanks — our team will review this report.</p>
          ) : (
            <>
              <label className="label">Reason</label>
              <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)}>
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {REPORT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <label className="label mt-3">Details</label>
              <textarea className="textarea" rows={3} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Please describe the issue…" />
              <Button size="sm" variant="danger" className="mt-2" disabled={isPending} onClick={sendReport}>
                Submit Report
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
