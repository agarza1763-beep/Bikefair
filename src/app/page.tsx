import { ShieldCheck, MapPin, Gauge, Bike } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { BikeCard } from "@/components/bike/bike-card";
import { fetchFeaturedListings } from "@/server/queries/listings";
import { BRAND_NAME } from "@/lib/constants";

export default async function HomePage() {
  const featured = await fetchFeaturedListings(8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,255,61,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(35,127,85,0.35),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-accent-500">
            Built specifically for bicycles
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Buy &amp; Sell Used Bikes <span className="text-accent-500">With Confidence</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-charcoal-200">Fair prices. Local transactions. Safer meetups.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <LinkButton href="/browse" variant="accent" size="lg">
              Find a Bike
            </LinkButton>
            <LinkButton href="/sell" variant="outline-inverse" size="lg">
              Sell a Bike
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard
            icon={<Gauge className="h-6 w-6" />}
            title="Know What Your Bike Is Worth"
            body="Get an estimated fair market value based on bicycle specifications, condition, and market information."
            href="/value-guide"
          />
          <ValueCard
            icon={<MapPin className="h-6 w-6" />}
            title="Meet Locally"
            body="Choose designated local meetup locations, including participating bicycle shops where available."
            href="/safety"
          />
          <ValueCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="High-Value Bike?"
            body="Optional enhanced safety assistance and law-enforcement-supported meetup resources, where legally and locally available."
            href="/safety"
          />
          <ValueCard
            icon={<Bike className="h-6 w-6" />}
            title="Built Specifically for Bicycles"
            body="This isn't a general classifieds website. Every feature is designed around bicycles."
            href="/how-it-works"
          />
        </div>
      </section>

      {/* Featured listings */}
      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-charcoal-900 sm:text-3xl">Fresh listings</h2>
                <p className="mt-1 text-charcoal-500">Every listing shows an estimated fair value alongside the asking price.</p>
              </div>
              <LinkButton href="/browse" variant="outline" size="sm" className="hidden sm:inline-flex">
                Browse all
              </LinkButton>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="bg-green-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Not a general marketplace. A bicycle marketplace.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-green-100">
            Every field in a {BRAND_NAME} listing — groupset, frame material, wheelset, serial number — exists because it matters for pricing and safety
            on a bicycle. That's what powers our fair value estimates and our meetup safety tools.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton href="/value-guide" variant="accent">
              See the Fair Value Guide
            </LinkButton>
            <LinkButton href="/safety" variant="outline-inverse">
              Safety Center
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, body, href }: { icon: React.ReactNode; title: string; body: string; href: string }) {
  return (
    <a href={href} className="group flex flex-col rounded-2xl border border-charcoal-100 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-charcoal-900/5">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">{icon}</span>
      <h3 className="font-display text-base font-bold text-charcoal-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal-500">{body}</p>
    </a>
  );
}
