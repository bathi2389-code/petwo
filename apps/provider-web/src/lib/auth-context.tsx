'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, updateProfile, reload, signOut as firebaseSignOut,
  onAuthStateChanged, User, Auth,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { apiClient } from './api-client';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};
const requiredFirebaseValues = [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId];
const isFirebaseConfigured = requiredFirebaseValues.every((value) => value.trim().length > 0);
const FIREBASE_CONFIG_MESSAGE = 'Firebase web configuration is missing. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_APP_ID in apps/provider-web/.env.local, then restart the provider app.';

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured) throw new Error(FIREBASE_CONFIG_MESSAGE);
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getAuth(app);
}

export function friendlyFirebaseAuthError(error: unknown): string {
  const authError = error as { code?: string; message?: string };
  const messages: Record<string, string> = {
    'auth/api-key-not-valid': 'The Firebase API key is not valid for this project. Check the Firebase web app configuration.',
    'auth/operation-not-allowed': 'Email and password sign-in is disabled. Enable it in Firebase Authentication settings.',
    'auth/unauthorized-domain': 'Add this website host to Firebase Authentication → Settings → Authorized domains.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'An account already uses this email. Sign in instead.',
    'auth/weak-password': 'Choose a password with at least 8 characters.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account was found for this email. Create an account first.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-disabled': 'This Firebase account is disabled. Contact PETWO support.',
    'auth/too-many-requests': 'Too many attempts. Wait a little, then try again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
  };
  return (authError.code && messages[authError.code]) || authError.message || 'Firebase authentication failed. Please try again.';
}

type Pet = { name: string; species: string; breed: string; gender: string; dob?: string };
interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  authRevision: number;
  configError: string | null;
  createAccount: (email: string, password: string, displayName: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  sendVerification: (target?: User) => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  createCustomerProfile: (displayName: string, pet?: Pet) => Promise<{ role: string; isNewUser: boolean }>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRevision, setAuthRevision] = useState(0);
  const [configError, setConfigError] = useState<string | null>(isFirebaseConfigured ? null : FIREBASE_CONFIG_MESSAGE);

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    try {
      const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            setIdToken(token);
            apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
            setUser(firebaseUser);
          } catch {
            setIdToken(null); setUser(null); delete apiClient.defaults.headers.common.Authorization;
          }
        } else {
          setIdToken(null); setUser(null); delete apiClient.defaults.headers.common.Authorization;
        }
        setLoading(false);
      }, (error) => { setConfigError(error.message || 'Firebase authentication could not be initialized.'); setLoading(false); });
      return unsubscribe;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : FIREBASE_CONFIG_MESSAGE); setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true);
        setIdToken(token); apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      } catch { setIdToken(null); delete apiClient.defaults.headers.common.Authorization; }
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const createAccount = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    await updateProfile(credential.user, { displayName });
    const token = await credential.user.getIdToken();
    setIdToken(token); apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(credential.user);
    return credential.user;
  };
  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    const token = await credential.user.getIdToken();
    setIdToken(token); apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(credential.user);
    return credential.user;
  };
  const sendVerification = async (target?: User) => {
    const current = target ?? getFirebaseAuth().currentUser;
    if (!current) throw new Error('Sign in to send a verification email.');
    await sendEmailVerification(current, { url: `${window.location.origin}/verify-email`, handleCodeInApp: false });
  };
  const refreshVerification = async () => {
    const current = getFirebaseAuth().currentUser;
    if (!current) return false;
    await reload(current);
    const token = await current.getIdToken(true);
    setIdToken(token); apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    // reload mutates Firebase's User instance; revision forces subscribers to
    // re-check emailVerified without briefly dropping the authenticated user.
    setAuthRevision((revision) => revision + 1);
    return current.emailVerified;
  };
  const createCustomerProfile = async (displayName: string, pet?: Pet) => {
    const response = await apiClient.post('/auth/customer/profile', { displayName, ...(pet ? { pet } : {}) });
    return response.data.data as { role: string; isNewUser: boolean };
  };
  const signOut = async () => {
    if (isFirebaseConfigured) await firebaseSignOut(getFirebaseAuth());
    setUser(null); setIdToken(null); delete apiClient.defaults.headers.common.Authorization;
  };

  return <AuthContext.Provider value={{ user, idToken, loading, authRevision, configError, createAccount, signIn, sendVerification, refreshVerification, createCustomerProfile, signOut }}>{children}</AuthContext.Provider>;
}
