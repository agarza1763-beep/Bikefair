import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/browse", label: "Browse Bikes" },
      { href: "/sell", label: "Sell a Bike" },
      { href: "/value-guide", label: "Fair Value Guide" },
      { href: "/bike-shops", label: "Bike Shops" },
    ],
  },
  {
    title: "Trust & Safety",
    links: [
      { href: "/safety", label: "Safety Center" },
      { href: "/safe-exchange-locations", label: "Safe Exchange Locations" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/community-guidelines", label: "Community Guidelines" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal-100 bg-charcoal-900 text-charcoal-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-accent-500 text-sm">🚲</span>
              {BRAND_NAME}
            </div>
            <p className="mt-3 max-w-xs text-sm text-charcoal-400">
              Fair prices. Local transactions. Safer meetups. Built specifically for bicycles — not a general classifieds site.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-charcoal-200 hover:text-accent-500">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-charcoal-800 pt-6 text-xs leading-relaxed text-charcoal-400">
          <p>
            {BRAND_NAME} facilitates connections between buyers and sellers of used bicycles. The actual bicycle transaction — including payment and exchange — occurs
            directly between the buyer and seller. {BRAND_NAME} does not take ownership of any bicycle listed on the platform, does not process bicycle purchase payments,
            and does not provide insurance, identity verification, law enforcement services, or professional inspections unless explicitly stated as a completed,
            configured integration. Participating meetup locations, including bike shops and any listed law-enforcement-supported locations, are not parties to any
            transaction.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} James Silver EP, LLC, DBA {BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
