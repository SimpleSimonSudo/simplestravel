import json
from pathlib import Path

def update_urls_to_local(json_file="tumblr_posts.json", 
                         output_file="tumblr_posts_local.json",
                         media_base="/media"):
    """
    Ersetzt Tumblr-URLs durch lokale Pfade
    """
    with open(json_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    for post in posts:
        post_id = post.get('id_string')
        
        for block_idx, block in enumerate(post.get('content', [])):
            if block.get('type') == 'image':
                for media in block.get('media', []):
                    if media.get('has_original_dimensions'):
                        media_key = media.get('media_key', '').split(':')[0]
                        url = media.get('url', '')
                        extension = url.split('.')[-1].split('?')[0]
                        
                        # Neuer lokaler Pfad
                        local_path = f"{media_base}/{post_id}/block_{block_idx}_{media_key}.{extension}"
                        
                        # Original-URL als Backup speichern
                        media['original_tumblr_url'] = media['url']
                        
                        # URL ersetzen
                        media['url'] = local_path
    
    # Neue JSON speichern
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Lokale URLs erstellt: {output_file}")

if __name__ == "__main__":
    update_urls_to_local()