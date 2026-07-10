#!/usr/bin/env python3
"""
Tumblr Incremental Import Script
Fetches posts newer than 2025-11-10 07:50:15 GMT, downloads media locally,
inserts into Supabase under Trip ID 18, uploads media to Cloudflare R2,
and updates metadata (countries, actual_date).
"""

import os
import sys
import json
import time
import re
import requests
import boto3
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

# 1. Load config
load_dotenv("/home/simple_simon/Codes/traveling_planet_earth/.env")

# Cloudflare R2 Config
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = "simplestravelmedia"
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # service role key for DB writes

# Local Media Path
LOCAL_MEDIA_PATH = "/home/simple_simon/Codes/traveling_planet_earth/media"

# Tumblr Config
TUMBLR_CONSUMER_KEY = os.getenv("TUMBLR_CONSUMER_KEY")
TUMBLR_CONSUMER_SECRET = os.getenv("TUMBLR_CONSUMER_SECRET")
TUMBLR_OAUTH_TOKEN = os.getenv("TUMBLR_OAUTH_TOKEN")
TUMBLR_OAUTH_SECRET = os.getenv("TUMBLR_OAUTH_SECRET")
BLOG_NAME = "simplestravel.tumblr.com"

# Target oldest post date
TARGET_DT = datetime.strptime("2025-11-10 07:50:15", "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)

# 2. Date-based Country Partitioning
def get_country_id_and_name(dt):
    date_str = dt.strftime("%Y-%m-%d")
    if date_str < "2026-02-16":
        return 3, "Germany"
    elif date_str < "2026-02-18":
        return 2, "Italy"
    elif date_str < "2026-03-28":
        return 91, "Cuba"
    else:
        return 96, "Dominican Republic"

# 3. Dynamic Companions Extraction
def extract_companions(post):
    companions = {"Johy"} # Johy is always on Trip 18
    known_names = ['Anna', 'Max', 'Dad', 'Mom', 'Johannes']
    
    for block in post.get('content', []):
        if block.get('type') == 'text':
            text = block.get('text', '')
            for name in known_names:
                if name in text:
                    companions.add(name)
    return list(companions)

# 4. safe extension extractor
def safe_extension_from_url(url, default="jpg"):
    path = urlparse(url).path
    ext = os.path.splitext(path)[1].lower()
    if ext and len(ext) <= 5 and "/" not in ext:
        return ext.lstrip(".")
    return default

def download_file(url, filepath):
    if filepath.exists() and filepath.stat().st_size > 0:
        return True
    try:
        response = requests.get(url, timeout=180)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
        time.sleep(0.2)
        return True
    except Exception as e:
        print(f"    ❌ Error downloading {url}: {e}")
        return False

# 5. Content-Type map for R2 upload
def get_content_type(filepath):
    ext = Path(filepath).suffix.lower()
    content_type_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
        ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
        ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4"
    }
    return content_type_map.get(ext, "application/octet-stream")

