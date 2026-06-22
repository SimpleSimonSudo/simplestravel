import os
import json
import time
import pytumblr
from dotenv import load_dotenv

load_dotenv()

consumer_key = os.getenv("TUMBLR_CONSUMER_KEY")
consumer_secret = os.getenv("TUMBLR_CONSUMER_SECRET")
oauth_token = os.getenv("TUMBLR_OAUTH_TOKEN")
oauth_secret = os.getenv("TUMBLR_OAUTH_SECRET")

client = pytumblr.TumblrRestClient(
    consumer_key,
    consumer_secret,
    oauth_token,
    oauth_secret
)

# Blog-Name: https://www.tumblr.com/blog/simplestravel
BLOG_NAME = "simplestravel.tumblr.com"

all_posts = []
limit = 20  # max. Posts pro API-Call
offset = 0

while True:
    response = client.posts(
        BLOG_NAME,
        limit=limit,
        offset=offset,
        reblog_info=True,
        notes_info=True,
        npf=True  # NPF = neues Post-Format
    )
    
    posts = response.get("posts", [])
    if not posts:
        break

    all_posts.extend(posts)
    offset += limit

    print(f"Geladen: {len(all_posts)} Posts")
    time.sleep(0.5)  # API-freundlich

# JSON-Datei speichern
with open("tumblr_posts.json", "w", encoding="utf-8") as f:
    json.dump(all_posts, f, ensure_ascii=False, indent=2)

print(f"\n✅ Fertig! {len(all_posts)} Posts in tumblr_posts.json gespeichert.")
