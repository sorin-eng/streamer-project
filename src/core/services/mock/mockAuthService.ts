import type { AppUser } from '@/core/domain/types';
import type { AppAuthService, AppRole, AuthResult, AuthStateChange, AuthSubscription } from '@/core/services/authService';

const STORAGE_KEY = 'castreamino-mock-user';

const defaultMockUsers: Record<string, AppUser> = {
  'casino@example.com': {
    id: 'mock-casino-user',
    email: 'casino@example.com',
    role: 'casino_manager',
    displayName: 'Mock Casino',
    verified: true,
    organizationId: 'mock-org-1',
    suspended: false,
    emailConfirmed: true,
  },
  'streamer@example.com': {
    id: 'mock-streamer-user',
    email: 'streamer@example.com',
    role: 'streamer',
    displayName: 'Mock Streamer',
    verified: true,
    suspended: false,
    emailConfirmed: true,
  },
  'admin@example.com': {
    id: 'mock-admin-user',
    email: 'admin@example.com',
    role: 'admin',
    displayName: 'Mock Admin',
    verified: true,
    suspended: false,
    emailConfirmed: true,
  },
};

export const mockSeedAccounts = [
  { email: 'casino@example.com', label: 'Casino manager' },
  { email: 'streamer@example.com', label: 'Streamer' },
  { email: 'admin@example.com', label: 'Admin' },
] as const;

let mockUsers: Record<string, AppUser> = { ...defaultMockUsers };

const listeners = new Set<(state: AuthStateChange) => void>();

function readStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredUser(user: AppUser | null) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(STORAGE_KEY);
}

function emit(user: AppUser | null) {
  for (const listener of listeners) {
    listener({ event: user ? 'SIGNED_IN' : 'SIGNED_OUT', session: null, user: user ? ({ id: user.id, email: user.email } as never) : null });
  }
}

export function resetMockAuthState() {
  mockUsers = { ...defaultMockUsers };
  writeStoredUser(null);
}

export const mockAuthService: AppAuthService = {
  async getCurrentUser(): Promise<AppUser | null> {
    return readStoredUser();
  },

  onAuthStateChange(callback): AuthSubscription {
    listeners.add(callback);
    return {
      unsubscribe: () => listeners.delete(callback),
    };
  },

  async login(email: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = mockUsers[normalizedEmail];
    if (!user) {
      return { ok: false, error: 'Mock user not found. Try casino@example.com, streamer@example.com, or admin@example.com' };
    }

    writeStoredUser(user);
    emit(user);
    return { ok: true };
  },

  async signup(email: string, _password: string, role: AppRole, displayName: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    if (!normalizedDisplayName) {
      return { ok: false, error: 'Display name is required' };
    }
    if (mockUsers[normalizedEmail]) {
      return { ok: false, error: 'An account with this email already exists' };
    }

    const user: AppUser = {
      id: `mock-${role}-${Date.now()}`,
      email: normalizedEmail,
      role,
      displayName: normalizedDisplayName,
      verified: role === 'admin',
      organizationId: role === 'casino_manager' ? `mock-org-${Date.now()}` : undefined,
      suspended: false,
      emailConfirmed: true,
    };

    mockUsers[normalizedEmail] = user;
    return { ok: true };
  },

  async requestPasswordReset(email: string): Promise<AuthResult> {
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    return { ok: true };
  },

  async updatePassword(password: string): Promise<AuthResult> {
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
    return { ok: true };
  },

  async logout(): Promise<void> {
    writeStoredUser(null);
    emit(null);
  },
};
