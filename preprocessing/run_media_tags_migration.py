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

print("Connecting to PostgreSQL database to apply media tags column migration...")
conn = psycopg2.connect(conn_str)
cursor = conn.cursor()

try:
    sql = """
    -- Migration: Add tags column to media table for individual image/media tagging
    ALTER TABLE media ADD COLUMN IF NOT EXISTS tags TEXT[];

    -- Create GIN index for efficient filtering and searching of tags
    CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN (tags) WHERE tags IS NOT NULL;
    """
    
    print("Executing SQL...")
    cursor.execute(sql)
    conn.commit()
    print("Successfully added 'tags' column and index to 'media' table!")
except Exception as e:
    conn.rollback()
    print(f"Error occurred: {e}")
finally:
    cursor.close()
    conn.close()
    print("Connection closed.")
