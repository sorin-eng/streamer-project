import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type AppRole = 'casino_manager' | 'streamer' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  displayName: string;
  avatarUrl?: string;
  verified: boolean;
  organizationId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, role: AppRole, displayName: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function buildAppUser(supaUser: SupabaseUser): Promise<AppUser> {
  // Fetch role
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', supaUser.id)
    .maybeSingle();

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', supaUser.id)
    .maybeSingle();

  // Fetch org membership
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', supaUser.id)
    .maybeSingle();

  // Check verification
  const role = (roleRow?.role as AppRole) || 'streamer';
  let verified = false;
  if (role === 'streamer') {
    const { data: sp } = await supabase
      .from('streamer_profiles')
      .select('verified')
      .eq('user_id', supaUser.id)
      .maybeSingle();
    verified = sp?.verified === 'approved';
  } else if (role === 'casino_manager' && orgMember?.organization_id) {
    const { data: cp } = await supabase
      .from('casino_programs')
      .select('verified')
      .eq('organization_id', orgMember.organization_id)
      .maybeSingle();
    verified = cp?.verified === 'approved';
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
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(async () => {
          const appUser = await buildAppUser(session.user);
          setUser(appUser);
          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await buildAppUser(session.user);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, role: AppRole, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: 'Signup failed' };

    const userId = data.user.id;

    // Insert role
    await supabase.from('user_roles').insert({ user_id: userId, role });

    // Update profile display name (trigger already created it)
    await supabase.from('profiles').update({ display_name: displayName }).eq('user_id', userId);

    // Role-specific setup
    if (role === 'casino_manager') {
      // Create organization and membership
      const { data: org } = await supabase
        .from('organizations')
        .insert({ name: displayName })
        .select('id')
        .single();
      if (org) {
        await supabase.from('organization_members').insert({
          organization_id: org.id,
          user_id: userId,
          role: 'owner',
        });
        // Create casino program stub
        await supabase.from('casino_programs').insert({
          organization_id: org.id,
          brand_name: displayName,
        });
      }
    } else if (role === 'streamer') {
      await supabase.from('streamer_profiles').insert({ user_id: userId });
    }

    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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
