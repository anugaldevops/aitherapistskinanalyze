import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: AuthError | null }>;
  deleteAccount: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);

    if (JSON.stringify(profileData) !== JSON.stringify(profile)) {
      setProfile(profileData);
    }
  };

  useEffect(() => {
    console.log('Auth: Checking initial session...');
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      console.log('Auth: Initial session:', session ? 'Found' : 'None');
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id).then(profileData => {
          if (mounted && profileData) {
            setProfile(profileData);
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('Auth: State change -', event, session ? 'User present' : 'No user');

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id).then(profileData => {
            if (mounted && profileData) {
              setProfile(profileData);
            }
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Auth: Attempting login...');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth: Login error:', error.message);
    } else {
      console.log('Auth: Login successful');
    }

    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Auth: Attempting sign up...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Auth: Sign up error:', error.message);
      return { error };
    }

    if (data.user) {
      console.log('Auth: Creating user profile...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          name,
          profile_completed: false,
        });

      if (profileError) {
        console.error('Auth: Profile creation error:', profileError.message);
      } else {
        console.log('Auth: Sign up successful');
      }
    }

    return { error };
  };

  const logout = async () => {
    console.log('Auth: Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    console.log('Auth: Logout complete');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    await refreshProfile();
  };

  const resetPasswordRequest = async (email: string) => {
    console.log('Auth: Sending password reset email...');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    if (error) {
      console.error('Auth: Password reset request error:', error.message);
    } else {
      console.log('Auth: Password reset email sent');
    }

    return { error };
  };

  const resetPassword = async (newPassword: string) => {
    console.log('Auth: Updating password...');
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Auth: Password update error:', error.message);
    } else {
      console.log('Auth: Password updated successfully');
    }

    return { error };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    console.log('Auth: Changing password...');

    if (!user?.email) {
      return { error: { message: 'No user email found' } as AuthError };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      console.error('Auth: Current password verification failed:', signInError.message);
      return { error: signInError };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Auth: Password change error:', error.message);
    } else {
      console.log('Auth: Password changed successfully');
    }

    return { error };
  };

  const deleteAccount = async () => {
    console.log('Auth: Deleting account...');

    if (!user) {
      return { error: { message: 'No user logged in' } as AuthError };
    }

    try {
      const { error: analysisError } = await supabase
        .from('analysis_history')
        .delete()
        .eq('user_id', user.id);

      if (analysisError) {
        console.error('Auth: Failed to delete analyses:', analysisError.message);
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Auth: Failed to delete profile:', profileError.message);
        return { error: { message: profileError.message } as AuthError };
      }

      console.log('Auth: User data deleted successfully');
      await logout();
      return { error: null };
    } catch (error: any) {
      console.error('Auth: Account deletion error:', error);
      return { error: { message: error.message || 'Failed to delete account' } as AuthError };
    }
  };

  const value = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    resetPasswordRequest,
    resetPassword,
    updatePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
