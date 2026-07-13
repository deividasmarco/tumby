// Google OAuth client IDs for expo-auth-session.
//
// WHERE TO GET EACH (Firebase project: yumly-70372):
//
// GOOGLE_WEB_CLIENT_ID  (required — Firebase validates the ID token against this)
//   Firebase Console → Authentication → Sign-in method → Google → expand →
//   "Web SDK configuration" → "Web client ID".
//   (Same as Google Cloud Console → APIs & Services → Credentials →
//    "Web client (auto created by Google Service)".)
//
// GOOGLE_IOS_CLIENT_ID  (required for iOS)
//   Firebase Console → Project settings → Your apps → the iOS app →
//   download GoogleService-Info.plist → value of the `CLIENT_ID` key.
//   (Or Google Cloud Console → Credentials → the "iOS client".)
//
// GOOGLE_ANDROID_CLIENT_ID  (required for Android; needs SHA-1 registered — see README notes)
//   Google Cloud Console → Credentials → the "Android client".
//
// GOOGLE_IOS_URL_SCHEME  (required for iOS redirect)
//   The `REVERSED_CLIENT_ID` value in GoogleService-Info.plist
//   (looks like com.googleusercontent.apps.NNN-xxxx). Also add it to
//   app.json → ios.infoPlist CFBundleURLTypes (already scaffolded there).

export const GOOGLE_WEB_CLIENT_ID = '513060506294-ipm4ub9vj5llqhm4md6a85f1nbbcc8of.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '513060506294-m6nph1v5qbejje13vpp7q9dt3f5dimr8.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'TODO_ANDROID_CLIENT_ID.apps.googleusercontent.com';

// Apple provider (configured entirely in Firebase console — no secret in the app):
//   Services ID: com.tumbyapp.tumby.signin
//   Enabled Firebase provider handles the token exchange.
export const APPLE_ENABLED = true;

import { Platform } from 'react-native';

export function isGoogleConfigured(): boolean {
  if (GOOGLE_WEB_CLIENT_ID.startsWith('TODO')) return false;
  const native = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID;
  return !native.startsWith('TODO');
}
