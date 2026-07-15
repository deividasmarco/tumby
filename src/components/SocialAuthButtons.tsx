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

// Routing after sign-in is handled centrally in app/_layout.tsx (based on auth
// state), so this component only performs the sign-in.
export default function SocialAuthButtons() {
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
      AppleAuthentication.isAvailableAsync()
        .then((available) => {
          console.log('[SocialAuth] Apple sign-in available:', available);
          setAppleAvailable(available);
        })
        .catch((e) => {
          // Usually means the native module/entitlement isn't in this build —
          // rebuild with `eas build --profile development --platform ios`.
          console.warn('[SocialAuth] Apple isAvailableAsync failed (native module missing — rebuild needed):', e);
          setAppleAvailable(false);
        });
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        setBusy('google');
        signInWithGoogle(idToken)
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

      await signInWithApple(credential.identityToken, rawNonce, fullName);
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
  // Full width + self-contained so it renders identically whether the parent
  // stretches (login) or centers (welcome) its children.
  wrap: { width: '100%', marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: '700', color: COLORS.text3 },
  // Google and Apple share the same footprint (height/width/radius) for equal
  // prominence per Apple Guideline 4.8.
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', height: 52,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, marginBottom: 12,
  },
  googleBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  appleBtn: { height: 52, width: '100%' },
  error: { color: COLORS.red, fontSize: 13, fontWeight: '700', marginTop: 12, textAlign: 'center' },
});
