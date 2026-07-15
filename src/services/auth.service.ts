import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  deleteUser,
  signInWithCredential,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  AuthCredential,
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
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import { ChildDoc, UserDoc } from '../types';

// Calls the server-side deleteAccount Cloud Function, which deletes all of the
// user's Firestore data AND their auth record with Admin privileges — no
// re-authentication needed on the client.
export async function callDeleteAccount(): Promise<void> {
  const fn = httpsCallable(functions, 'deleteAccount');
  await fn();
}

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

// Creates users/{uid} if missing, or fills in missing fields — never overwrites
// existing values (e.g. keeps currentChildId, keeps a name captured on Apple's
// first sign-in even though later sign-ins omit it). Safe to call after any
// sign-in path (email, Google, Apple).
export async function ensureUserDoc(
  uid: string,
  fields: { email?: string | null; displayName?: string | null; provider?: string }
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: fields.email ?? null,
      displayName: fields.displayName ?? null,
      provider: fields.provider ?? 'password',
      createdAt: Date.now(),
      currentChildId: null,
    });
    return;
  }
  const existing = snap.data() as UserDoc;
  const patch: Record<string, unknown> = {};
  if (!existing.email && fields.email) patch.email = fields.email;
  if (!existing.displayName && fields.displayName) patch.displayName = fields.displayName;
  if (!existing.provider && fields.provider) patch.provider = fields.provider;
  if (Object.keys(patch).length > 0) {
    await setDoc(ref, patch, { merge: true });
  }
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
}

export async function signInWithAppleCredential(identityToken: string, rawNonce: string): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce });
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
}

// Re-authenticate with a freshly-obtained provider credential. Used by the
// account-deletion flow when Firebase reports auth/requires-recent-login for a
// Google/Apple user (they can't re-enter a password).
export async function reauthenticateWithProviderCredential(credential: AuthCredential): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in user to re-authenticate.');
  await reauthenticateWithCredential(user, credential);
}

export function googleCredentialFromIdToken(idToken: string): AuthCredential {
  return GoogleAuthProvider.credential(idToken);
}

export function appleCredentialFromToken(identityToken: string, rawNonce: string): AuthCredential {
  return new OAuthProvider('apple.com').credential({ idToken: identityToken, rawNonce });
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
