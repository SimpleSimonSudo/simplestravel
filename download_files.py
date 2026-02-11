import os
from urllib.parse import urlparse
import json
import requests
from pathlib import Path
import time

def safe_extension_from_url(url, default="mp4"):
    """
    Extrahiert eine sichere Dateiendung aus einer URL.
    Fällt auf default zurück, wenn keine brauchbare Extension existiert.
    """
    path = urlparse(url).path
    ext = os.path.splitext(path)[1].lower()

    # akzeptiere nur kurze, "echte" Extensions
    if ext and len(ext) <= 5 and "/" not in ext:
        return ext.lstrip(".")

    return default


def download_all_media(json_file="tumblr_posts.json", output_dir="media"):
    """
    Lädt ALLE Medien aus dem Tumblr-Export herunter:
    - Bilder (JPG, PNG, GIF)
    - Videos (MP4, MOV)
    - Audio (MP3, etc.)
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    with open(json_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    stats = {
        'images': 0,
        'videos': 0,
        'audio': 0,
        'skipped': 0,
        'errors': []
    }
    
    for post_idx, post in enumerate(posts):
        post_id = post.get('id_string', f'unknown_{post_idx}')
        post_dir = Path(output_dir) / post_id
        post_dir.mkdir(exist_ok=True)
        
        content = post.get('content', [])
        
        for block_idx, block in enumerate(content):
            block_type = block.get('type')
            
            # === BILDER ===
            if block_type == 'image':
                media_items = block.get('media', [])
                
                for media in media_items:
                    # Nur höchste Auflösung laden
                    if not media.get('has_original_dimensions'):
                        continue
                    
                    url = media.get('url')
                    if not url:
                        continue
                    
                    media_key = media.get('media_key', '').split(':')[0]
                    extension = url.split('.')[-1].split('?')[0]
                    filename = f"block_{block_idx}_img_{media_key}.{extension}"
                    filepath = post_dir / filename
                    
                    if download_file(url, filepath, stats, 'images'):
                        print(f"✅ [Images:{stats['images']}, Errors:{len(stats['errors'])}] IMG: {filename}")
            
            # === VIDEOS ===
            elif block_type == 'video':
                # Videos haben oft eine andere Struktur
                # Kann 'media' oder direkt 'url' haben
                
                # Option 1: media-Array (wie bei Bildern)
                if 'media' in block:
                    video_url = block['media'].get('url')
                # Option 2: Direkter URL-Key
                elif 'url' in block:
                    video_url = block['url']
                # Option 3: provider-specific (YouTube, Vimeo etc.)
                elif 'provider' in block:
                    # Externe Videos (YouTube etc.) überspringen
                    print(f"⏭️  Überspringe externes Video: {block.get('provider')}")
                    continue
                else:
                    video_url = None
                
                if video_url:
                    extension = safe_extension_from_url(video_url)
                    filename = f"block_{block_idx}_video.{extension}"
                    filepath = post_dir / filename
                    
                    if download_file(video_url, filepath, stats, 'videos'):
                        print(f"✅ [Videos:{stats['videos']}, Errors:{len(stats['errors'])}] VID: {filename}")
            
            # === AUDIO ===
            elif block_type == 'audio':
                # Audio-Struktur ähnlich wie Video
                audio_url = None
                
                if 'media' in block:
                    audio_url = block['media'].get('url')
                elif 'url' in block:
                    audio_url = block['url']
                elif 'provider' in block:
                    print(f"⏭️  Überspringe externes Audio: {block.get('provider')}")
                    continue
                
                if audio_url:
                    extension = audio_url.split('.')[-1].split('?')[0]
                    filename = f"block_{block_idx}_audio.{extension}"
                    filepath = post_dir / filename
                    
                    if download_file(audio_url, filepath, stats, 'audio'):
                        print(f"✅ [Audio:{stats['audio']}, Errors:{len(stats['errors'])}] AUD: {filename}")
    
    # Zusammenfassung
    print(f"\n{'='*60}")
    print(f"✅ Bilder heruntergeladen:  {stats['images']}")
    print(f"✅ Videos heruntergeladen:  {stats['videos']}")
    print(f"✅ Audio heruntergeladen:   {stats['audio']}")
    print(f"⏭️  Übersprungen:           {stats['skipped']}")
    print(f"❌ Fehler:                  {len(stats['errors'])}")
    print(f"{'='*60}")
    
    if stats['errors']:
        print("\n⚠️  Fehler-Details (erste 10):")
        for error in stats['errors'][:10]:
            print(f"  - {error}")
        
        # Fehler in Log-Datei speichern
        with open('download_errors.log', 'w') as f:
            f.write('\n'.join(stats['errors']))
        print(f"\n💾 Alle Fehler gespeichert in: download_errors.log")


def download_file(url, filepath, stats, media_type):
    """
    Hilfsfunktion zum Herunterladen einer Datei
    
    Returns:
        bool: True wenn erfolgreich, False wenn übersprungen/Fehler
    """
    # Überspringen wenn bereits existiert
    if filepath.exists():
        stats['skipped'] += 1
        return False
    
    try:
        response = requests.get(url, timeout=180)  # Längeres Timeout für Videos
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        stats[media_type] += 1
        
        # Pause zwischen Downloads (API-freundlich)
        time.sleep(0.3)
        
        return True
        
    except requests.exceptions.RequestException as e:
        error_msg = f"Fehler bei {url}: {str(e)}"
        stats['errors'].append(error_msg)
        return False


if __name__ == "__main__":
    print("🚀 Starte Download aller Medien...")
    download_all_media()