#!/usr/bin/env python3
"""
Upload lokale Medien zu Cloudflare R2 und aktualisiere Supabase DB.

Voraussetzungen:
- pip install boto3 python-dotenv supabase --break-system-packages
- Cloudflare R2 API Token mit R2 Write Permission

Usage:
    python3 5_upload_to_r2.py                    # Upload all
    python3 5_upload_to_r2.py --dry-run          # Test run (no upload)
    python3 5_upload_to_r2.py --limit 10         # Upload only 10 files
    python3 5_upload_to_r2.py --dry-run --limit 5  # Test with 5 files
"""

import os
import sys
import boto3
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# ============================================================================
# CONFIG
# ============================================================================

# Cloudflare R2 Credentials (Account → R2 → Manage R2 API Tokens)
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")  # Deine Account ID
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")  # API Token Access Key
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")  # API Token Secret Key
R2_BUCKET_NAME = "simplestravelmedia"

# Public R2 URL (nach Custom Domain Setup oder R2.dev URL)
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

# Lokaler Media-Ordner (wo deine Bilder liegen)
LOCAL_MEDIA_PATH="/home/simple_simon/Codes/traveling_planet_earth/media"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service Role für DB-Updates

# ============================================================================
# S3-COMPATIBLE R2 CLIENT
# ============================================================================

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",  # R2 braucht keine Region
)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================================
# UPLOAD FUNKTION
# ============================================================================

def upload_file_to_r2(local_path: str, r2_key: str) -> str:
    """
    Lädt eine Datei zu R2 hoch.
    
    Args:
        local_path: Lokaler Dateipfad
        r2_key: Zielpfad in R2 (z.B. "2018/01/image.jpg")
    
    Returns:
        Public URL der hochgeladenen Datei
    """
    # Content-Type für alle gängigen Media-Formate
    ext = Path(local_path).suffix.lower()
    content_type_map = {
        # Images
        ".jpg": "image/jpeg", 
        ".jpeg": "image/jpeg",
        ".png": "image/png", 
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".bmp": "image/bmp",
        ".tiff": "image/tiff",
        ".tif": "image/tiff",
        
        # Videos
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mkv": "video/x-matroska",
        ".flv": "video/x-flv",
        ".wmv": "video/x-ms-wmv",
        ".m4v": "video/mp4",
        
        # Audio
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".flac": "audio/flac",
        ".wma": "audio/x-ms-wma",
    }
    content_type = content_type_map.get(ext, "application/octet-stream")

    # Upload
    s3.upload_file(
        local_path,
        R2_BUCKET_NAME,
        r2_key,
        ExtraArgs={"ContentType": content_type},
    )

    # Public URL
    return f"{R2_PUBLIC_URL}/{r2_key}"


# ============================================================================
# MIGRATION
# ============================================================================

