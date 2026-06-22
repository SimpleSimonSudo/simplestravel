import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set in .env")
        return

    print(f"Connecting to Supabase at: {SUPABASE_URL}...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Fetch trips
    print("\n--- Trips ---")
    trips_res = supabase.table("trips").select("*").execute()
    for trip in trips_res.data:
        print(f"ID: {trip.get('trip_id')}, Name: '{trip.get('trip_name')}', Start: {trip.get('start_date')}")

    # 2. Count posts in posts table
    print("\n--- Posts Count ---")
    posts_count_res = supabase.table("posts").select("post_id", count="exact").limit(1).execute()
    total_posts = posts_count_res.count if hasattr(posts_count_res, "count") else len(posts_count_res.data)
    print(f"Total posts in 'posts' table: {total_posts}")

    # 3. Check posts per trip
    print("\n--- Posts per trip_id in 'posts' table ---")
    posts_res = supabase.table("posts").select("trip_id").execute()
    trip_counts = {}
    for p in posts_res.data:
        tid = p.get("trip_id")
        trip_counts[tid] = trip_counts.get(tid, 0) + 1
    print(f"Trip ID counts in posts: {trip_counts}")

    # 4. Check one record from posts_with_thumbnail to see its keys
    print("\n--- One record from 'posts_with_thumbnail' ---")
    try:
        thumb_res = supabase.table("posts_with_thumbnail").select("*").limit(1).execute()
        if thumb_res.data:
            print("Keys available in 'posts_with_thumbnail':")
            print(list(thumb_res.data[0].keys()))
        else:
            print("No records in 'posts_with_thumbnail'")
    except Exception as e:
        print(f"Error querying posts_with_thumbnail: {e}")

    # 5. Try filtering posts_with_thumbnail by trip_id
    print("\n--- Filter posts_with_thumbnail by trip_id ---")
    for trip in trips_res.data:
        tid = trip.get('trip_id')
        try:
            res = supabase.table("posts_with_thumbnail").select("post_id").eq("trip_id", tid).execute()
            print(f"Trip {tid} ('{trip.get('trip_name')}'): found {len(res.data)} posts in posts_with_thumbnail")
        except Exception as e:
            print(f"Trip {tid} ('{trip.get('trip_name')}'): Failed to query posts_with_thumbnail: {e}")

if __name__ == "__main__":
    main()
