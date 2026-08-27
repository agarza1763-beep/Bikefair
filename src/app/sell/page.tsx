import { LinkButton } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const STEPS = [
  "Select your bicycle type",
  "Enter brand, model, year, size & frame material",
  "Enter components (groupset, wheels, brakes)",
  "Describe condition and any upgrades",
  "Upload photos",
  "Add the serial number (kept private)",
  "Set your asking price",
  "See your Estimated Fair Value",
  "Choose meetup preferences",
  "Preview your listing",
  "Publish",
];

export default function SellLandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-charcoal-900 sm:text-4xl">Sell your bike in about 5 minutes</h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal-500">
          We'll walk you through the details and show you an Estimated Fair Value before you publish — so you can price with confidence.
        </p>
        <LinkButton href="/sell/create" variant="accent" size="lg" className="mt-8">
          Start Your Listing
        </LinkButton>
      </div>

      <div className="mt-16 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-start gap-3 rounded-xl border border-charcoal-100 bg-white p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-xs font-semibold text-charcoal-400">STEP {i + 1}</p>
              <p className="text-sm font-medium text-charcoal-800">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
