import { FoodLog } from '../types';
import { FOODS } from './foods';

export interface WeeklyChallenge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  target: number;
}

const CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'try-3-foods',
    emoji: '🌈',
    title: 'Try 3 different foods',
    description: 'Log any reaction for 3 distinct foods this week.',
    target: 3,
  },
  {
    id: 'one-veggie',
    emoji: '🥦',
    title: 'Offer one vegetable',
    description: 'Introduce any vegetable at any meal this week.',
    target: 1,
  },
  {
    id: 'repeat-a-food',
    emoji: '🔁',
    title: 'Repeat one food twice',
    description: 'Offer the same food at least twice this week — repetition builds familiarity.',
    target: 2,
  },
  {
    id: 'try-a-fruit',
    emoji: '🍓',
    title: 'Try one new fruit',
    description: 'Introduce any fruit your child hasn\'t fully mastered yet.',
    target: 1,
  },
  {
    id: 'five-logs',
    emoji: '📋',
    title: 'Log 5 mealtime reactions',
    description: 'Track what happened at 5 different meal slots this week.',
    target: 5,
  },
  {
    id: 'soft-food',
    emoji: '🥣',
    title: 'Offer one soft food',
    description: 'Introduce any soft-textured food this week.',
    target: 1,
  },
];

export function weekStartDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function getWeekChallenge(): WeeklyChallenge {
  const d = new Date();
  const weekNum = Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000);
  return CHALLENGES[weekNum % CHALLENGES.length];
}

export function computeChallengeProgress(challenge: WeeklyChallenge, weekLogs: FoodLog[]): number {
  switch (challenge.id) {
    case 'try-3-foods': {
      return new Set(weekLogs.map(l => l.foodId)).size;
    }
    case 'try-a-fruit': {
      const ids = new Set(weekLogs
        .filter(l => FOODS.find(f => f.id === l.foodId)?.category === 'fruit')
        .map(l => l.foodId));
      return ids.size;
    }
    case 'one-veggie': {
      return weekLogs.some(l => FOODS.find(f => f.id === l.foodId)?.category === 'vegetable') ? 1 : 0;
    }
    case 'repeat-a-food': {
      const counts: Record<string, number> = {};
      weekLogs.forEach(l => { counts[l.foodId] = (counts[l.foodId] ?? 0) + 1; });
      return Math.max(...Object.values(counts), 0);
    }
    case 'five-logs': {
      return weekLogs.length;
    }
    case 'soft-food': {
      return weekLogs.some(l => FOODS.find(f => f.id === l.foodId)?.texture === 'soft') ? 1 : 0;
    }
    default:
      return 0;
  }
}
