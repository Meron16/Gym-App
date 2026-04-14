export interface GymSummaryDto {
  id: string;
  name: string;
  location: string;
  rating: number;
  priceFrom: string;
  lat: number;
  lng: number;
  capacityPercent: `${number}%`;
  tag: string;
}

export interface GymDetailDto extends GymSummaryDto {
  address: string;
  amenities: string[];
  operatingHours: { day: string; open: string; close: string }[];
  photos: { url: string }[];
}

export interface GymSearchQueryDto {
  q?: string;
  location?: string;
  facility?: string;
  /** Current user latitude for nearest sorting/filtering. */
  lat?: number;
  /** Current user longitude for nearest sorting/filtering. */
  lng?: number;
  /** Optional radius filter in kilometers when lat/lng are provided. */
  radiusKm?: number;
}

