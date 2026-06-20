"use client";

import { useEffect, useRef, useState } from "react";

interface MappedPost {
  post_id: string;
  post_date: string;
  title: string | null;
  summary: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  country_name: string | null;
  country_code: string | null;
}

interface MapClientProps {
  posts: MappedPost[];
}

export default function MapClient({ posts }: MapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let map: any = null;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || mapInstanceRef.current) return;

      // 1. Initialisiere die Karte (Fokus auf Mitteleuropa als Standard)
      map = L.map(mapRef.current, {
        center: [48.0, 14.0],
        zoom: 4,
        zoomControl: false, // Deaktivieren, um ihn rechts unten zu platzieren
      });

      mapInstanceRef.current = map;

      // 2. Zoom-Control unten rechts hinzufügen
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // 3. TileLayer hinzufügen (CartoDB Positron - passend zum Creme-Style)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // 4. Marker für alle Posts hinzufügen
      const bounds: any[] = [];

      posts.forEach((post) => {
        const date = new Date(post.post_date);
        const formattedDate = date.toLocaleDateString("de-DE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // Wunderschöner, reiner CSS Marker Pin (passend zum Branding)
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `
            <div class="relative flex items-center justify-center w-5 h-5 group">
              <div class="absolute w-5 h-5 bg-amber/30 rounded-full animate-ping"></div>
              <div class="relative w-3.5 h-3.5 bg-amber rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <div class="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10],
        });

        // Popup Content
        const popupContent = `
          <div class="p-3 font-body text-xs min-w-[200px] text-ink">
            <div class="flex items-center gap-1.5 mb-1 text-[10px] text-dust font-medium uppercase tracking-wider">
              <span>${formattedDate}</span>
              ${post.country_code ? `<span>·</span> <span>${countryCodeToFlag(post.country_code)} ${post.country_name}</span>` : ""}
            </div>
            <h4 class="font-display font-bold text-sm text-ink mb-1">
              <a href="/post/${post.post_id}" target="_blank" class="hover:text-amber transition-colors">
                ${post.title || "Tagebucheintrag"}
              </a>
            </h4>
            ${post.city ? `<p class="text-dust text-[10px] mb-2">Ort: ${post.city}</p>` : ""}
            ${post.summary ? `<p class="text-dust line-clamp-2 leading-relaxed text-[11px] font-light bg-cream/10 p-2 border-l border-amber/30">${post.summary}</p>` : ""}
            <div class="mt-3 text-right">
              <a href="/post/${post.post_id}" class="text-[10px] uppercase font-semibold text-amber hover:underline">
                Beitrag lesen &rarr;
              </a>
            </div>
          </div>
        `;

        const marker = L.marker([post.latitude, post.longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent, {
            className: "custom-leaflet-popup",
            maxWidth: 280,
          });

        bounds.push([post.latitude, post.longitude]);
      });

      // 5. Kartenausschnitt an alle Marker anpassen
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      setMapLoaded(true);
    };

    // Lade Leaflet CSS und JS dynamisch, falls nicht vorhanden
    if ((window as any).L) {
      initMap();
    } else {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [posts]);

  return (
    <>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Floating Info Box */}
      <div className="absolute top-28 left-6 z-10 max-w-sm p-6 bg-white/95 backdrop-blur-md border border-ink/5 rounded-sm shadow-lg font-body animate-fade-up">
        <span className="overline text-2xs mb-1">Reise-Map</span>
        <h2 className="font-display font-black text-2xl text-ink mb-2">Weltkarte</h2>
        <p className="text-xs text-dust leading-relaxed mb-4">
          Hier findest du alle geografisch erfassten Momente unserer Reisen. Klicke auf die Pins, um Vorschauen der Beiträge zu sehen.
        </p>
        <div className="flex items-center justify-between border-t border-ink/5 pt-4 text-xs font-medium">
          <span className="text-dust">Erfasste Orte:</span>
          <span className="text-amber font-semibold">{posts.length} Pins</span>
        </div>
      </div>

      {/* Leaflet Custom Style Overrides */}
      <style jsx global>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 2px !important;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: none !important;
        }
        .leaflet-container {
          background-color: #f4ede0 !important; /* Passend zum Creme-Hintergrund */
        }
      `}</style>
    </>
  );
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
