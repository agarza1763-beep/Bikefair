import Link from "next/link";
import { requireAdmin } from "@/lib/session";

const LINKS = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/serial-numbers", label: "Fraud / Safety" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/bike-shops", label: "Bike Shops" },
  { href: "/admin/safe-exchange-locations", label: "Safe Exchange Locations" },
  { href: "/admin/recognized-brands", label: "Recognized Brands" },
  { href: "/admin/valuation-rules", label: "Valuation Rules" },
  { href: "/admin/fees", label: "Fees" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="sticky top-20 space-y-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
