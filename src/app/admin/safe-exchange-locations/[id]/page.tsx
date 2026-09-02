import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LocationForm } from "../location-form";
import type { AgencyType } from "@/lib/constants";

export const metadata = { title: "Admin — Edit Safe Exchange Location" };

export default async function EditSafeExchangeLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await prisma.safeExchangeLocation.findUnique({ where: { id } });
  if (!location) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Edit Safe Exchange Location</h1>
      <div className="mt-6">
        <LocationForm
          initial={{
            id: location.id,
            name: location.name,
            agencyType: location.agencyType as AgencyType,
            address: location.address,
            city: location.city,
            state: location.state,
            zip: location.zip ?? "",
            phone: location.phone ?? "",
            notes: location.notes ?? "",
            isActive: location.isActive,
          }}
        />
      </div>
    </div>
  );
}
