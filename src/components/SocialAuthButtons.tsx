import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { COLORS, RADIUS } from '../constants/colors';
import {
  GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, isGoogleConfigured,
} from '../config/auth';
import { useAuthStore } from '../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

// hasChild=true → returning user (go to app); false → new user (onboarding)
type Props = { onSignedIn: (hasChild: boolean) => void };

export default function SocialAuthButtons({ onSignedIn }: Props) {
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle);
  const signInWithApple = useAuthStore(s => s.signInWithApple);
  const [busy, setBusy] = useState<null | 'google' | 'apple'>(null);
  const [error, setError] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        setBusy('google');
        signInWithGoogle(idToken)
          .then(onSignedIn)
          .catch((e: any) => setError(e?.message ?? 'Google sign-in failed.'))
          .finally(() => setBusy(null));
      }
    } else if (response?.type === 'error') {
      setError('Google sign-in was cancelled or failed.');
      setBusy(null);
    }
  }, [response]);

  const handleGoogle = async () => {
    setError('');
    if (!isGoogleConfigured()) {
      setError('Google sign-in isn\'t configured yet (missing client IDs).');
      return;
    }
    setBusy('google');
    try {
      await promptAsync();
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed.');
      setBusy(null);
    }
  };

  const handleApple = async () => {
    setError('');
    setBusy('apple');
    try {
      // Firebase Apple sign-in requires a nonce: Apple gets the SHA-256 hash,
      // Firebase gets the raw value.
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) throw new Error('No identity token returned from Apple.');

      const fullName = credential.fullName
        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim() || null
        : null;

      const hasChild = await signInWithApple(credential.identityToken, rawNonce, fullName);
      onSignedIn(hasChild);
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        // user cancelled — no error message needed
      } else {
        setError(e?.message ?? 'Apple sign-in failed.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.dividerRow}>
        <View style={s.divider} />
        <Text style={s.dividerText}>or</Text>
        <View style={s.divider} />
      </View>

      <TouchableOpacity
        style={s.googleBtn}
        onPress={handleGoogle}
        disabled={!request || busy !== null}
        activeOpacity={0.85}
      >
        {busy === 'google'
          ? <ActivityIndicator color={COLORS.text} />
          : (
            <>
              <Ionicons name="logo-google" size={18} color="#4285F4" />
              <Text style={s.googleBtnText}>Continue with Google</Text>
            </>
          )}
      </TouchableOpacity>

      {Platform.OS === 'ios' && appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={RADIUS.lg}
          style={s.appleBtn}
          onPress={handleApple}
        />
      )}

      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: '700', color: COLORS.text3 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 15, marginBottom: 12,
  },
  googleBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  appleBtn: { height: 50, width: '100%' },
  error: { color: COLORS.red, fontSize: 13, fontWeight: '700', marginTop: 12, textAlign: 'center' },
});
