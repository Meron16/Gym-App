export type BBox = { south: number; north: number; west: number; east: number };

export type OsmFitnessElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const ETHIOPIA_BBOX: BBox = { south: 3.3, north: 14.9, west: 33.0, east: 48.1 };
const ADDIS_BBOX: BBox = { south: 8.83, north: 9.1, west: 38.62, east: 38.92 };
const BISHOFTU_BBOX: BBox = { south: 8.7, north: 8.83, west: 38.9, east: 39.05 };

export function bboxForLocationQuery(locationQuery: string): BBox {
  const q = locationQuery.toLowerCase();
  if (q.includes("addis")) return ADDIS_BBOX;
  if (q.includes("bishoftu") || q.includes("debre zeit") || q.includes("debrezeit")) return BISHOFTU_BBOX;
  if (q.includes("ethiopia") || q.includes("et")) return ETHIOPIA_BBOX;
  return ADDIS_BBOX;
}

async function fetchOverpassWithRetry(query: string): Promise<unknown[] | null> {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "User-Agent": "gym-app/1.0",
        },
        body: query,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: unknown[] };
      if (Array.isArray(json.elements)) return json.elements;
    } catch {
      // try next mirror
    }
  }
  return null;
}

const osmCache = new Map<string, { at: number; elements: unknown[] }>();
const OSM_CACHE_MS = 5 * 60 * 1000;

export async function fetchFitnessPlacesFromOSM(bbox: BBox): Promise<OsmFitnessElement[]> {
  const cacheKey = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const cached = osmCache.get(cacheKey);
  if (cached && Date.now() - cached.at < OSM_CACHE_MS) {
    return normalizeElements(cached.elements);
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
  return normalizeElements(elements);
}

function normalizeElements(raw: unknown[]): OsmFitnessElement[] {
  return raw
    .map((el) => {
      const o = el as Record<string, unknown>;
      const id = typeof o.id === "number" ? o.id : Number(o.id);
      const type = o.type;
      if (!Number.isFinite(id) || (type !== "node" && type !== "way" && type !== "relation")) {
        return null;
      }
      const lat = typeof o.lat === "number" ? o.lat : undefined;
      const lon = typeof o.lon === "number" ? o.lon : undefined;
      const center = o.center as { lat?: number; lon?: number } | undefined;
      const tags = o.tags as Record<string, string> | undefined;
      return {
        id,
        type,
        lat,
        lon,
        center: center?.lat != null && center?.lon != null ? { lat: center.lat, lon: center.lon } : undefined,
        tags,
      } as OsmFitnessElement;
    })
    .filter(Boolean) as OsmFitnessElement[];
}
