import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { AppUser } from '@/core/domain/types';

export type AppRole = AppUser['role'];

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface AuthStateChange {
  event?: string;
  session: Session | null;
  user: SupabaseUser | null;
}

export interface AuthSubscription {
  unsubscribe: () => void;
}

export interface AppAuthService {
  getCurrentUser(): Promise<AppUser | null>;
  onAuthStateChange(callback: (state: AuthStateChange) => void): AuthSubscription;
  login(email: string, password: string): Promise<AuthResult>;
  signup(email: string, password: string, role: AppRole, displayName: string): Promise<AuthResult>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
  logout(): Promise<void>;
}
