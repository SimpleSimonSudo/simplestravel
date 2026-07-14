# Traveling Planet Earth

Ein schnelles, harmonisches und ästhetisches Reisetagebuch, gehostet auf Cloudflare Pages mit Supabase als Datenbank und Cloudflare R2 als Medien-Speicher.

## Projekt starten

Um die Anwendung lokal auszuführen, navigiere in den `frontend`-Ordner:

```bash
cd frontend
```

### 1. Lokaler Entwicklungsmodus (Standard Next.js)
Startet den Next.js-Entwicklungsserver mit Hot-Reloading:

```bash
npm run dev
```
Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

### 2. Lokaler Cloudflare Pages Vorschau-Modus
Kompiliert die Anwendung mit OpenNext und startet Wranglers lokalen Pages-Entwicklungsserver. Dies simuliert die tatsächliche Cloudflare-Laufzeitumgebung (inkl. Worker-Logik und Assets):

```bash
npm run preview
```
Die Vorschau ist dann unter [http://localhost:8788](http://localhost:8788) erreichbar.

## Deployment

Um deine lokalen Änderungen auf Cloudflare Pages zu veröffentlichen (z. B. auf https://simplestravel.pages.dev/):

1. Navigiere in das `frontend`-Verzeichnis:
   ```bash
   cd frontend
   ```
2. Führe den Deploy-Befehl aus:
   ```bash
   npm run deploy
   ```

*Hinweis:* Falls du noch nicht in Wrangler eingeloggt bist, wird dich die CLI im Browser dazu auffordern, dich mit deinem Cloudflare-Account anzumelden. Der Befehl baut die Anwendung mit OpenNext und lädt sowohl den Worker (`_worker.js`) als auch die statischen Assets hoch.

start venv:
source .venv/bin/activate

## Titelbilder-Ausschnitt (Focal Point Override)

Um zu verhindern, dass bei den Trip-Titelbildern auf der Startseite Köpfe abgeschnitten werden oder nur der Himmel sichtbar ist, kannst du den Bildausschnitt (Focal Point) manuell steuern. Tagge das entsprechende Bild in Tumblr zusätzlich oder anstelle von `#title` mit einem der folgenden Tags:

*   **`#title`** oder **`#title-center`**: Richtet den Bildausschnitt standardmäßig mittig aus (`center 50%`).
*   **`#title-top`**: Richtet den Bildausschnitt weiter oben aus (`center 15%`) – ideal, um abgeschnittene Köpfe zu vermeiden.
*   **`#title-bottom`**: Richtet den Bildausschnitt weiter unten aus (`center 85%`).
*   **`#title-XX`**: Setzt einen benutzerdefinierten vertikalen Prozentwert (z. B. `#title-30` für `center 30%` oder `#title-40` für `center 40%`).

## Datenbank-Backup & Architektur-Blueprint

Wir pflegen ein automatisiertes Daten- und Schemabackup sowie einen interaktiven Datenbank-Blueprint für Entwickler und Gemini-Agenten.

### 1. Backup aktualisieren
Um die lokale Kopie der Supabase-Datenbank zu aktualisieren, führe folgendes Skript im Hauptverzeichnis des Projekts aus:

```bash
./.venv/bin/python backup/backup_supabase.py
```

**Was passiert dabei?**
- Es wird eine neue Backup-Zip-Datei `backup/supabase_backup_YYYYMMDD_HHMMSS.zip` erstellt.
- **Speicherplatzoptimierung (Alte Backups überschreiben):** Um Speicherplatz zu sparen, löscht das Skript automatisch ältere zip-Backups und überschreibt die Links `backup/latest_backup.zip` sowie `backup/latest_backup.sql` mit dem neuesten Stand.
- **Blueprint aktualisieren:** Die Datei [DATABASE_BLUEPRINT.md](file:///home/simple_simon/Codes/traveling_planet_earth/DATABASE_BLUEPRINT.md) im Hauptverzeichnis wird automatisch neu generiert, um den aktuellen Schema- und Datenzustand widerzuspiegeln.

### 2. Datenbank-Blueprint (für Entwickler & Gemini-Agenten)
Im Hauptverzeichnis befindet sich die Datei [DATABASE_BLUEPRINT.md](file:///home/simple_simon/Codes/traveling_planet_earth/DATABASE_BLUEPRINT.md). Sie enthält:
- Ein aktuelles **Mermaid ER-Diagramm** mit allen Relationen, Primärschlüsseln (`PK`) und Fremdschlüsseln (`FK`).
- Detaillierte Tabellenbeschreibungen, Datentypen, Standardwerte und Zeilenanzahlen.

> [!TIP]
> **Für Gemini-Agenten:** Wenn du einem Gemini-Agenten eine Aufgabe gibst, die die Datenbank betrifft, weise ihn darauf hin, zuerst die Datei [DATABASE_BLUEPRINT.md](file:///home/simple_simon/Codes/traveling_planet_earth/DATABASE_BLUEPRINT.md) zu lesen. Dadurch versteht er die Tabellenstruktur und Fremdschlüsselbeziehungen sofort und muss sich nicht mühsam durch SQL-Migrationsdateien hangeln.

## Admin-Bereich & Blog-Management

Um in das Blog-Management zu gelangen:
1. **Versteckter Link**: Im Footer der Seite befindet sich direkt hinter dem Satz „Private journal. All rights reserved.“ ein versteckter Punkt `·`. Dieser ist standardmäßig unsichtbar und wird erst sichtbar (`opacity-100`), wenn man mit der Maus darüber fährt (Hover).
2. Alternativ kannst du auch direkt die URL `/admin-login` aufrufen.
3. **Zugangsdaten**:
   - **Admin-Key**: Einer deiner in `.env.local` konfigurierten Keys (z. B. `522-944`).
   - **Passwort**: Siehe `ADMIN_PASSWORD` in `frontend/.env.local`