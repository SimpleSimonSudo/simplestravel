#!/usr/bin/env python3
"""
Prüft alle Media-Einträge in Supabase.
Falls ein Bild auf R2 (Public URL) einen 404-Fehler wirft, 
wird es aus dem lokalen `media/`-Ordner nach R2 hochgeladen.
"""

import os
import sys
import boto3
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# R2 Config
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = "simplestravelmedia"
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

LOCAL_MEDIA_PATH = "/home/simple_simon/Codes/traveling_planet_earth/media"

# S3 R2 Client
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

def check_url_exists(url: str) -> bool:
    """Prüft per HEAD-Request, ob eine URL existiert (Status 200)."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        # User-Agent hinzufügen um Sperren zu vermeiden
        req.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status == 200
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return False
        # Andere Fehler (z.B. 403) werten wir vorsichtshalber als 'existiert'
        return True
    except Exception:
        # Bei Verbindungsfehlern nehmen wir an, es existiert nicht
        return False

def get_content_type(ext: str) -> str:
    content_type_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".gif": "image/gif",
        ".webp": "image/webp", ".svg": "image/svg+xml",
        ".mp4": "video/mp4", ".webm": "video/webm",
        ".mov": "video/quicktime", ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
    }
    return content_type_map.get(ext, "application/octet-stream")

def process_item(item: dict) -> dict:
    media_id = item["media_id"]
    local_path = item["local_path"]
    storage_path = item.get("storage_path")

    if not storage_path:
        return {"media_id": media_id, "status": "no_storage_path"}

    # Prüfen, ob die Datei in R2 existiert (200 OK)
    exists_in_r2 = check_url_exists(storage_path)
    if exists_in_r2:
        return {"media_id": media_id, "status": "exists"}

    # Datei existiert nicht in R2 (404) -> Upload vorbereiten
    relative_path = local_path.removeprefix("media/").lstrip("/")
    full_local_path = os.path.join(LOCAL_MEDIA_PATH, relative_path)
    folder = os.path.dirname(full_local_path)
    expected_filename = os.path.basename(full_local_path)

    if not os.path.exists(folder):
        return {"media_id": media_id, "status": "local_folder_missing", "path": folder}

    # Datei suchen (exakt oder Fuzzy)
    actual_file = None
    if os.path.exists(full_local_path):
        actual_file = full_local_path
    else:
        for filename in os.listdir(folder):
            if expected_filename.replace("_img_", "_") == filename.replace("_img_", "_"):
                actual_file = os.path.join(folder, filename)
                break

    if not actual_file:
        return {"media_id": media_id, "status": "local_file_missing", "path": relative_path}

    # Upload durchführen
    actual_filename = os.path.basename(actual_file)
    r2_key = os.path.join(os.path.dirname(relative_path), actual_filename)
    ext = Path(actual_file).suffix.lower()
    content_type = get_content_type(ext)

    try:
        s3.upload_file(
            actual_file,
            R2_BUCKET_NAME,
            r2_key,
            ExtraArgs={"ContentType": content_type},
        )
        return {"media_id": media_id, "status": "uploaded", "url": storage_path, "file": actual_filename}
    except Exception as e:
        return {"media_id": media_id, "status": "upload_failed", "error": str(e)}

def main():
    if not R2_ACCOUNT_ID or not R2_ACCESS_KEY or not R2_SECRET_KEY or not R2_PUBLIC_URL:
        print("❌ Fehler: Cloudflare R2 Credentials fehlen in .env")
        return
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Fehler: Supabase Credentials fehlen in .env")
        return

    print("Connecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Lade Media-Einträge...")
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
    print(f"Gefunden: {total} Media-Einträge in der DB.")

    print("\nPrüfe R2 Status und lade fehlende Dateien hoch (in parallel)...")
    
    uploaded_count = 0
    skipped_count = 0
    missing_local_count = 0
    failed_count = 0

    # Parallel verarbeiten mit ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_item, item): item for item in all_media}
        
        for i, future in enumerate(as_completed(futures), 1):
            res = future.result()
            status = res["status"]
            media_id = res["media_id"]

            if status == "uploaded":
                print(f" [{i}/{total}] 🚀 UPLOADED ID {media_id}: {res['file']} -> R2")
                uploaded_count += 1
            elif status == "exists":
                skipped_count += 1
            elif status in ["local_file_missing", "local_folder_missing"]:
                print(f" [{i}/{total}] ⚠️ LOKAL FEHLT ID {media_id}: {res.get('path')}")
                missing_local_count += 1
            elif status == "upload_failed":
                print(f" [{i}/{total}] ❌ UPLOAD FEHLER ID {media_id}: {res.get('error')}")
                failed_count += 1

    print("\n" + "="*40)
    print("MIGRATION BEENDET")
    print("="*40)
    print(f"  Hochgeladen:      {uploaded_count}")
    print(f"  Bereits in R2:     {skipped_count}")
    print(f"  Lokal nicht da:    {missing_local_count}")
    print(f"  Fehlgeschlagen:    {failed_count}")
    print("="*40)

if __name__ == "__main__":
    main()
