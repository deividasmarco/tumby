import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW, CATEGORY_BG, CATEGORY_COLOR, REACTION_META } from '../../src/constants/colors';
import { FOODS, Food } from '../../src/constants/foods';
import { foodConflictsWithAllergies, allergenLabel } from '../../src/constants/allergens';
import { useChildStore } from '../../src/stores/childStore';

const TEXTURES: { key: Food['texture'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'soft', label: 'Soft' },
  { key: 'crunchy', label: 'Crunchy' },
  { key: 'mushy', label: 'Mushy' },
  { key: 'mixed', label: 'Mixed' },
];

const CATEGORY_LABEL: Record<string, string> = {
  vegetable: 'Vegetables',
  fruit: 'Fruits',
  protein: 'Proteins',
  grain: 'Grains',
  dairy: 'Dairy',
};

export default function FoodMapScreen() {
  const { child } = useChildStore();
  const [filter, setFilter] = useState<Food['texture'] | 'all'>('all');

  if (!child) return <SafeAreaView style={s.container} />;

  const childAllergens = child.allergens ?? [];
  const filtered = filter === 'all' ? FOODS : FOODS.filter(f => f.texture === filter);
  const categories = Array.from(new Set(filtered.map(f => f.category)));

  const renderFood = (f: Food) => {
    const isSafe = (child.safeFoods ?? []).includes(f.id);
    const isLoved = (child.lovedFoodIds ?? []).includes(f.id);
    const best = child.bestReactionByFood?.[f.id];
    const allergyConflicts = foodConflictsWithAllergies(f.id, childAllergens);
    const isBlocked = allergyConflicts.length > 0;

    const handlePress = () => {
      if (isBlocked) return; // don't navigate to blocked foods
      router.push(`/food/${f.id}` as any);
    };

    return (
      <TouchableOpacity
        key={f.id}
        style={[
          s.tile,
          isBlocked ? s.tileBlocked : { backgroundColor: CATEGORY_BG[f.category] },
        ]}
        onPress={handlePress}
        activeOpacity={isBlocked ? 1 : 0.8}
      >
        <Text style={[s.tileEmoji, isBlocked && { opacity: 0.35 }]}>{f.emoji}</Text>
        <Text style={[s.tileName, isBlocked && { color: COLORS.text3 }]} numberOfLines={2}>
          {f.name}
        </Text>
        {isBlocked ? (
          <Text style={s.tileBlocked2} numberOfLines={1}>
            ⚠️ {allergyConflicts.map(allergenLabel).join(', ')}
          </Text>
        ) : isSafe ? (
          <Text style={[s.tileStatus, { color: CATEGORY_COLOR[f.category] }]}>✅ Safe</Text>
        ) : isLoved ? (
          <Text style={[s.tileStatus, { color: COLORS.green }]}>🏅 Loved</Text>
        ) : best ? (
          <Text style={[s.tileStatus, { color: REACTION_META[best].color }]}>
            {REACTION_META[best].emoji} {REACTION_META[best].label}
          </Text>
        ) : (
          <Text style={s.tileStatusMuted}>Tap to try</Text>
        )}
      </TouchableOpacity>
    );
  };

  const nonBlockedCount = FOODS.filter(f => foodConflictsWithAllergies(f.id, childAllergens).length === 0).length;
  const blockedCount = FOODS.length - nonBlockedCount;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Food Map</Text>
        <Text style={s.sub}>
          {nonBlockedCount} foods to explore
          {blockedCount > 0 && ` · ${blockedCount} hidden due to allergies`}
        </Text>

        {childAllergens.length > 0 && (
          <View style={s.allergyNote}>
            <Ionicons name="warning-outline" size={14} color={COLORS.red} />
            <Text style={s.allergyNoteText}>
              {' '}Foods containing {childAllergens.map(allergenLabel).join(', ')} are marked. Always consult your pediatrician before introducing allergens.
            </Text>
          </View>
        )}

        <View style={s.filterRow}>
          {TEXTURES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.filterChip, filter === t.key && s.filterChipOn]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[s.filterChipText, filter === t.key && s.filterChipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {categories.map(cat => (
          <View key={cat} style={s.section}>
            <Text style={s.sectionTitle}>{CATEGORY_LABEL[cat]}</Text>
            <View style={s.grid}>
              {filtered.filter(f => f.category === cat).map(renderFood)}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  sub: { fontSize: 13, fontWeight: '600', color: COLORS.text3, marginBottom: 10 },
  allergyNote: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.redPale, borderRadius: RADIUS.md, padding: 12, marginBottom: 14 },
  allergyNoteText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.red, lineHeight: 18 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.white, ...SHADOW.card },
  filterChipOn: { backgroundColor: COLORS.orange },
  filterChipText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  filterChipTextOn: { color: COLORS.white },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '22%', borderRadius: RADIUS.md, padding: 10, alignItems: 'center', gap: 3, minHeight: 88 },
  tileBlocked: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border },
  tileEmoji: { fontSize: 26 },
  tileName: { fontSize: 10, fontWeight: '700', color: COLORS.text, textAlign: 'center', lineHeight: 13 },
  tileStatus: { fontSize: 8, fontWeight: '800', textAlign: 'center' },
  tileStatusMuted: { fontSize: 8, fontWeight: '600', color: COLORS.text3, textAlign: 'center' },
  tileBlocked2: { fontSize: 8, fontWeight: '700', color: COLORS.red, textAlign: 'center' },
});
