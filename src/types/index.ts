export type MealType = 'breakfast' | 'midMorningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

export type ReactionType = 'refused' | 'licked' | 'bit' | 'ate' | 'loved';

export type FoodCategory = 'vegetable' | 'fruit' | 'protein' | 'grain' | 'dairy';

export type Texture = 'soft' | 'crunchy' | 'mushy' | 'mixed';

export interface Recipe {
  id: string;
  foodId: string;
  name: string;
  emoji: string;
  difficulty: 'easy' | 'medium';
  prepTime: string;
  ageRange: string;
  ingredients: string[];
  steps: string[];
  tip: string;
}

export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  texture: Texture;
  tip: string;
  description: string;
  recipes: Recipe[];
  introductionDays: number;
}

export interface UserDoc {
  email: string;
  createdAt: number;
  currentChildId: string | null;
}

export interface ChildDoc {
  id: string;
  parentId: string;
  name: string;
  age: number;
  avatarEmoji: string;
  buddyXP: number;
  streak: number;
  lastLogDate: string | null;
  safeFoods: string[];
  savedRecipeIds: string[];
  lovedFoodIds: string[];
  metFoodIds: string[];
  bestReactionByFood: Record<string, ReactionType>;
  allergens: string[];
}

export interface FoodLog {
  id: string;
  parentId: string;
  childId: string;
  foodId: string;
  meal: MealType;
  reaction: ReactionType;
  date: string;
  createdAt: number;
}

export interface MealPlan {
  id: string;
  parentId: string;
  childId: string;
  date: string;
  breakfast: string[];
  midMorningSnack: string[];
  lunch: string[];
  afternoonSnack: string[];
  dinner: string[];
}
