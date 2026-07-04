#!/usr/bin/env python3
import os
import sys
import psycopg2
import urllib.request
import json
import boto3
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from root env
dotenv_path = "/home/simple_simon/Codes/traveling_planet_earth/.env"
load_dotenv(dotenv_path)

db_user = "postgres.sgavinsdlmhiqleczbcx"
db_password = "Ek0O3bZAnfMNYcZI"
db_host = "aws-1-eu-west-1.pooler.supabase.com"
db_port = "5432"
db_name = "postgres"

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = "simplestravelmedia"
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

conn_str = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing post_id argument"}))
        sys.exit(1)
        
    post_id = sys.argv[1].strip()
    
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        
        # 1. Fetch content blocks for the post
        cursor.execute("SELECT content_blocks FROM posts WHERE post_id = %s;", (post_id,))
        row = cursor.fetchone()
        if not row:
            print(json.dumps({"success": False, "error": f"Post {post_id} not found in database"}))
            sys.exit(1)
            
        content_blocks = row[0]
        if isinstance(content_blocks, str):
            content_blocks = json.loads(content_blocks)
            
        # 2. Extract image blocks and media details
        image_blocks = []
        for idx, block in enumerate(content_blocks):
            if block.get("type") == "image":
                image_blocks.append((idx, block))
                
        if not image_blocks:
            print(json.dumps({"success": True, "restored": 0, "message": "No image blocks found in the post content blocks."}))
            sys.exit(0)
            
        # Set up R2 client
        s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name="auto"
        )
        
        restored_count = 0
        skipped_upload_count = 0
        
        for block_index, block in image_blocks:
            media_list = block.get("media", [])
            if not media_list:
                continue
                
            # Get highest resolution image
            img_info = media_list[0]
            tumblr_url = img_info.get("url")
            width = img_info.get("width")
            height = img_info.get("height")
            
            # 1. Determine extension and local filepath by searching local directories
            local_dirs = [
                f"/home/simple_simon/Codes/traveling_planet_earth/media/blog_media/{post_id}",
                f"/home/simple_simon/Codes/traveling_planet_earth/media/{post_id}"
            ]
            local_file = None
            extension = None
            
            for ldir in local_dirs:
                if os.path.exists(ldir):
                    for fname in os.listdir(ldir):
                        if fname.startswith(f"block_{block_index}_img_") or fname.startswith(f"block_{block_index}_"):
                            local_file = os.path.join(ldir, fname)
                            extension = Path(fname).suffix.lower()
                            break
                    if local_file:
                        break
            
            # 2. If no local file is found, try to download from Tumblr URL
            if not local_file:
                # If tumblr_url doesn't start with http, it is local relative URL and we can't download it
                if not tumblr_url or not tumblr_url.startswith("http"):
                    raise Exception(f"Media file block_{block_index} not found locally and no remote Tumblr URL is available (got: {tumblr_url})")
                
                # Parse extension from url path or fallback to .jpg
                import urllib.parse
                parsed_path = urllib.parse.urlparse(tumblr_url).path
                extension = Path(parsed_path).suffix.lower() or ".jpg"
                
                local_dir = f"/home/simple_simon/Codes/traveling_planet_earth/media/blog_media/{post_id}"
                os.makedirs(local_dir, exist_ok=True)
                local_file = os.path.join(local_dir, f"block_{block_index}_img_{extension}")
                
                # Download
                urllib.request.urlretrieve(tumblr_url, local_file)
            else:
                # If local_file is found, but not in the standard blog_media folder, copy it over to normalize
                target_local_dir = f"/home/simple_simon/Codes/traveling_planet_earth/media/blog_media/{post_id}"
                target_local_file = os.path.join(target_local_dir, f"block_{block_index}_img_{extension}")
                if os.path.abspath(local_file) != os.path.abspath(target_local_file):
                    os.makedirs(target_local_dir, exist_ok=True)
                    import shutil
                    shutil.copy2(local_file, target_local_file)
                    local_file = target_local_file

            # Normalize R2 key, content type, mime type
            r2_key = f"{post_id}/block_{block_index}_img_{extension}"
            
            content_types = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".gif": "image/gif",
                ".webp": "image/webp"
            }
            mime_type = content_types.get(extension, "image/jpeg")
            
            # Check if file already exists in R2 to avoid duplicates
            r2_exists = False
            try:
                s3.head_object(Bucket=R2_BUCKET_NAME, Key=r2_key)
                r2_exists = True
                skipped_upload_count += 1
            except Exception:
                r2_exists = False
                
            if not r2_exists:
                # Upload to R2
                s3.upload_file(
                    local_file,
                    R2_BUCKET_NAME,
                    r2_key,
                    ExtraArgs={"ContentType": mime_type}
                )
                
            r2_url = f"{R2_PUBLIC_URL}/{r2_key}"
            
            # Ensure local folder directory is created (even if R2 exists but local directory is missing)
            if r2_exists and not os.path.exists(local_file):
                try:
                    os.makedirs(os.path.dirname(local_file), exist_ok=True)
                    # Download to keep local folder in sync
                    if tumblr_url and tumblr_url.startswith("http"):
                        urllib.request.urlretrieve(tumblr_url, local_file)
                except Exception:
                    pass # Non-blocking local download fallback
            
            # Database registration
            media_local_path = f"media/{post_id}/block_{block_index}_{extension}"
            media_original_url = f"/media/{post_id}/block_{block_index}_{extension}"
            
            # Check if record exists
            cursor.execute("SELECT media_id FROM media WHERE post_id = %s AND block_index = %s;", (post_id, block_index))
            media_row = cursor.fetchone()
            
            if media_row:
                # Update existing
                update_query = """
                UPDATE media SET
                    storage_path = %s,
                    tumblr_url = %s,
                    width = %s,
                    height = %s
                WHERE media_id = %s;
                """
                cursor.execute(update_query, (r2_url, tumblr_url, width, height, media_row[0]))
            else:
                # Insert new
                insert_query = """
                INSERT INTO media (
                    post_id, block_index, display_order, media_type, mime_type, 
                    storage_path, local_path, original_url, tumblr_url, width, height
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                );
                """
                cursor.execute(
                    insert_query,
                    (
                        post_id, block_index, 0, "image", mime_type,
                        r2_url, media_local_path, media_original_url, tumblr_url, width, height
                    )
                )
                restored_count += 1
                
        conn.commit()
        print(json.dumps({
            "success": True, 
            "restored": restored_count, 
            "skipped_upload": skipped_upload_count,
            "message": f"Successfully processed {len(image_blocks)} images. Restored {restored_count} database rows (skipped {skipped_upload_count} duplicate R2 uploads)."
        }))
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
