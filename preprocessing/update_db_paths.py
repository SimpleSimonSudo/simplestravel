#!/usr/bin/env python3
"""
Aktualisiert die DB-Einträge in Supabase mit den korrekten Cloudflare R2 URLs,
OHNE die Dateien erneut hochzuladen (falls sie bereits in R2 liegen).
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

LOCAL_MEDIA_PATH = "/home/simple_simon/Codes/traveling_planet_earth/media"

def main():
    if not R2_PUBLIC_URL:
        print("❌ Fehler: R2_PUBLIC_URL fehlt in .env")
        return
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Fehler: Supabase Credentials fehlen in .env")
        return

    print("Connecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Lade alle Media-Einträge...")
    all_media = []
    page_size = 1000
    offset = 0
    
    while True:
        result = supabase.table("media") \
            .select("media_id, local_path, storage_path") \
            .not_.is_("local_path", "null") \
            .range(offset, offset + page_size - 1) \
            .execute()
        
        if not result.data:
            break
        
        all_media.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    total = len(all_media)
    print(f"Gefunden: {total} Media-Einträge mit local_path.")

    updated = 0
    skipped = 0
    errors = 0

    print("\nStarte Datenbank-Update...")
    for i, item in enumerate(all_media, 1):
        media_id = item["media_id"]
        local_path = item["local_path"]
        current_storage = item.get("storage_path")

        # Prüfen ob bereits aktualisiert
        if current_storage and current_storage.startswith(R2_PUBLIC_URL):
            skipped += 1
            continue

        # Relativen Pfad berechnen
        relative_path = local_path.removeprefix("media/").lstrip("/")
        full_local_path = os.path.join(LOCAL_MEDIA_PATH, relative_path)
        folder = os.path.dirname(full_local_path)
        expected_filename = os.path.basename(full_local_path)

        if not os.path.exists(folder):
            skipped += 1
            continue

        # Datei suchen (exakt oder mit _img_ Fuzzy Matching)
        actual_file = None
        if os.path.exists(full_local_path):
            actual_file = full_local_path
        else:
            for filename in os.listdir(folder):
                if expected_filename.replace("_img_", "_") == filename.replace("_img_", "_"):
                    actual_file = os.path.join(folder, filename)
                    break

        if not actual_file:
            # Wenn lokal gar nicht vorhanden, nehmen wir den Standard-Pfad ohne Upload
            actual_filename = expected_filename
        else:
            actual_filename = os.path.basename(actual_file)

        # R2 Key & URL berechnen
        r2_key = os.path.join(os.path.dirname(relative_path), actual_filename)
        r2_url = f"{R2_PUBLIC_URL}/{r2_key}"

        try:
            # DB aktualisieren
            supabase.table("media") \
                .update({"storage_path": r2_url}) \
                .eq("media_id", media_id) \
                .execute()
            
            print(f" [{i}/{total}] ✅ Updated ID {media_id}: {r2_url}")
            updated += 1
        except Exception as e:
            print(f" [{i}/{total}] ❌ Fehler bei ID {media_id}: {e}")
            errors += 1

    print("\n" + "="*40)
    print("Fertig!")
    print(f"  Aktualisiert: {updated}")
    print(f"  Übersprungen: {skipped}")
    print(f"  Fehler:       {errors}")
    print("="*40)

if __name__ == "__main__":
    main()
