import urllib.request
import json

url = "https://sgavinsdlmhiqleczbcx.supabase.co/rest/v1/posts?select=post_id,title,content_blocks&limit=5"
headers = {
    "apikey": "sb_publishable_tuD-YGhIfc-F2XtAzrhkTw_FKQsOqn6",
    "Authorization": "Bearer sb_publishable_tuD-YGhIfc-F2XtAzrhkTw_FKQsOqn6"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
