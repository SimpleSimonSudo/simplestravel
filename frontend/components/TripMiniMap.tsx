"use client";

import { useEffect, useRef, useState } from "react";

interface MiniMapPost {
  post_id: string;
  title: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
}

interface TripMiniMapProps {
  posts: MiniMapPost[];
  tripId?: number;
  defaultZoom?: number;
  className?: string;
}

export default function TripMiniMap({ posts, tripId, defaultZoom, className }: TripMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || posts.length === 0) return;

    // Load MapLibre CSS dynamically
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    let map: any = null;

    const initMiniMap = async () => {
      if (!mapContainerRef.current) return;
      const maplibregl = (await import("maplibre-gl")).default;

      // Initialize map
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: {
                "background-color": "#f4ede0", // matches body bg
              },
            },
          ],
        },
        center: [0, 0],
        zoom: 1,
        attributionControl: false, // hide attribution to keep it clean
      });

      map.on("load", () => {
        // Add basemap tiles (CartoDB Light matching the clean cream style)
        map.addSource("basemap-tiles", {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
        });

        map.addLayer({
          id: "basemap-layer",
          type: "raster",
          source: "basemap-tiles",
          paint: {
            "raster-opacity": 0.85,
          },
        });

        // Coordinates chronological (posts are ordered chronologically ascending)
        const coords: [number, number][] = posts.map((p) => [p.longitude, p.latitude]);

        // Draw travel path lines
        if (coords.length >= 2) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          });

          map.addLayer({
            id: "route-layer",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#c8863a", // Amber color
              "line-width": 2.5,
              "line-opacity": 0.75,
            },
          });
        }

        // Add markers
        posts.forEach((post) => {
          const el = document.createElement("div");
          el.className = "custom-mini-marker cursor-pointer";
          el.innerHTML = `
            <div class="relative flex items-center justify-center w-4 h-4 group">
              <div class="absolute w-4 h-4 bg-amber/35 rounded-full custom-ping-animation"></div>
              <div class="relative w-2.5 h-2.5 bg-amber rounded-full border border-white shadow-xs"></div>
            </div>
          `;

          // Smooth scroll on marker click
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetEl = document.getElementById(`post-${post.post_id}`);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth" });
            }
          });

          // Add clean popup showing post title
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            className: "custom-mini-map-popup",
            offset: 8,
          }).setHTML(`
            <div class="font-body text-[10px] font-semibold text-ink px-2 py-1 max-w-[150px] truncate">
              ${post.title || post.city || "Story"}
            </div>
          `);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([post.longitude, post.latitude])
            .setPopup(popup)
            .addTo(map);

          // Show popup on hover
          el.addEventListener("mouseenter", () => marker.togglePopup());
          el.addEventListener("mouseleave", () => marker.togglePopup());
        });

        // Fit map bounds to center coordinates (outlier-resistant focusing)
        if (coords.length > 0) {
          if (coords.length === 1) {
            map.setCenter([coords[0][0], coords[0][1]]);
            map.setZoom(defaultZoom || 6);
          } else if (coords.length === 2) {
            const lngs = coords.map((c) => c[0]);
            const lats = coords.map((c) => c[1]);
            map.fitBounds(
              [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
              { padding: 30, maxZoom: 10 }
            );
          } else {
            // Find median center
            const sortedLngs = [...coords].map(c => c[0]).sort((a, b) => a - b);
            const sortedLats = [...coords].map(c => c[1]).sort((a, b) => a - b);
            const mid = Math.floor(coords.length / 2);
            const medianLng = coords.length % 2 !== 0 ? sortedLngs[mid] : (sortedLngs[mid - 1] + sortedLngs[mid]) / 2;
            const medianLat = coords.length % 2 !== 0 ? sortedLats[mid] : (sortedLats[mid - 1] + sortedLats[mid]) / 2;

            // Calculate distance squared from median for each point to identify outliers
            const pointsWithDistance = coords.map(p => {
              const dLng = p[0] - medianLng;
              const dLat = p[1] - medianLat;
              return {
                point: p,
                distSq: dLng * dLng + dLat * dLat
              };
            });

            // Sort points by distance to median ascending
            pointsWithDistance.sort((a, b) => a.distSq - b.distSq);

            // Keep the closest 80% of points for focus bounds (minimum of 2 points) to ignore remote starts/ends
            const keepCount = Math.max(2, Math.ceil(coords.length * 0.8));
            const focusedPoints = pointsWithDistance.slice(0, keepCount).map(p => p.point);

            const lngs = focusedPoints.map((c) => c[0]);
            const lats = focusedPoints.map((c) => c[1]);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            map.fitBounds(
              [[minLng, minLat], [maxLng, maxLat]],
              { padding: 30, maxZoom: 10 }
            );
          }
        }

        setMapLoaded(true);
      });
    };

    initMiniMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [posts]);

  if (posts.length === 0) return null;

  return (
    <div className={className || "w-full md:w-[320px] lg:w-[400px] h-[180px] md:h-[220px] lg:h-[260px] shrink-0 border border-ink/10 rounded-sm bg-white overflow-hidden relative shadow-xs group transition-shadow duration-300 hover:shadow-md"}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Large Map Link Overlay */}
      {tripId && (
        <a
          href={`/map?trip=${tripId}&lines=true`}
          className="absolute bottom-2.5 right-2.5 z-10 px-2 py-1 rounded bg-white/90 hover:bg-white border border-ink/10 text-[9px] uppercase tracking-widest font-semibold font-body text-ink hover:text-amber shadow-xs transition-all duration-300 flex items-center gap-1.5"
        >
          <span>Large Map</span>
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      )}

      {/* CSS Overrides */}
      <style jsx global>{`
        .custom-mini-map-popup .maplibregl-popup-content {
          border-radius: 2px !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          padding: 0 !important;
        }
        .custom-mini-map-popup .maplibregl-popup-close-button {
          display: none;
        }
      `}</style>
    </div>
  );
}
