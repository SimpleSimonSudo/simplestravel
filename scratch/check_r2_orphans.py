#!/usr/bin/env python3
import os
import re
import json
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

    # 1. List all objects in R2
    print(f"Listing all files in R2 bucket '{R2_BUCKET_NAME}'...")
    r2_files = {}  # key -> size_bytes
    paginator = s3.get_paginator('list_objects_v2')
    
    total_r2_size = 0
    try:
        pages = paginator.paginate(Bucket=R2_BUCKET_NAME)
        for page in pages:
            for obj in page.get('Contents', []):
                key = obj['Key']
                size = obj['Size']
                r2_files[key] = size
                total_r2_size += size
    except Exception as e:
        print(f"❌ Error listing R2 bucket: {e}")
        return

    print(f"Found {len(r2_files)} files in R2 (Total size: {total_r2_size / 1024 / 1024:.2f} MB)")

    # 2. Fetch references from Supabase
    print("Fetching media references from Supabase 'media' table...")
    referenced_keys = set()
    
    # Supabase pagination
    page_size = 1000
    offset = 0
    
    # We will search for references in the media table: storage_path
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
                # Extract key from URL
                # Example: https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev/2023/10/file.jpg -> 2023/10/file.jpg
                # We can remove the R2_PUBLIC_URL prefix
                key = path
                if R2_PUBLIC_URL in key:
                    key = key.split(R2_PUBLIC_URL)[-1].lstrip('/')
                elif "r2.dev" in key:
                    # Generic r2.dev check just in case
                    key = re.sub(r'https?://[^/]+/', '', key)
                
                # Unquote URL encoding (e.g. %20 -> space)
                key = urllib.parse.unquote(key)
                
                referenced_keys.add(key)
                
        if len(result.data) < page_size:
            break
        offset += page_size

    print(f"Found {len(referenced_keys)} distinct R2 keys referenced in 'media' table.")

    # 3. Check for any other references in the db (optional scan)
    # We search the 'posts' content_blocks and text_content/link_url to be absolutely safe.
    print("Scanning 'posts' content_blocks and metadata for additional R2 references...")
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
                
            # Find any mentions of keys in strings
            # Look for any matches of our known R2 keys in the JSON or text strings
            for key in r2_files:
                if key in text_to_search:
                    if key not in referenced_keys:
                        print(f"  ℹ️ Key '{key}' found in post '{item['post_id']}' text/JSON reference.")
                        referenced_keys.add(key)
                        
        if len(result.data) < page_size:
            break
        offset += page_size

    # Also search 'content_blocks' table
    print("Scanning 'content_blocks' table for additional R2 references...")
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
                
            for key in r2_files:
                if key in text_to_search:
                    if key not in referenced_keys:
                        print(f"  ℹ️ Key '{key}' found in content block '{item['block_id']}' text/link reference.")
                        referenced_keys.add(key)
                        
        if len(result.data) < page_size:
            break
        offset += page_size

    # Also search 'community_impulses' table
    print("Scanning 'community_impulses' table for additional R2 references...")
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
            for key in r2_files:
                if key in text_to_search:
                    if key not in referenced_keys:
                        print(f"  ℹ️ Key '{key}' found in community impulse '{item['impulse_id']}' reference.")
                        referenced_keys.add(key)
                        
        if len(result.data) < page_size:
            break
        offset += page_size

    # Also search 'community_replies' table
    print("Scanning 'community_replies' table for additional R2 references...")
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
            for key in r2_files:
                if key in text_to_search:
                    if key not in referenced_keys:
                        print(f"  ℹ️ Key '{key}' found in community reply '{item['reply_id']}' reference.")
                        referenced_keys.add(key)
                        
        if len(result.data) < page_size:
            break
        offset += page_size

    # 4. Find orphaned keys
    orphaned_keys = []

    orphaned_size = 0
    
    for key, size in r2_files.items():
        if key not in referenced_keys:
            orphaned_keys.append({
                "key": key,
                "size_bytes": size,
                "size_mb": size / 1024 / 1024
            })
            orphaned_size += size
            
    # Sort by size descending
    orphaned_keys.sort(key=lambda x: x["size_bytes"], reverse=True)

    # 5. Output results
    print("\n" + "="*60)
    print("📊 ORPHANED MEDIA VERIFICATION SUMMARY")
    print("="*60)
    print(f"Total files in R2:          {len(r2_files)}")
    print(f"Total size in R2:           {total_r2_size / 1024 / 1024:.2f} MB")
    print(f"Total referenced files:     {len(referenced_keys)}")
    print(f"Orphaned files found:       {len(orphaned_keys)}")
    print(f"Potential space savings:    {orphaned_size / 1024 / 1024:.2f} MB")
    print("="*60)

    # Write full list of orphans to a JSON file
    output_file = Path("scratch/orphaned_media_list.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total_r2_files": len(r2_files),
                "total_r2_size_mb": total_r2_size / 1024 / 1024,
                "referenced_files": len(referenced_keys),
                "orphaned_files": len(orphaned_keys),
                "potential_savings_mb": orphaned_size / 1024 / 1024
            },
            "orphaned_keys": orphaned_keys
        }, f, indent=2, ensure_ascii=False)
        
    print(f"\n📝 Full list of orphaned files saved to: {output_file}")
    
    if orphaned_keys:
        print("\nTop 15 largest orphaned files:")
        for i, item in enumerate(orphaned_keys[:15], 1):
            print(f"  {i:2d}. {item['key']} ({item['size_mb']:.2f} MB)")
    else:
        print("\n🎉 Perfect! All files in R2 are currently referenced in the Supabase DB.")

if __name__ == "__main__":
    main()
