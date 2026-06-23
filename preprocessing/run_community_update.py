import psycopg2

DB_URL = "postgresql://postgres.sgavinsdlmhiqleczbcx:Ek0O3bZAnfMNYcZI@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

def main():
    print("Connecting to Supabase PostgreSQL database for schema updates...")
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # 1. Update impulses length constraint
        print("Altering community_impulses content length check constraint...")
        cursor.execute("ALTER TABLE community_impulses DROP CONSTRAINT IF EXISTS content_len;")
        cursor.execute("ALTER TABLE community_impulses ADD CONSTRAINT content_len CHECK (char_length(content) BETWEEN 3 AND 3000);")
        
        # 2. Update reactions check constraint
        print("Altering community_reactions reaction types check constraint...")
        cursor.execute("ALTER TABLE community_reactions DROP CONSTRAINT IF EXISTS community_reactions_reaction_type_check;")
        cursor.execute("ALTER TABLE community_reactions ADD CONSTRAINT community_reactions_reaction_type_check CHECK (reaction_type IN ('heart', 'sparkles', 'globe', 'funny', 'applause', 'rocket', 'camera'));")
        
        print("✅ Database schema constraints altered successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error updating database schema: {e}")

if __name__ == "__main__":
    main()
