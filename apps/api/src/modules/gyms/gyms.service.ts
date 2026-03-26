import { Injectable } from "@nestjs/common";
import { GymDetailDto, GymSearchQueryDto, GymSummaryDto } from "./dto";

const gyms: Array<{
  id: string;
  name: string;
  location: string;
  rating: number;
  priceFrom: string;
  capacityPercentBase: number;
  tag: string;
  lat: number;
  lng: number;
  address: string;
  amenities: string[];
  operatingHours: { day: string; open: string; close: string }[];
  photos: { url: string }[];
}> = [
  {
    id: "iron-sanctuary",
    name: "Iron Sanctuary",
    location: "Bole, Addis Ababa",
    rating: 4.7,
    priceFrom: "$30",
    capacityPercentBase: 82,
    tag: "Elite Status",
    lat: 8.9724,
    lng: 38.8016,
    address: "Bole Road, Addis Ababa",
    amenities: ["Strength area", "Cardio zone", "Sauna"],
    operatingHours: [
      { day: "Mon", open: "06:00", close: "22:00" },
      { day: "Tue", open: "06:00", close: "22:00" },
      { day: "Wed", open: "06:00", close: "22:00" },
      { day: "Thu", open: "06:00", close: "22:00" },
      { day: "Fri", open: "06:00", close: "23:00" },
      { day: "Sat", open: "08:00", close: "20:00" },
      { day: "Sun", open: "09:00", close: "18:00" },
    ],
    photos: [{ url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    id: "pulse-studio",
    name: "Pulse Studio",
    location: "Mexico Square, Addis",
    rating: 4.4,
    priceFrom: "$20",
    capacityPercentBase: 35,
    tag: "Power Zone",
    lat: 8.9972,
    lng: 38.7611,
    address: "Mexico Square, Addis Ababa",
    amenities: ["HIIT classes", "Functional training", "Recovery lounge"],
    operatingHours: [
      { day: "Mon", open: "07:00", close: "21:00" },
      { day: "Tue", open: "07:00", close: "21:00" },
      { day: "Wed", open: "07:00", close: "21:00" },
      { day: "Thu", open: "07:00", close: "21:00" },
      { day: "Fri", open: "07:00", close: "22:00" },
      { day: "Sat", open: "09:00", close: "19:00" },
      { day: "Sun", open: "10:00", close: "18:00" },
    ],
    photos: [{ url: "https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80" }],
  },
  {
    id: "atlas-arena",
    name: "Atlas Arena",
    location: "Bishoftu",
    rating: 4.6,
    priceFrom: "$25",
    capacityPercentBase: 58,
    tag: "Performance Lab",
    lat: 8.7526,
    lng: 38.9610,
    address: "Main Blvd, Bishoftu",
    amenities: ["Olympic lifting", "Spin studio", "Physio room"],
    operatingHours: [
      { day: "Mon", open: "06:30", close: "21:30" },
      { day: "Tue", open: "06:30", close: "21:30" },
      { day: "Wed", open: "06:30", close: "21:30" },
      { day: "Thu", open: "06:30", close: "21:30" },
      { day: "Fri", open: "06:30", close: "22:00" },
      { day: "Sat", open: "08:00", close: "20:00" },
      { day: "Sun", open: "09:00", close: "18:30" },
    ],
    photos: [{ url: "https://images.unsplash.com/photo-1549576490-b0f6c6b2c9d0?auto=format&fit=crop&w=1200&q=80" }],
  },
];

function capacityPercentForNow(base: number): number {
  // Deterministic pseudo-variation (so capacity changes, but is stable per day/hour).
  const d = new Date();
  const t = d.getHours() + d.getDate() * 3;
  const wiggle = (t % 17) - 8; // -8..+8
  return Math.max(8, Math.min(98, base + wiggle));
}

type BBox = { south: number; north: number; west: number; east: number };

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const ETHIOPIA_BBOX: BBox = { south: 3.3, north: 14.9, west: 33.0, east: 48.1 };
const ADDIS_BBOX: BBox = { south: 8.83, north: 9.10, west: 38.62, east: 38.92 };
const BISHOFTU_BBOX: BBox = { south: 8.70, north: 8.83, west: 38.90, east: 39.05 };

function bboxForLocation(locationQuery: string): BBox {
  const q = locationQuery.toLowerCase();
  if (q.includes("addis")) return ADDIS_BBOX;
  if (q.includes("bishoftu") || q.includes("debre zeit") || q.includes("debrezeit")) return BISHOFTU_BBOX;
  if (q.includes("ethiopia") || q.includes("et")) return ETHIOPIA_BBOX;
  // Default to Addis for MVP (best density of places).
  return ADDIS_BBOX;
}

async function fetchOverpassWithRetry(query: string): Promise<any[] | null> {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  // Keep this fast: we must not block the API for long.
  // Total budget ~10s, then fallback to mock data.
  for (let attempt = 0; attempt < 1; attempt++) {
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "User-Agent": "gym-mvp/1.0 (contact: dev@example.com)",
          },
          body: query,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) continue;
        const json = (await res.json()) as { elements?: any[] };
        if (Array.isArray(json.elements)) return json.elements;
      } catch {
        // try next endpoint/attempt
      }
    }
  }
  return null;
}

