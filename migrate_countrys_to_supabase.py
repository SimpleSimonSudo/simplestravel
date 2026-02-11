#!/usr/bin/env python3
"""
CSV → Supabase Migration: Countries & Trips
Liest countries.csv und speist Daten in Supabase ein.

Besonderheiten:
- Leere Trip-Namen = Fortsetzung des vorherigen Trips
- Cambodia-Duplikat wird dedupliziert
- "Andi Danny" → ["Andi", "Danny"]
- Typo-Korrekturen: Autstria, Madasgascar, Tunesia, Srilanka, Micheal
- Worldtrip hat nur End-Datum → alle Posts vor 2019-07-11
- 4 Trips mit klaren Zeiträumen → Posts automatisch zuordnen
"""

import os
import csv
import re
from datetime import date
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ============================================================================
# KORREKTUREN
# ============================================================================

COUNTRY_CORRECTIONS = {
    "Autstria":    "Austria",
    "Madasgascar": "Madagascar",
    "Tunesia":     "Tunisia",
    "Srilanka":    "Sri Lanka",
    "Macedonia":   "North Macedonia",
}

TRIP_CORRECTIONS = {
    "Climbing ": "Climbing",
}

# Companions die als ein String kamen aber mehrere Personen sind
COMPANION_CORRECTIONS = {
    "Andi Danny": ["Andi", "Danny"],
    "Micheal":    ["Michael"],
}

COUNTRY_ISO = {
    "Singapore":              ("SG", "Asia"),
    "Vietnam":                ("VN", "Asia"),
    "New Zealand":            ("NZ", "Oceania"),
    "Australia":              ("AU", "Oceania"),
    "Indonesia":              ("ID", "Asia"),
    "Timor-Leste":            ("TL", "Asia"),
    "Malaysia":               ("MY", "Asia"),
    "Brunei":                 ("BN", "Asia"),
    "Thailand":               ("TH", "Asia"),
    "Cambodia":               ("KH", "Asia"),
    "Philippines":            ("PH", "Asia"),
    "Nepal":                  ("NP", "Asia"),
    "India":                  ("IN", "Asia"),
    "Chile":                  ("CL", "South America"),
    "Peru":                   ("PE", "South America"),
    "Ecuador":                ("EC", "South America"),
    "Colombia":               ("CO", "South America"),
    "Spain":                  ("ES", "Europe"),
    "Israel":                 ("IL", "Asia"),
    "Portugal":               ("PT", "Europe"),
    "France":                 ("FR", "Europe"),
    "Egypt":                  ("EG", "Africa"),
    "Croatia":                ("HR", "Europe"),
    "Panama":                 ("PA", "North America"),
    "Costa Rica":             ("CR", "North America"),
    "Nicaragua":              ("NI", "North America"),
    "Honduras":               ("HN", "North America"),
    "Guatemala":              ("GT", "North America"),
    "Mexico":                 ("MX", "North America"),
    "Austria":                ("AT", "Europe"),
    "Hungary":                ("HU", "Europe"),
    "Montenegro":             ("ME", "Europe"),
    "Madagascar":             ("MG", "Africa"),
    "South Africa":           ("ZA", "Africa"),
    "Mozambique":             ("MZ", "Africa"),
    "Malawi":                 ("MW", "Africa"),
    "Sri Lanka":              ("LK", "Asia"),
    "Tunisia":                ("TN", "Africa"),
    "Bosnia and Herzegovina": ("BA", "Europe"),
    "Serbia":                 ("RS", "Europe"),
    "North Macedonia":        ("MK", "Europe"),
    "Greece":                 ("GR", "Europe"),
}

# ============================================================================
# DATUM PARSEN
# ============================================================================

MONTH_MAP = {
    "januar": 1, "february": 2, "februar": 2, "march": 3, "maerz": 3, "märz": 3,
    "april": 4, "may": 5, "mai": 5, "juni": 6, "july": 7, "juli": 7,
    "august": 8, "september": 9, "oktober": 10, "november": 11, "dezember": 12,
}

def parse_date(raw: str) -> Optional[date]:
    if not raw or raw.strip() in ('', 'Fist-Post'):
        return None
    raw = raw.strip()
    # DD.MonatName.YYYY
    m = re.match(r'(\d{1,2})\.([A-Za-z\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc]+)\.(\d{4})', raw)
    if m:
        mo = MONTH_MAP.get(m.group(2).lower())
        if mo:
            return date(int(m.group(3)), mo, int(m.group(1)))
    # DD.MM.YYYY
    m = re.match(r'(\d{1,2})\.(\d{1,2})\.(\d{4})', raw)
    if m:
        return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    print(f"  ⚠️  Konnte Datum nicht parsen: '{raw}'")
    return None


