import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  deleteUser,
  User,
} from '@firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ChildDoc, UserDoc } from '../types';

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function createUserDoc(uid: string, email: string): Promise<void> {
  const userDoc: UserDoc = { email, createdAt: Date.now(), currentChildId: null };
  await setDoc(doc(db, 'users', uid), userDoc);
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function setCurrentChildId(uid: string, childId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { currentChildId: childId });
}

export async function createChildDoc(
  parentId: string,
  name: string,
  age: number,
  avatarEmoji: string,
  safeFoods: string[],
  allergens: string[] = []
): Promise<string> {
  const ref = await addDoc(collection(db, 'children'), {
    parentId,
    name,
    age,
    avatarEmoji,
    buddyXP: 0,
    streak: 0,
    lastLogDate: null,
    safeFoods,
    savedRecipeIds: [],
    lovedFoodIds: [],
    metFoodIds: [],
    bestReactionByFood: {},
    allergens,
  });
  return ref.id;
}

export async function getChildDoc(childId: string): Promise<ChildDoc | null> {
  const snap = await getDoc(doc(db, 'children', childId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ChildDoc, 'id'>) };
}

export async function updateChildDoc(childId: string, partial: Partial<ChildDoc>): Promise<void> {
  await updateDoc(doc(db, 'children', childId), partial);
}

export async function deleteChildDoc(childId: string): Promise<void> {
  await deleteDoc(doc(db, 'children', childId));
}

export async function deleteUserDoc(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

export async function deleteCurrentAuthUser(): Promise<void> {
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
}
