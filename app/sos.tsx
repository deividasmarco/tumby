import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../src/constants/colors';

const TIP_SETS = [
  {
    title: '🆘 Mealtime SOS',
    subtitle: 'Stay calm — follow these steps.',
    headerColor: COLORS.red,
    steps: [
      { num: 'Step 1 — Right now', title: "Take a breath. Don't react to the refusal.", sub: 'Your calm energy is the #1 tool. Kids mirror parent anxiety at the table.' },
      { num: 'Step 2 — Remove pressure', title: "Don't ask them to eat. Just leave it on the plate.", sub: 'Pressure makes picky eating worse long-term. Exposure without pressure works.' },
      { num: 'Step 3 — Serve a safe food', title: 'Make sure one safe food they like is on the plate.', sub: 'This removes the fear of going hungry and reduces anxiety.' },
      { num: 'Step 4 — Distract & connect', title: 'Talk about something fun — not the food.', sub: 'A relaxed atmosphere helps more than anything.' },
    ],
    donts: ['"Just try one bite!" — creates pressure', '"No dessert unless..." — bribing backfires', '"Other kids eat this" — causes shame'],
    dos: ["\"You don't have to eat it, just have it nearby\"", '"I wonder what it smells like?"', 'Say nothing — neutral face, keep eating your own food'],
  },
  {
    title: '🤢 Texture Meltdown',
    subtitle: "They're gagging or distressed — here's what to do.",
    headerColor: '#8B5CF6',
    steps: [
      { num: 'Step 1 — Stay calm', title: "Don't panic or rush to remove the food.", sub: 'Gagging is a normal reflex. Overreacting teaches kids that textures ARE dangerous.' },
      { num: 'Step 2 — Never force', title: 'Never force food past a gag reflex. Ever.', sub: 'Forced eating creates long-term food trauma. Trust the slow process.' },
      { num: 'Step 3 — Adjust the texture', title: 'Next time, serve that food in a smoother form.', sub: 'Smooth → lumpy → chunky is the progression. Meet them where they are.' },
      { num: 'Step 4 — Praise the attempt', title: 'Praise them for being near the food, not for eating.', sub: '"You were so brave to touch it!" goes further than "just eat it".' },
    ],
    donts: ['Showing alarm or disgust at the gag', 'Banning that food forever from the table', '"Stop being dramatic" — invalidates real sensory distress'],
    dos: ['"That was brave — good try!"', 'Serve the same food puréed or mashed next time', 'Keep the food on the table even if they don\'t eat it'],
  },
  {
    title: '😤 Full Mealtime Tantrum',
    subtitle: 'Screaming at the table — breathe first.',
    headerColor: '#EF4444',
    steps: [
      { num: 'Step 1 — Lower your voice', title: "Don't raise yours when they raise theirs.", sub: 'A calm parent is the most powerful tool in a mealtime meltdown.' },
      { num: 'Step 2 — End the meal if needed', title: "It's OK to end the meal calmly and neutrally.", sub: 'Say "Mealtime is over" without punishment or lecture.' },
      { num: 'Step 3 — No replacement meal', title: "Don't cook a separate 'safe' meal after a tantrum.", sub: 'This rewards the behaviour. The safe food on the plate was already there.' },
      { num: 'Step 4 — Reconnect after', title: 'Cuddle and reconnect — mealtime stress affects your bond.', sub: 'Reconnecting keeps the relationship positive and safe around food.' },
    ],
    donts: ['"If you cry you\'re going to bed" — shame spiral', 'Making a completely different meal after', 'Linking screens or toys as punishment tied to eating'],
    dos: ['"I can see you\'re upset. Mealtime is done now."', 'Stay neutral and matter-of-fact throughout', 'Offer the plate\'s safe food quietly before ending'],
  },
  {
    title: '🔁 Only Wants One Food',
    subtitle: 'Same food every meal — here\'s the strategy.',
    headerColor: '#F59E0B',
    steps: [
      { num: 'Step 1 — Always include the safe food', title: 'Always serve their safe food alongside new ones.', sub: 'The safe food is a comfort anchor — never remove it as a tactic.' },
      { num: 'Step 2 — Food chaining', title: 'Find a food that\'s similar in shape, colour, or texture.', sub: 'Plain pasta accepted? Try orzo. Loves chicken nuggets? Try fish fingers.' },
      { num: 'Step 3 — Change one tiny thing', title: 'Modify the safe food very slightly each serving.', sub: 'Add a drop of butter. A different shape. A small dip on the side.' },
      { num: 'Step 4 — Wait it out', title: 'Food "jags" typically resolve in 2–4 weeks naturally.', sub: 'Forcing variety makes the jag last longer. Staying calm speeds it up.' },
    ],
    donts: ['Removing the safe food to force variety', '"You\'ve had pasta every day this week!"', 'Making mealtimes a battle over variety'],
    dos: ['"Here\'s your pasta AND something new — no pressure"', 'Introduce a tiny variation each time', 'Log it in Tumby — even touching the new food is a win'],
  },
  {
    title: '🆕 First Time on the Plate',
    subtitle: 'Introducing a brand new food — set it up right.',
    headerColor: COLORS.green,
    steps: [
      { num: 'Step 1 — No announcement', title: 'Don\'t say "I want you to try this today".', sub: 'Announcements create anticipatory anxiety. Just place it quietly.' },
      { num: 'Step 2 — Tiny portion on the side', title: 'One small piece — not mixed into other food.', sub: 'Separate presentation gives them control. Mixed-in food feels scary.' },
      { num: 'Step 3 — Model eating it', title: 'Eat the food yourself with enjoyment. Say nothing.', sub: 'Kids learn by watching. Your reaction is more powerful than any words.' },
      { num: 'Step 4 — Zero pressure', title: "Don't even mention it if they ignore it.", sub: 'Today was exposure #1. That\'s already a win. Log it and move on.' },
    ],
    donts: ['"At least smell it!" — any pressure is pressure', 'Watching them and waiting for a reaction', '"Last time you ate this!" — past comparisons create shame'],
    dos: ['Put it on the plate without saying anything', '"I\'m having some — it\'s really good" (to yourself)', 'Celebrate that it was on the table at all'],
  },
];

