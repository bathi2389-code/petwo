'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { apiClient } from './api-client';

// ─── Firebase Init ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyFakeKeyForNextjsBuildStaticExport000',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'petwo-prod.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'petwo-prod',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'petwo-prod.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);

// ─── Auth Context ──────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ otp?: string }>;
  verifyOtp: (phone: string, otp: string, displayName?: string) => Promise<{ role: string }>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setIdToken(token);
        // Set token in API client
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setIdToken(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh token every 55 minutes (Firebase tokens expire after 1 hour)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const token = await user.getIdToken(true);
      setIdToken(token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const sendOtp = async (phone: string) => {
    const res = await apiClient.post('/auth/otp/send', { phone });
    return res.data.data;
  };

  const verifyOtp = async (phone: string, otp: string, displayName?: string) => {
    const res = await apiClient.post('/auth/otp/verify', {
      phone,
      otp,
      role: 'provider',
      displayName,
    });

    const { customToken, role } = res.data.data;
    const credential = await signInWithCustomToken(auth, customToken);

    // Ensure the next protected API request has a Firebase ID token.
    const idToken = await credential.user.getIdToken();
    setUser(credential.user);
    setIdToken(idToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

    return { role };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIdToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, idToken, loading, sendOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
