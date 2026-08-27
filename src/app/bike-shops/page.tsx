import Link from "next/link";
import { BadgeCheck, MapPin, Wrench, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { US_STATES, formatCents } from "@/lib/constants";
import { getFee } from "@/lib/fees";

export const metadata = { title: "Bike Shops — BikeFair" };

export default async function BikeShopsPage({ searchParams }: { searchParams: Promise<{ state?: string; city?: string }> }) {
  const { state, city } = await searchParams;

  const [shops, membershipFee] = await Promise.all([
    prisma.bikeShop.findMany({
      where: {
        membershipStatus: "ACTIVE",
        ...(state ? { state } : {}),
        ...(city ? { city: { contains: city } } : {}),
      },
      orderBy: [{ state: "asc" }, { city: "asc" }, { isVerified: "desc" }, { meetupCount: "desc" }],
    }),
    getFee("BIKE_SHOP_MEMBERSHIP"),
  ]);

  const grouped = shops.reduce<Record<string, typeof shops>>((acc, shop) => {
    (acc[shop.state] ??= []).push(shop);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">Participating Bike Shops</h1>
      <p className="mt-3 max-w-2xl text-charcoal-600">
        These shops have agreed to serve as designated meetup locations for BikeFair transactions. A participating shop is not a party to any transaction — see our{" "}
        <Link href="/safety" className="text-green-700 underline">
          Safety Center
        </Link>{" "}
        for details. Some shops also offer an optional, separately-paid professional inspection or tune-up service.
      </p>

      <Link
        href="/bike-shops/join"
        className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-dashed border-green-600 bg-green-50 p-5 transition-colors hover:bg-green-100"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
          <Store className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="font-display text-base font-bold text-green-900">Own a bike shop? Become a BikeFair partner location.</p>
          <p className="text-sm text-green-800">
            {membershipFee.isActive ? formatCents(membershipFee.amountCents) : "$25"}/month — bring new cyclists and clients into your shop as a trusted community
            meetup spot for local bike sales.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white">Sign Up →</span>
      </Link>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-charcoal-100 bg-white p-4" method="get">
        <label className="block">
          <span className="label">State</span>
          <select name="state" defaultValue={state ?? ""} className="input">
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">City</span>
          <input name="city" defaultValue={city ?? ""} placeholder="e.g. Austin" className="input" />
        </label>
        <button type="submit" className="rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal-700">
          Filter
        </button>
        {(state || city) && (
          <Link href="/bike-shops" className="text-sm font-medium text-charcoal-500 hover:text-green-700">
            Clear
          </Link>
        )}
      </form>

      {shops.length === 0 ? (
        <p className="mt-10 text-center text-charcoal-500">No participating bike shops match that location yet.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {Object.entries(grouped).map(([stateCode, stateShops]) => (
            <div key={stateCode}>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-charcoal-400">{stateCode}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {stateShops.map((shop) => (
                  <Link key={shop.id} href={`/bike-shops/${shop.id}`} className="card p-5 hover:border-green-600">
                    <div className="flex items-start justify-between">
                      <h3 className="font-display text-lg font-bold text-charcoal-900">{shop.name}</h3>
                      {shop.isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-green-600" />}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-charcoal-500">
                      <MapPin className="h-3.5 w-3.5" /> {shop.city}, {shop.state}
                    </p>
                    {shop.offersInspection && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
                        <Wrench className="h-3.5 w-3.5" /> Optional professional inspection / tune-up available
                      </p>
                    )}
                    <p className="mt-2 text-xs text-charcoal-400">{shop.meetupCount} BikeFair meetups hosted</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
