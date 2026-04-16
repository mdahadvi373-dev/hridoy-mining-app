// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { deviceTracking } from '../services/deviceTracking';
import { antiFraud } from '../services/antiFraud';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signup: (email: string, password: string, username: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await deviceTracking.initialize();
        await antiFraud.initialize();
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, username: string): Promise<UserCredential> => {
    const deviceInfo = await deviceTracking.initialize();
    const ip = await deviceTracking.getClientIP();

    // Check if this device already has an account
    const deviceIndexRef = doc(db, 'device_index', deviceInfo.fingerprint);
    const existingCheck = await getDoc(deviceIndexRef);

    if (existingCheck.exists()) {
      throw new Error('This device already has an account. Multiple accounts are not allowed.');
    }

    // Create Firebase auth user
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with username
    await updateProfile(result.user, { displayName: username });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      username: username,
      displayName: username,
      createdAt: serverTimestamp(),
      deviceId: deviceInfo.deviceId,
      fingerprint: deviceInfo.fingerprint,
      ipAddress: ip,
      balance: 0,
      totalEarned: 0,
      fraudScore: 0,
      isActive: true,
      role: 'user'
    });

    // Create device index for fraud prevention
    await setDoc(doc(db, 'device_index', deviceInfo.fingerprint), {
      userId: result.user.uid,
      deviceId: deviceInfo.deviceId,
      firstLogin: serverTimestamp(),
      lastLogin: serverTimestamp(),
      platform: deviceInfo.platform,
      userAgent: deviceInfo.userAgent
    });

    return result;
  };

  const login = async (email: string, password: string): Promise<UserCredential> => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Update login tracking
    const deviceInfo = await deviceTracking.initialize();

    await setDoc(doc(db, 'users', result.user.uid), {
      lastLogin: serverTimestamp(),
      deviceId: deviceInfo.deviceId
    }, { merge: true });

    // Check fraud score
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const fraudScore = userDoc.data()?.fraudScore || 0;

    if (fraudScore >= 80) {
      await signOut(auth);
      throw new Error('Your account has been restricted due to suspicious activity.');
    }

    return result;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    isLoading,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
