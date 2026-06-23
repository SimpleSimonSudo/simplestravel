import os
import psycopg2

DB_URL = "postgresql://postgres.sgavinsdlmhiqleczbcx:Ek0O3bZAnfMNYcZI@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

def main():
    print("Connecting to Supabase PostgreSQL database for boards schema update...")
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Read the migration SQL file
        sql_file_path = os.path.join(os.path.dirname(__file__), "../sql/update_boards_schema.sql")
        print(f"Reading SQL file: {sql_file_path}")
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql = f.read()
            
        print("Executing SQL migration script...")
        cursor.execute(sql)
        print("✅ Boards SQL migration successfully executed!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error executing SQL migration: {e}")

if __name__ == "__main__":
    main()
