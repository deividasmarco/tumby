import { ReactionType } from '../types';

export const COLORS = {
  cream: '#FFF8F0',
  warm: '#FFF0DC',
  orange: '#FF6B35',
  orangeD: '#E85420',
  orangePale: '#FFE8DC',
  orangeMid: '#FFC4A8',
  green: '#4CAF50',
  greenD: '#3D8C40',
  greenPale: '#E5F5E6',
  yellow: '#FFC233',
  yellowPale: '#FFF6E0',
  red: '#FF6B6B',
  redPale: '#FFE5E5',
  blue: '#3B82F6',
  bluePale: '#E6F0FF',
  text: '#241808',
  text2: '#6B5344',
  text3: '#A8927F',
  border: '#F2E2D6',
  white: '#FFFFFF',
};

export const CATEGORY_BG: Record<string, string> = {
  vegetable: '#E5F5E6',
  fruit: '#FFE8DC',
  protein: '#FFE5E5',
  grain: '#FFF6E0',
  dairy: '#E6F0FF',
};

export const CATEGORY_COLOR: Record<string, string> = {
  vegetable: '#4CAF50',
  fruit: '#FF6B35',
  protein: '#FF6B6B',
  grain: '#D97706',
  dairy: '#3B82F6',
};

export const RADIUS = { sm: 14, md: 18, lg: 22, xl: 28, full: 999 };

export const SHADOW = {
  card: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  big: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
  get small() { return this.card; },
  get medium() { return this.big; },
};

export const REACTION_XP: Record<ReactionType, number> = {
  refused: 2,
  licked: 5,
  bit: 8,
  ate: 12,
  loved: 20,
};

export const REACTION_RANK: Record<ReactionType, number> = {
  refused: 0,
  licked: 1,
  bit: 2,
  ate: 3,
  loved: 4,
};

export const REACTION_META: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  refused: { emoji: '😤', label: 'Refused', color: '#A8927F' },
  licked: { emoji: '👅', label: 'Licked', color: '#FFC233' },
  bit: { emoji: '😬', label: 'Took a bite', color: '#FF9F43' },
  ate: { emoji: '😊', label: 'Ate some', color: '#7BC67E' },
  loved: { emoji: '😍', label: 'Loved it!', color: '#4CAF50' },
};

export const REACTION_ORDER: ReactionType[] = ['refused', 'licked', 'bit', 'ate', 'loved'];

export interface BuddyStage {
  name: string;
  emoji: string;
  minXP: number;
}

export const BUDDY_STAGES: BuddyStage[] = [
  { name: 'Egg', emoji: '🥚', minXP: 0 },
  { name: 'Hatchling', emoji: '🐣', minXP: 50 },
  { name: 'Chick', emoji: '🐤', minXP: 150 },
  { name: 'Chicken', emoji: '🐔', minXP: 400 },
  { name: 'Golden Hen', emoji: '🌟', minXP: 1000 },
];

export function stageForXP(xp: number): { stage: BuddyStage; index: number; next: BuddyStage | null } {
  let index = 0;
  for (let i = 0; i < BUDDY_STAGES.length; i++) {
    if (xp >= BUDDY_STAGES[i].minXP) index = i;
  }
  const stage = BUDDY_STAGES[index];
  const next = BUDDY_STAGES[index + 1] ?? null;
  return { stage, index, next };
}

export const PRAISE_LINES = [
  "You're an amazing parent!",
  'Look at you go!',
  'Tiny steps, big wins!',
  "You showed up — that's everything",
  'Future veggie-lover incoming!',
  'Calm parent, brave kid 😊',
  "That's how habits are built!",
];

export const MEAL_META: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  midMorningSnack: { label: 'Mid-morning snack', emoji: '🍎' },
  lunch: { label: 'Lunch', emoji: '☀️' },
  afternoonSnack: { label: 'Afternoon snack', emoji: '🍪' },
  dinner: { label: 'Dinner', emoji: '🌙' },
};

export const MEAL_ORDER = ['breakfast', 'midMorningSnack', 'lunch', 'afternoonSnack', 'dinner'] as const;
