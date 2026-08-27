import { prisma } from "@/lib/prisma";
import { AddBrandForm } from "./add-brand-form";
import { BrandRow } from "./brand-row";

export const metadata = { title: "Admin — Recognized Brands" };

export default async function AdminRecognizedBrandsPage() {
  const brands = await prisma.recognizedBrand.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Recognized Brands</h1>
      <p className="mt-1 max-w-2xl text-sm text-charcoal-500">
        This is an <strong>allowlist</strong>, not a blocklist. Any listing whose brand doesn't match an active entry here (case-insensitive) shows a caution badge to
        buyers — the listing still goes live normally, sellers aren't blocked. This mainly matters for e-bikes: generic drop-shipped e-bikes carry real battery
        fire/build-quality risk, and this flags them for buyer awareness without banning any specific seller or brand outright. Deactivating a brand (rather than
        deleting it) keeps the audit trail in{" "}
        <span className="font-mono text-xs">AdminAction</span>.
      </p>

      <div className="mt-6 card p-5">
        <h2 className="font-display text-sm font-bold text-charcoal-900">Add a brand</h2>
        <AddBrandForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal-100 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <BrandRow key={b.id} brand={{ id: b.id, name: b.name, notes: b.notes ?? "", isActive: b.isActive }} />
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-charcoal-400">
                  No brands seeded yet — run <span className="font-mono">npm run db:seed-brands</span>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
