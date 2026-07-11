import { createAdminClient } from "@/lib/supabase";
import { saveTrip } from "../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { MediaGrid } from "./MediaGrid";
import { TripCountriesManager } from "./TripCountriesManager";

export const dynamic = "force-dynamic";

export default async function TripEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  
  let trip: any = null;
  let tripMedia: any[] = [];
  
  if (!isNew) {
    const supabase = createAdminClient();
    const tripId = parseInt(id, 10);
    
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("trip_id", tripId)
      .single();
    
    if (error) {
      return <div className="p-6 text-red-500">Error loading trip: {error.message}</div>;
    }
    trip = data;
  }

  // Fetch all countries for the dropdowns
  const supabase = createAdminClient();
  const { data: countries } = await supabase.from("countries").select("country_id, name").order("name");
  
  let tripCountries: any[] = [];
  if (!isNew) {
    const { data: tcData } = await supabase
      .from("trip_countries")
      .select("*")
      .eq("trip_id", parseInt(id, 10))
      .order("visit_order");
    tripCountries = tcData || [];
  }

  const saveAction = saveTrip.bind(null, id);

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <header className="flex items-center gap-4">
        <Link href="/admin/trips" className="text-dust hover:text-ink transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl text-ink font-display">
            {isNew ? "New Trip" : `Edit ${trip?.trip_name}`}
          </h1>
          <p className="text-dust mt-1">Manage the details of this journey.</p>
        </div>
      </header>

      <form action={saveAction} className="bg-white border border-ink/10 rounded-md p-6 space-y-4">
        <div>
          <label htmlFor="trip_name" className="block text-sm font-medium text-ink mb-1">Trip Name</label>
          <input
            type="text"
            id="trip_name"
            name="trip_name"
            required
            defaultValue={trip?.trip_name || ""}
            className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            placeholder="e.g. Summer in Japan"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-ink mb-1">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              defaultValue={trip?.start_date || ""}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-ink mb-1">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              defaultValue={trip?.end_date || ""}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="total_distance_km" className="block text-sm font-medium text-ink mb-1">Total Distance (km)</label>
            <input
              type="number"
              id="total_distance_km"
              name="total_distance_km"
              step="0.1"
              defaultValue={trip?.total_distance_km || ""}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            />
          </div>
          <div>
            <label htmlFor="companions" className="block text-sm font-medium text-ink mb-1">Companions (comma separated)</label>
            <input
              type="text"
              id="companions"
              name="companions"
              defaultValue={trip?.companions?.join(", ") || ""}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={trip?.description || ""}
            className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber resize-y"
            placeholder="A short summary of the trip..."
          />
        </div>

        <div className="pt-4 border-t border-ink/10 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-ink text-white px-6 py-2 rounded hover:bg-smoke transition-colors"
          >
            <Save size={18} />
            Save Trip
          </button>
        </div>
      </form>

      {!isNew && <TripCountriesManager tripId={parseInt(id, 10)} initialConnections={tripCountries} availableCountries={countries || []} />}
      {!isNew && <MediaGrid tripId={parseInt(id, 10)} />}
    </div>
  );
}
