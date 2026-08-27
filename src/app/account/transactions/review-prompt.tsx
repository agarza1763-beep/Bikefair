"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitReviewAction } from "@/server/actions/reviews";

const CATEGORIES: { key: "overallRating" | "communicationRating" | "reliabilityRating" | "accuracyRating"; label: string }[] = [
  { key: "overallRating", label: "Overall" },
  { key: "communicationRating", label: "Communication" },
  { key: "reliabilityRating", label: "Reliability" },
  { key: "accuracyRating", label: "Listing accuracy" },
];

export function ReviewPrompt({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState({ overallRating: 5, communicationRating: 5, reliabilityRating: 5, accuracyRating: 5 });
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="mt-2" onClick={() => setOpen(true)}>
        Leave a Review
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-charcoal-50 p-3">
      {CATEGORIES.map((c) => (
        <div key={c.key} className="flex items-center justify-between">
          <span className="text-sm text-charcoal-700">{c.label}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRatings({ ...ratings, [c.key]: n })}>
                <Star className={`h-5 w-5 ${n <= ratings[c.key] ? "fill-accent-500 text-accent-600" : "text-charcoal-200"}`} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <textarea className="textarea" rows={2} placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        size="sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const res = await submitReviewAction(transactionId, { ...ratings, comment });
          setLoading(false);
          if (!res.ok) return setError(res.error);
          router.refresh();
        }}
      >
        Submit Review
      </Button>
    </div>
  );
}
