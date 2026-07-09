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
          set({ user, userDoc, currentChildId: userDoc?.currentChildId ?? null, initializing: false });
          await get().loadChildrenForCurrentUser();
        } catch (e) {
          // Never let a startup read error crash the app — sign in still succeeds.
          console.warn('[initAuthListener] load failed after sign-in:', e);
          set({ user, userDoc: null, currentChildId: null, initializing: false });
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
    const { user, children } = get();
    if (!user) return;
    const uid = user.uid;

    // Wrap every step so we log exactly which operation fails and its error code.
    const run = async <T,>(step: string, fn: () => Promise<T>): Promise<T> => {
      try {
        console.log(`[deleteAccount] → ${step}`);
        const result = await fn();
        console.log(`[deleteAccount] ✓ ${step}`);
        return result;
      } catch (e: any) {
        console.error(`[deleteAccount] ✗ FAILED at "${step}" — code=${e?.code ?? 'n/a'} message=${e?.message ?? e}`);
        const wrapped = new Error(`Failed at: ${step}${e?.code ? ` (${e.code})` : ''}`);
        (wrapped as any).step = step;
        (wrapped as any).code = e?.code;
        throw wrapped;
      }
    };

    // 1. Each child's foodLogs (child docs must still exist here).
    for (const child of children) {
      await run(`delete foodLogs for child ${child.id}`, async () => {
        const n = await deleteCollectionForChild('foodLogs', child.id);
        console.log(`[deleteAccount]   removed ${n} foodLogs`);
      });
    }

    // 2. Each child's mealPlans.
    for (const child of children) {
      await run(`delete mealPlans for child ${child.id}`, async () => {
        const n = await deleteCollectionForChild('mealPlans', child.id);
        console.log(`[deleteAccount]   removed ${n} mealPlans`);
      });
    }

    // 3. Child docs.
    for (const child of children) {
      await run(`delete child doc ${child.id}`, () => deleteChildDoc(child.id));
    }

    // 4. User doc.
    await run('delete user doc', () => deleteUserDoc(uid));

    // 5. Auth account LAST — once this is gone we lose all Firestore permission.
    //    Firebase blocks deleteUser() on stale sessions (auth/requires-recent-login).
    //    All data is already gone at this point, so in that case we just sign out;
    //    the (data-less) login record is cleaned up on next sign-in attempt.
    try {
      await run('delete auth user', () => deleteCurrentAuthUser());
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') {
        console.log('[deleteAccount] auth deletion needs recent login — data already removed, signing out');
        await logoutService();
      } else {
        throw e;
      }
    }

    set({ user: null, userDoc: null, currentChildId: null, children: [] });
    console.log('[deleteAccount] ✓✓ complete — account and all data removed');
  },
}));
