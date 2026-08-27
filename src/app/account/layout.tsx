import Link from "next/link";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/listings", label: "My Listings" },
  { href: "/account/transactions", label: "Transactions" },
  { href: "/account/reviews", label: "Reviews" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-charcoal-100 bg-white">
        <nav className="mx-auto flex max-w-3xl gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap py-3 text-sm font-medium text-charcoal-600 hover:text-green-700">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
