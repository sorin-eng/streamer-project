import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, role: UserRole, displayName: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('broker_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('broker_user', JSON.stringify(found));
      return true;
    }
    // Demo: accept any email, default to streamer
    const newUser: User = {
      id: `user-${Date.now()}`, email, role: 'streamer', displayName: email.split('@')[0],
      verified: false, createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('broker_user', JSON.stringify(newUser));
    return true;
  }, []);

  const signup = useCallback(async (email: string, _password: string, role: UserRole, displayName: string): Promise<boolean> => {
    const newUser: User = {
      id: `user-${Date.now()}`, email, role, displayName,
      verified: false, createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('broker_user', JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('broker_user');
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