export default function SOSScreen() {
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIP_SETS.length));
  const [current, setCurrent] = useState(tipIdx);
  const tips = TIP_SETS[current];

  const nextTip = () => setCurrent(i => (i + 1) % TIP_SETS.length);

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.header, { backgroundColor: tips.headerColor }]}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>{tips.title}</Text>
        <Text style={s.sub}>{tips.subtitle}</Text>
        <View style={s.dotsRow}>
          {TIP_SETS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrent(i)}>
              <View style={[s.dot, i === current && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {tips.steps.map((st, i) => (
          <View key={i} style={s.card}>
            <Text style={s.stepNum}>{st.num}</Text>
            <Text style={s.stepTitle}>{st.title}</Text>
            <Text style={s.stepSub}>{st.sub}</Text>
          </View>
        ))}

        <View style={s.dontCard}>
          <Text style={s.dontTitle}>❌ Don't say</Text>
          {tips.donts.map((d, i) => (
            <Text key={i} style={s.dontItem}>• {d}</Text>
          ))}
        </View>

        <View style={s.doCard}>
          <Text style={s.doTitle}>✅ Try saying</Text>
          {tips.dos.map((d, i) => (
            <Text key={i} style={s.doItem}>• {d}</Text>
          ))}
        </View>

        <TouchableOpacity style={[s.nextBtn, { borderColor: tips.headerColor }]} onPress={nextTip}>
          <Text style={[s.nextBtnText, { color: tips.headerColor }]}>
            See different tips →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btn} onPress={() => router.back()}>
          <Text style={s.btnText}>✓ I'm calm now — back to plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { padding: 24, paddingBottom: 20 },
  back: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.white, marginBottom: 8 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 14 },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: COLORS.white, width: 20 },
  body: { padding: 20, paddingBottom: 48 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 18, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.orange, ...SHADOW.small },
  stepNum: { fontSize: 11, fontWeight: '800', color: COLORS.orange, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, lineHeight: 22, marginBottom: 6 },
  stepSub: { fontSize: 13, color: COLORS.text2, fontWeight: '600', lineHeight: 19 },
  dontCard: { backgroundColor: COLORS.redPale, borderRadius: RADIUS.lg, padding: 16, marginBottom: 10 },
  dontTitle: { fontSize: 12, fontWeight: '800', color: COLORS.red, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  dontItem: { fontSize: 13, color: COLORS.text2, fontWeight: '600', marginBottom: 6, lineHeight: 19 },
  doCard: { backgroundColor: COLORS.greenPale, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  doTitle: { fontSize: 12, fontWeight: '800', color: COLORS.green, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  doItem: { fontSize: 13, color: COLORS.text2, fontWeight: '600', marginBottom: 6, lineHeight: 19 },
  nextBtn: { borderWidth: 2, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', marginBottom: 10 },
  nextBtnText: { fontSize: 15, fontWeight: '800' },
  btn: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center', ...SHADOW.medium },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