def main():
    print("="*60)
    print("🚀 STARTING INCREMENTAL TUMBLR IMPORT FOR TRIP 18")
    print("="*60)

    # Initialize clients
    import pytumblr
    tumblr_client = pytumblr.TumblrRestClient(
        TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET,
        TUMBLR_OAUTH_TOKEN, TUMBLR_OAUTH_SECRET
    )
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto"
    )

    # Fetch new posts from Tumblr
    print("\n📥 Fetching new posts from Tumblr...")
    new_posts = []
    offset = 0
    limit = 20
    done = False
    
    while not done:
        response = tumblr_client.posts(
            BLOG_NAME,
            limit=limit,
            offset=offset,
            reblog_info=True,
            notes_info=True,
            npf=True
        )
        
        posts = response.get("posts", [])
        if not posts:
            break
            
        for post in posts:
            date_str = post.get('date').replace(" GMT", "")
            post_dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            
            if post_dt <= TARGET_DT:
                done = True
                break
                
            new_posts.append(post)
            
        if done:
            break
        offset += limit

    total_posts = len(new_posts)
    print(f"✅ Found {total_posts} new posts since target date.")
    
    # Sort oldest first (chronological order)
    new_posts = list(reversed(new_posts))
    
    imported_post_ids = []
    stats = {"inserted": 0, "skipped": 0, "errors": 0}
    
    for idx, post in enumerate(new_posts, 1):
        post_id = post.get('id_string')
        date_str = post.get('date').replace(" GMT", "")
        post_dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        
        print(f"\n[{idx}/{total_posts}] Processing Post: {post_id} ({date_str})")
        
        # Check if already exists in DB
        existing = supabase.table('posts').select('post_id').eq('post_id', post_id).execute()
        if existing.data:
            print("  ⚠️ Already exists in DB. Deleting to re-import cleanly...")
            try:
                supabase.table('posts').delete().eq('post_id', post_id).execute()
            except Exception as e:
                print(f"    ❌ Delete error: {e}")
            
        # Create local directory
        post_media_dir = Path(LOCAL_MEDIA_PATH) / post_id
        post_media_dir.mkdir(parents=True, exist_ok=True)
        
        content_blocks = post.get('content', [])
        layout_info = post.get('layout', None)
        
        # Determine country and companions
        country_id, country_name = get_country_id_and_name(post_dt)
        companions = extract_companions(post)
        
        media_records = []
        media_count = 0
        text_blocks_count = 0
        
        # Process content blocks and download media
        for block_idx, block in enumerate(content_blocks):
            block_type = block.get('type')
            
            if block_type == 'text':
                text_blocks_count += 1
                
            elif block_type == 'image':
                media_items = block.get('media', [])
                if media_items:
                    # Find the largest media item by dimension (width * height)
                    largest_media = max(media_items, key=lambda m: (m.get('width', 0) or 0) * (m.get('height', 0) or 0))
                    
                    url = largest_media.get('url')
                    if url:
                        media_key = largest_media.get('media_key', '').split(':')[0]
                        extension = safe_extension_from_url(url, "jpg")
                        filename = f"block_{block_idx}_img_{media_key}.{extension}"
                        filepath = post_media_dir / filename
                        
                        print(f"  Downloading image: {filename}...")
                        if download_file(url, filepath):
                            media_count += 1
                            # Update url in JSON block to local path for the frontend
                            largest_media['original_tumblr_url'] = url
                            largest_media['url'] = f"/media/{post_id}/{filename}"
                            
                            # Prepare media row data
                            exif_data = block.get('exif', {})
                            photo_taken_at = None
                            if exif_data.get('Time'):
                                try:
                                    photo_taken_at = datetime.fromtimestamp(exif_data['Time'], tz=timezone.utc).isoformat()
                                except:
                                    pass
                                    
                            colors = block.get('colors', {})
                            
                            media_records.append({
                                'post_id': post_id,
                                'block_index': block_idx,
                                'display_order': 0,
                                'media_type': 'image',
                                'mime_type': largest_media.get('type'),
                                'local_path': f"media/{post_id}/{filename}",
                                'original_url': url,
                                'tumblr_url': url,
                                'width': largest_media.get('width'),
                                'height': largest_media.get('height'),
                                'dominant_colors': colors if colors else None,
                                'exif_data': exif_data if exif_data else None,
                                'camera_make': exif_data.get('CameraMake'),
                                'camera_model': exif_data.get('CameraModel'),
                                'lens': exif_data.get('Lens'),
                                'aperture': exif_data.get('Aperture'),
                                'exposure_time': exif_data.get('ExposureTime'),
                                'iso': exif_data.get('ISO'),
                                'focal_length': exif_data.get('FocalLength'),
                                'photo_taken_at': photo_taken_at,
                                'alt_text': block.get('alt_text')
                            })
                        
            elif block_type == 'video':
                video_url = None
                provider = block.get('provider', 'tumblr')
                if 'media' in block:
                    video_url = block['media'].get('url')
                elif 'url' in block:
                    video_url = block['url']
                    
                if video_url and 'tumblr' in video_url.lower():
                    extension = safe_extension_from_url(video_url, "mp4")
                    filename = f"block_{block_idx}_video.{extension}"
                    filepath = post_media_dir / filename
                    
                    print(f"  Downloading video: {filename}...")
                    if download_file(video_url, filepath):
                        media_count += 1
                        # Update in JSON
                        block['media'] = block.get('media', {})
                        block['media']['original_tumblr_url'] = video_url
                        block['media']['url'] = f"/media/{post_id}/{filename}"
                        if 'url' in block:
                            block['url'] = f"/media/{post_id}/{filename}"
                            
                        media_records.append({
                            'post_id': post_id,
                            'block_index': block_idx,
                            'display_order': 0,
                            'media_type': 'video',
                            'local_path': f"media/{post_id}/{filename}",
                            'original_url': video_url,
                            'tumblr_url': video_url,
                            'provider': provider,
                            'duration_seconds': block.get('duration')
                        })
                        
            elif block_type == 'audio':
                audio_url = None
                if 'media' in block:
                    audio_url = block['media'].get('url')
                elif 'url' in block:
                    audio_url = block['url']
                    
                if audio_url and 'tumblr' in audio_url.lower():
                    extension = safe_extension_from_url(audio_url, "mp3")
                    filename = f"block_{block_idx}_audio.{extension}"
                    filepath = post_media_dir / filename
                    
                    print(f"  Downloading audio: {filename}...")
                    if download_file(audio_url, filepath):
                        media_count += 1
                        # Update in JSON
                        block['media'] = block.get('media', {})
                        block['media']['original_tumblr_url'] = audio_url
                        block['media']['url'] = f"/media/{post_id}/{filename}"
                        if 'url' in block:
                            block['url'] = f"/media/{post_id}/{filename}"
                            
                        media_records.append({
                            'post_id': post_id,
                            'block_index': block_idx,
                            'display_order': 0,
                            'media_type': 'audio',
                            'local_path': f"media/{post_id}/{filename}",
                            'original_url': audio_url,
                            'tumblr_url': audio_url,
                            'provider': block.get('provider', 'tumblr')
                        })

        # Insert Post in DB
        summary = post.get('summary', '')
        if not summary:
            for b in content_blocks:
                if b.get('type') == 'text':
                    summary = b.get('text', '')[:500]
                    break

        post_data = {
            'post_id': post_id,
            'post_date': post_dt.isoformat(),
            'actual_date': post_dt.isoformat(), # default fallback
            'tumblr_timestamp': post.get('timestamp'),
            'slug': post.get('slug'),
            'original_url': post.get('post_url'),
            'short_url': post.get('short_url'),
            'state': post.get('state', 'published'),
            'note_count': post.get('note_count', 0),
            'title': None,
            'summary': summary,
            'content_blocks': content_blocks,
            'layout_info': layout_info,
            'country_id': country_id,
            'country_old': country_name,
            'trip_id': 18,
            'companions': companions,
            'tags': post.get('tags', []) if post.get('tags') else None,
            'media_count': media_count,
            'text_blocks_count': text_blocks_count
        }

        try:
            # 1. Insert post
            supabase.table('posts').insert(post_data).execute()
            print("  ✅ Post inserted into DB")
            
            # 2. Insert media items
            for media_row in media_records:
                supabase.table('media').insert(media_row).execute()
            if media_records:
                print(f"  ✅ {len(media_records)} media entries inserted into DB")
                
            # 3. Insert content blocks
            layout_map = {}
            if layout_info and layout_info[0].get('display'):
                for row_idx, row in enumerate(layout_info[0]['display']):
                    for block_idx_layout in row.get('blocks', []):
                        layout_map[block_idx_layout] = row_idx

            for block_idx, block in enumerate(content_blocks):
                block_data = {
                    'post_id': post_id,
                    'block_index': block_idx,
                    'block_type': block.get('type'),
                    'layout_row': layout_map.get(block_idx)
                }
                if block.get('type') == 'text':
                    block_data['text_content'] = block.get('text')
                    block_data['text_formatting'] = block.get('formatting')
                    block_data['text_subtype'] = block.get('subtype')
                elif block.get('type') == 'link':
                    block_data['link_url'] = block.get('url')
                    block_data['link_title'] = block.get('title')
                    block_data['link_description'] = block.get('description')
                
                supabase.table('content_blocks').insert(block_data).execute()
            print(f"  ✅ {len(content_blocks)} content blocks inserted into DB")
            
            # 4. Upload media to Cloudflare R2 and update storage_path
            for media_row in media_records:
                local_rel = media_row['local_path'] # e.g. media/post_id/file.jpg
                full_local = Path(LOCAL_MEDIA_PATH) / local_rel.removeprefix("media/").lstrip("/")
                
                if full_local.exists():
                    r2_key = local_rel.removeprefix("media/").lstrip("/") # e.g. post_id/file.jpg
                    content_type = get_content_type(full_local)
                    
                    print(f"  Uploading {r2_key} to CF R2...")
                    s3.upload_file(
                        str(full_local),
                        R2_BUCKET_NAME,
                        r2_key,
                        ExtraArgs={"ContentType": content_type}
                    )
                    
                    r2_url = f"{R2_PUBLIC_URL}/{r2_key}"
                    
                    # Update DB
                    supabase.table("media") \
                        .update({"storage_path": r2_url}) \
                        .eq("post_id", post_id) \
                        .eq("block_index", media_row['block_index']) \
                        .eq("display_order", media_row['display_order']) \
                        .execute()
                    print(f"    ✅ Uploaded: {r2_url}")
            
            imported_post_ids.append(post_id)
            stats["inserted"] += 1
            
        except Exception as e:
            print(f"  ❌ DB Error processing post {post_id}: {e}")
            stats["errors"] += 1

    # Step 6: Backfill actual_date from EXIF photo dates
    if imported_post_ids:
        backfill_actual_dates(supabase, imported_post_ids)
        update_trip_metadata(supabase, imported_post_ids)

    # Print summary
    print("\n" + "="*60)
    print("🏁 IMPORT PHASE COMPLETED")
    print("="*60)
    print(f"  Processed posts: {total_posts}")
    print(f"  Inserted:        {stats['inserted']}")
    print(f"  Skipped:         {stats['skipped']}")
    print(f"  Errors:          {stats['errors']}")
    print("="*60)


