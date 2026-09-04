"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateShopWatchlistAction } from "@/server/actions/bikeshops";
import { BIKE_CATEGORIES, BIKE_CATEGORY_LABELS, type BikeCategory } from "@/lib/constants";

export function WatchlistEditor({ initialCategories, initialBrands }: { initialCategories: string[]; initialBrands: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [brandsInput, setBrandsInput] = useState(initialBrands.join(", "));
  const [isPending, startTransition] = useTransition();

  function toggleCategory(c: BikeCategory) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function save() {
    const brands = brandsInput
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    startTransition(async () => {
      await updateShopWatchlistAction(categories, brands);
      router.refresh();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 className="h-4 w-4" /> Customize your focus
      </Button>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="label">Categories you want to track</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {BIKE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                categories.includes(c) ? "border-green-600 bg-green-50 text-green-800" : "border-charcoal-200 text-charcoal-600 hover:border-charcoal-400"
              }`}
            >
              {BIKE_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="watched-brands">
          Brands you want to track (comma-separated)
        </label>
        <input id="watched-brands" className="input" placeholder="e.g. Trek, Specialized, Cervelo" value={brandsInput} onChange={(e) => setBrandsInput(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={isPending}>
          Save
        </Button>
      </div>
    </div>
  );
}
