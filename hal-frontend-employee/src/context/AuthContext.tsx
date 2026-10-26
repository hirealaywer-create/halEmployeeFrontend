import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { jwtDecode } from 'jwt-decode';
import { userAuth } from '@/lib/firebase-config';
import type { EmployeeUser, DecodedToken } from '@/types/auth';

interface AuthContextType {
  user: EmployeeUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  setAuthenticatedUser: (user: EmployeeUser | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmployeeUser | null>(() => {
    // Check localStorage for offline / persisted session
    try {
      const saved = localStorage.getItem('hal_employee_user');
      if (saved) {
        return JSON.parse(saved) as EmployeeUser;
      }
    } catch (e) {
      console.warn('Could not restore employee session:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const processFirebaseUser = async (firebaseUser: FirebaseUser): Promise<EmployeeUser> => {
    const token = await firebaseUser.getIdToken();
    const decoded = jwtDecode<DecodedToken>(token);

    // Extract roles from groups / custom claims
    const groups: string[] = Array.isArray(decoded.groups)
      ? decoded.groups
      : Array.isArray(decoded.roles)
      ? decoded.roles
      : [];

    const isApprover =
      groups.includes('APPROVER') ||
      groups.includes('ROLE_APPROVER') ||
      (decoded.roles && decoded.roles.includes('APPROVER')) ||
      false;

    const employee: EmployeeUser = {
      id: firebaseUser.uid,
      phoneNumber: firebaseUser.phoneNumber || undefined,
      email: firebaseUser.email || undefined,
      displayName: firebaseUser.displayName || firebaseUser.email || firebaseUser.phoneNumber || 'HAL Employee',
      idToken: token,
      decodedToken: decoded,
      roles: groups,
      isApprover,
    };

    return employee;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(userAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const employee = await processFirebaseUser(firebaseUser);
          setUser(employee);
          localStorage.setItem('hal_employee_user', JSON.stringify(employee));
        } catch (error) {
          console.error('Error processing employee auth state:', error);
        }
      } else {
        // If no user in Firebase, clear user state
        setUser(null);
        localStorage.removeItem('hal_employee_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    const current = userAuth.currentUser;
    if (current) {
      const updated = await processFirebaseUser(current);
      setUser(updated);
      localStorage.setItem('hal_employee_user', JSON.stringify(updated));
    }
  };

  const logout = async () => {
    try {
      await signOut(userAuth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    setUser(null);
    localStorage.removeItem('hal_employee_user');
  };

  const setAuthenticatedUser = (newUser: EmployeeUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('hal_employee_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('hal_employee_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setAuthenticatedUser, refreshUser }}>
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
