import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  COLORS, RADIUS, SHADOW, MEAL_META, MEAL_ORDER,
  REACTION_META, stageForXP,
} from '../../src/constants/colors';
import { FOODS } from '../../src/constants/foods';
import { foodConflictsWithAllergies } from '../../src/constants/allergens';
import { getWeekChallenge, computeChallengeProgress, weekStartDateStr } from '../../src/constants/challenges';
import { useChildStore } from '../../src/stores/childStore';
import { MealType } from '../../src/types';

function currentMealGuess(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 11.5) return 'midMorningSnack';
  if (h < 14) return 'lunch';
  if (h < 17) return 'afternoonSnack';
  return 'dinner';
}

export default function TodayScreen() {
  const { child, mealPlan, todayLogs, recentLogs, latestReactionFor, addFoodToMeal, removeFoodFromMeal } = useChildStore();

  const currentMeal = currentMealGuess();

  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(new Set([currentMeal]));
  const [sheetMeal, setSheetMeal] = useState<MealType | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);

  // Auto-expand meals that already have foods when data loads
  useEffect(() => {
    if (!mealPlan) return;
    setExpandedMeals(prev => {
      const next = new Set(prev);
      MEAL_ORDER.forEach(meal => { if (mealPlan[meal].length > 0) next.add(meal); });
      return next;
    });
  }, [mealPlan]);

  const toggleMeal = useCallback((meal: MealType) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      next.has(meal) ? next.delete(meal) : next.add(meal);
      return next;
    });
  }, []);

  if (!child || !mealPlan) {
    return <SafeAreaView style={s.container} />;
  }

  // Weekly challenge
  const challenge = getWeekChallenge();
  const weekStart = weekStartDateStr();
  const weekLogs = recentLogs.filter(l => l.date >= weekStart);
  const challengeProgress = Math.min(computeChallengeProgress(challenge, weekLogs), challenge.target);
  const challengeDone = challengeProgress >= challenge.target;

  const stage = stageForXP(child.buddyXP);

  const pickableFoods = FOODS.filter(f =>
    !(child.lovedFoodIds ?? []).includes(f.id) &&
    foodConflictsWithAllergies(f.id, child.allergens ?? []).length === 0
  );

  const openSheet = (meal: MealType) => {
    setSelectedFoodIds([]);
    setSheetMeal(meal);
    setExpandedMeals(prev => new Set([...prev, meal]));
  };
  const closeSheet = () => { setSheetMeal(null); setSelectedFoodIds([]); };

  const toggleSelectFood = (id: string) =>
    setSelectedFoodIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const confirmAddFoods = async () => {
    if (!sheetMeal || selectedFoodIds.length === 0) return;
    await Promise.all(selectedFoodIds.map(id => addFoodToMeal(sheetMeal, id)));
    closeSheet();
  };

  const handleRemove = (meal: MealType, foodId: string) => {
    removeFoodFromMeal(meal, foodId);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <View style={s.childChip}>
            <Text style={{ fontSize: 18 }}>{child.avatarEmoji}</Text>
            <Text style={s.childChipText}>{child.name}</Text>
          </View>
          <View style={s.topBarRight}>
            {child.streak > 0 && (
              <View style={s.streakChip}>
                <Ionicons name="flame" size={13} color={COLORS.orangeD} />
                <Text style={s.streakChipText}> {child.streak}</Text>
              </View>
            )}
            <TouchableOpacity style={s.settingsBtn} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={20} color={COLORS.text2} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.dateLabel}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>

        {/* ── Weekly challenge ── */}
        <View style={[s.challengeCard, challengeDone && s.challengeCardDone]}>
          <View style={s.challengeHeader}>
            <Text style={s.challengeEmoji}>{challenge.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.challengeLabel}>THIS WEEK'S CHALLENGE</Text>
              <Text style={s.challengeTitle}>{challenge.title}</Text>
            </View>
            {challengeDone && (
              <View style={s.challengeBadge}>
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              </View>
            )}
          </View>
          <View style={s.challengeBarBg}>
            <View style={[s.challengeBarFill, {
              width: challenge.target > 0 ? `${Math.round((challengeProgress / challenge.target) * 100)}%` : '0%',
              backgroundColor: challengeDone ? COLORS.green : COLORS.orange,
            }]} />
          </View>
          <Text style={s.challengeCount}>
            {challengeDone ? `✓ Completed! ${challenge.description}` : `${challengeProgress} / ${challenge.target} — ${challenge.description}`}
          </Text>
        </View>

        {/* ── Meal sections ── */}
        {MEAL_ORDER.map(meal => {
          const meta = MEAL_META[meal];
          const foodIds = mealPlan[meal];
          const expanded = expandedMeals.has(meal);
          const isCurrent = meal === currentMeal;
          const isEmpty = foodIds.length === 0;

          // Collapsed strip (non-current, empty)
          if (!expanded && isEmpty) {
            return (
              <TouchableOpacity key={meal} style={s.mealStrip} onPress={() => toggleMeal(meal)} activeOpacity={0.7}>
                <Text style={s.mealStripEmoji}>{meta.emoji}</Text>
                <Text style={s.mealStripLabel}>{meta.label}</Text>
                <TouchableOpacity style={s.mealStripAdd} onPress={() => openSheet(meal)}>
                  <Ionicons name="add" size={18} color={COLORS.text3} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          // Expanded section
          return (
            <View key={meal} style={[s.mealSection, isCurrent && s.mealSectionCurrent]}>
              {/* Meal header */}
              <TouchableOpacity style={s.mealHeader} onPress={() => toggleMeal(meal)} activeOpacity={0.8}>
                <Text style={s.mealHeaderEmoji}>{meta.emoji}</Text>
                <Text style={[s.mealHeaderLabel, isCurrent && s.mealHeaderLabelCurrent]}>
                  {meta.label.toUpperCase()}
                </Text>
                {isCurrent && <View style={s.nowBadge}><Text style={s.nowBadgeText}>NOW</Text></View>}
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={s.mealAddBtn} onPress={() => openSheet(meal)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="add-circle-outline" size={22} color={isCurrent ? COLORS.orange : COLORS.text3} />
                </TouchableOpacity>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.text3}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              {/* Food rows */}
              {isEmpty ? (
                <View style={s.emptyMeal}>
                  <Text style={s.emptyMealText}>No foods added yet</Text>
                  <TouchableOpacity style={s.emptyMealBtn} onPress={() => openSheet(meal)}>
                    <Ionicons name="add" size={14} color={COLORS.orange} />
                    <Text style={s.emptyMealBtnText}> Add food</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.foodList}>
                  {foodIds.map(foodId => {
                    const food = FOODS.find(f => f.id === foodId);
                    if (!food) return null;
                    const reaction = latestReactionFor(foodId, meal);
                    const meta2 = reaction ? REACTION_META[reaction] : null;
                    return (
                      <Pressable
                        key={foodId}
                        style={s.foodRow}
                        onPress={() => router.push(`/food/${foodId}?meal=${meal}` as any)}
                        onLongPress={() => handleRemove(meal, foodId)}
                        android_ripple={{ color: COLORS.border }}
                      >
                        <Text style={s.foodRowEmoji}>{food.emoji}</Text>
                        <Text style={s.foodRowName} numberOfLines={2}>{food.name}</Text>
                        {meta2 ? (
                          <View style={[s.reactionPill, { backgroundColor: meta2.color + '22' }]}>
                            <Text style={s.reactionPillEmoji}>{meta2.emoji}</Text>
                            <Text style={[s.reactionPillLabel, { color: meta2.color }]}>{meta2.label}</Text>
                          </View>
                        ) : (
                          <Text style={s.tapToLog}>Tap to log</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Buddy preview ── */}
        <TouchableOpacity style={s.buddyCard} onPress={() => router.push('/(tabs)/buddy')} activeOpacity={0.9}>
          <Text style={s.buddyEmoji}>{stage.stage.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.buddyTitle}>{stage.stage.name} · {child.buddyXP} XP</Text>
            <Text style={s.buddySub}>{child.name}'s buddy — tap to view progress</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <TouchableOpacity style={s.skipLink} onPress={() => openSheet(currentMeal)}>
          <Text style={s.skipLinkText}>Skipped a meal? Log it anyway →</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Add food sheet ── */}
      <Modal visible={sheetMeal !== null} animationType="slide" transparent onRequestClose={closeSheet}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={closeSheet}>
          <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>
              Add to {sheetMeal ? MEAL_META[sheetMeal].label : ''}
            </Text>
            <Text style={s.sheetHint}>Tap foods to select, then confirm</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <View style={s.sheetGrid}>
                {pickableFoods.map(f => {
                  const selected = selectedFoodIds.includes(f.id);
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[s.sheetFoodChip, selected && s.sheetFoodChipOn]}
                      onPress={() => toggleSelectFood(f.id)}
                    >
                      <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                      <Text style={s.sheetFoodName} numberOfLines={2}>{f.name}</Text>
                      {selected && (
                        <View style={s.sheetFoodCheck}>
                          <Ionicons name="checkmark" size={10} color={COLORS.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[s.confirmBtn, selectedFoodIds.length === 0 && s.confirmBtnOff]}
              onPress={confirmAddFoods}
              disabled={selectedFoodIds.length === 0}
            >
              <Text style={[s.confirmBtnText, selectedFoodIds.length === 0 && { color: COLORS.text3 }]}>
                {selectedFoodIds.length === 0
                  ? 'Select foods to add'
                  : `Add ${selectedFoodIds.length} food${selectedFoodIds.length > 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 16, paddingBottom: 40 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  childChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 7, ...SHADOW.card },
  childChipText: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.orangePale, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 6 },
  streakChipText: { fontSize: 13, fontWeight: '800', color: COLORS.orangeD },
  settingsBtn: { backgroundColor: COLORS.white, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
  dateLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Weekly challenge
  challengeCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 14, marginBottom: 14, ...SHADOW.card },
  challengeCardDone: { backgroundColor: COLORS.greenPale, borderColor: COLORS.green, borderWidth: 1 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  challengeEmoji: { fontSize: 24 },
  challengeLabel: { fontSize: 10, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.6 },
  challengeTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  challengeBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  challengeBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  challengeBarFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  challengeCount: { fontSize: 11, fontWeight: '600', color: COLORS.text3 },

  // Meal strip (collapsed empty)
  mealStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6, ...SHADOW.card },
  mealStripEmoji: { fontSize: 16, marginRight: 8 },
  mealStripLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text3 },
  mealStripAdd: { padding: 4 },

  // Meal section (expanded)
  mealSection: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, marginBottom: 10, overflow: 'hidden', ...SHADOW.card },
  mealSectionCurrent: { borderWidth: 1.5, borderColor: COLORS.orange },
  mealHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  mealHeaderEmoji: { fontSize: 18, marginRight: 8 },
  mealHeaderLabel: { fontSize: 12, fontWeight: '800', color: COLORS.text3, letterSpacing: 0.5 },
  mealHeaderLabelCurrent: { color: COLORS.orange },
  nowBadge: { backgroundColor: COLORS.orangePale, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8 },
  nowBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.orange, letterSpacing: 0.5 },
  mealAddBtn: { padding: 2 },

  // Empty state inside meal
  emptyMeal: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  emptyMealText: { flex: 1, fontSize: 13, color: COLORS.text3, fontWeight: '500' },
  emptyMealBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.orangePale, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  emptyMealBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.orange },

  // Food rows
  foodList: { paddingBottom: 8 },
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  foodRowEmoji: { fontSize: 24, marginRight: 10 },
  foodRowName: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 19 },
  reactionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4 },
  reactionPillEmoji: { fontSize: 13 },
  reactionPillLabel: { fontSize: 11, fontWeight: '700' },
  tapToLog: { fontSize: 11, fontWeight: '600', color: COLORS.text3 },

  // Buddy card
  buddyCard: { backgroundColor: COLORS.green, borderRadius: RADIUS.xl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 8, ...SHADOW.card },
  buddyEmoji: { fontSize: 38 },
  buddyTitle: { fontSize: 14, fontWeight: '900', color: COLORS.white, marginBottom: 2 },
  buddySub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  skipLink: { alignItems: 'center', padding: 12 },
  skipLinkText: { fontSize: 12, fontWeight: '600', color: COLORS.text3 },

  // Food picker sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  sheetHint: { fontSize: 12, fontWeight: '600', color: COLORS.text3, marginBottom: 14 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 4 },
  sheetFoodChip: { width: 76, backgroundColor: COLORS.cream, borderRadius: RADIUS.md, padding: 10, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent' },
  sheetFoodChipOn: { backgroundColor: COLORS.orangePale, borderColor: COLORS.orange },
  sheetFoodName: { fontSize: 9, fontWeight: '700', color: COLORS.text2, textAlign: 'center', lineHeight: 13 },
  sheetFoodCheck: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 15, alignItems: 'center', marginTop: 14, ...SHADOW.card },
  confirmBtnOff: { backgroundColor: COLORS.border },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
