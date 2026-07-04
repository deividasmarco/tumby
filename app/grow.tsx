import { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOW, stageForXP, PRAISE_LINES, REACTION_META } from '../src/constants/colors';
import { FOODS } from '../src/constants/foods';
import { useChildStore } from '../src/stores/childStore';
import { ReactionType } from '../src/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_EMOJI = ['🎉', '⭐', '🎊', '✨', '🥳'];

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 18 }).map(() => ({
      x: Math.random() * SCREEN_W,
      delay: Math.random() * 300,
      duration: 1800 + Math.random() * 800,
      emoji: CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
      rotateStart: Math.random() * 360,
      anim: new Animated.Value(0),
    })),
    []
  );

  useEffect(() => {
    pieces.forEach(p => {
      Animated.timing(p.anim, { toValue: 1, duration: p.duration, delay: p.delay, useNativeDriver: true }).start();
    });
  }, [pieces]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-40, SCREEN_H * 0.7] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
        const rotate = p.anim.interpolate({ inputRange: [0, 1], outputRange: [`${p.rotateStart}deg`, `${p.rotateStart + 200}deg`] });
        return (
          <Animated.Text key={i} style={{ position: 'absolute', left: p.x, fontSize: 22, opacity, transform: [{ translateY }, { rotate }] }}>
            {p.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

export default function GrowScreen() {
  const { foodId, reaction, xp, improved, leveledUp } = useLocalSearchParams<{
    foodId: string; reaction: ReactionType; xp: string; improved: string; leveledUp: string;
  }>();
  const child = useChildStore(s => s.child);
  const pop = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  }, [pop]);

  const praise = useMemo(() => PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)], []);

  if (!child) {
    return <SafeAreaView style={s.container} />;
  }

  const food = FOODS.find(f => f.id === foodId);
  const xpGained = Number(xp) || 0;
  const wasImproved = improved === '1';
  const didLevelUp = leveledUp === '1';
  const meta = reaction ? REACTION_META[reaction] : null;

  const { stage, next } = stageForXP(child.buddyXP);
  const xpIntoStage = child.buddyXP - stage.minXP;
  const xpSpan = next ? next.minXP - stage.minXP : 1;
  const pct = next ? Math.min(100, Math.round((xpIntoStage / xpSpan) * 100)) : 100;

  const finish = () => router.replace('/(tabs)/today');

  return (
    <SafeAreaView style={s.container}>
      <Confetti />
      <View style={s.content}>
        <View style={s.praisePill}>
          <Text style={s.praisePillText}>🎉 {praise}</Text>
        </View>

        <Animated.Text style={[s.buddyEmoji, { transform: [{ scale: pop }] }]}>{stage.emoji}</Animated.Text>
        <Text style={s.title}>{child.name}'s buddy grew bigger!</Text>
        <Text style={s.sub}>
          {food && meta ? `${meta.emoji} ${meta.label} — ${food.name}` : 'Logged today’s try'} · +{xpGained} XP
        </Text>

        {wasImproved && (
          <View style={s.improvedBanner}>
            <Text style={s.improvedBannerText}>📈 Improved from yesterday!</Text>
          </View>
        )}

        <View style={s.levelCard}>
          {didLevelUp ? (
            <Text style={s.levelUpText}>🎊 Level up! Now a {stage.name}</Text>
          ) : (
            <Text style={s.levelUpText}>{stage.name} · {child.buddyXP} XP</Text>
          )}
          <View style={s.xpBar}>
            <View style={[s.xpFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.xpToNext}>
            {next ? `${next.minXP - child.buddyXP} more XP until ${child.name}'s buddy becomes a ${next.name} ${next.emoji}` : 'Top stage reached! 🌟'}
          </Text>
        </View>

        <View style={s.streakBanner}>
          <Text style={s.streakBannerText}>
            {child.streak > 0 ? `🔥 ${child.streak}-day streak! Come back tomorrow` : 'Start a new streak today! 💪'}
          </Text>
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={finish} activeOpacity={0.85}>
          <Text style={s.btnText}>Done for today ✓</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  praisePill: { backgroundColor: COLORS.orangePale, borderRadius: RADIUS.full, paddingHorizontal: 18, paddingVertical: 10, marginBottom: 24 },
  praisePillText: { fontSize: 14, fontWeight: '800', color: COLORS.orangeD },
  buddyEmoji: { fontSize: 96, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, fontWeight: '700', color: COLORS.text2, marginBottom: 16, textAlign: 'center' },
  improvedBanner: { backgroundColor: COLORS.greenPale, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16 },
  improvedBannerText: { fontSize: 13, fontWeight: '800', color: COLORS.greenD },
  levelCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, width: '100%', marginBottom: 14, ...SHADOW.card },
  levelUpText: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  xpBar: { height: 12, backgroundColor: COLORS.border, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: COLORS.green, minWidth: 6 },
  xpToNext: { fontSize: 12, fontWeight: '600', color: COLORS.text3, textAlign: 'center' },
  streakBanner: { backgroundColor: COLORS.yellowPale, borderRadius: RADIUS.lg, padding: 14, width: '100%', marginBottom: 24 },
  streakBannerText: { fontSize: 13, fontWeight: '800', color: '#92400E', textAlign: 'center' },
  btnPrimary: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 18, width: '100%', alignItems: 'center', ...SHADOW.big },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
});
