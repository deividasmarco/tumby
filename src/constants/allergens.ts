export interface Allergen {
  id: string;
  label: string;
  emoji: string;
}

// The "Big 9" major food allergens (FDA / FALCPA list)
export const ALLERGENS: Allergen[] = [
  { id: 'milk', label: 'Milk', emoji: '🥛' },
  { id: 'egg', label: 'Egg', emoji: '🥚' },
  { id: 'peanut', label: 'Peanut', emoji: '🥜' },
  { id: 'treenut', label: 'Tree Nut', emoji: '🌰' },
  { id: 'soy', label: 'Soy', emoji: '🫘' },
  { id: 'wheat', label: 'Wheat', emoji: '🌾' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'sesame', label: 'Sesame', emoji: '🟤' },
];

// Maps each food id to the allergen ids it contains (only foods that
// actually contain one of the Big 9 are listed; everything else is
// assumed allergen-free for these 9 categories).
export const FOOD_ALLERGENS: Record<string, string[]> = {
  cheese: ['milk'],
  yogurt: ['milk'],
  milk: ['milk'],
  egg: ['egg'],
  pancakes: ['egg', 'wheat'],
  peanutbutter: ['peanut'],
  tofu: ['soy'],
  pasta: ['wheat'],
  bread: ['wheat'],
  cereal: ['wheat'],
  salmon: ['fish'],
};

export function allergensForFood(foodId: string): string[] {
  return FOOD_ALLERGENS[foodId] ?? [];
}

export function foodConflictsWithAllergies(foodId: string, childAllergens: string[]): string[] {
  if (childAllergens.length === 0) return [];
  return allergensForFood(foodId).filter(a => childAllergens.includes(a));
}

export function allergenLabel(id: string): string {
  return ALLERGENS.find(a => a.id === id)?.label ?? id;
}
