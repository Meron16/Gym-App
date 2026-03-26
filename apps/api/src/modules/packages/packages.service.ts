import { Injectable } from "@nestjs/common";
import { PackageDto, PackagesResponseDto } from "./dto";

const packages: PackageDto[] = [
  {
    id: "daily",
    name: "Daily Pass",
    billing: "daily",
    price: "$5",
    highlights: ["1 session / day", "Priority slots", "Cancel anytime"],
    bookingEntitlement: { maxSessionsPerWeek: 7 },
  },
  {
    id: "weekly",
    name: "Weekly Elite",
    billing: "weekly",
    price: "$25",
    highlights: ["5 sessions / week", "Trainer discounts", "Streak boosters"],
    bookingEntitlement: { maxSessionsPerWeek: 5 },
  },
  {
    id: "monthly",
    name: "Monthly Champion",
    billing: "monthly",
    price: "$80",
    highlights: ["20 sessions / month", "Free check-in QR", "Exclusive events"],
    bookingEntitlement: { maxSessionsPerWeek: 6 },
  },
];

@Injectable()
export class PackagesService {
  list(): PackagesResponseDto {
    // MVP: pretend active subscription exists for every logged user later.
    return { packages, activePackageId: packages[1]?.id };
  }
}

