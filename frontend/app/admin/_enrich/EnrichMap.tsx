"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

interface EnrichMapProps {
  latitude: number | null;
  longitude: number | null;
  prevLatitude: number | null;
  prevLongitude: number | null;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onLocationFound?: (city: string | null, region: string | null, country: string | null, countryCode: string | null) => void;
}

export default function EnrichMap({
  latitude,
  longitude,
  prevLatitude,
  prevLongitude,
  onCoordinatesChange,
  onLocationFound,
}: EnrichMapProps) {
  const isValidCoordinate = (val: any) => {
    return val !== null && val !== undefined && val !== "" && !isNaN(Number(val));
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("Not initialized");

  // Initialize MapLibre
  useEffect(() => {
    if (typeof window === "undefined") {
      setDebugInfo("Window is undefined");
      return;
    }
    if (!mapContainerRef.current) {
      setDebugInfo("mapContainerRef.current is null");
      return;
    }
    if (mapInstanceRef.current) {
      setDebugInfo("Map already exists");
      return;
    }

    setDebugInfo("Initializing map...");



    const initMap = async () => {
      try {
        let map: any = null;
        setMapError(null);
        setDebugInfo("Loading stylesheet...");
        // Load MapLibre CSS dynamically as fallback
        if (!document.getElementById("maplibre-css")) {
          const link = document.createElement("link");
          link.id = "maplibre-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
          document.head.appendChild(link);
        }

        setDebugInfo("Importing maplibre-gl...");
        const maplibregl = (await import("maplibre-gl")).default;

        setDebugInfo("Creating Map instance...");
        // Determine initial center
        let initialCenter: [number, number] = [14.0, 48.0];
        let initialZoom = 3.5;

        if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
          initialCenter = [Number(longitude), Number(latitude)];
          initialZoom = 11;
        } else if (isValidCoordinate(prevLatitude) && isValidCoordinate(prevLongitude)) {
          initialCenter = [Number(prevLongitude), Number(prevLatitude)];
          initialZoom = 10;
        }

        map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: {
            version: 8,
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
          center: initialCenter,
          zoom: initialZoom,
        });

        mapInstanceRef.current = map;
        setDebugInfo("Map created, loading tiles...");

        map.on("load", () => {
          setDebugInfo("Adding cream tiles source...");
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

          setDebugInfo("Adding cream tiles layer...");
          map.addLayer({
            id: "cream-tiles-layer",
            type: "raster",
            source: "cream-tiles",
            layout: {
              visibility: "visible",
            },
            paint: {
              "raster-opacity": 0.95,
            },
          });

          // Navigation controls
          map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

          // Set up marker if coordinates exist
          if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
            markerRef.current = new maplibregl.Marker({ color: "#c8863a", draggable: true })
              .setLngLat([Number(longitude), Number(latitude)])
              .addTo(map);

            markerRef.current.on("dragend", () => {
              const lngLat = markerRef.current.getLngLat();
              onCoordinatesChange(lngLat.lat, lngLat.lng);
              fetchReverseGeocode(lngLat.lat, lngLat.lng);
            });
          }

          // Click on map to place/move marker
          map.on("click", (e: any) => {
            const { lng, lat } = e.lngLat;
            updateMarker(lat, lng);
            onCoordinatesChange(lat, lng);
            fetchReverseGeocode(lat, lng);
          });

          // Trigger resize on load to ensure canvas occupies full visible parent dimensions
          setTimeout(() => {
            if (map) {
              map.resize();
              setDebugInfo("Map fully rendered!");
            }
          }, 150);
        });
      } catch (err: any) {
        console.error("MapLibre initialization failed:", err);
        setMapError(err.message || String(err));
        setDebugInfo("Error: " + (err.message || String(err)));
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  // Update marker when props change from external inputs (e.g. Save or navigation)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Dynamically resize map container to adapt to layout shifts
    map.resize();

    if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
      updateMarker(Number(latitude), Number(longitude));
      // Pan to coordinates if not already centered
      const center = map.getCenter();
      const distance = Math.sqrt(Math.pow(center.lng - Number(longitude), 2) + Math.pow(center.lat - Number(latitude), 2));
      if (distance > 0.05) {
        map.flyTo({ center: [Number(longitude), Number(latitude)], zoom: map.getZoom() < 8 ? 10 : map.getZoom() });
      }
    } else {
      // Remove marker if coords are cleared
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      // If we have previous coordinates, pan to them to await input
      if (isValidCoordinate(prevLatitude) && isValidCoordinate(prevLongitude)) {
        map.flyTo({ center: [Number(prevLongitude), Number(prevLatitude)], zoom: 9 });
      }
    }
  }, [latitude, longitude, prevLatitude, prevLongitude]);

  // Helper to add or move marker
  const updateMarker = async (lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const maplibregl = (await import("maplibre-gl")).default;
    const targetLng = Number(lng);
    const targetLat = Number(lat);

    if (markerRef.current) {
      markerRef.current.setLngLat([targetLng, targetLat]);
    } else {
      markerRef.current = new maplibregl.Marker({ color: "#c8863a", draggable: true })
        .setLngLat([targetLng, targetLat])
        .addTo(map);

      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current.getLngLat();
        onCoordinatesChange(lngLat.lat, lngLat.lng);
        fetchReverseGeocode(lngLat.lat, lngLat.lng);
      });
    }
  };

  // Fetch address info from OpenStreetMap Nominatim API
  const fetchReverseGeocode = async (lat: number, lng: number) => {
    if (!onLocationFound) return;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { "Accept-Language": "en" }, // Request in English
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || null;
        const region = addr.state || addr.county || null;
        const countryName = addr.country || null;
        const countryCode = addr.country_code ? addr.country_code.toUpperCase() : null;

        onLocationFound(city, region, countryName, countryCode);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  // Search address using Nominatim Geocoder API
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`;
      const response = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      if (!response.ok) throw new Error("Search service error.");
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        onCoordinatesChange(lat, lon);
        updateMarker(lat, lon);
        
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo({ center: [lon, lat], zoom: 12 });
        }

        // Fetch location details for this found spot
        fetchReverseGeocode(lat, lon);
        setSearchError(null);
      } else {
        setSearchError("No results found.");
      }
    } catch (err: any) {
      setSearchError(err.message || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full h-full bg-cream">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 p-3 bg-white border-b border-ink/10">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location (e.g. Rome, Italy)..."
          className="flex-1 px-3 py-1.5 border border-cream rounded-xs text-xs font-body text-ink focus:outline-none focus:border-amber bg-paper/50"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-1.5 bg-amber hover:bg-amber/90 text-white font-body font-semibold text-xs rounded-xs shadow-sm transition-colors disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>
      {searchError && (
        <div className="px-3 py-1 text-2xs text-red-600 bg-red-50 border-b border-red-100">
          {searchError}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-[208px] bg-cream relative z-0">
        {mapError && (
          <div className="absolute inset-0 bg-red-50 text-red-700 p-4 text-xs font-mono overflow-auto z-50">
            <strong>Map Error:</strong> {mapError}
          </div>
        )}
        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-xs z-40 font-mono font-semibold">
          Map State: {debugInfo}
        </div>
      </div>
    </div>
  );
}
