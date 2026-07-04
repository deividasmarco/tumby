import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../src/constants/colors';

const SECTIONS = [
  {
    heading: null,
    body: 'These Terms of Use govern your use of the Yumly mobile app. By creating an account or using Yumly, you agree to these Terms.',
  },
  {
    heading: '1. Who can use Yumly',
    body: 'Yumly is intended for use by parents and caregivers on behalf of their children. You must be an adult capable of forming a binding contract to create an account.',
  },
  {
    heading: '2. Not medical advice',
    body: 'Yumly provides general, educational guidance about introducing foods to picky eaters, based on common feeding research. It is not medical advice, and it does not diagnose, treat, or cure any medical condition, allergy, or feeding disorder.\n\nAlways consult your pediatrician, allergist, or a qualified feeding specialist about your child\'s nutrition, allergies, or feeding concerns — especially if your child has a known medical condition, allergy, or feeding disorder.\n\nAllergy flags you set in the app are a convenience filter; they are not a medical record and do not replace professional medical guidance.',
  },
  {
    heading: '3. Your account',
    body: 'You\'re responsible for keeping your login credentials secure and for all activity under your account. If you believe your account has been compromised, contact us via Settings → Contact / Support.',
  },
  {
    heading: '4. Your content',
    body: 'Information you enter (child\'s name/nickname, age, allergies, food logs, saved recipes) belongs to you. We store it solely to operate the app, as described in our Privacy Policy. You can edit or delete it at any time from within the app.',
  },
  {
    heading: '5. Acceptable use',
    body: 'You agree not to:\n• Use Yumly for any purpose other than personal, non-commercial feeding guidance for your own family\n• Attempt to interfere with, disrupt, or gain unauthorized access to the app or its backend services\n• Use the app to collect or store data about a child other than your own without that child\'s parent\'s consent',
  },
  {
    heading: '6. No warranty',
    body: 'Yumly is provided "as is," without warranties of any kind, express or implied. We do not guarantee that the app will be uninterrupted, error-free, or that following its suggestions will produce any particular feeding outcome.',
  },
  {
    heading: '7. Limitation of liability',
    body: 'To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app, including any feeding or health-related decisions made based on in-app content. This does not limit any liability that cannot be excluded under applicable law.',
  },
  {
    heading: '8. Changes',
    body: 'We may update Yumly or these Terms from time to time. Material changes will be reflected in the in-app Terms screen.',
  },
  {
    heading: '9. Termination',
    body: 'You may stop using Yumly and delete your account at any time from Settings → Delete Account & All Data. We may suspend or terminate accounts that violate these Terms.',
  },
  {
    heading: '10. Contact',
    body: 'Questions about these Terms? Go to Settings → Contact / Support.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Terms of Use</Text>
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
