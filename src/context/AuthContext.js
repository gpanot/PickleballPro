import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser, signIn, signUp, signOut } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          handleUserSignedOut();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await handleUserSignedIn(session.user);
        }
        
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      const { user: currentUser, profile: userProfile, error } = await getCurrentUser();
      
      // Handle errors that aren't just "no user signed in"
      if (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      
      if (currentUser && userProfile) {
        setUser(currentUser);
        setProfile(userProfile);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSignedIn = async (authUser) => {
    console.log('AuthContext: handleUserSignedIn called with user:', authUser.email);
    try {
      // Skip database profile fetch for now - just authenticate the user
      console.log('AuthContext: Skipping database profile fetch for web - setting authentication directly');
      
      // Set user as authenticated immediately without waiting for profile
      setUser(authUser);
      setIsAuthenticated(true);
      setLoading(false);
      console.log('AuthContext: ✅ User authentication completed successfully (bypassed profile fetch)');
      console.log('AuthContext: Final state - isAuthenticated: true, user:', authUser.email);
      return;
      
      // Original profile fetch code (commented out for debugging)
      /*
      console.log('AuthContext: Fetching user profile from database...');
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      console.log('AuthContext: Profile fetch result - error:', !!error, 'data:', !!userProfile);

      if (error) {
        console.error('Error fetching user profile:', error);
        // Create profile if it doesn't exist
        const defaultName = authUser.email ? authUser.email.split('@')[0] : authUser.id;
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: defaultName,
            rating: 2.0 // Default rating
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          setProfile(null);
        } else {
          setProfile(newProfile);
        }
      } else {
        // Ensure profile has default values if they're missing
        const profileWithDefaults = {
          ...userProfile,
          name: userProfile.name || userProfile.email?.split('@')[0] || userProfile.id,
          rating: userProfile.rating || 2.0
        };
        setProfile(profileWithDefaults);
      }

      setUser(authUser);
      setIsAuthenticated(true);
      setLoading(false);
      console.log('AuthContext: ✅ User authentication completed successfully');
      console.log('AuthContext: Final state - isAuthenticated: true, user:', authUser.email);
      */
    } catch (error) {
      console.error('AuthContext: Error handling user sign in:', error);
      setUser(authUser);
      setProfile(null);
      setIsAuthenticated(true);
      setLoading(false);
      console.log('AuthContext: ⚠️ Authentication completed with errors, but user still authenticated');
    }
  };

  const handleUserSignedOut = () => {
    console.log('AuthContext: handleUserSignedOut called - clearing all auth state');
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    console.log('AuthContext: ✅ User signed out successfully');
  };

  const handleSignUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      const { data, error } = await signUp(email, password, userData);
      
      if (error) {
        throw error;
      }

      // Note: User will be signed in automatically if email confirmation is disabled
      // Otherwise, they'll need to confirm their email first
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('AuthContext: handleSignOut called');
    try {
      setLoading(true);
      console.log('AuthContext: Calling Supabase signOut...');
      const { error } = await signOut();
      
      if (error) {
        console.error('AuthContext: Supabase signOut error:', error);
        throw error;
      }

      console.log('AuthContext: Supabase signOut successful, clearing local state...');
      // Manually clear the state to ensure logout works on web
      handleUserSignedOut();
      
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      // Even if there's an error, clear local state
      handleUserSignedOut();
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
