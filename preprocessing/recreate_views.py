import os
import psycopg2
from dotenv import load_dotenv

# Load env variables
dotenv_path = "/home/simple_simon/Codes/traveling_planet_earth/.env"
load_dotenv(dotenv_path)

db_user = os.environ.get("user", "postgres.sgavinsdlmhiqleczbcx")
db_password = os.environ.get("password", "Ek0O3bZAnfMNYcZI")
db_host = os.environ.get("host", "aws-1-eu-west-1.pooler.supabase.com")
db_port = os.environ.get("port", "5432")
db_name = os.environ.get("database", "postgres")

conn_str = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

print("Connecting to PostgreSQL database to recreate views...")
conn = psycopg2.connect(conn_str)
cursor = conn.cursor()

try:
    sql = """
    -- 1. Drop existing views first to avoid dependency errors
    DROP VIEW IF EXISTS posts_with_thumbnail CASCADE;
    DROP VIEW IF EXISTS posts_with_media CASCADE;

    -- 2. Re-create posts_with_media view to expand p.* and capture actual_date
    CREATE OR REPLACE VIEW posts_with_media AS
    SELECT 
        p.*,
        COUNT(DISTINCT m.media_id) as total_media,
        COUNT(DISTINCT m.media_id) FILTER (WHERE m.media_type = 'image') as image_count,
        COUNT(DISTINCT m.media_id) FILTER (WHERE m.media_type = 'video') as video_count
    FROM posts p
    LEFT JOIN media m ON p.post_id = m.post_id
    GROUP BY p.post_id;

    -- 3. Re-create posts_with_thumbnail view to expand p.* and capture actual_date
    CREATE OR REPLACE VIEW posts_with_thumbnail AS
    SELECT 
        p.*,
        (
            SELECT m.storage_path
            FROM media m
            WHERE m.post_id = p.post_id 
            AND m.media_type = 'image'
            ORDER BY m.block_index, m.display_order
            LIMIT 1
        ) as thumbnail_path
    FROM posts p;
    """
    
    print("Executing SQL to recreate views...")
    cursor.execute(sql)
    conn.commit()
    print("Successfully recreated posts_with_thumbnail and posts_with_media views!")
except Exception as e:
    conn.rollback()
    print(f"Error occurred: {e}")
finally:
    cursor.close()
    conn.close()
    print("Connection closed.")
