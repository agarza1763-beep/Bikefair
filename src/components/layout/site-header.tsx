"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, MessageCircle, Heart, User as UserIcon, LayoutDashboard } from "lucide-react";
import clsx from "clsx";
import { BRAND_NAME } from "@/lib/constants";
import { LinkButton } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/browse", label: "Buy Bikes" },
  { href: "/sell", label: "Sell a Bike" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/value-guide", label: "Fair Value Guide" },
  { href: "/safety", label: "Safety" },
  { href: "/bike-shops", label: "Bike Shops" },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-100 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-charcoal-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-accent-500">🚲</span>
            {BRAND_NAME}
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-medium transition-colors hover:text-green-700",
                  pathname?.startsWith(link.href) ? "text-green-700" : "text-charcoal-700"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {status === "authenticated" && session?.user ? (
            <>
              <Link href="/messages" className="rounded-full p-2 text-charcoal-700 hover:bg-charcoal-50" aria-label="Messages">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link href="/saved" className="rounded-full p-2 text-charcoal-700 hover:bg-charcoal-50" aria-label="Saved bikes">
                <Heart className="h-5 w-5" />
              </Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="rounded-full p-2 text-charcoal-700 hover:bg-charcoal-50" aria-label="Admin dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              )}
              <Link href="/account" className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium text-charcoal-900 hover:bg-charcoal-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal-900 text-xs text-white">
                  <UserIcon className="h-4 w-4" />
                </span>
                {session.user.name?.split(" ")[0]}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm font-medium text-charcoal-500 hover:text-charcoal-900">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/sign-in" className="text-sm font-medium text-charcoal-700 hover:text-green-700">
              Sign In
            </Link>
          )}
          <LinkButton href="/sell" variant="accent" size="md">
            Sell Your Bike
          </LinkButton>
        </div>

        <button className="p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-charcoal-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50">
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-charcoal-100" />
            {status === "authenticated" && session?.user ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50">
                  My Account
                </Link>
                <Link href="/messages" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50">
                  Messages
                </Link>
                <Link href="/saved" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50">
                  Saved Bikes
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50">
                    Admin
                  </Link>
                )}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-charcoal-500 hover:bg-charcoal-50">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/auth/sign-in" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-800 hover:bg-charcoal-50">
                Sign In
              </Link>
            )}
            <LinkButton href="/sell" variant="accent" size="md" className="mt-2 w-full">
              Sell Your Bike
            </LinkButton>
          </nav>
        </div>
      )}
    </header>
  );
}
