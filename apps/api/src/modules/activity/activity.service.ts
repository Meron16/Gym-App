import { Injectable } from "@nestjs/common";

@Injectable()
export class ActivityService {
  summary(userId: string) {
    const seed = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const streak = 3 + (seed % 12);
    const sessionsThisWeek = 2 + (seed % 5);
    return {
      userId,
      streakDays: streak,
      sessionsThisWeek,
      badges: ["First Step", "Week Warrior"],
      leaderboardPreview: [
        { rank: 1, name: "You", points: 1200 + (seed % 200) },
        { rank: 2, name: "Teammate A", points: 980 },
        { rank: 3, name: "Teammate B", points: 870 },
      ],
    };
  }
}
