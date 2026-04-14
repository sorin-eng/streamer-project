import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AppUser } from '@/core/domain/types';
import type { AppAuthService, AppRole, AuthResult, AuthSubscription } from '@/core/services/authService';

async function buildAppUser(supaUser: SupabaseUser): Promise<AppUser> {
  const emailConfirmed = !!supaUser.email_confirmed_at;

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', supaUser.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, suspended')
    .eq('user_id', supaUser.id)
    .maybeSingle();

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', supaUser.id)
    .maybeSingle();

  const role = (roleRow?.role as AppRole) || 'streamer';
  let verified = false;

  if (role === 'streamer') {
    const { data: streamerProfile } = await supabase
      .from('streamer_profiles')
      .select('verified')
      .eq('user_id', supaUser.id)
      .maybeSingle();
    verified = streamerProfile?.verified === 'approved';
  } else if (role === 'casino_manager' && orgMember?.organization_id) {
    const { data: casinoProgram } = await supabase
      .from('casino_programs')
      .select('verified')
      .eq('organization_id', orgMember.organization_id)
      .maybeSingle();
    verified = casinoProgram?.verified === 'approved';
  } else if (role === 'admin') {
    verified = true;
  }

  return {
    id: supaUser.id,
    email: supaUser.email || '',
    role,
    displayName: profile?.display_name || supaUser.email?.split('@')[0] || '',
    avatarUrl: profile?.avatar_url || undefined,
    verified,
    organizationId: orgMember?.organization_id || undefined,
    suspended: (profile as Record<string, unknown>)?.suspended === true,
    emailConfirmed,
  };
}

export const supabaseAuthService: AppAuthService = {
  async getCurrentUser(): Promise<AppUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return buildAppUser(session.user);
  },

  onAuthStateChange(callback): AuthSubscription {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback({ event, session, user: session?.user ?? null });
    });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { ok: false, error: 'Please check your email and verify your account before signing in.' };
      }
      return { ok: false, error: error.message };
    }

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { ok: false, error: 'Please check your email and verify your account before signing in.' };
    }

    return { ok: true };
  },

  async signup(email: string, password: string, role: AppRole, displayName: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    if (!normalizedDisplayName) return { ok: false, error: 'Display name is required' };

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { display_name: normalizedDisplayName } },
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: 'Signup failed' };

    const { error: setupError } = await (supabase.rpc as any)('setup_new_user', {
      _user_id: data.user.id,
      _role: role,
      _display_name: normalizedDisplayName,
    });

    if (setupError) {
      console.error('Setup error:', setupError);
      return { ok: false, error: 'Account created but setup failed. Please contact support.' };
    }

    return { ok: true };
  },

  async requestPasswordReset(email: string, redirectTo?: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async updatePassword(password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};
