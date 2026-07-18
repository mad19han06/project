import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import type { Profile, Role } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: Role | null;
  isAdmin: boolean;
  isStudent: boolean;
}

interface AuthContextValue extends AuthState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    role: null,
    isAdmin: false,
    isStudent: false,
  });

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load profile', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id);
    setState((s) => ({
      ...s,
      profile,
      role: profile?.role ?? null,
      isAdmin: profile?.role === 'admin',
      isStudent: profile?.role === 'student',
    }));
  }, [state.user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      const user = session?.user ?? null;
      if (user) {
        loadProfile(user.id).then((profile) => {
          if (!mounted) return;
          setState({
            session,
            user,
            profile,
            loading: false,
            role: profile?.role ?? null,
            isAdmin: profile?.role === 'admin',
            isStudent: profile?.role === 'student',
          });
        });
      } else {
        setState({
          session: null,
          user: null,
          profile: null,
          loading: false,
          role: null,
          isAdmin: false,
          isStudent: false,
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const user = session?.user ?? null;
        if (user) {
          const profile = await loadProfile(user.id);
          if (!mounted) return;
          setState({
            session,
            user,
            profile,
            loading: false,
            role: profile?.role ?? null,
            isAdmin: profile?.role === 'admin',
            isStudent: profile?.role === 'student',
          });
        } else {
          if (!mounted) return;
          setState({
            session: null,
            user: null,
            profile: null,
            loading: false,
            role: null,
            isAdmin: false,
            isStudent: false,
          });
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
