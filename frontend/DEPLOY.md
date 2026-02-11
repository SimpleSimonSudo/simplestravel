# 🚀 Deploy to Cloudflare Pages

Step-by-step guide to deploy traveling-planet-earth to Cloudflare Pages with Next.js 15.

---

## ⚡ Stack

- **Next.js 15** (App Router, Server Components)
- **@opennextjs/cloudflare** — Cloudflare's recommended Next.js adapter
- **Cloudflare Pages** + **Cloudflare Workers**
- **Supabase** — PostgreSQL database

---

## 📋 Prerequisites

- Node.js 20+
- Cloudflare Account (free tier works)
- GitHub Account
- Supabase project running

---

## 🛠️ Schritt 1: Lokal einrichten

```bash
# 1. In den Projektordner
cd traveling-planet-earth

# 2. Dependencies installieren
npm install

# 3. Environment Variables
cp .env.local.example .env.local
# Öffne .env.local und fülle deine Supabase-Credentials ein:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 4. Lokal testen
npm run dev
# → http://localhost:3000
```

---

## 🗂️ Schritt 2: GitHub Repository

```bash
# 1. Neues Repo auf GitHub anlegen (privat empfohlen)

# 2. Lokal initialisieren
git init
git add .
git commit -m "Initial: Traveling Planet Earth frontend"

# 3. Zum GitHub Repo pushen
git remote add origin https://github.com/DEIN_USERNAME/traveling-planet-earth.git
git branch -M main
git push -u origin main
```

---

## ☁️ Schritt 3: Cloudflare Pages Projekt anlegen

1. Öffne **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Linke Sidebar → **Workers & Pages** → **Create**
3. Tab **Pages** wählen → **Connect to Git**
4. GitHub verbinden → Repository `traveling-planet-earth` auswählen
5. **Build Settings** konfigurieren:

   | Setting | Value |
   |---------|-------|
   | Framework preset | **Next.js** |
   | Build command | `npm run build && npx @opennextjs/cloudflare` |
   | Build output directory | `.open-next/assets` |
   | Root directory | `/` (Standard) |

6. Klick **Save and Deploy** → erster Build startet

---

## 🔑 Schritt 4: Environment Variables setzen

Gehe zu: **Cloudflare Dashboard → Workers & Pages → traveling-planet-earth → Settings → Variables and Secrets**

Füge hinzu:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Text |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Secret |

**Für beide Environments setzen:** Production + Preview

Dann **Redeploy** auslösen: Deployments Tab → Latest Deployment → "Retry deployment"

---

## ⚙️ Schritt 5: Compatibility Flags (wichtig!)

Gehe zu: **Settings → Runtime → Compatibility flags**

Füge hinzu für **Production** und **Preview**:
```
nodejs_compat
```

Compatibility Date: `2024-09-23` oder neuer

---

## 🔗 Schritt 6: Custom Domain (optional)

Gehe zu: **Settings → Custom domains** → **Set up a custom domain**

- Domain bei Cloudflare registriert? → Ein-Klick-Setup
- Domain woanders? → CNAME Record `xxx.pages.dev` eintragen

---

## 🔐 Schritt 7: Passwortschutz (empfohlen für private Blog)

Cloudflare Pages hat einen eingebauten Zugriffsschutz:

1. **Workers & Pages → traveling-planet-earth → Settings → Access policy**
2. **Manage** → **Cloudflare Zero Trust**
3. **Access → Applications → Add an application → Self-hosted**
4. Policy: Email-Adresse Whitelist oder Login-Passwort

**Alternativ:** Füge Middleware hinzu (middleware.ts):
```typescript
// middleware.ts — einfacher Basic Auth
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const auth = request.cookies.get("site-auth")?.value;
  if (auth === password) return NextResponse.next();

  // Redirect to login
  if (request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 🧪 Lokal mit Cloudflare Workers testen

```bash
# Build für Cloudflare
npm run preview

# Öffnet einen lokalen Workers-Server
# → http://localhost:8788
```

---

## 📤 Deployments

Jeder Push zu `main` triggert automatisch ein neues Deployment.

```bash
# Änderungen deployen
git add .
git commit -m "Update: neue Features"
git push

# Cloudflare baut automatisch neu (~1-2 Minuten)
```

**Manueller Deploy:**
```bash
npm run deploy
```

---

## 🔍 Troubleshooting

### Build schlägt fehl?
```bash
# Lokal checken
npm run build
```

### "Module not found" Fehler?
```bash
npm install
```

### Supabase-Daten kommen nicht?
- Environment Variables in Cloudflare Dashboard prüfen
- Supabase RLS Policies: Public read access aktiv?
  ```sql
  -- In Supabase SQL Editor prüfen
  SELECT * FROM posts LIMIT 5;
  ```

### Workers startet nicht?
- `nodejs_compat` Compatibility Flag gesetzt?
- Compatibility Date auf `2024-09-23` oder neuer?

---

## 📁 Projektstruktur

```
traveling-planet-earth/
├── app/
│   ├── layout.tsx          ← Root Layout, Header, Footer
│   ├── page.tsx            ← Homepage (Hero, Trips, Recent Posts)
│   ├── globals.css         ← Design System, Fonts
│   ├── error.tsx           ← Error Boundary
│   └── loading.tsx         ← Loading State
├── lib/
│   ├── supabase.ts         ← Supabase Client
│   ├── queries.ts          ← Alle DB-Abfragen
│   ├── types.ts            ← TypeScript Types
│   └── image-loader.ts     ← CF Image Loader
├── next.config.ts          ← Next.js Konfiguration
├── open-next.config.ts     ← Cloudflare Workers Adapter
├── wrangler.toml           ← Cloudflare Konfiguration
├── tailwind.config.ts      ← Design Tokens
└── tsconfig.json
```

---

## 🎯 Nächste Entwicklungsschritte

- [ ] `/journal` — Alle Posts (paginated)
- [ ] `/post/[id]` — Einzelner Post mit Bildergalerie
- [ ] `/trips` — Trips-Übersicht
- [ ] `/trips/[id]` — Einzelner Trip mit Timeline
- [ ] `/countries` — Länder-Übersicht
- [ ] `/map` — Interaktive Weltkarte (Mapbox/Leaflet)
- [ ] Passwortschutz / Login
- [ ] Foto-Lightbox
- [ ] Suche

---

## 💡 Useful Commands

```bash
npm run dev          # Lokale Entwicklung (Next.js dev server)
npm run build        # Production Build
npm run preview      # Lokal mit Cloudflare Workers Runtime testen
npm run deploy       # Direkt deployen (ohne GitHub)
npm run typecheck    # TypeScript prüfen
npm run lint         # ESLint
```

---

**🎉 Live in ~2 Minuten auf `https://traveling-planet-earth.pages.dev`!**
