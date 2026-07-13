import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../src/constants/colors';

const SECTIONS = [
  {
    heading: null,
    body: 'Tumby is a feeding-guidance app designed to help parents and caregivers introduce new foods to picky eaters. This policy explains what information Tumby collects, how it\'s used, and how you can control or delete it.\n\nTumby uses Google Firebase (Authentication and Cloud Firestore) as its only third-party infrastructure. There is no advertising network, no analytics SDK, and no data broker involved.',
  },
  {
    heading: '1. Who this app is for',
    body: 'Tumby is intended to be used by parents and caregivers, not directly by children. Account registration, food logging, and all settings are operated by an adult on behalf of their child.',
  },
  {
    heading: '2. Information we collect',
    body: 'Account: Email address, used to create and sign in to your account. You can sign in with an email and password, with Google, or with Apple. Passwords and the Google/Apple sign-in exchange are handled entirely by Google Firebase Authentication — we never see or store your password. If you use Sign in with Apple, you may choose to hide your email, in which case Apple provides a private relay address.\n\nChild profile (provided by you): Child\'s first name or nickname, age, avatar emoji, and any food allergies you choose to flag (optional). We recommend using a nickname rather than a full legal name.\n\nApp usage: Foods added to meal slots, reactions logged (refused/licked/bit/ate/loved), dates, daily streak count, buddy XP and level progress, recipes you save.\n\nWhat we do NOT collect: Location, camera, microphone, photos, contacts, advertising identifiers, analytics, or crash data of any kind.',
  },
  {
    heading: '3. How your data is stored',
    body: 'Your account and app data (child profile, food logs, meal plans, buddy progress) are stored in Google Cloud Firestore. A small session cache is kept locally on your device via AsyncStorage so you stay logged in between app launches. This local cache does not contain your child\'s food history — that lives in your cloud account.',
  },
  {
    heading: '4. Third-party processors',
    body: 'Tumby uses Google Firebase (Authentication and Cloud Firestore) purely as backend infrastructure. Firebase does not receive your data for its own advertising or analytics purposes under this configuration.\n\nWe do not use any other third-party SDK, analytics platform, or advertising network.',
  },
  {
    heading: '5. We do not sell or share your data',
    body: 'We do not sell your data, or your child\'s data, to anyone. We do not share it with third parties for marketing or advertising purposes.',
  },
  {
    heading: '6. Children\'s Privacy (COPPA)',
    body: 'Tumby is designed for use by parents and caregivers, not by children. Account creation requires an email and password entered by an adult. The child does not interact with sign-up or account settings.\n\nChild profile information is provided voluntarily by the parent, solely to personalise in-app suggestions — it is not used to contact, market to, or identify the child outside the app.\n\nIf you believe a child has independently created an account without parental involvement, please contact us and we will delete it promptly.',
  },
  {
    heading: '7. Your rights',
    body: 'Edit: Child profile details and allergies can be updated any time in Settings.\n\nDelete a child\'s data: Settings → tap 🗑️ next to a child\'s name.\n\nDelete your entire account: Settings → Delete Account & All Data. This permanently removes your Firebase account and all associated data. This cannot be undone.\n\nAccess/export: Contact us using the details below if you want a copy of your data.',
  },
  {
    heading: '8. Security',
    body: 'Authentication is handled by Google Firebase Authentication and data is stored in Cloud Firestore, both using industry-standard encryption in transit and at rest.',
  },
  {
    heading: '9. Changes to this policy',
    body: 'If we make material changes we\'ll update the "Last updated" date above and, where appropriate, notify you in the app.',
  },
  {
    heading: '10. Contact',
    body: 'Questions about this policy or your data? Go to Settings → Contact / Support.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Privacy Policy</Text>
        <Text style={s.updated}>Last updated: see app version in Settings</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((sec, i) => (
          <View key={i} style={s.section}>
            {sec.heading && <Text style={s.heading}>{sec.heading}</Text>}
            <Text style={s.body}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { alignSelf: 'flex-start', backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 12, ...SHADOW.card },
  backText: { color: COLORS.text2, fontWeight: '700', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  updated: { fontSize: 12, fontWeight: '600', color: COLORS.text3 },
  scroll: { padding: 20, paddingBottom: 48 },
  section: { marginBottom: 22 },
  heading: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  body: { fontSize: 14, color: COLORS.text2, fontWeight: '500', lineHeight: 22 },
});
