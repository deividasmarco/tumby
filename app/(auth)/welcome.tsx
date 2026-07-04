import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../../src/constants/colors';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.logo}>🥦</Text>
        <Text style={s.title}>Yumly</Text>
        <Text style={s.tagline}>Helping picky eaters,{'\n'}one bite at a time 🌱</Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(auth)/register')} activeOpacity={0.85}>
          <Text style={s.btnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.loginLink} onPress={() => router.push('/(auth)/login')}>
          <Text style={s.loginLinkText}>Already have an account? <Text style={{ fontWeight: '800', color: COLORS.orange }}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { flex: 1, padding: 28, alignItems: 'center', paddingTop: 80, paddingBottom: 32 },
  logo: { fontSize: 88, marginBottom: 16 },
  title: { fontSize: 38, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  tagline: { fontSize: 16, fontWeight: '600', color: COLORS.text2, textAlign: 'center', lineHeight: 24 },
  btnPrimary: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center', width: '100%', marginBottom: 14, ...SHADOW.big },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  loginLink: { alignItems: 'center', padding: 8 },
  loginLinkText: { fontSize: 14, fontWeight: '600', color: COLORS.text2 },
});
