#!/usr/bin/env python3
"""
Supabase Data Migration Script
Migriert Tumblr JSON-Daten in Supabase PostgreSQL
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
import time

# .env laden
load_dotenv()

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class SupabaseMigrator:
    """
    Migriert Tumblr-JSON-Daten in Supabase
    """
    
    def __init__(self, json_file: str = "tumblr_posts_local.json"):
        self.json_file = json_file
        self.supabase: Optional[Client] = None
        self.posts_data: List[Dict] = []
        
        # Statistiken
        self.stats = {
            'posts': {'inserted': 0, 'skipped': 0, 'errors': 0},
            'media': {'inserted': 0, 'skipped': 0, 'errors': 0},
            'blocks': {'inserted': 0, 'skipped': 0, 'errors': 0},
            'errors': []
        }
    
    def connect(self):
        """Verbindung zu Supabase herstellen"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL und SUPABASE_KEY müssen in .env gesetzt sein")
        
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Supabase verbunden: {SUPABASE_URL}")
    
    def load_json(self):
        """JSON-Daten laden"""
        print(f"\n📦 Lade JSON-Daten: {self.json_file}")
        
        if not Path(self.json_file).exists():
            raise FileNotFoundError(f"JSON-Datei nicht gefunden: {self.json_file}")
        
        with open(self.json_file, 'r', encoding='utf-8') as f:
            self.posts_data = json.load(f)
        
        print(f"✅ {len(self.posts_data)} Posts geladen")
        print(f"   Zeitraum: {self._get_date_range()}")
    
    def _get_date_range(self) -> str:
        """Ermittle Datum-Bereich"""
        dates = [p.get('date', '') for p in self.posts_data if p.get('date')]
        if not dates:
            return "Unbekannt"
        return f"{min(dates)} bis {max(dates)}"
    
    def migrate_all(self):
        """Hauptmigration"""
        print("\n" + "="*60)
        print("🚀 STARTE MIGRATION")
        print("="*60)
        
        total = len(self.posts_data)
        
        for idx, post in enumerate(self.posts_data, 1):
            try:
                post_id = post.get('id_string')
                
                print(f"\n[{idx}/{total}] Migriere Post: {post_id}")
                
                # 1. Prüfe ob Post bereits existiert
                if self._post_exists(post_id):
                    print(f"  ⏭️  Überspringe (bereits vorhanden)")
                    self.stats['posts']['skipped'] += 1
                    continue
                
                # 2. Post einfügen
                self._insert_post(post)
                
                # 3. Media einfügen
                self._insert_media(post)
                
                # 4. Content Blocks einfügen
                self._insert_content_blocks(post)
                
                self.stats['posts']['inserted'] += 1
                
                # Rate limiting (Supabase free tier)
                if idx % 50 == 0:
                    print(f"\n⏸️  Pause (50 Posts verarbeitet)...")
                    time.sleep(2)
                
            except Exception as e:
                error_msg = f"Post {post.get('id_string')}: {str(e)}"
                self.stats['posts']['errors'] += 1
                self.stats['errors'].append(error_msg)
                print(f"  ❌ Fehler: {str(e)[:80]}")
        
        self._print_summary()
    
    def _post_exists(self, post_id: str) -> bool:
        """Prüfe ob Post bereits existiert"""
        try:
            result = self.supabase.table('posts').select('post_id').eq('post_id', post_id).execute()
            return len(result.data) > 0
        except:
            return False
    
    def _insert_post(self, post: Dict):
        """Post einfügen"""
        post_id = post.get('id_string')
        
        # Datum parsen
        date_str = post.get('date', '')
        try:
            post_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S %Z')
        except:
            post_date = datetime.fromtimestamp(post.get('timestamp', 0))
        
        # Summary extrahieren
        summary = post.get('summary', '')
        if not summary:
            for block in post.get('content', []):
                if block.get('type') == 'text':
                    summary = block.get('text', '')[:500]
                    break
        
        # Tags extrahieren
        tags = post.get('tags', [])
        
        # Content als JSONB
        content_blocks = post.get('content', [])
        
        # Layout als JSONB
        layout_info = post.get('layout', None)
        
        # Companions extrahieren (heuristisch)
        companions = self._extract_companions(post)
        
        # Land extrahieren (heuristisch)
        country = self._extract_country(post)
        
        # Media zählen
        media_count = sum(1 for b in content_blocks if b.get('type') in ['image', 'video', 'audio'])
        text_blocks_count = sum(1 for b in content_blocks if b.get('type') == 'text')
        
        # Post-Daten vorbereiten
        post_data = {
            'post_id': post_id,
            'post_date': post_date.isoformat(),
            'tumblr_timestamp': post.get('timestamp'),
            'slug': post.get('slug'),
            'original_url': post.get('post_url'),
            'short_url': post.get('short_url'),
            'state': post.get('state', 'published'),
            'note_count': post.get('note_count', 0),
            'title': None,  # Später manuell
            'summary': summary,
            'content_blocks': content_blocks,
            'layout_info': layout_info,
            'country': country,
            'city': None,  # Später manuell
            'region': None,  # Später manuell
            'location_name': None,  # Später manuell
            'companions': companions,
            'tags': tags if tags else None,
            'media_count': media_count,
            'text_blocks_count': text_blocks_count
        }
        
        # In Supabase einfügen
        result = self.supabase.table('posts').insert(post_data).execute()
        
        if result.data:
            print(f"  ✅ Post eingefügt")
        else:
            raise Exception("Post konnte nicht eingefügt werden")
    
    def _insert_media(self, post: Dict):
        """Media-Einträge einfügen"""
        post_id = post.get('id_string')
        content_blocks = post.get('content', [])
        
        media_inserted = 0
        
        for block_idx, block in enumerate(content_blocks):
            block_type = block.get('type')
            
            # === IMAGES ===
            if block_type == 'image':
                media_items = block.get('media', [])
                
                for display_idx, media in enumerate(media_items):
                    # Nur Original-Auflösung
                    if not media.get('has_original_dimensions'):
                        continue
                    
                    url = media.get('url', '')
                    tumblr_url = media.get('original_tumblr_url', url)
                    
                    # Lokaler Pfad
                    media_key = media.get('media_key', '').split(':')[0]
                    extension = url.split('.')[-1].split('?')[0] if '.' in url else 'jpg'
                    local_path = f"media/{post_id}/block_{block_idx}_{media_key}.{extension}"
                    
                    # Storage path (für Supabase Storage später)
                    storage_path = f"posts/{post_id}/block_{block_idx}_{media_key}.{extension}"
                    
                    # EXIF extrahieren
                    exif_data = block.get('exif', {})
                    photo_taken_at = None
                    if exif_data.get('Time'):
                        try:
                            photo_taken_at = datetime.fromtimestamp(exif_data['Time']).isoformat()
                        except:
                            pass
                    
                    # Farben
                    colors = block.get('colors', {})
                    
                    media_data = {
                        'post_id': post_id,
                        'block_index': block_idx,
                        'display_order': display_idx,
                        'media_type': 'image',
                        'mime_type': media.get('type'),
                        'storage_path': storage_path,
                        'local_path': local_path,
                        'original_url': url,
                        'tumblr_url': tumblr_url,
                        'width': media.get('width'),
                        'height': media.get('height'),
                        'dominant_colors': colors if colors else None,
                        'exif_data': exif_data if exif_data else None,
                        'camera_make': exif_data.get('CameraMake'),
                        'camera_model': exif_data.get('CameraModel'),
                        'lens': exif_data.get('Lens'),
                        'aperture': exif_data.get('Aperture'),
                        'exposure_time': exif_data.get('ExposureTime'),
                        'iso': exif_data.get('ISO'),
                        'focal_length': exif_data.get('FocalLength'),
                        'photo_taken_at': photo_taken_at,
                        'alt_text': block.get('alt_text')
                    }
                    
                    try:
                        self.supabase.table('media').insert(media_data).execute()
                        media_inserted += 1
                    except Exception as e:
                        self.stats['media']['errors'] += 1
                        print(f"    ⚠️  Media-Fehler: {str(e)[:50]}")
            
            # === VIDEOS ===
            elif block_type == 'video':
                # Video-URL extrahieren
                video_url = None
                provider = block.get('provider', 'tumblr')
                
                if 'media' in block:
                    video_url = block['media'].get('url')
                elif 'url' in block:
                    video_url = block['url']
                
                # Nur Tumblr-Videos speichern (externe wie YouTube nicht)
                if video_url and 'tumblr' in video_url.lower():
                    extension = video_url.split('.')[-1].split('?')[0] if '.' in video_url else 'mp4'
                    local_path = f"media/{post_id}/block_{block_idx}_video.{extension}"
                    storage_path = f"posts/{post_id}/block_{block_idx}_video.{extension}"
                    
                    media_data = {
                        'post_id': post_id,
                        'block_index': block_idx,
                        'display_order': 0,
                        'media_type': 'video',
                        'storage_path': storage_path,
                        'local_path': local_path,
                        'original_url': video_url,
                        'tumblr_url': video_url,
                        'provider': provider,
                        'duration_seconds': block.get('duration')
                    }
                    
                    try:
                        self.supabase.table('media').insert(media_data).execute()
                        media_inserted += 1
                    except Exception as e:
                        self.stats['media']['errors'] += 1
            
            # === AUDIO ===
            elif block_type == 'audio':
                audio_url = None
                
                if 'media' in block:
                    audio_url = block['media'].get('url')
                elif 'url' in block:
                    audio_url = block['url']
                
                if audio_url and 'tumblr' in audio_url.lower():
                    extension = audio_url.split('.')[-1].split('?')[0] if '.' in audio_url else 'mp3'
                    local_path = f"media/{post_id}/block_{block_idx}_audio.{extension}"
                    storage_path = f"posts/{post_id}/block_{block_idx}_audio.{extension}"
                    
                    media_data = {
                        'post_id': post_id,
                        'block_index': block_idx,
                        'display_order': 0,
                        'media_type': 'audio',
                        'storage_path': storage_path,
                        'local_path': local_path,
                        'original_url': audio_url,
                        'tumblr_url': audio_url,
                        'provider': block.get('provider', 'tumblr')
                    }
                    
                    try:
                        self.supabase.table('media').insert(media_data).execute()
                        media_inserted += 1
                    except Exception as e:
                        self.stats['media']['errors'] += 1
        
        if media_inserted > 0:
            print(f"  ✅ {media_inserted} Media-Einträge")
            self.stats['media']['inserted'] += media_inserted
    
    def _insert_content_blocks(self, post: Dict):
        """Content Blocks einfügen"""
        post_id = post.get('id_string')
        content_blocks = post.get('content', [])
        
        # Layout-Map erstellen
        layout = post.get('layout', [])
        layout_map = {}
        
        if layout and layout[0].get('display'):
            for row_idx, row in enumerate(layout[0]['display']):
                for block_idx in row.get('blocks', []):
                    layout_map[block_idx] = row_idx
        
        blocks_inserted = 0
        
        for block_idx, block in enumerate(content_blocks):
            block_type = block.get('type')
            
            block_data = {
                'post_id': post_id,
                'block_index': block_idx,
                'block_type': block_type,
                'layout_row': layout_map.get(block_idx)
            }
            
            # Text-Blocks
            if block_type == 'text':
                block_data['text_content'] = block.get('text')
                block_data['text_formatting'] = block.get('formatting')
                block_data['text_subtype'] = block.get('subtype')
            
            # Link-Blocks
            elif block_type == 'link':
                block_data['link_url'] = block.get('url')
                block_data['link_title'] = block.get('title')
                block_data['link_description'] = block.get('description')
            
            try:
                self.supabase.table('content_blocks').insert(block_data).execute()
                blocks_inserted += 1
            except Exception as e:
                self.stats['blocks']['errors'] += 1
        
        if blocks_inserted > 0:
            print(f"  ✅ {blocks_inserted} Content-Blocks")
            self.stats['blocks']['inserted'] += blocks_inserted
    
    def _extract_companions(self, post: Dict) -> Optional[List[str]]:
        """Versuche Begleiter zu extrahieren (heuristisch)"""
        companions = set()
        known_names = ['Johy', 'Anna', 'Max', 'Dad', 'Mom', 'Johannes']
        
        for block in post.get('content', []):
            if block.get('type') == 'text':
                text = block.get('text', '')
                for name in known_names:
                    if name in text:
                        companions.add(name)
        
        return list(companions) if companions else None
    
    def _extract_country(self, post: Dict) -> Optional[str]:
        """Versuche Land zu extrahieren (heuristisch)"""
        countries = {
            'Italy': ['Italy', 'Italien', 'Venice', 'Venedig', 'Rome', 'Rom'],
            'Croatia': ['Croatia', 'Kroatien', 'Zagreb', 'Split'],
            'Slovenia': ['Slovenia', 'Slowenien', 'Ljubljana'],
            'Austria': ['Austria', 'Österreich', 'Vienna', 'Wien'],
            'Germany': ['Germany', 'Deutschland', 'Berlin', 'Munich'],
            'France': ['France', 'Frankreich', 'Paris'],
            'Spain': ['Spain', 'Spanien', 'Madrid', 'Barcelona'],
            'Greece': ['Greece', 'Griechenland', 'Athens', 'Athen']
        }
        
        # In Tags suchen
        for tag in post.get('tags', []):
            for country, keywords in countries.items():
                if any(kw.lower() in tag.lower() for kw in keywords):
                    return country
        
        # In Content suchen
        content_text = ' '.join(
            block.get('text', '') 
            for block in post.get('content', []) 
            if block.get('type') == 'text'
        )
        
        for country, keywords in countries.items():
            if any(kw in content_text for kw in keywords):
                return country
        
        return None
    
    def _print_summary(self):
        """Migrations-Zusammenfassung"""
        print("\n" + "="*60)
        print("✅ MIGRATION ABGESCHLOSSEN")
        print("="*60)
        print(f"\n📊 POSTS:")
        print(f"  ✅ Eingefügt:     {self.stats['posts']['inserted']}")
        print(f"  ⏭️  Übersprungen:  {self.stats['posts']['skipped']}")
        print(f"  ❌ Fehler:        {self.stats['posts']['errors']}")
        
        print(f"\n📊 MEDIA:")
        print(f"  ✅ Eingefügt:     {self.stats['media']['inserted']}")
        print(f"  ❌ Fehler:        {self.stats['media']['errors']}")
        
        print(f"\n📊 CONTENT BLOCKS:")
        print(f"  ✅ Eingefügt:     {self.stats['blocks']['inserted']}")
        print(f"  ❌ Fehler:        {self.stats['blocks']['errors']}")
        
        if self.stats['errors']:
            print(f"\n⚠️  FEHLER-DETAILS (erste 10):")
            for error in self.stats['errors'][:10]:
                print(f"  - {error}")
        
        print("\n" + "="*60)
    
    def verify_migration(self):
        """Verifiziere Migration"""
        print("\n" + "="*60)
        print("🔍 VERIFIKATION")
        print("="*60)
        
        # Posts zählen
        posts_result = self.supabase.table('posts').select('post_id', count='exact').execute()
        posts_count = posts_result.count if hasattr(posts_result, 'count') else len(posts_result.data)
        print(f"\n✅ Posts in DB:        {posts_count}")
        
        # Media zählen
        media_result = self.supabase.table('media').select('media_id', count='exact').execute()
        media_count = media_result.count if hasattr(media_result, 'count') else len(media_result.data)
        print(f"✅ Media in DB:        {media_count}")
        
        # Blocks zählen
        blocks_result = self.supabase.table('content_blocks').select('block_id', count='exact').execute()
        blocks_count = blocks_result.count if hasattr(blocks_result, 'count') else len(blocks_result.data)
        print(f"✅ Blocks in DB:       {blocks_count}")
        
        # Datum-Bereich
        date_result = self.supabase.table('posts').select('post_date').order('post_date').execute()
        if date_result.data:
            oldest = date_result.data[0]['post_date']
            newest = date_result.data[-1]['post_date']
            print(f"\n📅 Zeitraum:")
            print(f"  Ältester Post:   {oldest}")
            print(f"  Neuester Post:   {newest}")
        
        # Länder-Verteilung
        country_result = self.supabase.table('posts').select('country').execute()
        countries = {}
        for row in country_result.data:
            country = row.get('country')
            if country:
                countries[country] = countries.get(country, 0) + 1
        
        if countries:
            print(f"\n🌍 Posts nach Land:")
            for country, count in sorted(countries.items(), key=lambda x: x[1], reverse=True):
                print(f"  {country:15s}: {count:3d}")
        
        print("\n" + "="*60)

def main():
    """Hauptfunktion"""
    print("\n" + "="*60)
    print("🚀 SUPABASE DATA MIGRATION")
    print("="*60)
    
    migrator = SupabaseMigrator("tumblr_posts_local.json")
    
    try:
        # 1. Verbinden
        print("\n📋 Schritt 1: Supabase verbinden")
        migrator.connect()
        
        # 2. JSON laden
        print("\n📋 Schritt 2: JSON-Daten laden")
        migrator.load_json()
        
        # 3. Migration starten
        print("\n📋 Schritt 3: Daten migrieren")
        migrator.migrate_all()
        
        # 4. Verifizierung
        print("\n📋 Schritt 4: Migration verifizieren")
        migrator.verify_migration()
        
        print("\n✅ Migration erfolgreich abgeschlossen!")
        
    except Exception as e:
        print(f"\n❌ FEHLER: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
