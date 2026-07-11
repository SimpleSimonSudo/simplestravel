import os
import psycopg2
from dotenv import load_dotenv

# Load env variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

db_user = os.environ.get("user", "postgres.sgavinsdlmhiqleczbcx")
db_password = os.environ.get("password", "Ek0O3bZAnfMNYcZI")
db_host = os.environ.get("host", "aws-1-eu-west-1.pooler.supabase.com")
db_port = os.environ.get("port", "5432")
db_name = os.environ.get("database", "postgres")

conn_str = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

def main():
    print("Connecting to Supabase PostgreSQL database to run trip dates migration...")
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()
        
        sql_file_path = os.path.join(os.path.dirname(__file__), "../sql/sync_trip_dates_trigger.sql")
        print(f"Reading SQL file: {sql_file_path}")
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql = f.read()
            
        print("Executing SQL migration script...")
        cursor.execute(sql)
        print("✅ Trip dates migration and trigger successfully installed and executed!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error executing SQL migration: {e}")

if __name__ == "__main__":
    main()
