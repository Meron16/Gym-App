export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  unlocked: (ctx: {
    streak: number;
    totalWorkouts: number;
    weekWorkouts: number;
  }) => boolean;
}

/** Fixed catalog — UI shows locked vs unlocked from these rules */
export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Log your first workout',
    unlocked: ({ totalWorkouts }) => totalWorkouts >= 1,
  },
  {
    id: 'on_fire',
    title: 'On Fire',
    description: '3+ day streak',
    unlocked: ({ streak }) => streak >= 3,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: '7 day streak',
    unlocked: ({ streak }) => streak >= 7,
  },
  {
    id: 'volume_king',
    title: 'Volume King',
    description: '5+ workouts this week',
    unlocked: ({ weekWorkouts }) => weekWorkouts >= 5,
  },
  {
    id: 'committed',
    title: 'Committed',
    description: '20 lifetime workouts',
    unlocked: ({ totalWorkouts }) => totalWorkouts >= 20,
  },
  {
    id: 'iron_pulse',
    title: 'Iron Pulse',
    description: '10 day streak',
    unlocked: ({ streak }) => streak >= 10,
  },
];
