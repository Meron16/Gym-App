import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GymDetailDto, GymSearchQueryDto, GymSummaryDto } from './dto';
import {
  bboxForLocationQuery,
  fetchFitnessPlacesFromOSM,
} from './osm-overpass';

function capacityPercentForNow(base: number): number {
  const d = new Date();
  const t = d.getHours() + d.getDate() * 3;
  const wiggle = (t % 17) - 8;
  return Math.max(8, Math.min(98, base + wiggle));
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371; // earth radius in km
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

const DEFAULT_AMENITIES = ['Cardio', 'Free weights', 'Showers', 'Lockers'];
const DEFAULT_HOURS: { day: string; open: string; close: string }[] = [
  { day: 'Mon', open: '06:00', close: '22:00' },
  { day: 'Tue', open: '06:00', close: '22:00' },
  { day: 'Wed', open: '06:00', close: '22:00' },
  { day: 'Thu', open: '06:00', close: '22:00' },
  { day: 'Fri', open: '06:00', close: '23:00' },
  { day: 'Sat', open: '08:00', close: '20:00' },
  { day: 'Sun', open: '09:00', close: '18:00' },
];
const DEFAULT_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  },
];

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  private capacityPercent(base: number): `${number}%` {
    return `${capacityPercentForNow(base)}%`;
  }

  private toSummary(row: {
    id: string;
    name: string;
    location: string;
    rating: number;
    priceFrom: string;
    tag: string;
    capacityBase: number;
    lat: number;
    lng: number;
  }): GymSummaryDto {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      rating: row.rating,
      priceFrom: row.priceFrom,
      lat: row.lat,
      lng: row.lng,
      capacityPercent: this.capacityPercent(row.capacityBase),
      tag: row.tag,
    };
  }

  async search(query: GymSearchQueryDto): Promise<GymSummaryDto[]> {
    const q = (query?.q ?? '').toLowerCase().trim();
    const location = (query?.location ?? '').toLowerCase().trim();
    const facility = (query?.facility ?? '').toLowerCase().trim();
    const lat = query?.lat != null ? Number(query.lat) : NaN;
    const lng = query?.lng != null ? Number(query.lng) : NaN;
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
    const radiusKm =
      query?.radiusKm != null && Number.isFinite(Number(query.radiusKm))
        ? Math.max(1, Math.min(100, Number(query.radiusKm)))
        : 25;
    const rows = await this.prisma.gym.findMany({
      orderBy: { rating: 'desc' },
    });
    const filtered = rows
      .filter((row) => {
        const amenities = Array.isArray(row.amenities) ? row.amenities : [];
        const matchesQ =
          !q ||
          row.name.toLowerCase().includes(q) ||
          row.tag.toLowerCase().includes(q);
        const matchesLoc =
          !location || row.location.toLowerCase().includes(location);
        const matchesFac =
          !facility ||
          amenities.some(
            (a): boolean =>
              typeof a === 'string' && a.toLowerCase().includes(facility),
          );
        if (!matchesQ || !matchesLoc || !matchesFac) return false;
        if (!hasGeo) return true;
        return haversineKm(lat, lng, row.lat, row.lng) <= radiusKm;
      })
      .map((row) => ({
        row,
        distanceKm: hasGeo
          ? haversineKm(lat, lng, row.lat, row.lng)
          : Number.POSITIVE_INFINITY,
      }));

    if (hasGeo) {
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return filtered.map(({ row }) => this.toSummary(row));
  }

  async detail(id: string): Promise<GymDetailDto> {
    const row = await this.prisma.gym.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Gym not found');
    }
    return {
      ...this.toSummary(row),
      address: row.address,
      amenities: (Array.isArray(row.amenities)
        ? row.amenities
        : []) as string[],
      operatingHours: (Array.isArray(row.operatingHours)
        ? row.operatingHours
        : []) as {
        day: string;
        open: string;
        close: string;
      }[],
      photos: (Array.isArray(row.photos) ? row.photos : []) as {
        url: string;
      }[],
    };
  }

  /**
   * Pull fitness venues from OpenStreetMap (Overpass) for the bbox implied by `locationQuery`,
   * then upsert into Postgres by stable `osmId` = `${type}_${osmElementId}`.
   */
  async syncOsmVenues(
    locationQuery?: string,
  ): Promise<{ locationQuery: string; upserted: number }> {
    const loc = (locationQuery ?? 'Addis Ababa, Ethiopia').trim();
    const bbox = bboxForLocationQuery(loc);
    const elements = await fetchFitnessPlacesFromOSM(bbox);
    let upserted = 0;

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      const tags = el.tags ?? {};
      const name = tags['name'] ?? tags['name:en'] ?? 'Gym';
      const addrCity = tags['addr:city'] ?? '';
      const addrStreet = tags['addr:street'] ?? '';
      const address = [addrStreet, addrCity].filter(Boolean).join(', ') || loc;
      const tag =
        tags['leisure'] ?? tags['amenity'] ?? tags['sport'] ?? 'Fitness';
      const stable = `${el.type}_${el.id}`;
      const capacityBase =
        35 + (hashString(`${el.type}_${el.id}_${name}`) % 60);
      const rating = 4.2 + (hashString(name) % 40) / 100;

      await this.prisma.gym.upsert({
        where: { osmId: stable },
        create: {
          name,
          location: address,
          address,
          rating,
          priceFrom: '$—',
          tag: String(tag),
          capacityBase,
          lat,
          lng: lng,
          amenities: [...DEFAULT_AMENITIES],
          operatingHours: DEFAULT_HOURS.map((h) => ({ ...h })),
          photos: [...DEFAULT_PHOTOS],
          osmType: el.type,
          osmId: stable,
        },
        update: {
          name,
          location: address,
          address,
          rating,
          tag: String(tag),
          capacityBase,
          lat,
          lng: lng,
          osmType: el.type,
        },
      });
      upserted += 1;
    }

    return { locationQuery: loc, upserted };
  }
}