def parse_companions(raw: str) -> list:
    if not raw or not raw.strip():
        return []
    result = []
    for part in raw.split(','):
        part = part.strip()
        if not part:
            continue
        if part in COMPANION_CORRECTIONS:
            result.extend(COMPANION_CORRECTIONS[part])
        else:
            result.append(part)
    return result

# ============================================================================
# CSV PARSEN
# ============================================================================

def parse_csv(filepath: str) -> list:
    rows = []
    current_trip  = None
    current_start = None
    current_end   = None

    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            trip_raw    = row['Trip'].strip()
            country_raw = row['Country'].strip()
            companion   = row['Companion'].strip()
            start_raw   = row['Start-time'].strip()
            end_raw     = row['End-time'].strip()

            if not country_raw:
                continue

            if trip_raw:
                current_trip  = TRIP_CORRECTIONS.get(trip_raw, trip_raw)
                current_start = parse_date(start_raw) if start_raw and start_raw != 'Fist-Post' else None
                current_end   = parse_date(end_raw)   if end_raw else None
            else:
                if end_raw:
                    current_end = parse_date(end_raw)

            country = COUNTRY_CORRECTIONS.get(country_raw, country_raw)
            rows.append({
                'trip':       current_trip,
                'country':    country,
                'companions': parse_companions(companion),
                'start':      current_start,
                'end':        current_end,
            })
    return rows


def build_trips(rows: list) -> list:
    """Gruppiert Rows zu Trips, dedupliziert Länder."""
    trips     = {}
    order_cnt = {}

    for row in rows:
        t = row['trip']
        if t not in trips:
            trips[t]     = {'name': t, 'start': row['start'], 'end': row['end'], 'countries': []}
            order_cnt[t] = 0
        else:
            if row['end']:
                trips[t]['end'] = row['end']

        # Duplikat-Länder überspringen (Cambodia kam 2x vor)
        existing = {c['name'] for c in trips[t]['countries']}
        if row['country'] in existing:
            print(f"  ℹ️  Duplikat übersprungen: {row['country']} in '{t}'")
            continue

        order_cnt[t] += 1
        trips[t]['countries'].append({
            'name':        row['country'],
            'companions':  row['companions'],
            'visit_order': order_cnt[t],
        })

    return list(trips.values())

# ============================================================================
# SUPABASE MIGRATOR
# ============================================================================

