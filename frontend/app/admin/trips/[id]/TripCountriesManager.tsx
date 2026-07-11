"use client";

import { useState } from "react";
import { updateTripCountries } from "../actions";
import { Plus, Trash2, Save } from "lucide-react";

export function TripCountriesManager({ tripId, initialConnections, availableCountries }: { tripId: number, initialConnections: any[], availableCountries: any[] }) {
  const [connections, setConnections] = useState<any[]>(
    initialConnections.map(c => ({
      ...c,
      id: Math.random().toString(), // local id for list rendering
    }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = () => {
    setConnections([...connections, { id: Math.random().toString(), country_id: "", entry_date: "", exit_date: "", days_spent: "" }]);
  };

  const handleRemove = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  const handleChange = (id: string, field: string, value: any) => {
    setConnections(connections.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    // Filter out rows without a selected country
    const validConnections = connections.filter(c => c.country_id);
    
    setIsSaving(true);
    try {
      const res = await updateTripCountries(tripId, validConnections);
      if (res.error) {
        alert("Error saving countries: " + res.error);
      } else {
        alert("Countries updated successfully!");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 bg-white border border-ink/10 rounded-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-ink">Visited Countries</h3>
          <p className="text-sm text-dust">Manage the countries visited during this trip, in order.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-amber text-white px-4 py-2 rounded hover:bg-amber/90 transition-colors text-sm disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Route"}
        </button>
      </div>

      <div className="space-y-4">
        {connections.map((c, index) => (
          <div key={c.id} className="flex flex-wrap md:flex-nowrap items-start gap-4 p-4 border border-ink/10 rounded bg-cream/30">
            <div className="font-mono text-dust text-sm pt-2 w-6">{index + 1}.</div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-2xs text-dust mb-1 uppercase tracking-wider">Country</label>
              <select
                value={c.country_id || ""}
                onChange={(e) => handleChange(c.id, "country_id", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm bg-white"
              >
                <option value="">Select a country...</option>
                {availableCountries.map(country => (
                  <option key={country.country_id} value={country.country_id}>{country.name}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-2xs text-dust mb-1 uppercase tracking-wider">Entry Date</label>
              <input
                type="date"
                value={c.entry_date ? c.entry_date.substring(0, 10) : ""}
                onChange={(e) => handleChange(c.id, "entry_date", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
              />
            </div>

            <div className="w-full md:w-32">
              <label className="block text-2xs text-dust mb-1 uppercase tracking-wider">Exit Date</label>
              <input
                type="date"
                value={c.exit_date ? c.exit_date.substring(0, 10) : ""}
                onChange={(e) => handleChange(c.id, "exit_date", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
              />
            </div>

            <div className="w-full md:w-24">
              <label className="block text-2xs text-dust mb-1 uppercase tracking-wider">Days</label>
              <input
                type="number"
                value={c.days_spent || ""}
                onChange={(e) => handleChange(c.id, "days_spent", e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
              />
            </div>

            <div className="pt-5">
              <button
                onClick={() => handleRemove(c.id)}
                className="text-red-400 hover:text-red-600 p-2 transition-colors"
                title="Remove Country"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 text-amber hover:text-amber/80 font-medium text-sm p-2 transition-colors"
        >
          <Plus size={16} /> Add Country Stop
        </button>
      </div>
    </div>
  );
}
