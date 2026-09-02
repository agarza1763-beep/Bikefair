import { LocationForm } from "../location-form";

export const metadata = { title: "Admin — New Safe Exchange Location" };

export default function NewSafeExchangeLocationPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">New Safe Exchange Location</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        Only add an agency after they've actually agreed to be listed. Mark it "Active" for it to appear as a meetup option in conversations and on the public
        /safe-exchange-locations page.
      </p>
      <div className="mt-6">
        <LocationForm />
      </div>
    </div>
  );
}
