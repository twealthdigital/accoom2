// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { api } from '../lib/api.ts';
import { User } from '../types/index.ts';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (role: 'buyer' | 'agent' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(() => {
    return localStorage.getItem('accoom_balance_visible') !== 'false';
  });

  const toggleBalanceVisible = () => {
    setBalanceVisible((prev) => {
      const next = !prev;
      localStorage.setItem('accoom_balance_visible', String(next));
      return next;
    });
  };

  const refreshProfile = async () => {
    try {
      const res = await api.auth.getMe();
      if (res && res.authenticated && res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        sessionStorage.removeItem('accoom_demo_token');
        await refreshProfile();
      } else {
        // Check if demo user is stored in session
        const demoRole = sessionStorage.getItem('accoom_demo_role');
        if (demoRole) {
          await loadDemoUser(demoRole as 'buyer' | 'agent' | 'admin');
        } else {
          // Initialize default guest/demo buyer so user can immediately browse, save, and test without mandatory login prompt
          await loadDemoUser('buyer');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadDemoUser = async (role: 'buyer' | 'agent' | 'admin') => {
    let mockProfile: User;
    if (role === 'admin') {
      mockProfile = {
        id: 4,
        uid: 'accoom_admin_demo',
        email: 'admin@accoom.ng',
        name: 'Compliance Admin',
        role: 'ADMIN',
        phone: '+234 800 000 2226',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        location: 'Headquarters, Nigeria',
        status: 'active',
        createdAt: new Date().toISOString(),
        wallet: { id: 4, balance: 1450000, currency: 'NGN' },
        unreadNotifications: 1,
      };
    } else if (role === 'agent') {
      mockProfile = {
        id: 1,
        uid: 'agent_tunde_akungba',
        email: 'tunde.properties@accoom.ng',
        name: 'Tunde Balogun',
        role: 'AGENT',
        phone: '+234 803 456 7890',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        location: 'Akungba Akoko, Ondo State',
        status: 'active',
        createdAt: new Date().toISOString(),
        wallet: { id: 1, balance: 420000, currency: 'NGN' },
        unreadNotifications: 2,
        agentProfile: {
          id: 1,
          userId: 1,
          businessName: 'Balogun Prime Housing Ltd',
          tier: 'Pro',
          verified: true,
          rating: '4.9',
          reviewCount: 48,
          completedTransactions: 62,
          responseTime: '< 30 mins',
          responseRate: '99%',
          bio: 'Accredited student housing agent in Akungba Akoko. Fast physical inspections and zero double-allocation guarantee.',
          location: 'Akungba Akoko, Ondo State',
          phone: '+234 803 456 7890',
          createdAt: new Date().toISOString(),
        },
      };
    } else {
      mockProfile = {
        id: 101,
        uid: 'demo_buyer_funke',
        email: 'funke.adebayo@student.aaua.edu.ng',
        name: 'Funke Adebayo',
        role: 'USER',
        phone: '+234 814 555 1234',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        location: 'Akungba Akoko, Ondo State',
        status: 'active',
        createdAt: new Date().toISOString(),
        wallet: { id: 101, balance: 350000, currency: 'NGN' },
        unreadNotifications: 0,
      };
    }

    sessionStorage.setItem('accoom_demo_role', role);
    setCurrentUser(mockProfile);
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
      await refreshProfile();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      // Fallback gracefully to demo buyer if popup blocked by browser/iframe
      await loadDemoUser('buyer');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (role: 'buyer' | 'agent' | 'admin') => {
    setLoading(true);
    await loadDemoUser(role);
    setLoading(false);
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('accoom_demo_role');
      sessionStorage.removeItem('accoom_demo_token');
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        balanceVisible,
        toggleBalanceVisible,
        loginWithGoogle,
        loginAsDemo,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
