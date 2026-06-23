import os
import psycopg2
from dotenv import load_dotenv
from collections import Counter

# Load env variables
dotenv_path = "/home/simple_simon/Codes/traveling_planet_earth/.env"
load_dotenv(dotenv_path)

# Build connection string from env
# We have host, password, port, database, user in .env
db_user = os.environ.get("user", "postgres.sgavinsdlmhiqleczbcx")
db_password = os.environ.get("password", "Ek0O3bZAnfMNYcZI")
db_host = os.environ.get("host", "aws-1-eu-west-1.pooler.supabase.com")
db_port = os.environ.get("port", "5432")
db_name = os.environ.get("database", "postgres")

conn_str = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

print("Connecting to PostgreSQL database...")
conn = psycopg2.connect(conn_str)
cursor = conn.cursor()

try:
    # 1. Execute SQL Migration
    print("Executing SQL Migration (add_actual_date_column.sql)...")
    sql_path = "/home/simple_simon/Codes/traveling_planet_earth/sql/add_actual_date_column.sql"
    with open(sql_path, "r", encoding="utf-8") as f:
        sql_commands = f.read()
    
    cursor.execute(sql_commands)
    conn.commit()
    print("SQL Migration completed successfully.")

    # 2. Fetch photo dates to calculate backfill
    print("Fetching media records with photo_taken_at metadata...")
    cursor.execute("SELECT post_id, photo_taken_at FROM media WHERE photo_taken_at IS NOT NULL;")
    media_records = cursor.fetchall()
    print(f"Retrieved {len(media_records)} media records.")

    # Group photo dates (YYYY-MM-DD) by post_id
    post_photos = {}
    for post_id, photo_taken_at in media_records:
        if not photo_taken_at:
            continue
        # Extract date string YYYY-MM-DD
        date_str = photo_taken_at.strftime("%Y-%m-%d")
        if post_id not in post_photos:
            post_photos[post_id] = []
        post_photos[post_id].append(date_str)

    # Calculate actual date mode and update posts
    print(f"Calculating actual date mode for {len(post_photos)} posts...")
    updated_count = 0
    
    for post_id, dates in post_photos.items():
        counter = Counter(dates)
        most_common = counter.most_common(1)
        
        if most_common:
            # Mode date
            mode_date_str = most_common[0][0]
            # Normalize to YYYY-MM-DD 12:00:00 UTC
            normalized_timestamp = f"{mode_date_str} 12:00:00+00"
            
            # Update database
            cursor.execute(
                "UPDATE posts SET actual_date = %s WHERE post_id = %s;",
                (normalized_timestamp, post_id)
            )
            updated_count += 1

    conn.commit()
    print(f"Successfully backfilled actual_date for {updated_count} posts using EXIF photo metadata.")

    # Verify updates
    cursor.execute("SELECT COUNT(*) FROM posts WHERE actual_date IS NOT NULL;")
    total_posts = cursor.fetchone()[0]
    print(f"Verification: Total posts in database with actual_date: {total_posts}")

except Exception as e:
    conn.rollback()
    print(f"Error occurred: {e}")
finally:
    cursor.close()
    conn.close()
    print("Connection closed.")
