import { createAdminClient } from "@/lib/supabase";
import { saveCountry } from "../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CountryEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  
  let country: any = null;
  if (!isNew) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .eq("country_id", parseInt(id, 10))
      .single();
    
    if (error) {
      return <div className="p-6 text-red-500">Error loading country: {error.message}</div>;
    }
    country = data;
  }

  const saveAction = saveCountry.bind(null, id) as any;

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <header className="flex items-center gap-4">
        <Link href="/admin/countries" className="text-dust hover:text-ink transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl text-ink font-display">
            {isNew ? "New Country" : `Edit ${country?.name}`}
          </h1>
          <p className="text-dust mt-1">Make sure the ISO code is correct.</p>
        </div>
      </header>

      <form action={saveAction} className="bg-white border border-ink/10 rounded-md p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={country?.name || ""}
            className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            placeholder="e.g. Japan"
          />
        </div>
        
        <div>
          <label htmlFor="iso_code" className="block text-sm font-medium text-ink mb-1">ISO Code (2-letter)</label>
          <input
            type="text"
            id="iso_code"
            name="iso_code"
            required
            maxLength={2}
            defaultValue={country?.iso_code || ""}
            className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber uppercase"
            placeholder="e.g. JP"
          />
        </div>

        <div>
          <label htmlFor="continent" className="block text-sm font-medium text-ink mb-1">Continent</label>
          <input
            type="text"
            id="continent"
            name="continent"
            defaultValue={country?.continent || ""}
            className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            placeholder="e.g. Asia"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={country?.description || ""}
            className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber resize-y"
            placeholder="Notes about this country..."
          />
        </div>

        <div className="pt-4 border-t border-ink/10 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-ink text-white px-6 py-2 rounded hover:bg-smoke transition-colors"
          >
            <Save size={18} />
            Save Country
          </button>
        </div>
      </form>
    </div>
  );
}
