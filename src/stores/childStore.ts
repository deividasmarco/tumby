import { create } from 'zustand';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection,
  query, where, getDocs, orderBy, limit, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getChildDoc, updateChildDoc } from '../services/auth.service';
import { ChildDoc, FoodLog, MealPlan, MealType, ReactionType } from '../types';
import { REACTION_XP, REACTION_RANK, stageForXP } from '../constants/colors';

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStrDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function emptyMealPlan(childId: string, date: string): MealPlan {
  return { id: `${childId}_${date}`, childId, date, breakfast: [], midMorningSnack: [], lunch: [], afternoonSnack: [], dinner: [] };
}

interface LogResult {
  xpGained: number;
  improved: boolean;
  leveledUp: boolean;
  streak: number;
}

interface ChildState {
  child: ChildDoc | null;
  mealPlan: MealPlan | null;
  todayLogs: FoodLog[];
  recentLogs: FoodLog[];
  loading: boolean;

  loadChild: (childId: string) => Promise<void>;
  addFoodToMeal: (meal: MealType, foodId: string) => Promise<void>;
  removeFoodFromMeal: (meal: MealType, foodId: string) => Promise<void>;
  logReaction: (foodId: string, meal: MealType, reaction: ReactionType) => Promise<LogResult>;
  latestReactionFor: (foodId: string, meal: MealType) => ReactionType | null;
  toggleSavedRecipe: (recipeId: string) => Promise<void>;
  setAllergens: (allergens: string[]) => Promise<void>;
}

