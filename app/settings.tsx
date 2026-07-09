import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert, Linking, Switch, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../src/constants/colors';
import { FOODS } from '../src/constants/foods';
import { ALLERGENS, allergenLabel } from '../src/constants/allergens';
import { MEDICAL_DISCLAIMER } from '../src/legal/disclaimer';
import { SUPPORT_EMAIL } from '../src/legal/contact';
import { useAuthStore } from '../src/stores/authStore';
import { useChildStore } from '../src/stores/childStore';

const AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const AVATARS = ['🐯', '🦊', '🐸', '🐼', '🦁', '🐨'];
const SEED_FOOD_IDS = ['banana', 'apple', 'chicken', 'pasta', 'cheese', 'rice', 'bread', 'yogurt', 'egg', 'peanutbutter'];
const SEED_FOODS = FOODS.filter(f => SEED_FOOD_IDS.includes(f.id));

import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { children, currentChildId, switchChild, addChild, deleteChild, deleteAccount, logout } = useAuthStore();
  const { child: activeChild, loadChild, setAllergens } = useChildStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(2);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [safeFoods, setSafeFoods] = useState<string[]>([]);
  const [newChildAllergens, setNewChildAllergens] = useState<string[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('tumby_reminders').then(v => { if (v === 'true') setRemindersEnabled(true); });
  }, []);

  const toggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await AsyncStorage.setItem('tumby_reminders', value ? 'true' : 'false');
    // Note: actual push notification scheduling requires expo-notifications
    // and a native EAS build. This stores the preference for when that is added.
  };

  const toggleFood = (id: string) =>
    setSafeFoods(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id]);

  const toggleNewChildAllergen = (id: string) =>
    setNewChildAllergens(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id]);

  const toggleActiveChildAllergen = (id: string) => {
    if (!activeChild) return;
    const current = activeChild.allergens ?? [];
    const next = current.includes(id) ? current.filter(a => a !== id) : [...current, id];
    setAllergens(next);
  };

  const handleSwitch = async (childId: string) => {
    if (childId === currentChildId) {
      router.back();
      return;
    }
    await switchChild(childId);
    await loadChild(childId);
    router.replace('/(tabs)/today');
  };

  const handleAddChild = async () => {
    if (!name) return;
    await addChild(name, age, avatar, safeFoods, newChildAllergens);
    const { currentChildId: newId } = useAuthStore.getState();
    if (newId) {
      await loadChild(newId);
      router.replace('/(tabs)/today');
    }
  };

  const handleDeleteChild = (childId: string, childName: string) => {
    Alert.alert(
      `Delete ${childName}'s data?`,
      'This permanently deletes this child\'s profile, food logs, and meal plans. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChild(childId);
            const { currentChildId: nextId } = useAuthStore.getState();
            if (nextId) {
              await loadChild(nextId);
              router.replace('/(tabs)/today');
            } else {
              router.replace('/(auth)/welcome');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => setDeleteModalOpen(true);

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'delete') return;
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteModalOpen(false);
      setDeleteConfirmText('');
      router.replace('/(auth)/welcome');
    } catch (e: any) {
      const code = e?.code ?? '';
      let msg = e?.message ?? 'Please try again.';
      if (code === 'permission-denied') {
        msg = `Permission error while deleting your data (${e?.step ?? 'unknown step'}). Your Firestore rules may need republishing. Details are in the console log.`;
      }
      Alert.alert('Could not delete account', msg, [{ text: 'OK' }]);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You\'ll need to log back in to access your data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const openPrivacy = () => router.push('/privacy' as any);
  const openTerms = () => router.push('/terms' as any);
  const openSupport = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Tumby Support`);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Settings</Text>

        {/* Children */}
        <Text style={s.sectionLabel}>CHILDREN</Text>
        {children.map(c => (
          <View key={c.id} style={[s.childRow, c.id === currentChildId && s.childRowActive]}>
            <TouchableOpacity style={s.childRowMain} onPress={() => handleSwitch(c.id)}>
              <Text style={{ fontSize: 28 }}>{c.avatarEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.childName}>{c.name}</Text>
                <Text style={s.childMeta}>Age {c.age} · {c.buddyXP} XP</Text>
              </View>
              {c.id === currentChildId && <Text style={{ color: COLORS.orange, fontWeight: '800' }}>✓ Active</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteChildBtn} onPress={() => handleDeleteChild(c.id, c.name)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        ))}

        {!adding ? (
          <TouchableOpacity style={s.addBtn} onPress={() => setAdding(true)}>
            <Text style={s.addBtnText}>+ Add another child</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.addForm}>
            <Text style={s.label}>Child's name</Text>
            <TextInput style={s.input} placeholder="e.g. Dominic" placeholderTextColor={COLORS.text3} value={name} onChangeText={setName} />
            <Text style={s.label}>Age</Text>
            <View style={s.row}>
              {AGES.map(a => (
                <TouchableOpacity key={a} style={[s.chip, age === a && s.chipOn]} onPress={() => setAge(a)}>
                  <Text style={[s.chipText, age === a && { color: COLORS.white }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Avatar</Text>
            <View style={s.row}>
              {AVATARS.map(a => (
                <TouchableOpacity key={a} style={[s.avatarChip, avatar === a && s.avatarChipOn]} onPress={() => setAvatar(a)}>
                  <Text style={{ fontSize: 24 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Known allergies (optional)</Text>
            <View style={s.row}>
              {ALLERGENS.map(a => (
                <TouchableOpacity key={a.id} style={[s.allergenChip, newChildAllergens.includes(a.id) && s.allergenChipOn]} onPress={() => toggleNewChildAllergen(a.id)}>
                  <Text style={{ fontSize: 14 }}>{a.emoji}</Text>
                  <Text style={[s.allergenChipText, newChildAllergens.includes(a.id) && { color: COLORS.white }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Foods they already eat</Text>
            <View style={s.foodGrid}>
              {SEED_FOODS.map(f => (
                <TouchableOpacity key={f.id} style={[s.foodChip, safeFoods.includes(f.id) && s.foodChipOn]} onPress={() => toggleFood(f.id)}>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                  <Text style={s.foodName} numberOfLines={1}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.btnPrimary, !name && { opacity: 0.4 }]} onPress={handleAddChild} disabled={!name}>
              <Text style={s.btnText}>Create Buddy 🐣</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAdding(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Allergies for active child */}
        {activeChild && (
          <>
            <Text style={s.sectionLabel}>{activeChild.name.toUpperCase()}'S ALLERGIES</Text>
            <View style={s.card}>
              <Text style={s.cardHint}>Foods matching these are filtered out of suggestions.</Text>
              <View style={s.row}>
                {ALLERGENS.map(a => {
                  const on = (activeChild.allergens ?? []).includes(a.id);
                  return (
                    <TouchableOpacity key={a.id} style={[s.allergenChip, on && s.allergenChipOn]} onPress={() => toggleActiveChildAllergen(a.id)}>
                      <Text style={{ fontSize: 14 }}>{a.emoji}</Text>
                      <Text style={[s.allergenChipText, on && { color: COLORS.white }]}>{a.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {(activeChild.allergens ?? []).length > 0 && (
                <Text style={s.allergenSummary}>
                  Flagged: {(activeChild.allergens ?? []).map(allergenLabel).join(', ')}
                </Text>
              )}
            </View>
          </>
        )}

        {/* Medical disclaimer */}
        <Text style={s.sectionLabel}>IMPORTANT</Text>
        <View style={s.disclaimerCard}>
          <Text style={s.disclaimerText}>{MEDICAL_DISCLAIMER}</Text>
        </View>

        {/* Reminders */}
        <Text style={s.sectionLabel}>REMINDERS</Text>
        <View style={s.card}>
          <View style={s.linkRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.linkRowText}>Daily check-in reminder</Text>
              <Text style={s.linkRowSub}>"Did your child try something new today?"</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: COLORS.border, true: COLORS.orangeMid }}
              thumbColor={remindersEnabled ? COLORS.orange : COLORS.white}
            />
          </View>
          {remindersEnabled && (
            <Text style={s.reminderNote}>
              ℹ️ Notifications will activate once the full app version is installed.
            </Text>
          )}
        </View>

        {/* Legal */}
        <Text style={s.sectionLabel}>LEGAL</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.linkRow} onPress={openPrivacy}>
            <Text style={s.linkRowText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text3} />
          </TouchableOpacity>
          <View style={s.linkDivider} />
          <TouchableOpacity style={s.linkRow} onPress={openTerms}>
            <Text style={s.linkRowText}>Terms of Use</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text3} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <Text style={s.sectionLabel}>SUPPORT</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.linkRow} onPress={openSupport}>
            <Text style={s.linkRowText}>Contact / Support</Text>
            <Ionicons name="mail-outline" size={18} color={COLORS.text3} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={s.sectionLabel}>ABOUT</Text>
        <View style={s.card}>
          <Text style={s.versionText}>Tumby version {APP_VERSION}</Text>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutBtnText}>Log out</Text>
        </TouchableOpacity>

        {/* Danger zone */}
        <Text style={[s.sectionLabel, { color: COLORS.red }]}>DANGER ZONE</Text>
        <TouchableOpacity style={s.deleteAccountBtn} onPress={handleDeleteAccount}>
          <Text style={s.deleteAccountBtnText}>Delete Account & All Data</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete account confirmation modal (password required to re-authenticate) */}
      <Modal
        visible={deleteModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => { if (!deleting) { setDeleteModalOpen(false); setDeleteConfirmText(''); } }}
      >
        <View style={s.modalOverlay}>
          <View style={s.deleteModal}>
            <Text style={s.deleteModalTitle}>Delete account & all data?</Text>
            <Text style={s.deleteModalBody}>
              This permanently deletes your account, every child profile, and all food logs and meal plans. This cannot be undone.
            </Text>
            <Text style={s.deleteModalLabel}>Type DELETE to confirm</Text>
            <TextInput
              style={s.deleteModalInput}
              placeholder="delete"
              placeholderTextColor={COLORS.text3}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[s.deleteModalConfirm, (deleteConfirmText.trim().toLowerCase() !== 'delete' || deleting) && { opacity: 0.5 }]}
              onPress={confirmDeleteAccount}
              disabled={deleteConfirmText.trim().toLowerCase() !== 'delete' || deleting}
            >
              {deleting
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={s.deleteModalConfirmText}>Delete Everything</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.deleteModalCancel}
              onPress={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
              disabled={deleting}
            >
              <Text style={s.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: 20, paddingBottom: 48 },
  back: { alignSelf: 'flex-start', backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 16, ...SHADOW.card },
  backText: { color: COLORS.text2, fontWeight: '700', fontSize: 14 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 22 },
  childRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginBottom: 10, ...SHADOW.card },
  childRowActive: { borderWidth: 2, borderColor: COLORS.orange },
  childRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  childName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  childMeta: { fontSize: 12, fontWeight: '600', color: COLORS.text3 },
  deleteChildBtn: { padding: 14 },
  addBtn: { borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginTop: 6 },
  addBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.text3 },
  addForm: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, marginTop: 12, ...SHADOW.card },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: COLORS.cream, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 15, fontWeight: '700', color: COLORS.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: 40, height: 40, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  avatarChip: { width: 48, height: 48, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' },
  avatarChipOn: { backgroundColor: COLORS.orangePale, borderColor: COLORS.orange },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodChip: { width: 70, backgroundColor: COLORS.cream, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 8, alignItems: 'center', gap: 2 },
  foodChipOn: { backgroundColor: COLORS.greenPale, borderColor: COLORS.green },
  foodName: { fontSize: 9, fontWeight: '700', color: COLORS.text2 },
  allergenChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.cream },
  allergenChipOn: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  allergenChipText: { fontSize: 12, fontWeight: '700', color: COLORS.text2 },
  allergenSummary: { fontSize: 12, fontWeight: '700', color: COLORS.red, marginTop: 10 },
  btnPrimary: { backgroundColor: COLORS.orange, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginTop: 18 },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', padding: 12, marginTop: 4 },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.text3 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, ...SHADOW.card },
  cardHint: { fontSize: 12, fontWeight: '600', color: COLORS.text3, marginBottom: 12 },
  disclaimerCard: { backgroundColor: COLORS.orangePale, borderRadius: RADIUS.lg, padding: 16 },
  disclaimerText: { fontSize: 13, color: COLORS.text2, fontWeight: '600', lineHeight: 20 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  linkRowText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  linkRowSub: { fontSize: 11, fontWeight: '600', color: COLORS.text3, marginTop: 2 },
  reminderNote: { fontSize: 12, fontWeight: '600', color: COLORS.text3, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  linkDivider: { height: 1, backgroundColor: COLORS.border },
  versionText: { fontSize: 13, fontWeight: '600', color: COLORS.text2, textAlign: 'center' },
  logoutBtn: { alignItems: 'center', padding: 14, marginTop: 20 },
  logoutBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.text2 },
  deleteAccountBtn: { backgroundColor: COLORS.redPale, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center' },
  deleteAccountBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.red },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 28 },
  deleteModal: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 22 },
  deleteModalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  deleteModalBody: { fontSize: 13, fontWeight: '600', color: COLORS.text2, lineHeight: 19, marginBottom: 16 },
  deleteModalLabel: { fontSize: 11, fontWeight: '800', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  deleteModalInput: { backgroundColor: COLORS.cream, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  deleteModalConfirm: { backgroundColor: COLORS.red, borderRadius: RADIUS.lg, padding: 15, alignItems: 'center' },
  deleteModalConfirmText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  deleteModalCancel: { alignItems: 'center', padding: 12, marginTop: 4 },
  deleteModalCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.text3 },
});
