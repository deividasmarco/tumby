import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import SocialAuthButtons from '../../src/components/SocialAuthButtons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const resetPassword = useAuthStore(s => s.resetPassword);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/today');
    } catch (e: any) {
      setError(e?.message ?? 'Could not log in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Enter your email above first.');
      return;
    }
    try {
      await resetPassword(email.trim());
      setInfo('Password reset email sent!');
    } catch (e: any) {
      setError(e?.message ?? 'Could not send reset email.');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.logo}>🥦</Text>
        <Text style={s.heading}>Welcome back</Text>

        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={COLORS.text3} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} placeholder="Your password" placeholderTextColor={COLORS.text3} value={password} onChangeText={setPassword} secureTextEntry />

        {!!error && <Text style={s.error}>{error}</Text>}
        {!!info && <Text style={s.info}>{info}</Text>}

        <TouchableOpacity style={s.btnPrimary} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnText}>Log In</Text>}
        </TouchableOpacity>

        <SocialAuthButtons />

        <TouchableOpacity style={s.forgotLink} onPress={forgotPassword}>
          <Text style={s.forgotLinkText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
          <Text style={s.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { flex: 1, padding: 28, paddingTop: 60 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  heading: { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  input: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 16, fontSize: 16, fontWeight: '700', color: COLORS.text },
  error: { color: COLORS.red, fontSize: 13, fontWeight: '700', marginTop: 14 },
  info: { color: COLORS.green, fontSize: 13, fontWeight: '700', marginTop: 14 },
  btnPrimary: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center', marginTop: 24, ...SHADOW.card },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  forgotLink: { alignItems: 'center', padding: 14, marginTop: 4 },
  forgotLinkText: { color: COLORS.orange, fontSize: 14, fontWeight: '700' },
  backLink: { alignItems: 'center', padding: 8 },
  backLinkText: { color: COLORS.text3, fontSize: 14, fontWeight: '700' },
});
