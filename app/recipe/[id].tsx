import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../../src/constants/colors';
import { FOODS } from '../../src/constants/foods';
import { useChildStore } from '../../src/stores/childStore';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { child, toggleSavedRecipe } = useChildStore();

  let recipe = null;
  for (const food of FOODS) {
    const found = food.recipes.find(r => r.id === id);
    if (found) { recipe = found; break; }
  }

  if (!recipe || !child) {
    return <SafeAreaView style={s.container} />;
  }

  const isSaved = (child.savedRecipeIds ?? []).includes(recipe.id);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.emoji}>{recipe.emoji}</Text>
        <Text style={s.name}>{recipe.name}</Text>

        <View style={s.metaRow}>
          <View style={s.metaChip}><Text style={s.metaChipText}>⏱ {recipe.prepTime}</Text></View>
          <View style={s.metaChip}><Text style={s.metaChipText}>👶 {recipe.ageRange}</Text></View>
          <View style={s.metaChip}><Text style={s.metaChipText}>{recipe.difficulty === 'easy' ? '⭐ Easy' : '⭐⭐ Medium'}</Text></View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>INGREDIENTS</Text>
          {recipe.ingredients.map((ing, i) => (
            <Text key={i} style={s.listItem}>• {ing}</Text>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>HOW TO MAKE IT</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={s.tipCard}>
          <Text style={s.tipTitle}>💡 PARENT TIP</Text>
          <Text style={s.tipText}>{recipe.tip}</Text>
        </View>

        <TouchableOpacity style={[s.saveBtn, isSaved && s.saveBtnOn]} onPress={() => toggleSavedRecipe(recipe.id)} activeOpacity={0.85}>
          <Text style={[s.saveBtnText, isSaved && s.saveBtnTextOn]}>{isSaved ? '🔖 Saved' : '🔖 Save Recipe'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  back: { alignSelf: 'flex-start', backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 16, ...SHADOW.card },
  backText: { color: COLORS.text2, fontWeight: '700', fontSize: 14 },
  emoji: { fontSize: 72, marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  metaChip: { backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 7, ...SHADOW.card },
  metaChipText: { fontSize: 12, fontWeight: '700', color: COLORS.text2 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, width: '100%', marginBottom: 14, ...SHADOW.card },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.text3, letterSpacing: 0.8, marginBottom: 12 },
  listItem: { fontSize: 14, color: COLORS.text, fontWeight: '600', lineHeight: 22, marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
  stepText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600', lineHeight: 20 },
  tipCard: { backgroundColor: COLORS.orangePale, borderRadius: RADIUS.lg, padding: 16, width: '100%', marginBottom: 18 },
  tipTitle: { fontSize: 11, fontWeight: '800', color: COLORS.orangeD, letterSpacing: 0.6, marginBottom: 8 },
  tipText: { fontSize: 13, color: COLORS.text2, fontWeight: '600', lineHeight: 20 },
  saveBtn: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', width: '100%' },
  saveBtnOn: { backgroundColor: COLORS.orange },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.orange },
  saveBtnTextOn: { color: COLORS.white },
});
