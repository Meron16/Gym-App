export interface PackageDto {
  id: string;
  name: string;
  billing: "daily" | "weekly" | "monthly" | "annual";
  price: string;
  highlights: string[];
  bookingEntitlement: {
    maxSessionsPerWeek: number;
  };
}

export interface PackagesResponseDto {
  packages: PackageDto[];
  activePackageId?: string;
}

