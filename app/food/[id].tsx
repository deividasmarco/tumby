import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOW, CATEGORY_BG, REACTION_META, REACTION_XP, REACTION_ORDER, MEAL_META, MEAL_ORDER } from '../../src/constants/colors';
import { FOODS } from '../../src/constants/foods';
import { foodConflictsWithAllergies, allergenLabel } from '../../src/constants/allergens';
import { useChildStore } from '../../src/stores/childStore';
import { MealType, ReactionType } from '../../src/types';

function currentMealGuess(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 11.5) return 'midMorningSnack';
  if (h < 14) return 'lunch';
  if (h < 17) return 'afternoonSnack';
  return 'dinner';
}

export default function FoodDetailScreen() {
  const { id, meal: mealParam } = useLocalSearchParams<{ id: string; meal?: string }>();
  const { child, todayLogs, logReaction } = useChildStore();
  const [selectedMeal, setSelectedMeal] = useState<MealType>((mealParam as MealType) ?? currentMealGuess());
  const [reactionModalOpen, setReactionModalOpen] = useState(false);
  const [logging, setLogging] = useState(false);

  const food = FOODS.find(f => f.id === id);

  if (!food || !child) {
    return <SafeAreaView style={s.container} />;
  }

  const bestReaction = child.bestReactionByFood[food.id];
  const todayFoodLogs = todayLogs.filter(l => l.foodId === food.id);
  const allergyConflicts = foodConflictsWithAllergies(food.id, child.allergens ?? []);

  const handleReaction = async (reaction: ReactionType) => {
    setLogging(true);
    setReactionModalOpen(false);
    try {
      const result = await logReaction(food.id, selectedMeal, reaction);
      router.push({
        pathname: '/grow',
        params: {
          foodId: food.id,
          reaction,
          xp: String(result.xpGained),
          improved: result.improved ? '1' : '0',
          leveledUp: result.leveledUp ? '1' : '0',
        },
      } as any);
    } finally {
      setLogging(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={[s.emojiCircle, { backgroundColor: CATEGORY_BG[food.category] }]}>
          <Text style={s.emojiText}>{food.emoji}</Text>
        </View>
        <Text style={s.foodName}>{food.name}</Text>
        <Text style={s.description}>{food.description}</Text>

        {allergyConflicts.length > 0 && (
          <View style={s.allergyWarning}>
            <Text style={s.allergyWarningText}>
              ⚠️ You marked an allergy to {allergyConflicts.map(allergenLabel).join(', ')} — talk to your pediatrician before trying this.
            </Text>
          </View>
        )}

        <View style={s.ladderCard}>
          <Text style={s.ladderTitle}>REACTION LADDER</Text>
          <View style={s.ladderRow}>
            {REACTION_ORDER.map(r => {
              const meta = REACTION_META[r];
              const achieved = bestReaction === r;
              return (
                <View key={r} style={[s.ladderDot, achieved && { backgroundColor: meta.color, borderColor: meta.color }]}>
                  <Text style={s.ladderDotEmoji}>{meta.emoji}</Text>
                </View>
              );
            })}
          </View>
          <Text style={s.ladderHint}>
            {bestReaction ? `Best so far: ${REACTION_META[bestReaction].label}` : 'No tries logged yet — every step counts!'}
          </Text>
          {todayFoodLogs.length > 0 && (
            <Text style={s.todayHint}>
              Today: {todayFoodLogs.map(l => `${MEAL_META[l.meal].emoji} ${REACTION_META[l.reaction].emoji}`).join('  ')}
            </Text>
          )}
        </View>

        <Text style={s.label}>Log reaction for:</Text>
        <View style={s.mealRow}>
          {MEAL_ORDER.map(m => (
            <TouchableOpacity
              key={m}
              style={[s.mealChip, selectedMeal === m && s.mealChipOn]}
              onPress={() => setSelectedMeal(m)}
            >
              <Text style={[s.mealChipText, selectedMeal === m && s.mealChipTextOn]}>{MEAL_META[m].emoji} {MEAL_META[m].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={() => setReactionModalOpen(true)} disabled={logging} activeOpacity={0.85}>
          <Text style={s.btnText}>🍽️ We tried it!</Text>
        </TouchableOpacity>

        <View style={s.divider} />

        <Text style={s.sectionTitle}>RECIPES</Text>
        {food.recipes.map(recipe => (
          <TouchableOpacity
            key={recipe.id}
            style={s.recipeCard}
            onPress={() => router.push(`/recipe/${recipe.id}` as any)}
            activeOpacity={0.85}
          >
            <Text style={s.recipeEmoji}>{recipe.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.recipeName}>{recipe.name}</Text>
              <Text style={s.recipeMeta}>{recipe.prepTime} · {recipe.difficulty === 'easy' ? '⭐ Easy' : '⭐⭐ Medium'}</Text>
            </View>
            <Text style={{ fontSize: 16, color: COLORS.text3 }}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={s.divider} />

        <Text style={s.sectionTitle}>TIPS FOR PARENTS</Text>
        <View style={s.tipCard}>
          <Text style={s.tipText}>
            🔬 Research shows it takes 15+ exposures before a child accepts a new food. {food.tip}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={reactionModalOpen} animationType="slide" transparent onRequestClose={() => setReactionModalOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setReactionModalOpen(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>How did it go?</Text>
            {REACTION_ORDER.map(r => {
              const meta = REACTION_META[r];
              return (
                <TouchableOpacity key={r} style={s.reactionRow} onPress={() => handleReaction(r)} activeOpacity={0.85}>
                  <Text style={s.reactionRowEmoji}>{meta.emoji}</Text>
                  <Text style={s.reactionRowLabel}>{meta.label}</Text>
                  <View style={[s.xpBadge, { backgroundColor: meta.color }]}>
                    <Text style={s.xpBadgeText}>+{REACTION_XP[r]}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  back: { alignSelf: 'flex-start', backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 16, ...SHADOW.card },
  backText: { color: COLORS.text2, fontWeight: '700', fontSize: 14 },
  emojiCircle: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emojiText: { fontSize: 64 },
  foodName: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.text2, fontWeight: '600', textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 8 },
  allergyWarning: { backgroundColor: COLORS.redPale, borderRadius: RADIUS.lg, padding: 14, width: '100%', marginBottom: 16 },
  allergyWarningText: { fontSize: 13, color: COLORS.red, fontWeight: '700', lineHeight: 19, textAlign: 'center' },
  ladderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, width: '100%', alignItems: 'center', marginBottom: 18, ...SHADOW.card },
  ladderTitle: { fontSize: 11, fontWeight: '800', color: COLORS.text3, letterSpacing: 0.6, marginBottom: 12, alignSelf: 'flex-start' },
  ladderRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  ladderDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' },
  ladderDotEmoji: { fontSize: 18 },
  ladderHint: { fontSize: 12, fontWeight: '700', color: COLORS.text3, textAlign: 'center' },
  todayHint: { fontSize: 12, fontWeight: '700', color: COLORS.orangeD, textAlign: 'center', marginTop: 6 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, alignSelf: 'flex-start' },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, justifyContent: 'center' },
  mealChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border },
  mealChipOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  mealChipText: { fontSize: 12, fontWeight: '700', color: COLORS.text2 },
  mealChipTextOn: { color: COLORS.white },
  btnPrimary: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center', width: '100%', marginBottom: 8, ...SHADOW.big },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  divider: { width: '100%', height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.text3, letterSpacing: 0.8, marginBottom: 12, alignSelf: 'flex-start' },
  recipeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, width: '100%', marginBottom: 10, ...SHADOW.card },
  recipeEmoji: { fontSize: 30 },
  recipeName: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  recipeMeta: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },
  tipCard: { backgroundColor: COLORS.orangePale, borderRadius: RADIUS.lg, padding: 16, width: '100%' },
  tipText: { fontSize: 13, color: COLORS.text2, fontWeight: '600', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, paddingBottom: 36 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 14, textAlign: 'center' },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.cream, borderRadius: RADIUS.lg, padding: 14, marginBottom: 8 },
  reactionRowEmoji: { fontSize: 26 },
  reactionRowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  xpBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  xpBadgeText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
});
