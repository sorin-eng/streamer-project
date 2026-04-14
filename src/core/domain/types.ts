export type AppRole = 'casino_manager' | 'streamer' | 'admin';

export type DataMode = 'mock' | 'supabase';

export interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  displayName: string;
  avatarUrl?: string;
  verified: boolean;
  organizationId?: string;
  suspended: boolean;
  emailConfirmed: boolean;
}
