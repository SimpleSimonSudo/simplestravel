#!/usr/bin/env python3
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables to get the R2 public URL
load_dotenv()
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev")

def main():
    json_path = Path("scratch/orphaned_media_list.json")
    if not json_path.exists():
        print("❌ File 'scratch/orphaned_media_list.json' not found. Please run scratch/check_r2_orphans.py first.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    orphaned_keys = data.get("orphaned_keys", [])
    summary = data.get("summary", {})

    print(f"Generating HTML viewer for {len(orphaned_keys)} orphaned files...")

    # Build the HTML content
    html_content = f"""<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare R2 Orphaned Media Viewer</title>
    <style>
        :root {{
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --text-color: #f1f5f9;
            --text-muted: #94a3b8;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --border-color: #334155;
            --success: #10b981;
        }}
        
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        
        body {{
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 2rem;
            line-height: 1.5;
        }}
        
        header {{
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }}
        
        h1 {{
            font-size: 2rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }}
        
        .badge {{
            background-color: #ef4444;
            color: white;
            font-size: 0.875rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-weight: bold;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }}
        
        .stat-card {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }}
        
        .stat-val {{
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--accent);
        }}
        
        .stat-lbl {{
            font-size: 0.875rem;
            color: var(--text-muted);
        }}
        
        .controls {{
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            align-items: center;
        }}
        
        .search-input, .filter-select {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 1rem;
            flex: 1;
            min-width: 250px;
        }}
        
        .filter-select {{
            flex: 0 0 200px;
            min-width: 150px;
        }}
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }}
        
        .media-card {{
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        
        .media-card:hover {{
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }}
        
        .preview-container {{
            position: relative;
            width: 100%;
            height: 200px;
            background-color: #090d16;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-bottom: 1px solid var(--border-color);
        }}
        
        .preview-img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: pointer;
            transition: opacity 0.2s;
        }}
        
        .preview-img:hover {{
            opacity: 0.8;
        }}
        
        .preview-video {{
            width: 100%;
            height: 100%;
            object-fit: contain;
        }}
        
        .fallback-icon {{
            font-size: 3rem;
            color: var(--text-muted);
        }}
        
        .card-content {{
            padding: 1rem;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            justify-content: space-between;
            gap: 1rem;
        }}
        
        .key-text {{
            font-family: monospace;
            font-size: 0.825rem;
            word-break: break-all;
            color: var(--text-color);
            max-height: 4.5em;
            overflow: hidden;
            text-overflow: ellipsis;
        }}
        
        .meta-row {{
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--text-muted);
            border-top: 1px solid var(--border-color);
            padding-top: 0.5rem;
        }}
        
        .links-row {{
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }}
        
        .btn {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: bold;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: background-color 0.2s;
            flex: 1;
            text-align: center;
        }}
        
        .btn-primary {{
            background-color: var(--accent);
            color: white;
        }}
        
        .btn-primary:hover {{
            background-color: var(--accent-hover);
        }}
        
        .btn-secondary {{
            background-color: var(--border-color);
            color: var(--text-color);
        }}
        
        .btn-secondary:hover {{
            background-color: #475569;
        }}
        
        .copy-btn.copied {{
            background-color: var(--success);
            color: white;
        }}
        
        /* Modal */
        .modal {{
            display: none;
            position: fixed;
            z-index: 1000;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }}
        
        .modal-content {{
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }}
        
        .close-btn {{
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            color: white;
            font-size: 2.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.2s;
            background: none;
            border: none;
        }}
        
        .close-btn:hover {{
            color: var(--accent);
        }}
    </style>
</head>
<body>

    <header>
        <h1><span>R2 Orphaned Media Viewer</span> <span class="badge">{len(orphaned_keys)} Orphans</span></h1>
        <p style="color: var(--text-muted);">Diese Medien liegen im R2 Bucket, sind aber in Supabase (weder in der Tabelle 'media', noch in 'posts' oder 'content_blocks' Texten) referenziert.</p>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-val">{summary.get("total_r2_files", 0)}</div>
                <div class="stat-lbl">Dateien in R2</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">{summary.get("total_r2_size_mb", 0):.1f} MB</div>
                <div class="stat-lbl">Gesamtgröße R2</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" style="color: var(--success);">{summary.get("referenced_files", 0)}</div>
                <div class="stat-lbl">In DB referenziert</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" style="color: #ef4444;">{len(orphaned_keys)}</div>
                <div class="stat-lbl">Verwaiste Dateien (Orphans)</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" style="color: #f59e0b;">{summary.get("potential_savings_mb", 0):.2f} MB</div>
                <div class="stat-lbl">Mögliche Einsparung</div>
            </div>
        </div>
    </header>

    <div class="controls">
        <input type="text" id="search" class="search-input" placeholder="Suche nach Key / Dateiname / Post-ID..." oninput="filterCards()">
        
        <select id="typeFilter" class="filter-select" onchange="filterCards()">
            <option value="all">Alle Typen</option>
            <option value="image">Bilder (jpg, jpeg, png, gif, webp, svg)</option>
            <option value="video">Videos (mp4, webm, mov, avi)</option>
            <option value="other">Andere</option>
        </select>
        
        <select id="sizeFilter" class="filter-select" onchange="filterCards()">
            <option value="all">Alle Größen</option>
            <option value="large">Groß (&gt; 1 MB)</option>
            <option value="medium">Mittel (100 KB - 1 MB)</option>
            <option value="small">Klein (&lt; 100 KB)</option>
        </select>
    </div>

    <div class="grid" id="mediaGrid">
"""

    for item in orphaned_keys:
        key = item["key"]
        size_mb = item["size_mb"]
        full_url = f"{R2_PUBLIC_URL}/{key}"
        ext = Path(key).suffix.lower()

        # Determine type
        media_type = "other"
        if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]:
            media_type = "image"
        elif ext in [".mp4", ".webm", ".mov", ".avi", ".m4v"]:
            media_type = "video"

        # Try to guess post_id
        # Keys are usually: POST_ID/filename or media/POST_ID-filename
        # Or media/filename
        post_id = ""
        parts = key.split("/")
        if len(parts) > 1:
            if parts[0] == "media":
                # Look at the filename, e.g. "1784057517592-dfpfiym-IMG_0528.jpeg"
                # Post ID could be the part before the first dash if it's long digit
                fn_part = parts[1]
                dash_idx = fn_part.find("-")
                if dash_idx != -1 and fn_part[:dash_idx].isdigit() and len(fn_part[:dash_idx]) > 8:
                    post_id = fn_part[:dash_idx]
            else:
                # E.g. "186210956785/block_7..."
                if parts[0].isdigit() and len(parts[0]) > 8:
                    post_id = parts[0]

        # Element preview html
        preview_html = ""
        if media_type == "image":
            preview_html = f'<img src="{full_url}" class="preview-img" alt="{key}" loading="lazy" onclick="openModal(this.src)">'
        elif media_type == "video":
            preview_html = f'<video src="{full_url}" class="preview-video" controls muted preload="metadata"></video>'
        else:
            preview_html = '<div class="fallback-icon">📄</div>'

        # Action links for post
        db_links = ""
        if post_id:
            db_links = f"""
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                <a href="http://localhost:3000/post/{post_id}" target="_blank" class="btn btn-secondary" style="background-color: #1e3a8a; border: 1px solid #3b82f6;">🌐 View Post ({post_id})</a>
                <a href="http://localhost:3000/admin/posts/{post_id}" target="_blank" class="btn btn-secondary" style="background-color: #312e81; border: 1px solid #4f46e5;">✍️ Admin Edit</a>
            </div>
            """

        html_content += f"""
        <div class="media-card" data-key="{key.lower()}" data-type="{media_type}" data-size="{size_mb}">
            <div class="preview-container">
                {preview_html}
            </div>
            <div class="card-content">
                <div>
                    <div class="key-text" title="{key}">{key}</div>
                    {db_links}
                </div>
                <div>
                    <div class="meta-row">
                        <span>Größe: {size_mb:.2f} MB</span>
                        <span>Typ: {ext.upper()}</span>
                    </div>
                    <div class="links-row" style="margin-top: 0.75rem;">
                        <button class="btn btn-secondary copy-btn" onclick="copyToClipboard('{key}', this)">📋 Copy Key</button>
                        <a href="{full_url}" target="_blank" class="btn btn-primary">🔗 Open URL</a>
                    </div>
                </div>
            </div>
        </div>
        """

    html_content += """
    </div>

    <!-- Modal for full size images -->
    <div id="imageModal" class="modal" onclick="closeModal()">
        <button class="close-btn" onclick="closeModal()">&times;</button>
        <img class="modal-content" id="modalImg" onclick="event.stopPropagation()">
    </div>

    <script>
        function filterCards() {
            const searchValue = document.getElementById('search').value.toLowerCase();
            const typeValue = document.getElementById('typeFilter').value;
            const sizeValue = document.getElementById('sizeFilter').value;
            
            const cards = document.querySelectorAll('.media-card');
            
            cards.forEach(card => {
                const key = card.getAttribute('data-key');
                const type = card.getAttribute('data-type');
                const size = parseFloat(card.getAttribute('data-size'));
                
                let matchesSearch = key.includes(searchValue);
                let matchesType = (typeValue === 'all') || (type === typeValue);
                
                let matchesSize = true;
                if (sizeValue === 'large') {
                    matchesSize = (size >= 1.0);
                } else if (sizeValue === 'medium') {
                    matchesSize = (size >= 0.1 && size < 1.0);
                } else if (sizeValue === 'small') {
                    matchesSize = (size < 0.1);
                }
                
                if (matchesSearch && matchesType && matchesSize) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        function copyToClipboard(text, btn) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Fehler beim Kopieren: ', err);
            });
        }
        
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImg');
        
        function openModal(src) {
            modal.style.display = 'flex';
            modalImg.src = src;
        }
        
        function closeModal() {
            modal.style.display = 'none';
        }
        
        // ESC key to close modal
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>
"""

    output_path = Path("scratch/view_orphans.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"🎉 HTML viewer page successfully written to: {output_path}")
    print(f"You can now double-click or open file://{output_path.absolute()} in your browser to inspect the files!")

if __name__ == "__main__":
    main()
