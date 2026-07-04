import { ChildDoc, FoodLog } from '../types';
import { FOODS } from './foods';

function weekStartDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function generateInsight(child: ChildDoc, recentLogs: FoodLog[]): string {
  const name = child.name || 'Your child';
  const metCount = (child.metFoodIds ?? []).length;
  const weekStart = weekStartDateStr();
  const weekLogs = recentLogs.filter(l => l.date >= weekStart);
  const weekFoodIds = new Set(weekLogs.map(l => l.foodId));

  // 1. Streak milestone
  if (child.streak >= 7) {
    return `${name} is on a ${child.streak}-day streak. Consistency is the real strategy — research shows calm repetition matters more than variety.`;
  }
  if (child.streak >= 3) {
    return `${child.streak} days in a row! Keep it calm and pressure-free — that's exactly how food acceptance builds over time.`;
  }

  // 2. Most-logged food recently → encourage repeating it
  const logCounts: Record<string, number> = {};
  recentLogs.forEach(l => { logCounts[l.foodId] = (logCounts[l.foodId] ?? 0) + 1; });
  const sortedFoods = Object.entries(logCounts).sort(([, a], [, b]) => b - a);
  if (sortedFoods.length > 0) {
    const [topFoodId, topCount] = sortedFoods[0];
    const food = FOODS.find(f => f.id === topFoodId);
    if (food && topCount >= 3) {
      return `${name} has been introduced to ${food.name} ${topCount} times recently. Keep calmly offering it — repeated calm exposure is exactly what works.`;
    }
    if (food && topCount >= 2) {
      return `${food.name} has appeared twice recently. Repetition without pressure is the most evidence-backed approach for picky eaters.`;
    }
  }

  // 3. Refusals are normal
  const refusedRecently = recentLogs.some(l => l.reaction === 'refused');
  if (refusedRecently) {
    return `Refusals are completely normal — and they still count as an exposure. Just having food on the plate is meaningful progress.`;
  }

  // 4. Foods met milestone
  if (metCount >= 15) {
    return `${name} has now been introduced to ${metCount} different foods. That's a real foundation to build on.`;
  }
  if (metCount >= 5) {
    return `${name} has met ${metCount} different foods so far. Try offering 1–2 familiar ones each week alongside any new introductions.`;
  }

  // 5. This week variety
  if (weekFoodIds.size >= 3) {
    return `You've introduced ${weekFoodIds.size} different foods this week. Consider repeating a favourite next time — familiarity builds acceptance.`;
  }

  // 6. General rotating tips
  const tips = [
    `Research shows children may need 10–15 calm exposures before accepting a new food. You're playing a long game — and winning.`,
    `Eating the same food yourself without comment is one of the most powerful things you can do at mealtimes.`,
    `Try repeating one food from last week — familiarity lowers the anxiety response faster than always introducing something new.`,
    `No pressure at the table helps more than any specific technique. A relaxed meal is a successful meal.`,
    `Even touching or smelling a food counts. Every calm interaction builds a smaller fear response over time.`,
  ];
  const weekNum = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000);
  return tips[weekNum % tips.length];
}
