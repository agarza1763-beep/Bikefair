import { prisma } from "@/lib/prisma";
import { SuspendButton } from "./suspend-button";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { listings: true, reportsAgainst: true } } },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal-100 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-charcoal-100 text-left text-xs uppercase tracking-wide text-charcoal-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-charcoal-50 last:border-0">
                <td className="px-4 py-3 font-medium text-charcoal-900">
                  {u.name} {u.isDemo && <span className="text-xs text-charcoal-400">(demo)</span>}
                </td>
                <td className="px-4 py-3 text-charcoal-600">{u.email}</td>
                <td className="px-4 py-3 text-charcoal-600">{u.verificationLevel}</td>
                <td className="px-4 py-3 text-charcoal-600">{u._count.listings}</td>
                <td className="px-4 py-3 text-charcoal-600">{u._count.reportsAgainst}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isSuspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                    {u.isSuspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <SuspendButton userId={u.id} suspended={u.isSuspended} disabled={u.role === "ADMIN"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