def backfill_actual_dates(supabase, imported_post_ids):
    print("\n" + "="*60)
    print("⏳ STEP 6: BACKFILL ACTUAL DATES FROM EXIF")
    print("="*60)
    
    # Fetch all media for these imported posts with photo_taken_at
    media_res = supabase.table("media") \
        .select("post_id, photo_taken_at") \
        .in_("post_id", imported_post_ids) \
        .not_.is_("photo_taken_at", "null") \
        .execute()
        
    post_photos = {}
    for row in media_res.data:
        post_id = row['post_id']
        photo_taken_at = row['photo_taken_at']
        if not photo_taken_at:
            continue
        # Extract date part YYYY-MM-DD
        date_str = photo_taken_at.split('T')[0]
        if post_id not in post_photos:
            post_photos[post_id] = []
        post_photos[post_id].append(date_str)
        
    from collections import Counter
    updated_count = 0
    for post_id, dates in post_photos.items():
        counter = Counter(dates)
        most_common = counter.most_common(1)
        if most_common:
            mode_date_str = most_common[0][0]
            normalized_timestamp = f"{mode_date_str}T12:00:00+00:00"
            
            # Update post
            supabase.table("posts") \
                .update({"actual_date": normalized_timestamp}) \
                .eq("post_id", post_id) \
                .execute()
            print(f"  ✅ Updated actual_date for post {post_id} to {normalized_timestamp} based on EXIF.")
            updated_count += 1
            
    print(f"  Exif backfill completed. Updated {updated_count} posts.")


