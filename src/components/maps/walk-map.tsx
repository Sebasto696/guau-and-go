"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

interface Coord { lat: number; lng: number }

interface WalkMapProps {
  walkerPosition: Coord;
  clientPosition: Coord;
  isWalking?: boolean;
  routeHistory?: Coord[];
}

export function WalkMap({ walkerPosition, clientPosition, isWalking, routeHistory = [] }: WalkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const walkerMarkerRef = useRef<Marker | null>(null);
  const polylineRef = useRef<Polyline | null>(null);
  const [ready, setReady] = useState(false);

  // Boot Leaflet once on mount
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      // Import CSS first
      await import("leaflet/dist/leaflet.css" as string);
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) return;

      // Fix default marker icons broken by webpack
      // @ts-expect-error _getIconUrl is missing from types
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.default.map(containerRef.current, {
        center: [walkerPosition.lat, walkerPosition.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Walker marker 🐕
      const walkerIcon = L.default.divIcon({
        html: `<div style="background:#f97316;border:3px solid white;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 3px 10px rgba(249,115,22,0.5)">🐕</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        className: "",
      });

      // Client / home marker 🏠
      const clientIcon = L.default.divIcon({
        html: `<div style="background:#10b981;border:3px solid white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 10px rgba(16,185,129,0.5)">🏠</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: "",
      });

      walkerMarkerRef.current = L.default.marker([walkerPosition.lat, walkerPosition.lng], { icon: walkerIcon })
        .addTo(map)
        .bindPopup("<b>🐕 Paseador</b>");

      L.default.marker([clientPosition.lat, clientPosition.lng], { icon: clientIcon })
        .addTo(map)
        .bindPopup("<b>🏠 Tu ubicación</b>");

      // Accuracy circle around client
      L.default.circle([clientPosition.lat, clientPosition.lng], {
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.08,
        weight: 1,
        radius: 80,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update walker position
  useEffect(() => {
    if (!ready || !mapRef.current || !walkerMarkerRef.current) return;
    walkerMarkerRef.current.setLatLng([walkerPosition.lat, walkerPosition.lng]);
  }, [ready, walkerPosition]);

  // Update route polyline
  useEffect(() => {
    if (!ready || !mapRef.current || routeHistory.length < 2) return;

    import("leaflet").then(({ default: L }) => {
      const latLngs = routeHistory.map(c => [c.lat, c.lng] as [number, number]);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(latLngs);
      } else {
        polylineRef.current = L.polyline(latLngs, {
          color: "#f97316",
          weight: 4,
          opacity: 0.75,
          dashArray: "10 6",
        }).addTo(mapRef.current!);
      }
    });
  }, [ready, routeHistory]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 rounded-xl gap-3">
          <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando mapa...</p>
        </div>
      )}

      {isWalking && ready && (
        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Paseo en curso
        </div>
      )}
    </div>
  );
}
