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
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    // Get initial session
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        console.log('🔄 Auth event details - event:', event, 'session valid:', !!session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔄 Handling SIGNED_IN event...');
          await handleUserSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('🔄 Handling SIGNED_OUT event...');
          handleUserSignedOut();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Handling TOKEN_REFRESHED event...');
          await handleUserSignedIn(session.user);
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔄 Handling INITIAL_SESSION event - session:', !!session);
          // INITIAL_SESSION is fired on app start/refresh
          if (session?.user) {
            console.log('🔄 INITIAL_SESSION has user, handling sign in...');
            await handleUserSignedIn(session.user);
          } else {
            console.log('🔄 INITIAL_SESSION has no user');
          }
        } else {
          console.log('🔄 Unhandled auth event:', event);
        }
        
        console.log('🔄 Setting loading to false after auth state change');
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 AuthContext: Initializing authentication...');
      
      // Simplified approach: Just check for session and set auth state immediately
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔄 AuthContext: Session check - error:', !!sessionError, 'session valid:', !!session);
      
      if (sessionError) {
        console.log('🔄 AuthContext: Session error, assuming no auth:', sessionError.message);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      
      if (!session || !session.user) {
        console.log('🔄 AuthContext: No session, user not authenticated');
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      
      // If we have a session, set auth state immediately
      const user = session.user;
      console.log('🔄 AuthContext: Found session for user:', user.email);
      setUser(user);
      setIsAuthenticated(true);
      
      // Fetch profile in background - don't block UI
      fetchUserProfile(user.id);
      
    } catch (error) {
      console.error('🔄 AuthContext: Error initializing auth:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      // Always set loading to false - don't let anything block this
      setLoading(false);
      setInitializationComplete(true);
      console.log('🔄 AuthContext: ✅ Authentication initialization completed - loading set to false');
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔄 AuthContext: Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.warn('🔄 AuthContext: Profile fetch error:', profileError);
        setProfile(null);
      } else {
        console.log('🔄 AuthContext: Profile loaded successfully');
        setProfile(profile);
      }
    } catch (error) {
      console.warn('🔄 AuthContext: Profile fetch failed:', error.message);
      setProfile(null);
    }
  };

  const handleUserSignedIn = async (authUser) => {
    console.log('AuthContext: handleUserSignedIn called with user:', authUser.email);
    
    // Set authenticated state immediately - never block UI
    setUser(authUser);
    setIsAuthenticated(true);
    setLoading(false);
    console.log('AuthContext: ✅ Authentication state set immediately for user:', authUser.email);
    
    // Fetch or create profile in background
    fetchOrCreateUserProfile(authUser);
  };

  const fetchOrCreateUserProfile = async (authUser) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Profile not found, create new profile
        const defaultName = authUser.email ? authUser.email.split('@')[0] : authUser.id;
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: defaultName,
            dupr_rating: 2.0,
            focus_areas: []
          })
          .select()
          .single();

        if (createError) {
          // Check if it's a duplicate key error (profile already exists)
          if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
            // Profile was created by another process, fetch it
            const { data: existingProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
            
            if (existingProfile) {
              const profileWithDefaults = {
                ...existingProfile,
                name: existingProfile.name || existingProfile.email?.split('@')[0] || existingProfile.id,
                dupr_rating: existingProfile.dupr_rating || 2.0,
                focus_areas: existingProfile.focus_areas || []
              };
              setProfile(profileWithDefaults);
              return;
            }
          }
          
          // Fallback to local profile
          setProfile({
            id: authUser.id,
            email: authUser.email,
            name: defaultName,
            dupr_rating: 2.0,
            focus_areas: []
          });
        } else {
          setProfile(newProfile);
        }
      } else if (userProfile) {
        // Use existing profile with defaults
        const profileWithDefaults = {
          ...userProfile,
          name: userProfile.name || userProfile.email?.split('@')[0] || userProfile.id,
          dupr_rating: userProfile.dupr_rating || 2.0,
          focus_areas: userProfile.focus_areas || []
        };
        setProfile(profileWithDefaults);
      } else {
        throw error;
      }
    } catch (error) {
      // Set default profile to prevent null issues
      setProfile({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email ? authUser.email.split('@')[0] : authUser.id,
        dupr_rating: 2.0,
        focus_areas: []
      });
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
