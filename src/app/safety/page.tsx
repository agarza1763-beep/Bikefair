import Link from "next/link";
import { ShieldCheck, MapPin, Landmark, Wrench, AlertTriangle, BatteryWarning } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";

export const metadata = { title: "Safety Center — BikeFair" };

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">Safety Center</h1>
      <p className="mt-3 text-charcoal-600">
        {BRAND_NAME} helps you find a safer way to meet — it doesn't replace your own judgment. Always trust your instincts, and involve someone you know if a meetup feels
        off.
      </p>

      <div className="mt-10 space-y-8">
        <SafetySection icon={<MapPin className="h-5 w-5" />} title="Public meetups">
          <p>
            Choose a well-lit, populated public location — a shopping center parking lot, a busy trailhead, a coffee shop. Meet during daylight hours when possible, and
            consider bringing a friend.
          </p>
        </SafetySection>

        <SafetySection icon={<Wrench className="h-5 w-5" />} title="Participating bike shops">
          <p>
            Some bike shops partner with {BRAND_NAME} as designated meetup locations. <strong>The participating bicycle shop is not a party to the transaction and is not
            responsible for the bicycle, buyer, seller, payment, ownership, condition, or outcome of the transaction.</strong> Meeting at a shop does not mean the shop has
            inspected or approved the bicycle — unless you've separately paid for and received that shop's optional professional inspection service.
          </p>
        </SafetySection>

        <SafetySection icon={<Landmark className="h-5 w-5" />} title="Law-enforcement-supported meetup options">
          <p>
            For higher-value transactions, some areas offer designated "safe exchange" locations — often at a police station lobby or a monitored parking area — as a
            community safety resource. <strong>Availability varies by location, and {BRAND_NAME} does not employ, dispatch, or pay police officers, and does not represent
            any law enforcement agency as a business partner.</strong> See our{" "}
            <Link href="/safe-exchange-locations" className="text-green-700 underline">
              list of participating agencies
            </Link>{" "}
            — verify current availability and any rules directly with your local department before relying on it.
          </p>
        </SafetySection>

        <SafetySection icon={<BatteryWarning className="h-5 w-5" />} title="Buying a used e-bike">
          <p>
            E-bikes carry a risk regular bikes don't: lithium-ion battery fires. This is a real, documented problem with cheap, generic, drop-shipped e-bikes and
            aftermarket battery packs sold under an ever-changing rotation of no-name brands (often through marketplaces like Amazon) — damaged, poorly-manufactured, or
            mismatched batteries have caused serious house fires. Before buying a used e-bike:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Look for a <strong>UL 2849</strong> (electrical system) or <strong>UL 2271</strong> (battery) certification mark, or ask the seller directly — a
              reputable manufacturer will know the answer immediately.
            </li>
            <li>Never buy a bike with a visibly swollen, damaged, dented, or previously-repaired battery, and never charge one unattended.</li>
            <li>Ask whether the battery is the original one the bike shipped with, or an aftermarket/third-party replacement — mismatched batteries are a major fire risk.</li>
            <li>
              Listings whose brand isn't on our recognized-manufacturer list show a{" "}
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">⚠ Unrecognized brand</span> caution badge — this is an
              informational flag, not a claim that the bike is unsafe, and not a ban on the seller or brand. Use it as a prompt to ask more questions, not as a
              guarantee either way.
            </li>
          </ul>
        </SafetySection>

        <SafetySection icon={<ShieldCheck className="h-5 w-5" />} title="Before you buy: inspect the bike">
          <p>
            Test ride it. Check that the serial number (usually stamped under the bottom bracket) is legible and not obviously altered or removed. If anything feels
            inconsistent with the listing, walk away and report the listing.
          </p>
        </SafetySection>

        <SafetySection icon={<AlertTriangle className="h-5 w-5" />} title="If something seems wrong">
          <p>
            Report suspected stolen bicycles, fraud, or unsafe behavior directly from the listing or from your messages. Our team reviews every report — we don't
            publicly accuse anyone of a crime based solely on an automated match, but we do investigate and can remove listings, flag serial numbers for review, or
            suspend accounts.
          </p>
        </SafetySection>
      </div>

      <div className="mt-12 rounded-2xl bg-charcoal-900 p-6 text-sm text-charcoal-200">
        {BRAND_NAME} facilitates connections between buyers and sellers. It does not process bicycle purchase payments, take ownership of any bicycle, provide insurance,
        or guarantee the outcome of any transaction.
      </div>
    </div>
  );
}

function SafetySection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">{icon}</span>
      <div>
        <h2 className="font-display text-lg font-bold text-charcoal-900">{title}</h2>
        <div className="mt-1.5 text-sm leading-relaxed text-charcoal-600">{children}</div>
      </div>
    </div>
  );
}
