import json
from pathlib import Path

def test_local_media_files(json_file="tumblr_posts_local.json"):
    """
    Testet ob alle lokalen Media-URLs tatsächlich existieren
    """
    print(f"🔍 Teste lokale Media-Dateien aus {json_file}...\n")

    with open(json_file, 'r', encoding='utf-8') as f:
        posts = json.load(f)

    total_media = 0
    found_media = 0
    missing_media = 0
    missing_files = []

    for post in posts:
        post_id = post.get('id_string')

        for block_idx, block in enumerate(post.get('content', [])):
            if block.get('type') == 'image':
                for media in block.get('media', []):
                    if media.get('has_original_dimensions'):
                        total_media += 1
                        local_url = media.get('url', '')

                        # Entferne führenden /media/ und erstelle vollständigen Pfad
                        if local_url.startswith('/media/'):
                            relative_path = local_url[1:]  # Entfernt das führende /
                        else:
                            relative_path = local_url

                        file_path = Path(relative_path)

                        if file_path.exists():
                            found_media += 1
                        else:
                            missing_media += 1
                            missing_files.append({
                                'post_id': post_id,
                                'block': block_idx,
                                'url': local_url,
                                'expected_path': str(file_path),
                                'original_url': media.get('original_tumblr_url', 'N/A')
                            })

    # Ergebnisse ausgeben
    print("=" * 60)
    print(f"📊 STATISTIK:")
    print("=" * 60)
    print(f"Gesamt Media-Dateien:  {total_media}")
    print(f"✅ Gefunden:           {found_media} ({found_media/total_media*100:.1f}%)")
    print(f"❌ Fehlen:             {missing_media} ({missing_media/total_media*100:.1f}%)")
    print("=" * 60)

    if missing_files:
        print(f"\n⚠️  FEHLENDE DATEIEN ({len(missing_files)}):\n")
        for idx, missing in enumerate(missing_files[:10], 1):  # Zeige erste 10
            print(f"{idx}. Post {missing['post_id']}, Block {missing['block']}")
            print(f"   Erwarteter Pfad: {missing['expected_path']}")
            print(f"   Original URL: {missing['original_url'][:80]}...")
            print()

        if len(missing_files) > 10:
            print(f"   ... und {len(missing_files) - 10} weitere\n")
    else:
        print("\n🎉 Alle Media-Dateien wurden gefunden!")

    # Zusammenfassung
    print("\n" + "=" * 60)
    if found_media == total_media:
        print("✅ TEST BESTANDEN: Alle lokalen URLs zeigen auf existierende Dateien")
    else:
        print(f"⚠️  TEST TEILWEISE ERFOLGREICH: {missing_media} Dateien fehlen")
    print("=" * 60)

    return {
        'total': total_media,
        'found': found_media,
        'missing': missing_media,
        'success_rate': found_media/total_media*100 if total_media > 0 else 0
    }

if __name__ == "__main__":
    results = test_local_media_files()
