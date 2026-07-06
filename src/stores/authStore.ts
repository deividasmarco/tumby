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
  setCurrentChildId as setCurrentChildIdService,
  createChildDoc,
  deleteChildDoc,
  deleteUserDoc,
  deleteCurrentAuthUser,
} from '../services/auth.service';
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
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loadChildrenForCurrentUser: () => Promise<void>;
  addChild: (name: string, age: number, avatarEmoji: string, safeFoods: string[], allergens: string[]) => Promise<void>;
  switchChild: (childId: string) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Deletes foodLogs + mealPlans owned by this parent. Queries by parentId so the
// security rules can authorize with a direct field check (no per-doc get(),
// which otherwise hits Firestore's ~20 get()/query limit on larger accounts).
// Pass childId to scope deletion to a single child; omit to wipe everything.
async function deleteLogsAndPlans(parentId: string, childId?: string) {
  const del = async (coll: string) => {
    const snap = await getDocs(query(collection(db, coll), where('parentId', '==', parentId)));
    const targets = snap.docs.filter(d => !childId || d.data().childId === childId);
    // Firestore batches cap at 500 ops — chunk to stay safely under.
    for (let i = 0; i < targets.length; i += 400) {
      const batch = writeBatch(db);
      targets.slice(i, i + 400).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  };
  await del('foodLogs');
  await del('mealPlans');
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
        const userDoc = await getUserDoc(user.uid);
        set({ user, userDoc, currentChildId: userDoc?.currentChildId ?? null, initializing: false });
        await get().loadChildrenForCurrentUser();
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
    const q = query(collection(db, 'children'), where('parentId', '==', user.uid));
    const snap = await getDocs(q);
    const children: ChildDoc[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ChildDoc, 'id'>) }));
    set({ children });
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
    await deleteLogsAndPlans(user.uid, childId);
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
    const { user, children } = get();
    if (!user) return;
    // Wipe all Firestore data first (while still authenticated).
    await deleteLogsAndPlans(user.uid);
    for (const child of children) {
      await deleteChildDoc(child.id);
    }
    await deleteUserDoc(user.uid);
    // Try to delete the auth record. Firebase blocks this on stale sessions
    // (auth/requires-recent-login) — in that case just sign out; the user's
    // data is already gone, which is what matters for a deletion request.
    try {
      await deleteCurrentAuthUser();
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') {
        await logoutService();
      } else {
        throw e;
      }
    }
    set({ user: null, userDoc: null, currentChildId: null, children: [] });
  },
}));
