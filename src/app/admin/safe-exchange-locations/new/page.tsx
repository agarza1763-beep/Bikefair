import { LocationForm } from "../location-form";

export const metadata = { title: "Admin — New Safe Exchange Location" };

export default function NewSafeExchangeLocationPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">New Safe Exchange Location</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        Only add an agency you've verified actually runs a public safe-exchange program (a news article, city .gov page, or similar) — this isn't a partnership, so
        listing doesn't require their prior agreement, but accuracy does. Send a courtesy notice after listing so they know they're on the site and can request a
        correction or removal. Mark it "Active" for it to appear as a meetup option in conversations and on the public /safe-exchange-locations page.
      </p>
      <div className="mt-6">
        <LocationForm />
      </div>
    </div>
  );
}
