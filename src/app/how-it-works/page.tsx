import { LinkButton } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = { title: "How It Works — BikeFair" };

const BUYER_STEPS = [
  "Search or browse bikes by type, price, and location.",
  "Check the Estimated Fair Value shown on every listing.",
  "Message the seller — ask questions, make an offer.",
  "Agree on a price and a meetup location together.",
  "Meet, inspect the bike, and exchange payment directly with the seller.",
  "Mark the transaction completed and leave a review.",
];

const SELLER_STEPS = [
  "Create your listing with the guided wizard.",
  "Enter specifications, condition, and photos.",
  "See your Estimated Fair Value before you publish.",
  "Set your asking price and publish.",
  "Respond to messages and offers from interested buyers.",
  "Arrange a meetup, complete the sale, and mark it sold.",
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">How {BRAND_NAME} Works</h1>
      <p className="mt-3 max-w-2xl text-charcoal-600">
        {BRAND_NAME} connects local buyers and sellers of used bicycles. We handle listings, pricing guidance, messaging, and meetup coordination — the buyer and seller
        handle payment and the bicycle exchange directly, in person.
      </p>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <StepList title="For buyers" steps={BUYER_STEPS} />
        <StepList title="For sellers" steps={SELLER_STEPS} />
      </div>

      <div className="mt-12 rounded-2xl border border-charcoal-100 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-charcoal-900">What {BRAND_NAME} does not do</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-charcoal-600">
          <li>Process the bicycle's purchase payment — that happens directly between buyer and seller.</li>
          <li>Take ownership of any bicycle listed on the platform.</li>
          <li>Guarantee a bicycle's condition, authenticity, or ownership history.</li>
          <li>Act as a party to any transaction — including at participating bike shop meetup locations.</li>
        </ul>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <LinkButton href="/browse" variant="accent" size="lg">
          Find a Bike
        </LinkButton>
        <LinkButton href="/sell" variant="outline" size="lg">
          Sell a Bike
        </LinkButton>
      </div>
    </div>
  );
}

function StepList({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-charcoal-900">{title}</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm text-charcoal-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
