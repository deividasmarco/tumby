import { create } from 'zustand';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { User } from '@firebase/auth';
import { db } from '../services/firebase';
import {
  subscribeAuthState,
  registerWithEmail,
  loginWithEmail,
  logout as logoutService,
  resetPassword as resetPasswordService,
  createUserDoc,
  getUserDoc,
  ensureUserDoc,
  setCurrentChildId as setCurrentChildIdService,
  createChildDoc,
  deleteChildDoc,
  callDeleteAccount,
  signInWithGoogleIdToken,
  signInWithAppleCredential,
} from '../services/auth.service';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { ChildDoc, UserDoc } from '../types';

interface AuthState {
  user: User | null;
  userDoc: UserDoc | null;
  currentChildId: string | null;
  children: ChildDoc[];
  initializing: boolean;

  initAuthListener: () => () => void;
  register: (email: string, password: string, childName: string, age: number, avatarEmoji: string, safeFoods: string[], allergens: string[]) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  // Social sign-in. Returns true if the signed-in user already has at least one
  // child (→ go to app), false if they're new and need onboarding.
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signInWithApple: (identityToken: string, rawNonce: string, fullName: string | null) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loadChildrenForCurrentUser: () => Promise<void>;
  addChild: (name: string, age: number, avatarEmoji: string, safeFoods: string[], allergens: string[]) => Promise<void>;
  switchChild: (childId: string) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

async function deleteDocsInChunks(docs: QueryDocumentSnapshot[]) {
  // Firestore batches cap at 500 ops — chunk to stay safely under.
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

// Deletes every doc in `coll` belonging to a single child (queried by childId).
// Returns the number deleted. Throws with the collection/childId in the message
// so callers can log exactly where a failure happened.
async function deleteCollectionForChild(coll: 'foodLogs' | 'mealPlans', childId: string): Promise<number> {
  const snap = await getDocs(query(collection(db, coll), where('childId', '==', childId)));
  await deleteDocsInChunks(snap.docs);
  return snap.size;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userDoc: null,
  currentChildId: null,
  children: [],
  initializing: true,

  initAuthListener: () => {
    return subscribeAuthState(async (user) => {
      if (user) {
        try {
          const userDoc = await getUserDoc(user.uid);
          set({ user, userDoc, currentChildId: userDoc?.currentChildId ?? null });
          await get().loadChildrenForCurrentUser();
        } catch (e) {
          // Never let a startup read error crash the app — sign in still succeeds.
          console.warn('[initAuthListener] load failed after sign-in:', e);
          set({ user, userDoc: null, currentChildId: null, children: [] });
        } finally {
          // Flip initializing AFTER children are loaded so routing decisions
          // (has a child → app, no child → onboarding) have full information.
          set({ initializing: false });
        }
      } else {
        set({ user: null, userDoc: null, currentChildId: null, children: [], initializing: false });
      }
    });
  },

  register: async (email, password, childName, age, avatarEmoji, safeFoods, allergens) => {
    const user = await registerWithEmail(email, password);
    await createUserDoc(user.uid, email);
    const childId = await createChildDoc(user.uid, childName, age, avatarEmoji, safeFoods, allergens);
    await setCurrentChildIdService(user.uid, childId);
    const userDoc = await getUserDoc(user.uid);
    set({ user, userDoc, currentChildId: childId });
    await get().loadChildrenForCurrentUser();
  },

  login: async (email, password) => {
    const user = await loginWithEmail(email, password);
    const userDoc = await getUserDoc(user.uid);
    set({ user, userDoc, currentChildId: userDoc?.currentChildId ?? null });
    await get().loadChildrenForCurrentUser();
  },

  signInWithGoogle: async (idToken) => {
    const user = await signInWithGoogleIdToken(idToken);
    await ensureUserDoc(user.uid, { email: user.email, displayName: user.displayName, provider: 'google.com' });
    const userDoc = await getUserDoc(user.uid);
    set({ user, userDoc, currentChildId: userDoc?.currentChildId ?? null });
    await get().loadChildrenForCurrentUser();
    return get().children.length > 0;
  },

  signInWithApple: async (identityToken, rawNonce, fullName) => {
    const user = await signInWithAppleCredential(identityToken, rawNonce);
    // Apple returns the name only on the FIRST sign-in — capture it now.
    await ensureUserDoc(user.uid, {
      email: user.email,
      displayName: fullName || user.displayName,
      provider: 'apple.com',
    });
    const userDoc = await getUserDoc(user.uid);
    set({ user, userDoc, currentChildId: userDoc?.currentChildId ?? null });
    await get().loadChildrenForCurrentUser();
    return get().children.length > 0;
  },

  logout: async () => {
    await logoutService();
    set({ user: null, userDoc: null, currentChildId: null, children: [] });
  },

  resetPassword: async (email) => {
    await resetPasswordService(email);
  },

  loadChildrenForCurrentUser: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const q = query(collection(db, 'children'), where('parentId', '==', user.uid));
      const snap = await getDocs(q);
      const children: ChildDoc[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ChildDoc, 'id'>) }));
      set({ children });
    } catch (e) {
      console.warn('[loadChildrenForCurrentUser] failed:', e);
      set({ children: [] });
    }
  },

  addChild: async (name, age, avatarEmoji, safeFoods, allergens) => {
    const { user } = get();
    if (!user) return;
    const childId = await createChildDoc(user.uid, name, age, avatarEmoji, safeFoods, allergens);
    await setCurrentChildIdService(user.uid, childId);
    set({ currentChildId: childId });
    await get().loadChildrenForCurrentUser();
  },

  switchChild: async (childId) => {
    const { user } = get();
    if (!user) return;
    await setCurrentChildIdService(user.uid, childId);
    set({ currentChildId: childId });
  },

  deleteChild: async (childId) => {
    const { user, children, currentChildId } = get();
    if (!user) return;
    // Order matters: delete a child's sub-data BEFORE the child doc, because the
    // security rules authorize sub-data by the child's ownership.
    await deleteCollectionForChild('foodLogs', childId);
    await deleteCollectionForChild('mealPlans', childId);
    await deleteChildDoc(childId);
    const remaining = children.filter(c => c.id !== childId);
    let nextCurrentId = currentChildId;
    if (currentChildId === childId) {
      nextCurrentId = remaining[0]?.id ?? null;
      if (nextCurrentId) {
        await setCurrentChildIdService(user.uid, nextCurrentId);
      }
    }
    set({ children: remaining, currentChildId: nextCurrentId });
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) return;
    // The Cloud Function deletes all Firestore data AND the auth record with
    // Admin privileges — no client-side re-authentication required.
    console.log('[deleteAccount] → calling deleteAccount Cloud Function');
    await callDeleteAccount();
    console.log('[deleteAccount] ✓ server deletion complete');
    // Clear the (now-deleted) local session.
    try {
      await logoutService();
    } catch {
      // The auth record is already gone server-side; ignore local sign-out errors.
    }
    set({ user: null, userDoc: null, currentChildId: null, children: [] });
    console.log('[deleteAccount] ✓✓ complete — account and all data removed');
  },
}));
