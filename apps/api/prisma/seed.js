const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const gyms = [
  {
    name: "Addis Prime Fitness",
    location: "Bole, Addis Ababa",
    address: "Bole Road, Addis Ababa",
    rating: 4.7,
    priceFrom: "$30",
    tag: "Strength",
    capacityBase: 72,
    lat: 8.9982,
    lng: 38.7869,
    amenities: ["Cardio", "Free weights", "Sauna", "Locker rooms"],
    operatingHours: [
      { day: "Mon", open: "06:00", close: "22:00" },
      { day: "Tue", open: "06:00", close: "22:00" },
      { day: "Wed", open: "06:00", close: "22:00" },
      { day: "Thu", open: "06:00", close: "22:00" },
      { day: "Fri", open: "06:00", close: "23:00" },
      { day: "Sat", open: "07:00", close: "21:00" },
      { day: "Sun", open: "08:00", close: "20:00" },
    ],
    photos: [{ url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" }],
    osmType: "seed",
    osmId: "seed_addis_prime",
  },
  {
    name: "Pulse Zone Club",
    location: "Kazanchis, Addis Ababa",
    address: "Kazanchis, Addis Ababa",
    rating: 4.5,
    priceFrom: "$24",
    tag: "Crossfit",
    capacityBase: 56,
    lat: 9.0207,
    lng: 38.7616,
    amenities: ["HIIT", "Functional training", "Showers"],
    operatingHours: [
      { day: "Mon", open: "06:30", close: "21:30" },
      { day: "Tue", open: "06:30", close: "21:30" },
      { day: "Wed", open: "06:30", close: "21:30" },
      { day: "Thu", open: "06:30", close: "21:30" },
      { day: "Fri", open: "06:30", close: "22:00" },
      { day: "Sat", open: "08:00", close: "20:00" },
      { day: "Sun", open: "09:00", close: "18:00" },
    ],
    photos: [{ url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80" }],
    osmType: "seed",
    osmId: "seed_pulse_zone",
  },
  {
    name: "Bishoftu Performance Hub",
    location: "Bishoftu",
    address: "Main Boulevard, Bishoftu",
    rating: 4.6,
    priceFrom: "$26",
    tag: "Performance",
    capacityBase: 61,
    lat: 8.7527,
    lng: 38.9784,
    amenities: ["Olympic lifting", "Spin", "Mobility studio"],
    operatingHours: [
      { day: "Mon", open: "06:00", close: "21:30" },
      { day: "Tue", open: "06:00", close: "21:30" },
      { day: "Wed", open: "06:00", close: "21:30" },
      { day: "Thu", open: "06:00", close: "21:30" },
      { day: "Fri", open: "06:00", close: "22:00" },
      { day: "Sat", open: "07:00", close: "20:00" },
      { day: "Sun", open: "08:00", close: "18:30" },
    ],
    photos: [{ url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80" }],
    osmType: "seed",
    osmId: "seed_bishoftu_hub",
  },
];

const packages = [
  {
    id: "daily",
    name: "Daily Pass",
    billing: "daily",
    priceCents: 500,
    maxSessions: 7,
    maxSessionsPerWeek: 7,
    highlights: ["1 session / day", "Priority slots", "Cancel anytime"],
  },
  {
    id: "weekly",
    name: "Weekly Elite",
    billing: "weekly",
    priceCents: 2500,
    maxSessions: 5,
    maxSessionsPerWeek: 5,
    highlights: ["5 sessions / week", "Trainer discounts", "Streak boosters"],
  },
  {
    id: "monthly",
    name: "Monthly Champion",
    billing: "monthly",
    priceCents: 8000,
    maxSessions: 24,
    maxSessionsPerWeek: 6,
    highlights: ["24 sessions / month", "Priority support", "Exclusive events"],
  },
];

async function main() {
  for (const gym of gyms) {
    await prisma.gym.upsert({
      where: { osmId: gym.osmId },
      update: gym,
      create: gym,
    });
  }

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
