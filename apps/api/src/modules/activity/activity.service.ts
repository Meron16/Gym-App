import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekBookings = await this.prisma.booking.count({
      where: {
        userId,
        status: "confirmed",
        createdAt: { gte: startOfWeek },
      },
    });
    const totalBookings = await this.prisma.booking.count({
      where: {
        userId,
        status: "confirmed",
      },
    });

    const streak = Math.max(0, Math.min(60, totalBookings));
    const sessionsThisWeek = weekBookings;

    return {
      userId,
      streakDays: streak,
      sessionsThisWeek,
      badges: ["First Step", "Week Warrior"],
      leaderboardPreview: [
        { rank: 1, name: "You", points: 1000 + totalBookings * 20 },
        { rank: 2, name: "Teammate A", points: 980 },
        { rank: 3, name: "Teammate B", points: 870 },
      ],
    };
  }
}
