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
  reauthenticateCurrentUser,
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
  deleteAccount: (password: string) => Promise<void>;
}

async function deleteAllDocsForChild(childId: string) {
  const batch = writeBatch(db);

  const logsQ = query(collection(db, 'foodLogs'), where('childId', '==', childId));
  const logsSnap = await getDocs(logsQ);
  logsSnap.forEach(d => batch.delete(d.ref));

  const plansQ = query(collection(db, 'mealPlans'), where('childId', '==', childId));
  const plansSnap = await getDocs(plansQ);
  plansSnap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  await deleteChildDoc(childId);
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
    await deleteAllDocsForChild(childId);
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

  deleteAccount: async (password) => {
    const { user, children } = get();
    if (!user) return;
    // Re-authenticate first so deleteUser() cannot fail with
    // auth/requires-recent-login after data has already been wiped.
    await reauthenticateCurrentUser(password);
    for (const child of children) {
      await deleteAllDocsForChild(child.id);
    }
    await deleteUserDoc(user.uid);
    await deleteCurrentAuthUser();
    set({ user: null, userDoc: null, currentChildId: null, children: [] });
  },
}));
