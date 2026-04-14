import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthService } from '@/core/services/registry';
import type { AppRole } from '@/core/services/authService';
import type { AppUser } from '@/core/domain/types';

export type { AppUser } from '@/core/domain/types';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, role: AppRole, displayName: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authService = getAuthService();

    const syncUser = async () => {
      const appUser = await authService.getCurrentUser();
      setUser(appUser);
      setIsLoading(false);
    };

    const subscription = authService.onAuthStateChange(() => {
      setTimeout(() => {
        void syncUser();
      }, 0);
    });

    void syncUser();

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await getAuthService().login(email, password);
    if (result.ok) {
      setUser(await getAuthService().getCurrentUser());
    }
    return result;
  }, []);

  const signup = useCallback(async (email: string, password: string, role: AppRole, displayName: string) => {
    const result = await getAuthService().signup(email, password, role, displayName);
    if (result.ok) {
      setUser(await getAuthService().getCurrentUser());
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await getAuthService().logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
