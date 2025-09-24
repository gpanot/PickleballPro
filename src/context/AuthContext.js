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
      console.log('🔄 AuthContext: This could be app start OR browser refresh');
      
      // Detect platform
      const isWeb = typeof window !== 'undefined';
      console.log('🔄 AuthContext: Platform detected:', isWeb ? 'Web' : 'Mobile');
      
      if (isWeb) {
        // For web, use a more conservative approach
        console.log('🔄 AuthContext: Using web-optimized auth initialization...');
        console.log('🔄 AuthContext: About to call supabase.auth.getSession()...');
        
        const sessionStart = Date.now();
        
        // Quick check for existing session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        const sessionEnd = Date.now();
        console.log(`🔄 AuthContext: getSession() completed in ${sessionEnd - sessionStart}ms`);
        console.log('🔄 AuthContext: Web session check - error:', !!sessionError, 'session valid:', !!session);
        
        if (session) {
          console.log('🔄 AuthContext: Session details - user email:', session.user?.email, 'expires at:', session.expires_at);
        }
        
        if (sessionError) {
          console.log('🔄 AuthContext: Session error on web, assuming no auth:', sessionError.message);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }
        
        if (!session || !session.user) {
          console.log('🔄 AuthContext: No session on web, user not authenticated');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }
        
        // If we have a session, set auth immediately and fetch profile async
        const user = session.user;
        console.log('🔄 AuthContext: Found web session for user:', user.email);
        console.log('🔄 AuthContext: Setting authenticated state immediately...');
        setUser(user);
        setIsAuthenticated(true);
        
        // Fetch profile asynchronously with detailed logging and timeout
        console.log('🔄 AuthContext: About to fetch user profile from database...');
        const profileStart = Date.now();
        
        try {
          // Add timeout to profile fetch to prevent hanging
          const profileTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // 10s timeout
          );
          
          const profileFetch = supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          const { data: profile, error: profileError } = await Promise.race([
            profileFetch,
            profileTimeout
          ]);
          
          const profileEnd = Date.now();
          console.log(`🔄 AuthContext: Profile fetch completed in ${profileEnd - profileStart}ms`);
            
          if (profileError) {
            console.warn('🔄 AuthContext: Web profile fetch error:', profileError);
            setProfile(null);
          } else {
            console.log('🔄 AuthContext: Web profile loaded successfully:', !!profile);
            setProfile(profile);
          }
        } catch (profileError) {
          console.warn('🔄 AuthContext: Web profile fetch failed/timed out:', profileError.message);
          setProfile(null);
          // Don't let profile fetch failure break auth - user is still authenticated
        }
        
      } else {
        // Mobile: use original approach with timeout
        console.log('AuthContext: Using mobile auth initialization with timeout...');
        const timeout = 15000; // 15s for mobile
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), timeout)
        );
        
        const authPromise = getCurrentUser();
        
        const { user: currentUser, profile: userProfile, error } = await Promise.race([
          authPromise,
          timeoutPromise
        ]);
        
        // Handle errors that aren't just "no user signed in"
        if (error) {
          console.error('Error initializing auth:', error);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }
        
        if (currentUser && userProfile) {
          console.log('AuthContext: Found existing session for user:', currentUser.email);
          setUser(currentUser);
          setProfile(userProfile);
          setIsAuthenticated(true);
        } else if (currentUser) {
          console.log('AuthContext: Found user but no profile, setting authenticated state');
          setUser(currentUser);
          setProfile(null);
          setIsAuthenticated(true);
        } else {
          console.log('AuthContext: No existing session found');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      
      // Handle timeout specifically
      if (error.message?.includes('timeout')) {
        console.warn('AuthContext: ⚠️ Auth initialization timed out - proceeding without auth');
      } else {
        console.error('AuthContext: ❌ Auth initialization failed with error:', error);
      }
      
      // Always set to not authenticated on error
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setInitializationComplete(true);
      console.log('🔄 AuthContext: ✅ Authentication initialization completed - loading set to false');
    }
  };

  const handleUserSignedIn = async (authUser) => {
    console.log('AuthContext: handleUserSignedIn called with user:', authUser.email);
    try {
      // Set authenticated state immediately to prevent UI hanging
      setUser(authUser);
      setIsAuthenticated(true);
      setLoading(false);
      console.log('AuthContext: ✅ Authentication state set immediately for user:', authUser.email);
      
      // Fetch or create user profile in database (async, non-blocking)
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
            dupr_rating: 2.0, // Default rating
            focus_areas: [] // Initialize empty focus areas
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          // Set a default profile to prevent null issues
          setProfile({
            id: authUser.id,
            email: authUser.email,
            name: authUser.email ? authUser.email.split('@')[0] : authUser.id,
            dupr_rating: 2.0,
            focus_areas: []
          });
        } else {
          console.log('AuthContext: ✅ Created new user profile:', newProfile);
          setProfile(newProfile);
        }
      } else {
        // Ensure profile has default values if they're missing
        const profileWithDefaults = {
          ...userProfile,
          name: userProfile.name || userProfile.email?.split('@')[0] || userProfile.id,
          dupr_rating: userProfile.dupr_rating || 2.0,
          focus_areas: userProfile.focus_areas || []
        };
        console.log('AuthContext: ✅ Found existing user profile:', profileWithDefaults);
        setProfile(profileWithDefaults);
      }

      console.log('AuthContext: ✅ User authentication and profile setup completed successfully');
    } catch (error) {
      console.error('AuthContext: Error handling user sign in:', error);
      // Ensure authentication state is still set even if profile fails
      setUser(authUser);
      setIsAuthenticated(true);
      setLoading(false);
      // Set a default profile to prevent null issues
      setProfile({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email ? authUser.email.split('@')[0] : authUser.id,
        dupr_rating: 2.0,
        focus_areas: []
      });
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
