"use client";

import React, { useState, useRef, useCallback } from "react";
import { MapPin, Navigation, X, Search, Loader2, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface AddressData {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
}

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  geometry: { coordinates: [number, number] };
}

interface Props {
  value: AddressData;
  onChange: (data: AddressData) => void;
}

// ─── Proxy search ────────────────────────────────────────────────────────────
async function searchPhoton(query: string): Promise<PhotonFeature[]> {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}&lang=en`);
    const data = await res.json();
    return data.features || [];
  } catch {
    return [];
  }
}

function featureToAddress(f: PhotonFeature): AddressData {
  const p = f.properties;
  const houseNum = p.housenumber ? `${p.housenumber} ` : "";
  const street = p.street || p.name || "";
  return {
    address_line1: `${houseNum}${street}`.trim(),
    address_line2: "",
    city: p.city || "",
    state: p.state || "",
    country: p.country || "",
    postal_code: p.postcode || "",
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  };
}

interface MapProps { lat: number; lng: number; label?: string; }
const AddressMap = dynamic<MapProps>(
  () => import("./AddressMap").then(mod => mod.default),
  { ssr: false }
);

// ─── Shared input class ──────────────────────────────────────────────────────
const inputCls = "w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground";
const labelCls = "block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1.5";

// ─── Main Component ──────────────────────────────────────────────────────────
export function AddressAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPhoton(q);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } finally { setIsSearching(false); }
    }, 400);
  }, []);

  const handleSelect = (feature: PhotonFeature) => {
    const addr = featureToAddress(feature);
    onChange(addr);
    setQuery(addr.address_line1 || addr.city || "");
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMap(true);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { alert("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند"); return; }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`
          );
          const data = await res.json();
          const addr = data.address;
          const line1 = [addr.house_number, addr.road || addr.pedestrian || addr.footway]
            .filter(Boolean).join(" ");
          onChange({
            address_line1: line1,
            address_line2: "",
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || addr.province || "",
            country: addr.country || "",
            postal_code: addr.postcode || "",
            lat, lng,
          });
          setQuery(line1 || addr.city || "");
          setShowMap(true);
        } catch { alert("خطا در دریافت آدرس"); }
        finally { setIsGeolocating(false); }
      },
      () => { alert("دسترسی به موقعیت رد شد"); setIsGeolocating(false); }
    );
  };

  const clearAddress = () => {
    onChange({ address_line1: "", address_line2: "", city: "", state: "", country: "", postal_code: "", lat: null, lng: null });
    setQuery(""); setSuggestions([]); setShowSuggestions(false); setShowMap(false);
  };

  const handleFieldChange = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-5">

      {/* ── Search Bar ── */}
      <div className="relative">
        <div className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors",
          "bg-secondary border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20"
        )}>
          <Search className="w-4 h-4 text-primary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="جستجوی آدرس... (حداقل ۳ حرف)"
            className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
            aria-label="جستجوی آدرس"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
          {query && !isSearching && (
            <button onClick={clearAddress} title="پاک کردن" className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {suggestions.map((f, i) => {
              const p = f.properties;
              const label = [
                p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street || p.name,
                p.city, p.country
              ].filter(Boolean).join(", ");
              return (
                <button
                  key={i}
                  onMouseDown={() => handleSelect(f)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-start gap-3 border-b border-border last:border-0"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{label || "آدرس"}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={isGeolocating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 text-xs font-bold transition-all disabled:opacity-50"
        >
          {isGeolocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          موقعیت فعلی من
        </button>
        {value.lat && (
          <button
            type="button"
            onClick={() => setShowMap(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
          >
            <MapPin className="w-3.5 h-3.5" />
            {showMap ? "پنهان کردن نقشه" : "نمایش روی نقشه"}
          </button>
        )}
      </div>

      {/* ── Leaflet Map ── */}
      {showMap && value.lat && value.lng && (
        <div className="rounded-2xl overflow-hidden border border-border h-48 shadow-sm">
          <AddressMap lat={value.lat} lng={value.lng} label={value.address_line1} />
        </div>
      )}

      {/* ── Structured Fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="address_line1" className={labelCls}>خیابان / آدرس خط اول</label>
          <input id="address_line1" type="text" value={value.address_line1}
            onChange={e => handleFieldChange("address_line1", e.target.value)}
            placeholder="مثال: 123 Main Street" dir="ltr" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address_line2" className={labelCls}>آدرس خط دوم (اختیاری)</label>
          <input id="address_line2" type="text" value={value.address_line2}
            onChange={e => handleFieldChange("address_line2", e.target.value)}
            placeholder="مثال: Apt 4B, Suite 100" dir="ltr" className={inputCls} />
        </div>
        <div>
          <label htmlFor="addr-city" className={labelCls}>شهر</label>
          <input id="addr-city" type="text" value={value.city}
            onChange={e => handleFieldChange("city", e.target.value)}
            placeholder="City" dir="ltr" className={inputCls} />
        </div>
        <div>
          <label htmlFor="addr-state" className={labelCls}>استان / ایالت</label>
          <input id="addr-state" type="text" value={value.state}
            onChange={e => handleFieldChange("state", e.target.value)}
            placeholder="State / Province" dir="ltr" className={inputCls} />
        </div>
        <div>
          <label htmlFor="addr-country" className={labelCls}>کشور</label>
          <input id="addr-country" type="text" value={value.country}
            onChange={e => handleFieldChange("country", e.target.value)}
            placeholder="Country" dir="ltr" className={inputCls} />
        </div>
        <div>
          <label htmlFor="addr-postal" className={labelCls}>کد پستی</label>
          <input id="addr-postal" type="text" value={value.postal_code}
            onChange={e => handleFieldChange("postal_code", e.target.value)}
            placeholder="ZIP / Postal Code" dir="ltr" className={inputCls} />
        </div>
      </div>

      {/* Coordinates badge */}
      {value.lat && value.lng && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
          <Check className="w-3.5 h-3.5 shrink-0" />
          مختصات ثبت شد: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}
