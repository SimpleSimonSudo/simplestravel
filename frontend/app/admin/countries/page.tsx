import Link from "next/link";
import { PlusCircle, Edit } from "lucide-react";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminCountriesList() {
  const supabase = createAdminClient();
  const { data: countries, error } = await supabase
    .from("countries")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-md">
        Failed to load countries: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-ink font-display">Countries</h1>
          <p className="text-dust mt-1">Manage the destinations in your diary.</p>
        </div>
        <Link
          href="/admin/countries/new"
          className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded hover:bg-smoke transition-colors"
        >
          <PlusCircle size={18} />
          Create Country
        </Link>
      </header>

      <div className="bg-white border border-ink/10 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/30 text-dust text-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-medium border-b border-ink/10">ISO</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10">Name</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden md:table-cell">Continent</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {countries?.map((country: any) => (
              <tr key={country.country_id} className="hover:bg-cream/10 transition-colors">
                <td className="py-3 px-4 text-dust font-mono text-sm">{country.iso_code}</td>
                <td className="py-3 px-4 font-medium text-ink">{country.name}</td>
                <td className="py-3 px-4 text-dust hidden md:table-cell">{country.continent || "-"}</td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/countries/${country.country_id}`}
                    className="inline-flex items-center gap-1 text-sm text-amber hover:text-ink transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!countries || countries.length === 0) && (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-dust">
                  No countries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
