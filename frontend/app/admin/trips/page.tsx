import Link from "next/link";
import { PlusCircle, Edit } from "lucide-react";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminTripsList() {
  const supabase = createAdminClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-md">
        Failed to load trips: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-ink font-display">Trips</h1>
          <p className="text-dust mt-1">Manage your journeys.</p>
        </div>
        <Link
          href="/admin/trips/new"
          className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded hover:bg-smoke transition-colors"
        >
          <PlusCircle size={18} />
          Create Trip
        </Link>
      </header>

      <div className="bg-white border border-ink/10 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/30 text-dust text-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-medium border-b border-ink/10">Name</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden sm:table-cell">Dates</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden md:table-cell">Distance</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {trips?.map((trip: any) => (
              <tr key={trip.trip_id} className="hover:bg-cream/10 transition-colors">
                <td className="py-3 px-4 font-medium text-ink">{trip.trip_name}</td>
                <td className="py-3 px-4 text-dust hidden sm:table-cell">
                  {trip.start_date || "?"} - {trip.end_date || "?"}
                </td>
                <td className="py-3 px-4 text-dust hidden md:table-cell">
                  {trip.total_distance_km ? `${trip.total_distance_km} km` : "-"}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/trips/${trip.trip_id}`}
                    className="inline-flex items-center gap-1 text-sm text-amber hover:text-ink transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!trips || trips.length === 0) && (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-dust">
                  No trips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