def update_trip_metadata(supabase, imported_post_ids):
    print("\n" + "="*60)
    print("⏳ STEP 7: UPDATE TRIP METADATA & COUNTRIES")
    print("="*60)
    
    # Fetch dates of imported posts
    posts_res = supabase.table("posts") \
        .select("post_date") \
        .in_("post_id", imported_post_ids) \
        .execute()
        
    dates = [p['post_date'] for p in posts_res.data if p['post_date']]
    if not dates:
        print("  ⚠️ No post dates found. Skipping trip date update.")
        return
        
    min_date = min(dates).split('T')[0]
    max_date = max(dates).split('T')[0]
    
    print(f"  Trip 18 calculated date range: {min_date} to {max_date}")
    
    # Update trips table for trip_id = 18
    supabase.table("trips") \
        .update({
            "start_date": min_date,
            "end_date": max_date
        }) \
        .eq("trip_id", 18) \
        .execute()
    print("  ✅ Updated Trip 18 start_date and end_date.")
    
    # Add trip_countries associations
    country_ids = [3, 2, 91, 96]
    for idx, cid in enumerate(country_ids, 1):
        try:
            # Check if entry already exists
            tc_res = supabase.table("trip_countries") \
                .select("*") \
                .eq("trip_id", 18) \
                .eq("country_id", cid) \
                .execute()
            if not tc_res.data:
                supabase.table("trip_countries") \
                    .insert({
                        "trip_id": 18,
                        "country_id": cid,
                        "visit_order": idx
                    }) \
                    .execute()
                print(f"  ✅ Associated country ID {cid} to Trip 18 (visit_order={idx}).")
            else:
                print(f"  ⏭️ Country ID {cid} already associated with Trip 18.")
        except Exception as e:
            print(f"  ❌ Error associating country ID {cid} to Trip 18: {e}")


if __name__ == "__main__":
    main()
