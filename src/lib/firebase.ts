import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import defaultConfig from "../../firebase-applet-config.json";

const defaultAuthDomain = defaultConfig.authDomain || 'gen-lang-client-0878556058.firebaseapp.com';
const resolvedAuthDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 
  (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && !window.location.hostname.includes('.run.app') && !window.location.hostname.includes('127.0.0.1')
    ? window.location.hostname
    : defaultAuthDomain);

const firebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || defaultConfig.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || defaultConfig.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || defaultConfig.apiKey,
  authDomain: resolvedAuthDomain,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || defaultConfig.firestoreDatabaseId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || defaultConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || defaultConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

export const getSafeIdToken = async (targetUser?: any, forceRefresh = false): Promise<string | null> => {
  const u = targetUser || auth.currentUser;
  if (!u) return null;
  try {
    if (typeof u.getIdToken === 'function') {
      return await u.getIdToken(forceRefresh);
    }
  } catch (_e) {}
  return u.uid || u.id || null;
};

export const getAuthHeaders = async (fallbackUserId?: string): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await getSafeIdToken(auth.currentUser);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  } catch (_e) {}
  if (fallbackUserId) {
    headers['Authorization'] = `Bearer ${fallbackUserId}`;
  }
  return headers;
};

