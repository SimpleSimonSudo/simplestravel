import psycopg2

DB_URL = "postgresql://postgres.sgavinsdlmhiqleczbcx:Ek0O3bZAnfMNYcZI@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

def main():
    print("Connecting to Supabase PostgreSQL database to add updated_at columns...")
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Adding updated_at column to community_impulses...")
        cursor.execute("ALTER TABLE community_impulses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;")
        
        print("Adding updated_at column to community_replies...")
        cursor.execute("ALTER TABLE community_replies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;")
        
        print("✅ Database updated successfully with updated_at columns!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error during column updates: {e}")

if __name__ == "__main__":
    main()
