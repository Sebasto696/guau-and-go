"use client";
import { useEffect, useState } from "react";

export interface Coord { lat: number; lng: number }

// Bogotá neighborhoods as fallback starting points
const BOGOTA_ZONES: (Coord & { name: string })[] = [
  { lat: 4.6769, lng: -74.0491, name: "Usaquén" },
  { lat: 4.6532, lng: -74.0560, name: "Chapinero" },
  { lat: 4.6097, lng: -74.0817, name: "Teusaquillo" },
  { lat: 4.6291, lng: -74.1647, name: "Engativá" },
  { lat: 4.5981, lng: -74.0762, name: "Puente Aranda" },
];

const DEFAULT_ZONE = BOGOTA_ZONES[0]; // Usaquén

export function useLocation() {
  const [position, setPosition] = useState<Coord | null>(null);
  const [zoneName, setZoneName] = useState<string>("Bogotá");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(DEFAULT_ZONE);
      setZoneName(DEFAULT_ZONE.name);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZoneName("Tu ubicación");
        setLoading(false);
      },
      () => {
        // Permission denied or unavailable — use random Bogotá zone
        const zone = BOGOTA_ZONES[Math.floor(Math.random() * BOGOTA_ZONES.length)];
        setPosition(zone);
        setZoneName(zone.name);
        setError("Usando ubicación aproximada");
        setLoading(false);
      },
      { timeout: 6000, maximumAge: 60000 }
    );
  }, []);

  return { position, zoneName, loading, error };
}

/** Given a client position, generate N walker positions within ~300–900m */
export function nearbyWalkerPositions(clientPos: Coord, count = 5): Coord[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
    const dist = 0.003 + Math.random() * 0.005; // ~300–900m in degrees
    return {
      lat: clientPos.lat + Math.sin(angle) * dist,
      lng: clientPos.lng + Math.cos(angle) * dist,
    };
  });
}