export const useChildStore = create<ChildState>((set, get) => ({
  child: null,
  mealPlan: null,
  todayLogs: [],
  recentLogs: [],
  loading: false,

  loadChild: async (childId) => {
    set({ loading: true });
    const child = await getChildDoc(childId);

    const date = todayDateStr();
    const planRef = doc(db, 'mealPlans', `${childId}_${date}`);
    const planSnap = await getDoc(planRef);
    let mealPlan: MealPlan;
    if (planSnap.exists()) {
      mealPlan = planSnap.data() as MealPlan;
    } else {
      mealPlan = emptyMealPlan(childId, date);
      await setDoc(planRef, mealPlan);
    }

    const todayQ = query(collection(db, 'foodLogs'), where('childId', '==', childId), where('date', '==', date));
    const todaySnap = await getDocs(todayQ);
    const todayLogs: FoodLog[] = todaySnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<FoodLog, 'id'>) }));

    const recentQ = query(collection(db, 'foodLogs'), where('childId', '==', childId), orderBy('createdAt', 'desc'), limit(10));
    const recentSnap = await getDocs(recentQ);
    const recentLogs: FoodLog[] = recentSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<FoodLog, 'id'>) }));

    set({ child, mealPlan, todayLogs, recentLogs, loading: false });
  },

  addFoodToMeal: async (meal, foodId) => {
    const { mealPlan } = get();
    if (!mealPlan) return;
    const planRef = doc(db, 'mealPlans', mealPlan.id);
    await updateDoc(planRef, { [meal]: arrayUnion(foodId) });
    set(state => state.mealPlan ? {
      mealPlan: { ...state.mealPlan, [meal]: Array.from(new Set([...state.mealPlan[meal], foodId])) },
    } : {});
  },

  removeFoodFromMeal: async (meal, foodId) => {
    const { mealPlan } = get();
    if (!mealPlan) return;
    const planRef = doc(db, 'mealPlans', mealPlan.id);
    await updateDoc(planRef, { [meal]: arrayRemove(foodId) });
    set(state => state.mealPlan ? {
      mealPlan: { ...state.mealPlan, [meal]: state.mealPlan[meal].filter(id => id !== foodId) },
    } : {});
  },

  logReaction: async (foodId, meal, reaction) => {
    const { child, mealPlan, todayLogs } = get();
    if (!child || !mealPlan) {
      return { xpGained: 0, improved: false, leveledUp: false, streak: 0 };
    }

    const today = todayDateStr();
    const xpGained = REACTION_XP[reaction];

    // yesterday's best reaction for this food, for "improved" detection
    const yestQ = query(
      collection(db, 'foodLogs'),
      where('childId', '==', child.id),
      where('foodId', '==', foodId),
      where('date', '==', dateStrDaysAgo(1))
    );
    const yestSnap = await getDocs(yestQ);
    const yestLogs = yestSnap.docs.map(d => d.data() as FoodLog);
    const bestYesterdayRank = yestLogs.reduce((max, l) => Math.max(max, REACTION_RANK[l.reaction]), -1);
    const improved = bestYesterdayRank >= 0 && REACTION_RANK[reaction] > bestYesterdayRank;

    // streak logic: increments once per day, grace day for one missed day
    let newStreak = child.streak;
    if (child.lastLogDate === today) {
      newStreak = child.streak;
    } else if (!child.lastLogDate) {
      newStreak = 1;
    } else {
      const diffDays = Math.round((new Date(today).getTime() - new Date(child.lastLogDate).getTime()) / 86400000);
      newStreak = diffDays <= 2 ? child.streak + 1 : 1;
    }

    const oldXP = child.buddyXP;
    const newXP = oldXP + xpGained;
    const leveledUp = stageForXP(oldXP).index < stageForXP(newXP).index;

    await addDoc(collection(db, 'foodLogs'), {
      childId: child.id, foodId, meal, reaction, date: today, createdAt: Date.now(),
    });

    if (!mealPlan[meal].includes(foodId)) {
      await get().addFoodToMeal(meal, foodId);
    }

    const lovedFoodIds = reaction === 'loved' && !child.lovedFoodIds.includes(foodId)
      ? [...child.lovedFoodIds, foodId]
      : child.lovedFoodIds;

    const metFoodIds = child.metFoodIds.includes(foodId)
      ? child.metFoodIds
      : [...child.metFoodIds, foodId];

    const existingBest = child.bestReactionByFood[foodId];
    const bestReactionByFood = !existingBest || REACTION_RANK[reaction] > REACTION_RANK[existingBest]
      ? { ...child.bestReactionByFood, [foodId]: reaction }
      : child.bestReactionByFood;

    await updateChildDoc(child.id, {
      buddyXP: newXP, streak: newStreak, lastLogDate: today, lovedFoodIds, metFoodIds, bestReactionByFood,
    });

    const newLog: FoodLog = { id: `local-${Date.now()}`, childId: child.id, foodId, meal, reaction, date: today, createdAt: Date.now() };
    set({
      child: { ...child, buddyXP: newXP, streak: newStreak, lastLogDate: today, lovedFoodIds, metFoodIds, bestReactionByFood },
      todayLogs: [...todayLogs, newLog],
      recentLogs: [newLog, ...get().recentLogs].slice(0, 10),
    });

    return { xpGained, improved, leveledUp, streak: newStreak };
  },

  latestReactionFor: (foodId, meal) => {
    const { todayLogs } = get();
    const logs = todayLogs.filter(l => l.foodId === foodId && l.meal === meal);
    if (logs.length === 0) return null;
    return logs.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).reaction;
  },

  toggleSavedRecipe: async (recipeId) => {
    const { child } = get();
    if (!child) return;
    const savedRecipeIds = child.savedRecipeIds.includes(recipeId)
      ? child.savedRecipeIds.filter(id => id !== recipeId)
      : [...child.savedRecipeIds, recipeId];
    await updateChildDoc(child.id, { savedRecipeIds });
    set({ child: { ...child, savedRecipeIds } });
  },

  setAllergens: async (allergens) => {
    const { child } = get();
    if (!child) return;
    await updateChildDoc(child.id, { allergens });
    set({ child: { ...child, allergens } });
  },
}));
