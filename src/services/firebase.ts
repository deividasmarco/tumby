import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyAjMqYbWNuAnxw21bAoHpnIbQZJvZUJtD8',
  authDomain: 'yumly-70372.firebaseapp.com',
  projectId: 'yumly-70372',
  storageBucket: 'yumly-70372.firebasestorage.app',
  messagingSenderId: '513060506294',
  appId: '1:513060506294:web:1c5f321b44e6b8acd73417',
};

export const isFirebaseConfigured = true;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
export default app;