def migrate_media(limit: int = None, dry_run: bool = False):
    """
    1. Lädt alle Medien aus Supabase `media` Tabelle
    2. Für jede Datei mit `local_path`:
       - Upload zu R2
       - Update `storage_path` in DB
    
    Args:
        limit: Limit number of files (for testing)
        dry_run: If True, only check files without uploading
    """
    print("\n" + "="*60)
    print("🚀 R2 MEDIA MIGRATION")
    if dry_run:
        print("   [DRY RUN - No files will be uploaded]")
    print("="*60)

    # Alle Media-Einträge mit local_path holen (mit Pagination!)
    # Supabase hat ein Backend-Limit von 1000 Rows pro Query
    print("\n📥 Lade Media-Einträge aus DB...")
    
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
        print(f"   Geladen: {len(all_media)} Einträge...")
        
        if len(result.data) < page_size:
            break  # Letzte Seite
        
        offset += page_size
    
    # Limit anwenden falls angegeben
    if limit and len(all_media) > limit:
        all_media = all_media[:limit]
    
    media_items = all_media
    total = len(media_items)
    
    print(f"\n📊 {total} Medien gefunden mit local_path\n")

    uploaded = 0
    skipped = 0
    errors = 0
    by_type = {}  # Track uploads per media type

    for i, item in enumerate(media_items, 1):
        media_id = item["media_id"]
        local_path = item["local_path"]
        current_storage = item.get("storage_path")

        # DB hat "media/POST_ID/file.jpg", lokal ist es nur "POST_ID/file.jpg"
        # Entferne "media/" prefix falls vorhanden
        relative_path = local_path.removeprefix("media/").lstrip("/")
        
        # Lokaler Pfad absolut machen
        full_local_path = os.path.join(LOCAL_MEDIA_PATH, relative_path)
        folder = os.path.dirname(full_local_path)
        expected_filename = os.path.basename(full_local_path)

        # Prüfen ob Ordner existiert
        if not os.path.exists(folder):
            print(f"  ⚠️  [{i}/{total}] SKIP: Ordner nicht gefunden: {os.path.basename(folder)}")
            skipped += 1
            continue

        # Datei suchen (exakt oder mit _img_ Pattern)
        actual_file = None
        if os.path.exists(full_local_path):
            actual_file = full_local_path
        else:
            # Fuzzy match: block_N_hash.jpg → suche block_N_img_hash.jpg
            # Oder umgekehrt: block_N_img_hash.jpg → suche block_N_hash.jpg
            for filename in os.listdir(folder):
                # Entferne "_img_" aus beiden Namen für Vergleich
                normalized_expected = expected_filename.replace("_img_", "_")
                normalized_actual = filename.replace("_img_", "_")
                
                if normalized_expected == normalized_actual:
                    actual_file = os.path.join(folder, filename)
                    break
        
        if not actual_file:
            print(f"  ⚠️  [{i}/{total}] SKIP: Datei nicht gefunden: {relative_path}")
            skipped += 1
            continue

        # Schon hochgeladen? (storage_path beginnt mit R2_PUBLIC_URL)
        if current_storage and current_storage.startswith(R2_PUBLIC_URL):
            print(f"  ⏭️  [{i}/{total}] SKIP: Bereits in R2: {relative_path}")
            skipped += 1
            continue

        # R2 Key = relative_path (ohne "media/" prefix, behalte POST_ID/file.jpg)
        # Aber verwende den ECHTEN Dateinamen vom Filesystem
        actual_filename = os.path.basename(actual_file)
        r2_key = os.path.join(os.path.dirname(relative_path), actual_filename)

        try:
            # Bestimme Media-Type
            ext = Path(actual_file).suffix.lower()
            media_type = "image" if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"] else \
                         "video" if ext in [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".m4v"] else \
                         "audio" if ext in [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".wma"] else \
                         "other"
            
            if dry_run:
                # Dry run: nur checken, nicht hochladen
                file_size = os.path.getsize(actual_file)
                print(f"  ✓  [{i}/{total}] OK: {relative_path} → {actual_filename} ({file_size:,} bytes, {media_type})")
                uploaded += 1
                by_type[media_type] = by_type.get(media_type, 0) + 1
            else:
                # Upload (verwende echten Dateinamen)
                r2_url = upload_file_to_r2(actual_file, r2_key)

                # Update DB
                supabase.table("media") \
                    .update({"storage_path": r2_url}) \
                    .eq("media_id", media_id) \
                    .execute()

                print(f"  ✅ [{i}/{total}] {relative_path} → {actual_filename}")
                uploaded += 1
                by_type[media_type] = by_type.get(media_type, 0) + 1

        except Exception as e:
            print(f"  ❌ [{i}/{total}] ERROR: {relative_path} — {e}")
            errors += 1

    # Summary
    print("\n" + "="*60)
    print("✅ MIGRATION ABGESCHLOSSEN")
    print("="*60)
    print(f"  ✅ Hochgeladen:  {uploaded}")
    print(f"  ⏭️  Übersprungen: {skipped}")
    print(f"  ❌ Fehler:       {errors}")
    
    if by_type:
        print(f"\n  📊 Nach Media-Type:")
        for mtype, count in sorted(by_type.items()):
            print(f"     {mtype:8s}: {count}")
    print()


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    # Parse CLI args
    dry_run = "--dry-run" in sys.argv
    limit = None
    
    for i, arg in enumerate(sys.argv):
        if arg == "--limit" and i + 1 < len(sys.argv):
            try:
                limit = int(sys.argv[i + 1])
            except ValueError:
                print("❌ --limit muss eine Zahl sein")
                exit(1)
    
    # Validierung
    if not R2_ACCOUNT_ID or not R2_ACCESS_KEY or not R2_SECRET_KEY:
        print("❌ Fehler: R2 Credentials fehlen in .env")
        print("   Benötigt: R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY")
        exit(1)

    if not os.path.exists(LOCAL_MEDIA_PATH):
        print(f"❌ Fehler: LOCAL_MEDIA_PATH existiert nicht: {LOCAL_MEDIA_PATH}")
        exit(1)

    print(f"📂 Lokaler Media-Ordner: {LOCAL_MEDIA_PATH}")
    print(f"🪣 R2 Bucket: {R2_BUCKET_NAME}")
    print(f"🌐 Public URL: {R2_PUBLIC_URL}")
    if limit:
        print(f"📊 Limit: {limit} Dateien")
    if dry_run:
        print(f"🧪 Dry Run: Kein Upload, nur Validierung")
    print()
    
    if not dry_run:
        input("Fortfahren? [ENTER] oder CTRL+C zum Abbrechen")

    migrate_media(limit=limit, dry_run=dry_run)
