import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserPermission } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  canAccessAdmin: boolean;
  hasPermission: (permission: UserPermission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'user',
              permissions: [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);

            // Send welcome email
            try {
              const token = await firebaseUser.getIdToken();
              await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/send-welcome-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || 'User',
                }),
              });
            } catch (emailError) {
              console.error('Failed to send welcome email:', emailError);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth context error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const isStaff = profile?.role === 'staff';
  const canAccessAdmin = isAdmin || isManager || isStaff;

  const hasPermission = (permission: UserPermission) => {
    if (isAdmin) return true;
    if (!profile?.permissions) return false;
    return profile.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isManager, isStaff, canAccessAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
