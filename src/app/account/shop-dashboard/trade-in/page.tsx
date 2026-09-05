import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TradeInCalculator } from "@/components/account/trade-in-calculator";

export const metadata = { title: "Trade-In Calculator — BikeFair" };

export default async function TradeInCalculatorPage() {
  const user = await requireUser();
  const shop = await prisma.bikeShop.findUnique({ where: { ownerUserId: user.id } });

  if (!shop || shop.membershipStatus !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Trade-In Calculator</h1>
        <p className="mt-2 text-charcoal-500">This is a bike-shop partner perk. Your shop needs an active BikeFair membership to use it.</p>
        <Link href="/bike-shops/join" className="mt-6 inline-block rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal-700">
          Become a Partner
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/account/shop-dashboard" className="flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-green-700">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-charcoal-900">Trade-In Calculator</h1>
      <p className="mt-1 text-sm text-charcoal-500">
        Runs the same fair-value engine buyers and sellers see on BikeFair, plus a suggested trade-in offer range for when a customer brings in a used bike. Use it at
        the counter to price a trade-in on the spot.
      </p>
      <div className="mt-6">
        <TradeInCalculator shopState={shop.state} />
      </div>
    </div>
  );
}
