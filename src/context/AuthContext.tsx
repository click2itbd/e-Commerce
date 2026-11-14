import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserPermission } from '../types';
import { resolveApiBaseUrl } from '../services/apiClient';

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
              const baseUrl = resolveApiBaseUrl();
              await fetch(`${baseUrl}/api/send-welcome-email`, {
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
  const isStaff = profile?.role === 'staff' || isAdmin;
  const canAccessAdmin = isAdmin || isManager || isStaff;

  const hasPermission = (permission: UserPermission) => {
    if (isAdmin) return true;
    if ((permission === 'cheques' || permission === 'daily_collection_payout') && (isStaff || isManager)) return true;
    if (!profile?.permissions) return false;

    // Direct alias mappings (e.g. dashboard vs view_dashboard)
    const aliases: Record<string, string[]> = {
      dashboard: ['view_dashboard', 'dashboard'],
      view_dashboard: ['view_dashboard', 'dashboard'],
      inventory: ['manage_inventory', 'inventory'],
      manage_inventory: ['manage_inventory', 'inventory'],
      services: ['manage_services', 'services'],
      manage_services: ['manage_services', 'services'],
      users: ['manage_users', 'users'],
      manage_users: ['manage_users', 'users'],
      settings: ['manage_settings', 'settings'],
      manage_settings: ['manage_settings', 'settings'],
      pos: ['pos', 'sales', 'manage_orders'],
      tasks: ['tasks', 'manage_settings'],
    };

    if (aliases[permission]) {
      if (aliases[permission].some(a => profile.permissions!.includes(a))) return true;
    }

    // Exact match
    if (profile.permissions.includes(permission)) return true;

    // Check legacy mappings ONLY if the profile has no granular permissions stored
    // (i.e. backward compatibility for legacy users that were created prior to granular permissions)
    const knownBundleKeys = ['manage_inventory', 'manage_orders', 'manage_finances', 'manage_hr', 'manage_services', 'manage_marketing', 'manage_reports', 'manage_settings', 'access_ecommerce', 'access_hosting'];
    const hasAnyGranular = profile.permissions.some(p => !knownBundleKeys.includes(p));

    if (!hasAnyGranular) {
      const legacyMap: Record<string, string[]> = {
        'manage_inventory': ['inventory', 'menus', 'brands', 'purchases', 'purchase_return', 'vendors', 'vendor_due_list', 'cheques'],
        'manage_orders': ['sales', 'sale_return', 'orders', 'customers', 'business_units', 'quotations', 'customer_due_list', 'deliveries', 'build_requests', 'pos'],
        'manage_finances': ['internal_notes', 'payment_accounts', 'ledger', 'manual_income', 'manual_expense', 'tx_categories', 'stock_accounting', 'deposits_withdrawals', 'account_balance', 'account_statement', 'balance_sheet', 'trial_balance', 'transaction_history', 'daily_collection_payout', 'cheques', 'profit_loss', 'all_reports', 'reports', 'customer_receive_report', 'day_book'],
        'manage_hr': ['users', 'employees', 'leave', 'salary', 'staff_performance'],
        'manage_services': ['hostingOrders', 'activeHostingAccounts', 'domainPricing', 'hostingPlans', 'domainOffers', 'domainRenewals', 'supportTickets', 'hosting_api_settings', 'hostingBilling', 'services'],
        'manage_marketing': ['campaigns', 'discountCodes', 'reviews'],
        'manage_reports': ['reports', 'all_reports', 'customer_receive_report', 'daily_collection_payout', 'profit_loss'],
        'manage_settings': ['crm', 'tasks', 'audit_logs', 'settings', 'restore']
      };

      for (const [legacyKey, granularPerms] of Object.entries(legacyMap)) {
        if (profile.permissions.includes(legacyKey as UserPermission) && granularPerms.includes(permission)) {
          return true;
        }
      }
    }

    return false;
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
