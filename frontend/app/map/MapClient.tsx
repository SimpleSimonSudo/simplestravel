"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface MappedPost {
  post_id: string;
  post_date: string;
  actual_date: string;
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
  visitedCountries: any[];
}

export default function MapClient({ posts, visitedCountries }: MapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [layerMode, setLayerMode] = useState<"cream" | "satellite">("cream");
  const [hoveredCountry, setHoveredCountry] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showHoverCard, setShowHoverCard] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mapInstanceRef = useRef<any>(null);
  const router = useRouter();
  const colorOffsetRef = useRef(Math.floor(Math.random() * 360));

  const showHoverCardRef = useRef(showHoverCard);
  const showHighlightsRef = useRef(showHighlights);

  useEffect(() => {
    showHoverCardRef.current = showHoverCard;
    if (!showHoverCard) {
      setHoveredCountry(null);
      setHoverPosition(null);
      const map = mapInstanceRef.current;
      if (map && map.getLayer("countries-hover")) {
        map.setFilter("countries-hover", ["==", ["get", "iso_a2"], ""]);
      }
    }
  }, [showHoverCard]);

  useEffect(() => {
    showHighlightsRef.current = showHighlights;
    if (!showHighlights) {
      setHoveredCountry(null);
      setHoverPosition(null);
      const map = mapInstanceRef.current;
      if (map && map.getLayer("countries-hover")) {
        map.setFilter("countries-hover", ["==", ["get", "iso_a2"], ""]);
      }
    }
  }, [showHighlights]);

  // Dynamic MapLibre Initialization
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Load MapLibre CSS dynamically
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    let map: any = null;

    const initMap = async () => {
      if (!mapRef.current) return;
      const maplibregl = (await import("maplibre-gl")).default;

      // Clean visited codes list to match with GeoJSON's iso_a2 properties
      const visitedCodes = visitedCountries
        .map((c) => c.iso_code?.toUpperCase())
        .filter(Boolean);

      // Define map styling rules with deterministic random hues per country
      const fillColorExpression: any[] = ["match", ["get", "iso_a2"]];
      const lineOutlineExpression: any[] = ["match", ["get", "iso_a2"]];
      const hoverColorExpression: any[] = ["match", ["get", "iso_a2"]];

      visitedCodes.forEach((code) => {
        const hue = (getHueFromISO(code) + colorOffsetRef.current) % 360;
        // Harmonious pastel colors: Saturation 65%, Lightness 65%, Opacity 0.16
        fillColorExpression.push(code, `hsla(${hue}, 65%, 65%, 0.16)`);
        lineOutlineExpression.push(code, `hsla(${hue}, 65%, 50%, 0.45)`);
        hoverColorExpression.push(code, `hsla(${hue}, 70%, 55%, 0.35)`);
      });

      if (visitedCodes.length === 0) {
        fillColorExpression.push("__NONE__");
        lineOutlineExpression.push("__NONE__");
        hoverColorExpression.push("__NONE__");
      }
      fillColorExpression.push("rgba(0, 0, 0, 0.0)");
      lineOutlineExpression.push("rgba(13, 12, 11, 0.08)");
      hoverColorExpression.push("rgba(13, 12, 11, 0.08)");

      // Initialize map with globe projection
      map = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          projection: { type: "globe" } as any,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: {
                "background-color": "#f4ede0",
              },
            },
          ],
        },
        center: [14.0, 48.0],
        zoom: 3.5,
        projection: { type: "globe" } as any,
      } as any);

      mapInstanceRef.current = map;

      map.on("load", () => {
        // Set projection to globe explicitly
        map.setProjection({ type: "globe" });

        // 1. Add Cream Map tiles source & layer (matching the blog styling)
        map.addSource("cream-tiles", {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        });

        map.addLayer({
          id: "cream-tiles-layer",
          type: "raster",
          source: "cream-tiles",
          layout: {
            visibility: layerMode === "cream" ? "visible" : "none",
          },
          paint: {
            "raster-opacity": 0.95,
          },
        });

        // 2. Add Satellite tiles source & layer (Esri high-res imagery)
        map.addSource("satellite-tiles", {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "&copy; Esri &copy; Earthstar Geographics",
        });

        map.addLayer({
          id: "satellite-tiles-layer",
          type: "raster",
          source: "satellite-tiles",
          layout: {
            visibility: layerMode === "satellite" ? "visible" : "none",
          },
        });

        // 3. Add world countries GeoJSON source
        map.addSource("countries-source", {
          type: "geojson",
          data: "/countries.json",
        });

        // 4. Fill layer for coloring visited countries
        map.addLayer({
          id: "countries-fill",
          type: "fill",
          source: "countries-source",
          paint: {
            "fill-color": fillColorExpression as any,
          },
        });

        // 5. Fill layer for showing hover highlights
        map.addLayer({
          id: "countries-hover",
          type: "fill",
          source: "countries-source",
          paint: {
            "fill-color": hoverColorExpression as any,
          },
          filter: ["==", ["get", "iso_a2"], ""],
        });

        // 6. Border lines layer
        map.addLayer({
          id: "countries-outline",
          type: "line",
          source: "countries-source",
          paint: {
            "line-color": lineOutlineExpression as any,
            "line-width": 0.8,
          },
        });

        // 7. Standard Navigation control
        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

        // 8. Dynamic Pins (Markers) for posts
        const bounds: [number, number][] = [];

        posts.forEach((post) => {
          const date = new Date(post.actual_date || post.post_date);
          const formattedDate = date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          // Custom Marker Wrapper
          const el = document.createElement("div");
          el.className = "custom-marker-container cursor-pointer";
          el.innerHTML = `
            <div class="relative flex items-center justify-center w-5 h-5 group">
              <div class="absolute w-5 h-5 bg-amber/30 rounded-full animate-ping"></div>
              <div class="relative w-3.5 h-3.5 bg-amber rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <div class="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          `;

          // Post Popup Content
          const popupContent = `
            <div class="p-3 font-body text-xs min-w-[200px] text-ink">
              <div class="flex items-center gap-1.5 mb-1 text-[10px] text-dust font-medium uppercase tracking-wider">
                <span>${formattedDate}</span>
                ${post.country_code ? `<span>·</span> <span>${countryCodeToFlag(post.country_code)} ${post.country_name}</span>` : ""}
              </div>
              <h4 class="font-display font-bold text-sm text-ink mb-1">
                <a href="/post/${post.post_id}" target="_blank" class="hover:text-amber transition-colors">
                  ${post.title || "Diary Entry"}
                </a>
              </h4>
              ${post.city ? `<p class="text-dust text-[10px] mb-2">Location: ${post.city}</p>` : ""}
              ${post.summary ? `<p class="text-dust line-clamp-2 leading-relaxed text-[11px] font-light bg-cream/10 p-2 border-l border-amber/30">${post.summary}</p>` : ""}
              <div class="mt-3 text-right">
                <a href="/post/${post.post_id}" class="text-[10px] uppercase font-semibold text-amber hover:underline">
                  Read Post &rarr;
                </a>
              </div>
            </div>
          `;

          const popup = new maplibregl.Popup({
            closeButton: false,
            className: "custom-maplibre-popup",
            maxWidth: "280px",
            offset: 12,
          }).setHTML(popupContent);

          new maplibregl.Marker({ element: el })
            .setLngLat([post.longitude, post.latitude])
            .setPopup(popup)
            .addTo(map);

          bounds.push([post.longitude, post.latitude]);
        });

        // Fit map bounds to encompass all posts
        if (bounds.length > 0) {
          const lngs = bounds.map((b) => b[0]);
          const lats = bounds.map((b) => b[1]);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 8 });
        }

        // 9. Attach Country Interaction Events
        map.on("mousemove", "countries-fill", (e: any) => {
          if (!showHoverCardRef.current) return;
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const iso2 = feature.properties.iso_a2?.toUpperCase();
            const name = feature.properties.name;

            const stats = visitedCountries.find((c) => c.iso_code?.toUpperCase() === iso2);

            setHoveredCountry({
              name,
              iso_code: iso2,
              stats,
            });

            setHoverPosition({ x: e.point.x, y: e.point.y });
            map.getCanvas().style.cursor = "pointer";

            // Update hover layer filter
            map.setFilter("countries-hover", ["==", ["get", "iso_a2"], feature.properties.iso_a2]);
          }
        });

        map.on("mouseleave", "countries-fill", () => {
          setHoveredCountry(null);
          setHoverPosition(null);
          map.getCanvas().style.cursor = "";
          map.setFilter("countries-hover", ["==", ["get", "iso_a2"], ""]);
        });

        map.on("click", "countries-fill", (e: any) => {
          if (!showHighlightsRef.current && !showHoverCardRef.current) return;
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const iso2 = feature.properties.iso_a2?.toUpperCase();
            if (iso2 && iso2 !== "-99") {
              const isVisited = visitedCountries.some((c) => c.iso_code?.toUpperCase() === iso2);
              if (isVisited) {
                router.push(`/countries/${iso2.toLowerCase()}`);
              }
            }
          }
        });
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [posts, visitedCountries, router]);

  // Synchronize Layer Mode transitions
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.getLayer("cream-tiles-layer")) {
      map.setLayoutProperty("cream-tiles-layer", "visibility", layerMode === "cream" ? "visible" : "none");
    }
    if (map.getLayer("satellite-tiles-layer")) {
      map.setLayoutProperty("satellite-tiles-layer", "visibility", layerMode === "satellite" ? "visible" : "none");
    }
  }, [layerMode]);

  // Synchronize Country Highlights paint properties
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const visitedCodes = visitedCountries
      .map((c) => c.iso_code?.toUpperCase())
      .filter(Boolean);

    if (showHighlights) {
      const fillColorExpression: any[] = ["match", ["get", "iso_a2"]];
      const lineOutlineExpression: any[] = ["match", ["get", "iso_a2"]];

      visitedCodes.forEach((code) => {
        const hue = (getHueFromISO(code) + colorOffsetRef.current) % 360;
        fillColorExpression.push(code, `hsla(${hue}, 65%, 65%, 0.16)`);
        lineOutlineExpression.push(code, `hsla(${hue}, 65%, 50%, 0.45)`);
      });

      if (visitedCodes.length === 0) {
        fillColorExpression.push("__NONE__");
        lineOutlineExpression.push("__NONE__");
      }
      fillColorExpression.push("rgba(0, 0, 0, 0.0)");
      lineOutlineExpression.push("rgba(13, 12, 11, 0.08)");

      if (map.getLayer("countries-fill")) {
        map.setPaintProperty("countries-fill", "fill-color", fillColorExpression);
      }
      if (map.getLayer("countries-outline")) {
        map.setPaintProperty("countries-outline", "line-color", lineOutlineExpression);
      }
    } else {
      // Make highlights transparent but keep layers visible so mouse events (like hover) still fire
      if (map.getLayer("countries-fill")) {
        map.setPaintProperty("countries-fill", "fill-color", "rgba(0, 0, 0, 0.0)");
      }
      if (map.getLayer("countries-outline")) {
        map.setPaintProperty("countries-outline", "line-color", "rgba(0, 0, 0, 0.0)");
      }
    }
  }, [showHighlights, visitedCountries]);

  // Dynamic positioning logic for the hover info card to prevent off-screen overflow
  const getCardStyle = (): React.CSSProperties => {
    if (!hoverPosition) return { display: "none" };

    const padding = 15;
    let left = hoverPosition.x + padding;
    let top = hoverPosition.y + padding;

    // Use default estimate bounds if window parameters are not fully loaded
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    // Card dimensions estimation: width 260px, height 280px
    const cardWidth = 260;
    const cardHeight = 280;

    if (left + cardWidth > windowWidth) {
      left = hoverPosition.x - cardWidth - padding;
    }
    if (top + cardHeight > windowHeight) {
      top = hoverPosition.y - cardHeight - padding;
    }

    return {
      position: "absolute",
      zIndex: 20,
      pointerEvents: "none",
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  return (
    <>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-0 bg-cream" />

      {/* Map Settings Collapsible Control */}
      <div className="absolute top-20 right-6 z-10 font-body text-xs flex flex-col items-end">
        {/* Toggle Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md border border-ink/5 rounded-xs shadow-md font-semibold text-ink hover:text-amber transition-all cursor-pointer select-none"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
            <line x1="9" y1="3" x2="9" y2="18"></line>
            <line x1="15" y1="6" x2="15" y2="21"></line>
          </svg>
          Map Options
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {/* Expandable Menu */}
        {isMenuOpen && (
          <div className="mt-2 w-[220px] p-4 bg-white/98 backdrop-blur-md border border-ink/5 rounded-xs shadow-lg flex flex-col gap-4 animate-fade-in z-20">
            {/* Base Layer Switcher */}
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-dust mb-2">Map Style</span>
              <div className="flex gap-1 p-0.5 bg-cream/40 rounded-xs border border-ink/5">
                <button
                  onClick={() => setLayerMode("cream")}
                  className={`flex-1 py-1 rounded-2xs text-[10px] font-bold uppercase transition-all ${
                    layerMode === "cream" ? "bg-amber text-white shadow-xs" : "text-dust hover:text-ink"
                  }`}
                >
                  Cream
                </button>
                <button
                  onClick={() => setLayerMode("satellite")}
                  className={`flex-1 py-1 rounded-2xs text-[10px] font-bold uppercase transition-all ${
                    layerMode === "satellite" ? "bg-amber text-white shadow-xs" : "text-dust hover:text-ink"
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="border-t border-ink/5 pt-3 flex flex-col gap-2.5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-dust mb-1">Overlay Features</span>
              
              {/* Highlight Visited */}
              <label className="flex items-center justify-between cursor-pointer select-none text-[11px]">
                <span className="text-ink font-medium">Visited Highlights</span>
                <input
                  type="checkbox"
                  checked={showHighlights}
                  onChange={(e) => setShowHighlights(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber rounded-xs cursor-pointer border border-ink/10"
                />
              </label>

              {/* Hover Details */}
              <label className="flex items-center justify-between cursor-pointer select-none text-[11px]">
                <span className="text-ink font-medium">Country Hover Cards</span>
                <input
                  type="checkbox"
                  checked={showHoverCard}
                  onChange={(e) => setShowHoverCard(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber rounded-xs cursor-pointer border border-ink/10"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Floating Info Box */}
      {showInfoBox && (
        <div className="absolute top-20 left-6 z-10 max-w-sm p-6 bg-white/95 backdrop-blur-md border border-ink/5 rounded-sm shadow-lg font-body animate-fade-up">
          {/* Close button */}
          <button
            onClick={() => setShowInfoBox(false)}
            className="absolute top-4 right-4 text-dust hover:text-ink transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <span className="overline text-2xs mb-1 text-dust">Travel Map</span>
          <h2 className="font-display font-black text-2xl text-ink mb-2">World Map</h2>
          <p className="text-xs text-dust leading-relaxed mb-4 pr-4">
            Here you will find all geographically recorded moments of our travels. Click on the pins to see previews of the posts. Hover over countries to view details.
          </p>
          <div className="flex items-center justify-between border-t border-ink/5 pt-4 text-xs font-medium">
            <span className="text-dust">Recorded Locations:</span>
            <span className="text-amber font-semibold">{posts.length} Pins</span>
          </div>
        </div>
      )}

      {/* Dynamic Hover Info Card (Steckbrief) */}
      {hoveredCountry && hoverPosition && (
        <div
          className="p-4 bg-white/95 backdrop-blur-md border border-ink/10 rounded-sm shadow-xl font-body w-[260px] animate-fade-in"
          style={getCardStyle()}
        >
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-ink/5">
            <span className="text-2xl leading-none" role="img" aria-label="flag">
              {countryCodeToFlag(hoveredCountry.iso_code)}
            </span>
            <h3 className="font-display font-bold text-sm text-ink truncate">
              {hoveredCountry.name}
            </h3>
          </div>

          {hoveredCountry.stats ? (
            <div className="space-y-2 text-2xs text-dust">
              <div className="flex justify-between border-b border-ink/5 pb-1">
                <span>Status:</span>
                <span className="text-amber font-semibold uppercase tracking-wider">Visited</span>
              </div>
              <div className="flex justify-between border-b border-ink/5 pb-1">
                <span>Written Posts:</span>
                <span className="text-ink font-medium">{hoveredCountry.stats.total_posts}</span>
              </div>
              {hoveredCountry.stats.first_post_date && (
                <div className="flex justify-between border-b border-ink/5 pb-1">
                  <span>First Visit:</span>
                  <span className="text-ink font-medium">
                    {new Date(hoveredCountry.stats.first_post_date).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {hoveredCountry.stats.last_post_date &&
                hoveredCountry.stats.first_post_date !== hoveredCountry.stats.last_post_date && (
                  <div className="flex justify-between border-b border-ink/5 pb-1">
                    <span>Last Visit:</span>
                    <span className="text-ink font-medium">
                      {new Date(hoveredCountry.stats.last_post_date).toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              {hoveredCountry.stats.trips && hoveredCountry.stats.trips.length > 0 && (
                <div className="pt-1">
                  <span className="block mb-1 text-[10px] uppercase tracking-wider font-semibold">Trips:</span>
                  <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pr-1">
                    {hoveredCountry.stats.trips.map((trip: string) => (
                      <span key={trip} className="bg-cream px-1.5 py-0.5 rounded-2xs text-[10px] text-ink font-light truncate max-w-full">
                        {trip}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2 text-center text-[10px] text-amber italic font-light">
                Click to explore country stories
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-2xs text-dust">
              <div className="flex justify-between border-b border-ink/5 pb-1">
                <span>Status:</span>
                <span className="text-dust font-medium uppercase tracking-wider">Not Visited</span>
              </div>
              <p className="text-[10px] italic pt-1.5 leading-relaxed text-dust/80">
                No articles or trips logged in this country yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MapLibre Custom Style Overrides */}
      <style jsx global>{`
        .custom-maplibre-popup .maplibregl-popup-content {
          border-radius: 2px !important;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 0 !important;
        }
        .custom-maplibre-popup .maplibregl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.98) !important;
          border-bottom-color: rgba(255, 255, 255, 0.98) !important;
        }
        .maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: rgba(255, 255, 255, 0.98) !important;
        }
        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.98) !important;
        }
        .maplibregl-popup-anchor-left .maplibregl-popup-tip {
          border-right-color: rgba(255, 255, 255, 0.98) !important;
        }
        .maplibregl-popup-anchor-right .maplibregl-popup-tip {
          border-left-color: rgba(255, 255, 255, 0.98) !important;
        }
        .maplibregl-canvas-container.maplibregl-interactive {
          cursor: default;
        }
      `}</style>
    </>
  );
}

function countryCodeToFlag(code: string): string {
  if (!code || code === "-99") return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

function getHueFromISO(str: string): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
