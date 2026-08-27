import { BRAND_NAME } from "@/lib/constants";

export const metadata = { title: "Community Guidelines — BikeFair" };

const DOS = [
  "Describe your bike's condition honestly, including any needed repairs.",
  "Respond to messages promptly and let buyers know when a bike sells.",
  "Meet in a safe, agreed-upon location and arrive on time.",
  "Inspect a bike in person before completing a purchase.",
  "Report anything that seems fraudulent, unsafe, or suspicious.",
];

const DONTS = [
  "List a bicycle you don't have the right to sell.",
  "Misrepresent a bike's brand, components, condition, or history.",
  "Harass, threaten, or discriminate against another user.",
  "Share another user's private information publicly.",
  "Attempt to move a bicycle purchase payment through the platform — BikeFair does not process bicycle sale payments.",
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">Community Guidelines</h1>
      <p className="mt-3 text-charcoal-600">{BRAND_NAME} works because riders treat each other fairly. Here's what we expect.</p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-bold text-green-700">Do</h2>
          <ul className="mt-3 space-y-2 text-sm text-charcoal-700">
            {DOS.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-green-600">✓</span> {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-red-500">Don't</h2>
          <ul className="mt-3 space-y-2 text-sm text-charcoal-700">
            {DONTS.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-red-500">✕</span> {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-10 rounded-xl bg-charcoal-50 p-4 text-sm text-charcoal-600">
        Violations may result in listing removal, account suspension, or a report being escalated for further review. See our{" "}
        <a href="/safety" className="text-green-700 underline">
          Safety Center
        </a>{" "}
        for how to report a concern.
      </p>
    </div>
  );
}
