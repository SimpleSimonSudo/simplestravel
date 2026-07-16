#!/usr/bin/env python3
import os
import re
import json
import sys
import urllib.parse
import boto3
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# R2 Config
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "simplestravelmedia")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

def main():
    dry_run = "--delete" not in sys.argv
    force_yes = "--yes" in sys.argv

    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_PUBLIC_URL]):
        print("❌ Cloudflare R2 Credentials/Config missing in .env")
        return
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Supabase URL/Key missing in .env")
        return

    print("Connecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Connecting to Cloudflare R2...")
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
    )

    # 1. List all objects in R2 with ETags
    print(f"Listing all files in R2 bucket '{R2_BUCKET_NAME}'...")
    r2_objects = {}  # key -> {size, etag}
    etag_map = {}    # etag -> list of keys
    
    paginator = s3.get_paginator('list_objects_v2')
    total_r2_size = 0
    
    try:
        pages = paginator.paginate(Bucket=R2_BUCKET_NAME)
        for page in pages:
            for obj in page.get('Contents', []):
                key = obj['Key']
                size = obj['Size']
                # Clean ETag (strip double quotes)
                etag = obj['ETag'].replace('"', '')
                
                r2_objects[key] = {
                    "size_bytes": size,
                    "size_mb": size / 1024 / 1024,
                    "etag": etag
                }
                total_r2_size += size
                
                if etag not in etag_map:
                    etag_map[etag] = []
                etag_map[etag].append(key)
    except Exception as e:
        print(f"❌ Error listing R2 bucket: {e}")
        return

    print(f"Found {len(r2_objects)} files in R2 (Total size: {total_r2_size / 1024 / 1024:.2f} MB)")

    # 2. Fetch references from Supabase (media, posts, content_blocks, community)
    print("Fetching active media references from Supabase...")
    referenced_keys = set()
    page_size = 1000
    
    # 2a. media table
    offset = 0
    while True:
        result = supabase.table("media") \
            .select("media_id, storage_path") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        for item in result.data:
            path = item.get("storage_path")
            if path:
                key = path
                if R2_PUBLIC_URL in key:
                    key = key.split(R2_PUBLIC_URL)[-1].lstrip('/')
                elif "r2.dev" in key:
                    key = re.sub(r'https?://[^/]+/', '', key)
                key = urllib.parse.unquote(key)
                referenced_keys.add(key)
        if len(result.data) < page_size:
            break
        offset += page_size

    # 2b. posts table
    offset = 0
    while True:
        result = supabase.table("posts") \
            .select("post_id, summary, content_blocks") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        for item in result.data:
            text_to_search = ""
            if item.get("summary"):
                text_to_search += item["summary"]
            if item.get("content_blocks"):
                text_to_search += json.dumps(item["content_blocks"])
            for key in r2_objects:
                if key in text_to_search:
                    referenced_keys.add(key)
        if len(result.data) < page_size:
            break
        offset += page_size

    # 2c. content_blocks table
    offset = 0
    while True:
        result = supabase.table("content_blocks") \
            .select("block_id, text_content, link_url") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        for item in result.data:
            text_to_search = ""
            if item.get("text_content"):
                text_to_search += item["text_content"]
            if item.get("link_url"):
                text_to_search += item["link_url"]
            for key in r2_objects:
                if key in text_to_search:
                    referenced_keys.add(key)
        if len(result.data) < page_size:
            break
        offset += page_size

    # 2d. community impulses & replies
    offset = 0
    while True:
        result = supabase.table("community_impulses") \
            .select("impulse_id, content") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        for item in result.data:
            text_to_search = item.get("content") or ""
            for key in r2_objects:
                if key in text_to_search:
                    referenced_keys.add(key)
        if len(result.data) < page_size:
            break
        offset += page_size

    offset = 0
    while True:
        result = supabase.table("community_replies") \
            .select("reply_id, content") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        for item in result.data:
            text_to_search = item.get("content") or ""
            for key in r2_objects:
                if key in text_to_search:
                    referenced_keys.add(key)
        if len(result.data) < page_size:
            break
        offset += page_size

    print(f"Found {len(referenced_keys)} distinct R2 keys referenced in DB.")

    # 3. Analyze Orphans and Duplicates
    safe_to_delete = []
    unique_orphans = []
    
    total_safe_size = 0
    total_unique_size = 0

    for key, info in r2_objects.items():
        if key in referenced_keys:
            continue  # Referenced, keep it!
            
        etag = info["etag"]
        size_mb = info["size_mb"]
        
        # Check if there are other files with the same ETag
        siblings = etag_map.get(etag, [])
        
        # Check if any of the siblings are referenced in Supabase
        referenced_siblings = [sib for sib in siblings if sib in referenced_keys]
        
        if referenced_siblings:
            # We have the exact same file content referenced under another key!
            # This orphaned file is a duplicate and is SAFE to delete.
            safe_to_delete.append({
                "key": key,
                "size_bytes": info["size_bytes"],
                "size_mb": size_mb,
                "etag": etag,
                "duplicates_referenced_key": referenced_siblings[0],
                "all_referenced_siblings": referenced_siblings
            })
            total_safe_size += info["size_bytes"]
        else:
            # This file is orphaned and unique (no referenced file shares its content)
            unique_orphans.append({
                "key": key,
                "size_bytes": info["size_bytes"],
                "size_mb": size_mb,
                "etag": etag
            })
            total_unique_size += info["size_bytes"]

    # Write detailed analysis to JSON
    analysis_file = Path("scratch/duplicate_analysis.json")
    with open(analysis_file, "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total_r2_files": len(r2_objects),
                "total_r2_size_mb": total_r2_size / 1024 / 1024,
                "referenced_files": len(referenced_keys),
                "safe_to_delete_duplicates_count": len(safe_to_delete),
                "safe_to_delete_duplicates_size_mb": total_safe_size / 1024 / 1024,
                "unique_orphans_count": len(unique_orphans),
                "unique_orphans_size_mb": total_unique_size / 1024 / 1024
            },
            "safe_to_delete_duplicates": safe_to_delete,
            "unique_orphans": unique_orphans
        }, f, indent=2, ensure_ascii=False)

    # 4. Print Summary Report
    print("\n" + "="*60)
    print("📊 DUPILKATE & VERWAISTE MEDIEN REPORT")
    print("="*60)
    print(f"Verwaiste Dateien insgesamt:     {len(safe_to_delete) + len(unique_orphans)}")
    print(f" davon sichere Duplikate:        {len(safe_to_delete)} ({total_safe_size / 1024 / 1024:.2f} MB)")
    print(f" davon einzigartige Orphans:      {len(unique_orphans)} ({total_unique_size / 1024 / 1024:.2f} MB)")
    print(f"Gesamte einsparbare Größe:       {(total_safe_size + total_unique_size) / 1024 / 1024:.2f} MB")
    print("="*60)
    print(f"Detaillierter Bericht gespeichert in: {analysis_file}")
    
    if safe_to_delete:
        print("\nBeispiele für sichere Duplikate (Verwaiste Datei -> Referenzierte Datei):")
        for i, item in enumerate(safe_to_delete[:10], 1):
            print(f"  {i:2d}. {item['key']} ({item['size_mb']:.2f} MB)")
            print(f"      -> Duplikat von: {item['duplicates_referenced_key']}")
        if len(safe_to_delete) > 10:
            print(f"      ... und {len(safe_to_delete) - 10} weitere.")
            
    if unique_orphans:
        print("\nBeispiele für einzigartige verwaiste Dateien (Kein Duplikat vorhanden!):")
        for i, item in enumerate(unique_orphans[:10], 1):
            print(f"  {i:2d}. {item['key']} ({item['size_mb']:.2f} MB)")
        if len(unique_orphans) > 10:
            print(f"      ... und {len(unique_orphans) - 10} weitere.")

    # 5. Handle Deletion
    if dry_run:
        print("\n💡 Tipp: Um die sicheren Duplikate automatisch zu löschen, führe aus:")
        print("   python3 scratch/manage_duplicates.py --delete")
        print("\n⚠️ Einzigartige verwaiste Dateien (Unique Orphans) werden NIE automatisch gelöscht,")
        print("   da deren Inhalt nicht an anderer Stelle referenziert ist.")
        return

    # Deletion Mode
    print("\n" + "!"*60)
    print("⚠️ LÖSCHMODUS AKTIVIERT")
    print("!"*60)
    print(f"Es sollen {len(safe_to_delete)} sichere Duplikate gelöscht werden.")
    print(f"Dadurch werden {total_safe_size / 1024 / 1024:.2f} MB Speicherplatz freigegeben.")
    print("Einzigartige verwaiste Dateien werden zum Schutz vor Datenverlust ignoriert.")
    
    if not safe_to_delete:
        print("Nichts zu löschen.")
        return

    if not force_yes:
        confirm = input("\nMöchtest du diese Dateien jetzt dauerhaft aus R2 löschen? [y/N]: ")
        if confirm.lower() != 'y':
            print("Abgebrochen.")
            return

    print("\nLösche Dateien aus R2...")
    deleted_count = 0
    failed_count = 0
    
    for i, item in enumerate(safe_to_delete, 1):
        key = item["key"]
        try:
            s3.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
            print(f"  [{i}/{len(safe_to_delete)}] ✅ Gelöscht: {key}")
            deleted_count += 1
        except Exception as e:
            print(f"  [{i}/{len(safe_to_delete)}] ❌ Fehler bei {key}: {e}")
            failed_count += 1

    print("\n" + "="*40)
    print("LÖSCHVORGANG BEENDET")
    print("="*40)
    print(f"  Erfolgreich gelöscht: {deleted_count}")
    print(f"  Fehlgeschlagen:       {failed_count}")
    print("="*40)

if __name__ == "__main__":
    main()