class CSVMigrator:
    def __init__(self):
        self.supabase       = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.country_id_map = {}
        self.trip_id_map    = {}
        self.stats          = {'countries': 0, 'trips': 0, 'trip_countries': 0, 'posts_assigned': 0}

    def upsert_countries(self, all_names: list):
        print("\n" + "="*60)
        print("🌍 STEP 1: COUNTRIES")
        print("="*60)
        for name in sorted(set(all_names)):
            iso, continent = COUNTRY_ISO.get(name, (None, None))
            result = self.supabase.table('countries') \
                .upsert({'name': name, 'iso_code': iso, 'continent': continent}, on_conflict='name') \
                .execute()
            if result.data:
                self.country_id_map[name] = result.data[0]['country_id']
                print(f"  ✅ {name:30s} ({iso or '??'})")
                self.stats['countries'] += 1
            else:
                print(f"  ❌ Fehler: {name}")
        # Alle frisch laden
        for row in self.supabase.table('countries').select('country_id, name').execute().data:
            self.country_id_map[row['name']] = row['country_id']

    def upsert_trips(self, trips: list):
        print("\n" + "="*60)
        print("🗺️  STEP 2: TRIPS")
        print("="*60)
        for trip in trips:
            name = trip['name']
            all_companions = sorted({c for e in trip['countries'] for c in e['companions']})
            data = {
                'trip_name':  name,
                'start_date': trip['start'].isoformat() if trip['start'] else None,
                'end_date':   trip['end'].isoformat()   if trip['end']   else None,
                'companions': all_companions if all_companions else None,
            }
            result = self.supabase.table('trips').upsert(data, on_conflict='trip_name').execute()
            if result.data:
                self.trip_id_map[name] = result.data[0]['trip_id']
                s = str(trip['start']) if trip['start'] else '—'
                e = str(trip['end'])   if trip['end']   else '—'
                print(f"  ✅ {name:25s}  [{s} → {e}]")
                print(f"     {', '.join(c['name'] for c in trip['countries'])}\n")
                self.stats['trips'] += 1
            else:
                print(f"  ❌ Fehler: {name}")
        for row in self.supabase.table('trips').select('trip_id, trip_name').execute().data:
            self.trip_id_map[row['trip_name']] = row['trip_id']

    def insert_trip_countries(self, trips: list):
        print("\n" + "="*60)
        print("🔗 STEP 3: TRIP ↔ COUNTRIES")
        print("="*60)
        for trip in trips:
            trip_id = self.trip_id_map.get(trip['name'])
            if not trip_id:
                print(f"  ❌ Trip ID fehlt: {trip['name']}")
                continue
            for c in trip['countries']:
                country_id = self.country_id_map.get(c['name'])
                if not country_id:
                    print(f"  ❌ Country ID fehlt: {c['name']}")
                    continue
                result = self.supabase.table('trip_countries') \
                    .upsert({'trip_id': trip_id, 'country_id': country_id, 'visit_order': c['visit_order']},
                            on_conflict='trip_id,country_id') \
                    .execute()
                if result.data:
                    print(f"  ✅ {trip['name']:25s} → {c['name']}")
                    self.stats['trip_countries'] += 1
                else:
                    print(f"  ❌ {trip['name']} → {c['name']}")

    def assign_posts_to_trips(self, trips: list):
        print("\n" + "="*60)
        print("📝 STEP 4: POSTS → TRIPS ZUORDNEN")
        print("="*60)
        print("  (Nur Trips mit (teil-)klaren Zeiträumen; Rest → im Frontend)\n")

        assigned_total = 0

        for trip in trips:
            trip_id = self.trip_id_map.get(trip['name'])
            if not trip_id:
                continue

            # Fall A: Start + End → Klarer Zeitraum
            if trip['start'] and trip['end']:
                posts = self.supabase.table('posts') \
                    .select('post_id') \
                    .gte('post_date', trip['start'].isoformat()) \
                    .lte('post_date', trip['end'].isoformat() + 'T23:59:59Z') \
                    .is_('trip_id', 'null') \
                    .execute()
                if posts.data:
                    self.supabase.table('posts') \
                        .update({'trip_id': trip_id}) \
                        .in_('post_id', [p['post_id'] for p in posts.data]) \
                        .execute()
                    print(f"  ✅ {trip['name']:25s} [{trip['start']} → {trip['end']}]")
                    print(f"     {len(posts.data)} Posts zugeordnet")
                    assigned_total += len(posts.data)
                else:
                    print(f"  ⏭️  {trip['name']:25s} Keine neuen Posts im Zeitraum")

            # Fall B: Nur End-Datum (= Worldtrip) → alle Posts VOR diesem Datum
            elif not trip['start'] and trip['end']:
                posts = self.supabase.table('posts') \
                    .select('post_id') \
                    .lte('post_date', trip['end'].isoformat() + 'T23:59:59Z') \
                    .is_('trip_id', 'null') \
                    .execute()
                if posts.data:
                    self.supabase.table('posts') \
                        .update({'trip_id': trip_id}) \
                        .in_('post_id', [p['post_id'] for p in posts.data]) \
                        .execute()
                    print(f"  ✅ {trip['name']:25s} [Anfang → {trip['end']}]")
                    print(f"     {len(posts.data)} Posts zugeordnet (alle vor End-Datum)")
                    assigned_total += len(posts.data)

            # Fall C: Kein Datum → manuell
            else:
                countries_str = ', '.join(c['name'] for c in trip['countries'])
                print(f"  ⏸️  {trip['name']:25s} → manuell ({countries_str})")

        self.stats['posts_assigned'] = assigned_total

    def print_summary(self):
        print("\n" + "="*60)
        print("✅ MIGRATION ABGESCHLOSSEN")
        print("="*60)
        print(f"  🌍 Countries:         {self.stats['countries']}")
        print(f"  🗺️  Trips:             {self.stats['trips']}")
        print(f"  🔗 Trip↔Country:      {self.stats['trip_countries']}")
        print(f"  📝 Posts zugeordnet:  {self.stats['posts_assigned']}")
        print()
        print("  Im Frontend noch zu erledigen:")
        print("  → Post-Trip-Zuordnung für Trips ohne Datum")
        print("  → Post-Country-Zuordnung (alle Posts)")
        print("  → Genaue Einreisedaten in trip_countries")
        print()

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "="*60)
    print("🚀 CSV → SUPABASE MIGRATION: COUNTRIES & TRIPS")
    print("="*60)

    csv_path = "countries.csv"
    if not os.path.exists(csv_path):
        csv_path = "/mnt/user-data/uploads/countries.csv"

    print("\n📋 Parse CSV...")
    rows  = parse_csv(csv_path)
    trips = build_trips(rows)
    all_countries = list({r['country'] for r in rows})

    print(f"\n  📊 VORSCHAU: {len(all_countries)} Länder  |  {len(trips)} Trips\n")
    for trip in trips:
        s = str(trip['start']) if trip['start'] else '—'
        e = str(trip['end'])   if trip['end']   else '—'
        print(f"  • {trip['name']:25s} [{s} → {e}]")
        print(f"    {', '.join(c['name'] for c in trip['countries'])}")

    print("\nFortfahren? [ENTER] oder CTRL+C zum Abbrechen")
    input()

    migrator = CSVMigrator()
    migrator.upsert_countries(all_countries)
    migrator.upsert_trips(trips)
    migrator.insert_trip_countries(trips)
    migrator.assign_posts_to_trips(trips)
    migrator.print_summary()


if __name__ == "__main__":
    main()