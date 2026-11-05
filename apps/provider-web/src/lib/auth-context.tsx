'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
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

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];
const isFirebaseConfigured = requiredFirebaseValues.every((value) => value.trim().length > 0);

const FIREBASE_CONFIG_MESSAGE =
  'Firebase web configuration is missing. Add NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_APP_ID to apps/provider-web/.env.local, then restart the provider app. Get these values from Firebase Console → Project settings → Your apps → Web app.';

function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured) {
    throw new Error(FIREBASE_CONFIG_MESSAGE);
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getAuth(app);
}

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  configError: string | null;
  sendOtp: (phone: string) => Promise<{ otp?: string }>;
  verifyOtp: (phone: string, otp: string, displayName?: string) => Promise<{ role: string }>;
  verifyCustomerOtp: (phone: string, otp: string, displayName?: string) => Promise<{ role: string }>;
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
  const [configError, setConfigError] = useState<string | null>(
    isFirebaseConfigured ? null : FIREBASE_CONFIG_MESSAGE,
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser) {
            try {
              const token = await firebaseUser.getIdToken();
              setIdToken(token);
              apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch {
              setIdToken(null);
              delete apiClient.defaults.headers.common['Authorization'];
            }
          } else {
            setIdToken(null);
            delete apiClient.defaults.headers.common['Authorization'];
          }
          setLoading(false);
        },
        (error) => {
          setConfigError(error.message || 'Firebase authentication could not be initialized.');
          setLoading(false);
        },
      );

      return unsubscribe;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : FIREBASE_CONFIG_MESSAGE);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true);
        setIdToken(token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        setIdToken(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const sendOtp = async (phone: string) => {
    if (!isFirebaseConfigured) throw new Error(FIREBASE_CONFIG_MESSAGE);
    const res = await apiClient.post('/auth/otp/send', { phone });
    return res.data.data;
  };

  const verifyOtp = async (phone: string, otp: string, displayName?: string) => {
    if (!isFirebaseConfigured) throw new Error(FIREBASE_CONFIG_MESSAGE);
    const res = await apiClient.post('/auth/otp/verify', {
      phone,
      otp,
      role: 'provider',
      displayName,
    });

    const { customToken, role } = res.data.data;
    const credential = await signInWithCustomToken(getFirebaseAuth(), customToken);
    const token = await credential.user.getIdToken();
    setUser(credential.user);
    setIdToken(token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return { role };
  };

  const verifyCustomerOtp = async (phone: string, otp: string, displayName?: string) => {
    if (!isFirebaseConfigured) throw new Error(FIREBASE_CONFIG_MESSAGE);
    const res = await apiClient.post('/auth/otp/verify', {
      phone, otp, role: 'customer', displayName,
    });
    const { customToken, role } = res.data.data;
    if (role !== 'customer') throw new Error('This mobile number belongs to a provider account. Please use provider login.');
    const credential = await signInWithCustomToken(getFirebaseAuth(), customToken);
    const token = await credential.user.getIdToken();
    setUser(credential.user);
    setIdToken(token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { role };
  };

  const signOut = async () => {
    if (isFirebaseConfigured) await firebaseSignOut(getFirebaseAuth());
    setUser(null);
    setIdToken(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, idToken, loading, configError, sendOtp, verifyOtp, verifyCustomerOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
