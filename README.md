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