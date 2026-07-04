import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW, CATEGORY_BG, REACTION_META, REACTION_XP, stageForXP, BUDDY_STAGES } from '../../src/constants/colors';
import { FOODS } from '../../src/constants/foods';
import { generateInsight } from '../../src/constants/insights';
import { weekStartDateStr } from '../../src/constants/challenges';
import { useChildStore } from '../../src/stores/childStore';

export default function BuddyScreen() {
  const { child, recentLogs } = useChildStore();

  if (!child) {
    return <SafeAreaView style={s.container} />;
  }

  const stageResult = stageForXP(child.buddyXP);
  const currentStage = stageResult.stage;
  const nextStage = stageResult.next;
  const xpIntoStage = child.buddyXP - currentStage.minXP;
  const xpSpan = nextStage ? nextStage.minXP - currentStage.minXP : 1;
  const pct = nextStage ? Math.min(100, Math.round((xpIntoStage / xpSpan) * 100)) : 100;

  // Summary stats
  const metCount = (child.metFoodIds ?? []).length;
  const weekStart = weekStartDateStr();
  const weekFoods = new Set(recentLogs.filter(l => l.date >= weekStart).map(l => l.foodId));

  // Coaching insight
  const insight = generateInsight(child, recentLogs);

  // Recent XP — cap at 5 most recent
  const displayLogs = recentLogs.slice(0, 5);

  // Foods met / locked
  const metFoodIds = new Set(child.metFoodIds ?? []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={16} color={COLORS.text2} />
          <Text style={s.settingsBtnText}> Settings</Text>
        </TouchableOpacity>

        {/* ── Hero card ── */}
        <View style={s.hero}>
          <Text style={s.heroEmoji}>{currentStage.emoji}</Text>
          <Text style={s.heroName}>{currentStage.name}</Text>
          <Text style={s.heroLevel}>{child.name}'s buddy · {child.buddyXP} XP</Text>
          <View style={s.xpBar}>
            <View style={[s.xpFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.xpToNext}>
            {nextStage
              ? `${nextStage.minXP - child.buddyXP} XP until ${child.name}'s buddy becomes a ${nextStage.name} ${nextStage.emoji}`
              : '🌟 Maximum level reached!'}
          </Text>
        </View>

        {/* ── Milestone track ── */}
        <View style={s.milestonesRow}>
          {BUDDY_STAGES.map(st => (
            <View key={st.name} style={s.milestone}>
              <Text style={[s.milestoneEmoji, child.buddyXP < st.minXP && { opacity: 0.3 }]}>{st.emoji}</Text>
              <Text style={[s.milestoneLabel, child.buddyXP >= st.minXP && { color: COLORS.orange, fontWeight: '800' }]}>{st.name}</Text>
            </View>
          ))}
        </View>

        {/* ── Coaching insight ── */}
        <View style={s.insightCard}>
          <View style={s.insightHeader}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.orange} />
            <Text style={s.insightLabel}> COACHING TIP</Text>
          </View>
          <Text style={s.insightText}>{insight}</Text>
        </View>

        {/* ── Summary stats ── */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{metCount}</Text>
            <Text style={s.statLabel}>Foods met</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{child.buddyXP}</Text>
            <Text style={s.statLabel}>Total XP</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{child.streak}</Text>
            <Text style={s.statLabel}>Day streak</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{weekFoods.size}</Text>
            <Text style={s.statLabel}>This week</Text>
          </View>
        </View>

        {/* ── Recent XP ── */}
        {displayLogs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚡ RECENT XP</Text>
            {displayLogs.map(log => {
              const food = FOODS.find(f => f.id === log.foodId);
              const meta = REACTION_META[log.reaction];
              if (!food) return null;
              return (
                <View key={log.id} style={s.logRow}>
                  <Text style={{ fontSize: 20 }}>{food.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.logName}>{food.name}</Text>
                    <Text style={s.logReaction}>{meta.emoji} {meta.label}</Text>
                  </View>
                  <Text style={s.logXp}>+{REACTION_XP[log.reaction]} XP</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Foods collection ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🍎 FOODS {child.name.toUpperCase()} HAS MET ({metCount})</Text>
          <View style={s.grid}>
            {FOODS.map(f => {
              const met = metFoodIds.has(f.id);
              const best = met ? child.bestReactionByFood[f.id] : null;
              return (
                <View
                  key={f.id}
                  style={[s.foodTile, met
                    ? { backgroundColor: CATEGORY_BG[f.category] }
                    : s.foodTileLocked]}
                >
                  <Text style={[s.foodTileEmoji, !met && { opacity: 0.2 }]}>
                    {met ? f.emoji : '❓'}
                  </Text>
                  <Text style={[s.foodTileName, !met && { color: COLORS.border }]} numberOfLines={1}>
                    {met ? f.name : '???'}
                  </Text>
                  {met && best && (
                    <Text style={s.foodTileReaction}>{REACTION_META[best].emoji}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 20, paddingBottom: 40 },
  settingsBtn: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 10, ...SHADOW.card },
  settingsBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.text2 },

  // Hero
  hero: { backgroundColor: COLORS.green, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', marginBottom: 12, ...SHADOW.big },
  heroEmoji: { fontSize: 72, marginBottom: 6 },
  heroName: { fontSize: 22, fontWeight: '900', color: COLORS.white, marginBottom: 2 },
  heroLevel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  xpBar: { width: '100%', height: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: COLORS.white, minWidth: 6 },
  xpToNext: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },

  // Milestones
  milestonesRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 12, marginBottom: 12, ...SHADOW.card },
  milestone: { alignItems: 'center', flex: 1 },
  milestoneEmoji: { fontSize: 20, marginBottom: 2 },
  milestoneLabel: { fontSize: 8, fontWeight: '700', color: COLORS.text3, textAlign: 'center' },

  // Insight
  insightCard: { backgroundColor: COLORS.yellowPale, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightLabel: { fontSize: 11, fontWeight: '800', color: COLORS.orange, letterSpacing: 0.6 },
  insightText: { fontSize: 14, color: COLORS.text2, fontWeight: '600', lineHeight: 21 },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', ...SHADOW.card },
  statNum: { fontSize: 24, fontWeight: '900', color: COLORS.orange },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, textAlign: 'center' },

  // Recent XP
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, ...SHADOW.card },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  logReaction: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },
  logXp: { fontSize: 13, fontWeight: '800', color: COLORS.green },

  // Food grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodTile: { width: '22%', borderRadius: RADIUS.md, padding: 8, alignItems: 'center', gap: 2 },
  foodTileLocked: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  foodTileEmoji: { fontSize: 22 },
  foodTileName: { fontSize: 9, fontWeight: '700', color: COLORS.text2, textAlign: 'center' },
  foodTileReaction: { fontSize: 11 },
});
