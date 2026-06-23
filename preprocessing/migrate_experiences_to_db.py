import os
import csv
import re
import json
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Load env variables
load_dotenv()

DB_CONN = "postgresql://postgres.sgavinsdlmhiqleczbcx:Ek0O3bZAnfMNYcZI@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

def parse_shares_to_json(raw_str: str) -> dict:
    if not raw_str or raw_str.strip() in ('', 'N/A'):
        return None
    parts = raw_str.split(",")
    res = {}
    for part in parts:
        part = part.strip()
        if not part:
            continue
        m = re.search(r'^(.*?)\s+(\d+(?:\.\d+)?%?)$', part)
        if m:
            label = m.group(1).strip()
            pct_val = m.group(2).strip()
            if not pct_val.endswith("%"):
                pct_val += "%"
            res[label] = pct_val
        else:
            res[part] = "100%"
    return res

def clean_float(val: str) -> float:
    if not val or val.strip() in ('', 'null', 'N/A'):
        return None
    try:
        return float(val.strip())
    except ValueError:
        return None

def clean_int(val: str) -> int:
    if not val or val.strip() in ('', 'null', 'N/A'):
        return None
    try:
        return int(float(val.strip()))
    except ValueError:
        return None

def clean_text(val: str) -> str:
    if not val or val.strip() in ('', 'null', 'N/A'):
        return None
    return val.strip()

def clean_date(val: str) -> str:
    if not val or val.strip() in ('', 'null', 'N/A'):
        return None
    return val.strip()

def main():
    print("🚀 DATABASE MIGRATION: ADDING EXPERIENCES COLUMNS & IMPORTING CSV")
    
    # 1. Connect to PostgreSQL
    try:
        conn = psycopg2.connect(DB_CONN)
        cur = conn.cursor()
        print("  ✅ Connected to PostgreSQL successfully.")
    except Exception as e:
        print(f"  ❌ Failed to connect to PostgreSQL: {e}")
        return

    # 2. Run DDL migrations
    ddl_queries = [
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS capital text;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS area double precision;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS population bigint;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS happiness_index double precision;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS languages_share jsonb;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS religions_share jsonb;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS gdp double precision;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS minorities text;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS gini double precision;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS hdi double precision;",
        "ALTER TABLE countries ADD COLUMN IF NOT EXISTS time_zone text;"
    ]

    print("\n📦 Adapting database schema (Adding new columns)...")
    for q in ddl_queries:
        try:
            cur.execute(q)
            print(f"  Executed: {q.strip()}")
        except Exception as e:
            print(f"  ❌ Error executing DDL '{q.strip()}': {e}")
            conn.rollback()
            return
    conn.commit()
    print("  ✅ Schema migration completed.")

    # 3. Read and parse countries_import.csv
    csv_path = "countries_import.csv"
    if not os.path.exists(csv_path):
        csv_path = "preprocessing/countries_import.csv"

    print(f"\n📋 Parsing {csv_path} and inserting data...")
    success_count = 0
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = clean_text(row.get('name'))
            if not name:
                continue

            # Parse stats and text
            name_de = clean_text(row.get('name_de'))
            iso_code = clean_text(row.get('iso_code'))
            iso_code_3 = clean_text(row.get('iso_code_3'))
            continent = clean_text(row.get('continent'))
            capital = clean_text(row.get('capital'))
            area = clean_float(row.get('area'))
            population = clean_int(row.get('population'))
            first_visited = clean_date(row.get('first_visited'))
            last_visited = clean_date(row.get('last_visited'))
            description = clean_text(row.get('description'))
            notes = clean_text(row.get('notes'))
            
            happiness_index = clean_float(row.get('happiness_index'))
            languages_share = parse_shares_to_json(row.get('languages_share'))
            religions_share = parse_shares_to_json(row.get('religions_share'))
            gdp = clean_float(row.get('gdp'))
            minorities = clean_text(row.get('minorities'))
            gini = clean_float(row.get('gini'))
            hdi = clean_float(row.get('hdi'))
            time_zone = clean_text(row.get('time zone') or row.get('time_zone'))

            upsert_query = """
            INSERT INTO countries (
                name, name_de, iso_code, iso_code_3, continent, capital, area, population,
                first_visited, last_visited, description, notes, happiness_index,
                languages_share, religions_share, gdp, minorities, gini, hdi, time_zone
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT (name) DO UPDATE SET
                name_de = COALESCE(countries.name_de, EXCLUDED.name_de),
                iso_code = COALESCE(countries.iso_code, EXCLUDED.iso_code),
                iso_code_3 = COALESCE(countries.iso_code_3, EXCLUDED.iso_code_3),
                continent = COALESCE(countries.continent, EXCLUDED.continent),
                capital = EXCLUDED.capital,
                area = EXCLUDED.area,
                population = EXCLUDED.population,
                first_visited = COALESCE(countries.first_visited, EXCLUDED.first_visited),
                last_visited = COALESCE(countries.last_visited, EXCLUDED.last_visited),
                description = COALESCE(countries.description, EXCLUDED.description),
                notes = COALESCE(countries.notes, EXCLUDED.notes),
                happiness_index = EXCLUDED.happiness_index,
                languages_share = EXCLUDED.languages_share,
                religions_share = EXCLUDED.religions_share,
                gdp = EXCLUDED.gdp,
                minorities = EXCLUDED.minorities,
                gini = EXCLUDED.gini,
                hdi = EXCLUDED.hdi,
                time_zone = EXCLUDED.time_zone,
                updated_at = NOW();
            """

            params = (
                name, name_de, iso_code, iso_code_3, continent, capital, area, population,
                first_visited, last_visited, description, notes, happiness_index,
                Json(languages_share) if languages_share else None,
                Json(religions_share) if religions_share else None,
                gdp, minorities, gini, hdi, time_zone
            )

            try:
                cur.execute(upsert_query, params)
                print(f"  ✅ Upserted: {name}")
                success_count += 1
            except Exception as e:
                print(f"  ❌ Error upserting {name}: {e}")
                conn.rollback()
                cur.close()
                conn.close()
                return

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n🎉 Migration finished! Successfully upserted {success_count} countries in database.")

if __name__ == "__main__":
    main()
