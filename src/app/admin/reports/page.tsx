import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/constants";
import { ReportRowActions } from "./row-actions";

export const metadata = { title: "Admin — Reports" };

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { name: true } }, reportedUser: { select: { name: true } }, listing: { select: { id: true, title: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Reports</h1>
      <div className="mt-6 space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-charcoal-900">{REPORT_TYPE_LABELS[r.type as ReportType]}</p>
                <p className="text-xs text-charcoal-500">
                  Filed by {r.reporter.name} on {r.createdAt.toLocaleDateString()}
                  {r.listing && (
                    <>
                      {" "}
                      re:{" "}
                      <Link href={`/bike/${r.listing.id}`} className="underline">
                        {r.listing.title}
                      </Link>
                    </>
                  )}
                  {r.reportedUser && <> re: user {r.reportedUser.name}</>}
                </p>
              </div>
              <span className="rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">{r.status}</span>
            </div>
            <p className="mt-2 text-sm text-charcoal-700">{r.description}</p>
            {r.status !== "RESOLVED" && r.status !== "DISMISSED" && <ReportRowActions reportId={r.id} />}
            {r.adminNotes && <p className="mt-2 text-xs text-charcoal-400">Admin notes: {r.adminNotes}</p>}
          </div>
        ))}
        {reports.length === 0 && <p className="text-charcoal-500">No reports filed.</p>}
      </div>
    </div>
  );
}