const osmCache = new Map<string, { at: number; elements: any[] }>();
const OSM_CACHE_MS = 5 * 60 * 1000;

async function fetchFitnessPlacesFromOSM(bbox: BBox): Promise<
  Array<{
    id: number;
    type: "node" | "way" | "relation";
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>
> {
  const cacheKey = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const cached = osmCache.get(cacheKey);
  if (cached && Date.now() - cached.at < OSM_CACHE_MS) {
    return cached.elements.map((el) => ({
      id: el.id,
      type: el.type,
      lat: el.lat,
      lon: el.lon,
      center: el.center,
      tags: el.tags,
    }));
  }

  const overpass = `
  [out:json][timeout:25];
  (
    node["amenity"="gym"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["amenity"="gym"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    relation["amenity"="gym"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

    node["leisure"="fitness_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["leisure"="fitness_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    relation["leisure"="fitness_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

    node["sport"="fitness"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["sport"="fitness"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    relation["sport"="fitness"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  );
  out center tags;
  `;

  const elements = await fetchOverpassWithRetry(overpass);
  if (!elements) return [];

  osmCache.set(cacheKey, { at: Date.now(), elements });

  return elements.map((el) => ({
    id: el.id,
    type: el.type,
    lat: el.lat,
    lon: el.lon,
    center: el.center,
    tags: el.tags,
  }));
}

@Injectable()
export class GymsService {
  async search(query: GymSearchQueryDto): Promise<GymSummaryDto[]> {
    const q = (query?.q ?? "").toLowerCase().trim();
    const location = (query?.location ?? "").toLowerCase().trim();
    const facility = (query?.facility ?? "").toLowerCase().trim();

    // MVP “real places” mode:
    // 1) OpenStreetMap/Overpass (no key)
    // If anything fails, we fallback to deterministic mock data.
    try {
      const locForBBox = location ? location : "Addis Ababa, Ethiopia";
      const bbox = bboxForLocation(locForBBox);
      const elements = await fetchFitnessPlacesFromOSM(bbox);

      const mapped: GymSummaryDto[] = elements
        .map((el) => {
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (typeof lat !== "number" || typeof lng !== "number") return null;
          const tags = el.tags ?? {};

          const name = tags["name"] ?? tags["name:en"] ?? "Gym";
          const addrCity = tags["addr:city"] ?? "";
          const addrStreet = tags["addr:street"] ?? "";
          const address = [addrStreet, addrCity].filter(Boolean).join(", ") || locForBBox;

          const matchesQ =
            !q || name.toLowerCase().includes(q) || (tags["sport"] ?? "").toLowerCase().includes(q);
          const matchesFac =
            !facility || name.toLowerCase().includes(facility) || address.toLowerCase().includes(facility);
          if (!matchesQ || !matchesFac) return null;

          const base = 35 + (hashString(`${el.type}_${el.id}_${name}`) % 60);
          const cap = capacityPercentForNow(base);
          const tag = tags["leisure"] ?? tags["amenity"] ?? tags["sport"] ?? "Fitness";

          return {
            id: `osm_${el.type}_${el.id}`,
            name,
            location: address,
            rating: 4.2 + ((hashString(name) % 40) / 100), // 4.2..4.6
            priceFrom: "$—",
            lat,
            lng,
            capacityPercent: `${cap}%` as `${number}%`,
            tag,
          } satisfies GymSummaryDto;
        })
        .filter(Boolean) as GymSummaryDto[];

      if (mapped.length) return mapped.sort((a, b) => b.rating - a.rating);
    } catch {
      // ignore and fallback
    }

    // Fallback: deterministic mock data (always works).
    const filtered = gyms.filter((g) => {
      const matchesQ = !q || g.name.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q);
      const matchesLoc = !location || g.location.toLowerCase().includes(location);
      const matchesFac = !facility || g.amenities.some((a) => a.toLowerCase().includes(facility));
      return matchesQ && matchesLoc && matchesFac;
    });

    return filtered
      .map((g) => ({
        id: g.id,
        name: g.name,
        location: g.location,
        rating: g.rating,
        priceFrom: g.priceFrom,
        lat: g.lat,
        lng: g.lng,
        capacityPercent: `${capacityPercentForNow(g.capacityPercentBase)}%` as `${number}%`,
        tag: g.tag,
      }))
      .sort((a, b) => b.rating - a.rating);
  }

  detail(id: string): GymDetailDto {
    const gym = gyms.find((g) => g.id === id);
    const fallback = gyms[0];
    const selected = gym ?? fallback;

    return {
      id: selected.id,
      name: selected.name,
      location: selected.location,
      rating: selected.rating,
      priceFrom: selected.priceFrom,
      lat: selected.lat,
      lng: selected.lng,
      capacityPercent: `${capacityPercentForNow(selected.capacityPercentBase)}%` as `${number}%`,
      tag: selected.tag,
      address: selected.address,
      amenities: selected.amenities,
      operatingHours: selected.operatingHours,
      photos: selected.photos,
    };
  }
}

