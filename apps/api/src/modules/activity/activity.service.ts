import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BADGE_CATALOG } from './badge-catalog';

function isoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysUtc(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function streakFromWorkoutDays(daysWithWorkout: Set<string>): number {
  const today = isoDateUTC(new Date());
  let anchor = new Date();
  anchor.setUTCHours(12, 0, 0, 0);
  if (!daysWithWorkout.has(today)) {
    anchor = addDaysUtc(anchor, -1);
  }
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const key = isoDateUTC(anchor);
    if (daysWithWorkout.has(key)) {
      streak++;
      anchor = addDaysUtc(anchor, -1);
    } else {
      break;
    }
  }
  return streak;
}

function last7DayCountsUtc(
  workouts: { createdAt: Date }[],
  now: Date,
): number[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(isoDateUTC(addDaysUtc(now, -i)));
  }
  const counts: number[] = Array.from({ length: 7 }, () => 0);
  const keyToIndex = new Map<string, number>();
  keys.forEach((k, i) => keyToIndex.set(k, i));
  for (const w of workouts) {
    const k = w.createdAt.toISOString().slice(0, 10);
    const idx = keyToIndex.get(k);
    if (idx !== undefined) counts[idx] += 1;
  }
  return counts;
}

function buildBadgeShelf(
  streak: number,
  totalWorkouts: number,
  weekWorkouts: number,
) {
  const ctx = { streak, totalWorkouts, weekWorkouts };
  return BADGE_CATALOG.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    unlocked: b.unlocked(ctx),
  }));
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async logWorkout(
    userId: string,
    body: {
      kind?: string;
      durationMinutes?: number;
      caloriesEstimate?: number;
    },
  ) {
    return this.prisma.workoutEvent.create({
      data: {
        userId,
        kind: body.kind?.trim() || 'workout',
        durationMinutes:
          typeof body.durationMinutes === 'number' &&
          Number.isFinite(body.durationMinutes)
            ? Math.max(0, Math.round(body.durationMinutes))
            : null,
        caloriesEstimate:
          typeof body.caloriesEstimate === 'number' &&
          Number.isFinite(body.caloriesEstimate)
            ? Math.max(0, Math.round(body.caloriesEstimate))
            : null,
      },
    });
  }

  async summary(userId: string) {
    const now = new Date();
    const sinceWeek = addDaysUtc(now, -7);

    const workouts = await this.prisma.workoutEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 800,
    });

    const daysSet = new Set<string>();
    for (const w of workouts) {
      daysSet.add(w.createdAt.toISOString().slice(0, 10));
    }
    const streakDays = streakFromWorkoutDays(daysSet);

    const weekWorkouts = workouts.filter(
      (w) => w.createdAt >= sinceWeek,
    ).length;
    const totalWorkouts = workouts.length;

    const weeklyCounts = last7DayCountsUtc(workouts, now);
    const maxC = Math.max(1, ...weeklyCounts);
    const weeklyBars = weeklyCounts.map((c) => Math.min(1, c / maxC));

    const gymSessions = await this.prisma.booking.count({
      where: { userId, status: 'confirmed', createdAt: { gte: sinceWeek } },
    });

    const badgeShelf = buildBadgeShelf(streakDays, totalWorkouts, weekWorkouts);
    const badgesUnlocked = badgeShelf
      .filter((b) => b.unlocked)
      .map((b) => b.title);

    const leaderboardPreview = await this.leaderboardPreview(userId);

    return {
      userId,
      streakDays,
      sessionsThisWeek: weekWorkouts,
      gymSessionsThisWeek: gymSessions,
      weeklyBars,
      weeklyCounts,
      weeklyLabels: (() => {
        const labels: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = addDaysUtc(now, -i);
          labels.push(
            d.toLocaleDateString('en-US', {
              weekday: 'short',
              timeZone: 'UTC',
            }),
          );
        }
        return labels;
      })(),
      badges: badgesUnlocked,
      badgeShelf,
      leaderboardPreview,
      totalWorkouts,
      stats: {
        avgHeartRate: 68 + (streakDays % 9),
        stepsEstimate: 7200 + totalWorkouts * 220 + weekWorkouts * 40,
        sleepHours: Math.min(8.5, 6.8 + (totalWorkouts % 5) * 0.08),
        hydrationLiters: Math.min(3.5, 1.9 + totalWorkouts * 0.03),
      },
    };
  }

  private async leaderboardPreview(currentUserId: string) {
    const since = addDaysUtc(new Date(), -30);
    since.setUTCHours(0, 0, 0, 0);
    const grouped = await this.prisma.workoutEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });
    const sortedAll = grouped.sort((a, b) => b._count.id - a._count.id);
    const sorted = sortedAll.slice(0, 8);
    const users = await this.prisma.user.findMany({
      where: { id: { in: sorted.map((s) => s.userId) } },
      select: { id: true, displayName: true, email: true },
    });
    const nameById = new Map(
      users.map((u) => [
        u.id,
        u.displayName?.trim() || u.email?.split('@')[0] || 'Athlete',
      ]),
    );
    const rows = sorted.map((row, i) => ({
      rank: i + 1,
      name: nameById.get(row.userId) ?? 'Athlete',
      points: 800 + row._count.id * 45,
      isYou: row.userId === currentUserId,
    }));
    const yourIndex = sortedAll.findIndex((r) => r.userId === currentUserId);
    const yourRank = yourIndex >= 0 ? yourIndex + 1 : null;
    const yourPoints =
      yourIndex >= 0 ? 800 + sortedAll[yourIndex]._count.id * 45 : null;
    return { rows, yourRank, yourPoints };
  }
}
