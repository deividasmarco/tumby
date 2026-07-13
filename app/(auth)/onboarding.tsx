import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../../src/constants/colors';
import { FOODS } from '../../src/constants/foods';
import { ALLERGENS } from '../../src/constants/allergens';
import { MEDICAL_DISCLAIMER } from '../../src/legal/disclaimer';
import { useAuthStore } from '../../src/stores/authStore';
import { useChildStore } from '../../src/stores/childStore';

const AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const AVATARS = ['🐯', '🦊', '🐸', '🐼', '🦁', '🐨'];
const SEED_FOOD_IDS = ['banana', 'apple', 'chicken', 'pasta', 'cheese', 'rice', 'bread', 'yogurt', 'egg', 'peanutbutter'];
const SEED_FOODS = FOODS.filter(f => SEED_FOOD_IDS.includes(f.id));
const STEP_COUNT = 4;

// Child-creation onboarding shown after a social sign-in for a brand-new user
// (account already exists via Google/Apple; they just need their first child).
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState(2);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [safeFoods, setSafeFoods] = useState<string[]>(['banana', 'chicken', 'pasta', 'cheese']);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const addChild = useAuthStore(s => s.addChild);
  const loadChild = useChildStore(s => s.loadChild);

  const toggleFood = (id: string) =>
    setSafeFoods(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id]);
  const toggleAllergen = (id: string) =>
    setAllergens(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id]);

  const finish = async () => {
    setError('');
    setLoading(true);
    try {
      await addChild(childName.trim(), age, avatar, safeFoods, allergens);
      const { currentChildId } = useAuthStore.getState();
      if (currentChildId) await loadChild(currentChildId);
      router.replace('/(tabs)/today');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.dotsRow}>
        {Array.from({ length: STEP_COUNT }).map((_, i) => <View key={i} style={[s.dot, step === i && s.dotActive]} />)}
      </View>

      {step === 0 && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.heading}>Welcome to{'\n'}Tumby 🌱</Text>
          <View style={s.disclaimerCard}>
            <Text style={s.disclaimerText}>{MEDICAL_DISCLAIMER}</Text>
          </View>
          <TouchableOpacity style={s.checkRow} onPress={() => setDisclaimerAck(!disclaimerAck)}>
            <View style={[s.checkbox, disclaimerAck && s.checkboxOn]}>
              {disclaimerAck && <Text style={s.checkboxMark}>✓</Text>}
            </View>
            <Text style={s.checkLabel}>I understand this is guidance, not medical advice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnPrimary, !disclaimerAck && { opacity: 0.4 }]} onPress={() => disclaimerAck && setStep(1)} disabled={!disclaimerAck}>
            <Text style={s.btnText}>Next →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.heading}>About your{'\n'}child 👶</Text>
          <Text style={s.label}>Child's name</Text>
          <TextInput style={s.input} placeholder="e.g. Dominic" placeholderTextColor={COLORS.text3} value={childName} onChangeText={setChildName} />
          <Text style={s.label}>Age</Text>
          <View style={s.row}>
            {AGES.map(a => (
              <TouchableOpacity key={a} style={[s.chip, age === a && s.chipOn]} onPress={() => setAge(a)}>
                <Text style={[s.chipText, age === a && { color: COLORS.white }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Pick an avatar</Text>
          <View style={s.row}>
            {AVATARS.map(a => (
              <TouchableOpacity key={a} style={[s.avatarChip, avatar === a && s.avatarChipOn]} onPress={() => setAvatar(a)}>
                <Text style={{ fontSize: 28 }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.btnPrimary, !childName && { opacity: 0.4 }]} onPress={() => childName && setStep(2)} disabled={!childName}>
            <Text style={s.btnText}>Next →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.heading}>Any known{'\n'}allergies? ⚠️</Text>
          <Text style={s.sub}>We'll filter these out of food suggestions. Optional — skip if none.</Text>
          <View style={s.row}>
            {ALLERGENS.map(a => (
              <TouchableOpacity key={a.id} style={[s.allergenChip, allergens.includes(a.id) && s.allergenChipOn]} onPress={() => toggleAllergen(a.id)}>
                <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                <Text style={[s.allergenChipText, allergens.includes(a.id) && { color: COLORS.white }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.btnPrimary} onPress={() => setStep(3)}>
            <Text style={s.btnText}>Next →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnBack} onPress={() => setStep(1)}>
            <Text style={s.btnBackText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.heading}>What does{'\n'}{childName} already eat? ✅</Text>
          <Text style={s.sub}>Tap everything they accept — even sometimes!</Text>
          <View style={s.foodGrid}>
            {SEED_FOODS.map(f => (
              <TouchableOpacity key={f.id} style={[s.foodChip, safeFoods.includes(f.id) && s.foodChipOn]} onPress={() => toggleFood(f.id)}>
                <Text style={{ fontSize: 26 }}>{f.emoji}</Text>
                <Text style={[s.foodName, safeFoods.includes(f.id) && { color: COLORS.green }]}>{f.name}</Text>
                {safeFoods.includes(f.id) && <Text style={s.foodCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
          <TouchableOpacity style={s.btnPrimary} onPress={finish} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnText}>Build {childName}'s Plan 🎉</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.btnBack} onPress={() => setStep(2)}>
            <Text style={s.btnBackText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  dotsRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.orange, width: 24 },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 30, fontWeight: '900', color: COLORS.text, marginBottom: 12, lineHeight: 36 },
  sub: { fontSize: 14, color: COLORS.text2, fontWeight: '600', lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 },
  input: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 16, fontSize: 16, fontWeight: '700', color: COLORS.text },
  error: { color: COLORS.red, fontSize: 13, fontWeight: '700', marginTop: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { fontSize: 14, fontWeight: '700', color: COLORS.text2 },
  avatarChip: { width: 56, height: 56, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  avatarChipOn: { backgroundColor: COLORS.orangePale, borderColor: COLORS.orange },
  allergenChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.white },
  allergenChipOn: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  allergenChipText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  foodChip: { width: '22%', backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 10, alignItems: 'center', gap: 4 },
  foodChipOn: { backgroundColor: COLORS.greenPale, borderColor: COLORS.green },
  foodName: { fontSize: 10, fontWeight: '700', color: COLORS.text2, textAlign: 'center' },
  foodCheck: { position: 'absolute', top: 4, right: 6, fontSize: 10, color: COLORS.green, fontWeight: '900' },
  disclaimerCard: { backgroundColor: COLORS.orangePale, borderRadius: RADIUS.lg, padding: 18, marginBottom: 20 },
  disclaimerText: { fontSize: 14, color: COLORS.text2, fontWeight: '600', lineHeight: 21 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  checkboxOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  checkboxMark: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  btnPrimary: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center', marginTop: 8, ...SHADOW.card },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  btnBack: { alignItems: 'center', padding: 14, marginTop: 4 },
  btnBackText: { color: COLORS.text3, fontSize: 14, fontWeight: '700' },
});
