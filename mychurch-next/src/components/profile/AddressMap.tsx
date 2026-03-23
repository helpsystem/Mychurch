"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  label?: string;
}

export default function AddressMap({ lat, lng, label }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      // Fix default marker icons in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([lat, lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      if (label) marker.bindPopup(label).openPopup();

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when lat/lng change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([lat, lng], 15);
  }, [lat, lng]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
