import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUser, signIn, signUp, signOut } from '../lib/supabase';
import { APP_VERSION, shouldPreserveSession } from '../lib/appVersion';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Storage keys for persistence
const APP_VERSION_KEY = '@pickleball_hero:app_version';
const SESSION_BACKUP_KEY = '@pickleball_hero:session_backup';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    // Add safety timeout to ensure loading state is eventually cleared
    let initializationTimeout;
    let recoveryTimeout;
    
    const safelyInitializeAuth = async () => {
      try {
        // Set a timeout to ensure we don't get stuck in loading forever
        initializationTimeout = setTimeout(() => {
          console.warn('⚠️ Auth initialization timeout - forcing loading to false');
          setLoading(false);
          setInitializationComplete(true);
        }, 5000); // 5 second timeout
        
        await initializeAuth();
        
        // Clear timeout if initialization completed successfully
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
      } catch (error) {
        console.error('🔄 Unexpected error in safelyInitializeAuth:', error);
        setLoading(false);
        setInitializationComplete(true);
      }
    };
    
    // Start initialization
    safelyInitializeAuth();

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
          await handleUserSignedOut();
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

    return () => {
      if (initializationTimeout) clearTimeout(initializationTimeout);
      if (recoveryTimeout) clearTimeout(recoveryTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 AuthContext: Initializing authentication...');
      
      // Check app version for update handling
      await checkAppVersion();
      
      // Try to get current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Get session timeout')), 3000);
      });
      
      let session, sessionError;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result.data.session;
        sessionError = result.error;
      } catch (timeoutError) {
        console.warn('🔄 AuthContext: Get session timed out, trying recovery...');
        session = null;
        sessionError = timeoutError;
      }
      
      console.log('🔄 AuthContext: Session check - error:', !!sessionError, 'session valid:', !!session);
      
      if (sessionError) {
        console.log('🔄 AuthContext: Session error, trying session recovery...');
        await attemptSessionRecovery();
        // Ensure loading is set to false even if recovery completes
        setLoading(false);
        setInitializationComplete(true);
        return;
      }
      
      if (!session || !session.user) {
        console.log('🔄 AuthContext: No session, trying session recovery...');
        await attemptSessionRecovery();
        // Ensure loading is set to false even if recovery completes
        setLoading(false);
        setInitializationComplete(true);
        return;
      }
      
      // If we have a session, set auth state immediately
      const user = session.user;
      console.log('🔄 AuthContext: Found session for user:', user.email);
      setUser(user);
      setIsAuthenticated(true);
      
      // Backup session for recovery
      await backupSession(session);
      
      // Fetch profile in background - don't block UI
      fetchUserProfile(user.id);
      
      // Set loading to false immediately when we have a valid session
      setLoading(false);
      setInitializationComplete(true);
      console.log('🔄 AuthContext: ✅ Authentication initialization completed - loading set to false');
      
    } catch (error) {
      console.error('🔄 AuthContext: Error initializing auth:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setLoading(false);
      setInitializationComplete(true);
    }
  };

  // Helper function to check app version and handle updates
  const checkAppVersion = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
      console.log('🔄 AuthContext: App version check - stored:', storedVersion, 'current:', APP_VERSION);
      
      if (storedVersion !== APP_VERSION) {
        console.log('🔄 AuthContext: App version changed, updating stored version');
        
        // Check if we should preserve the session
        const preserveSession = shouldPreserveSession(storedVersion, APP_VERSION);
        
        if (storedVersion && !preserveSession) {
          console.log('🔄 AuthContext: Major version update detected, clearing session backup');
          await AsyncStorage.removeItem(SESSION_BACKUP_KEY);
        } else if (storedVersion) {
          console.log('🔄 AuthContext: App updated from', storedVersion, 'to', APP_VERSION, '- preserving session');
        }
        
        await AsyncStorage.setItem(APP_VERSION_KEY, APP_VERSION);
      }
    } catch (error) {
      console.error('🔄 AuthContext: Error checking app version:', error);
    }
  };

  // Helper function to backup session for recovery
  const backupSession = async (session) => {
    try {
      if (session && session.user) {
        const sessionData = {
          user: {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at
          },
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          token_type: session.token_type,
          backup_timestamp: Date.now()
        };
        
        await AsyncStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(sessionData));
        console.log('🔄 AuthContext: Session backed up successfully');
      }
    } catch (error) {
      console.error('🔄 AuthContext: Error backing up session:', error);
    }
  };

  // Helper function to attempt session recovery
  const attemptSessionRecovery = async () => {
    try {
      console.log('🔄 AuthContext: Attempting session recovery...');
      
      // Add timeout for recovery operations
      const recoveryPromise = (async () => {
        const backupData = await AsyncStorage.getItem(SESSION_BACKUP_KEY);
        if (!backupData) {
          console.log('🔄 AuthContext: No backup session found');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }

        const sessionData = JSON.parse(backupData);
        const now = Date.now();
        const backupAge = now - (sessionData.backup_timestamp || 0);
        
        // Only use backup if it's less than 7 days old
        if (backupAge > 7 * 24 * 60 * 60 * 1000) {
          console.log('🔄 AuthContext: Backup session too old, clearing');
          await AsyncStorage.removeItem(SESSION_BACKUP_KEY);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }

        // Try to refresh the session using the stored refresh token
        if (sessionData.refresh_token) {
          console.log('🔄 AuthContext: Attempting to refresh session from backup...');
          
          // Add timeout for refresh session call
          const refreshPromise = supabase.auth.refreshSession({
            refresh_token: sessionData.refresh_token
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Refresh session timeout')), 3000);
          });
          
          const { data, error } = await Promise.race([refreshPromise, timeoutPromise]).catch(e => {
            console.log('🔄 AuthContext: Session refresh timed out or failed:', e.message);
            return { data: null, error: e };
          });

          if (error) {
            console.log('🔄 AuthContext: Session refresh failed:', error.message);
            // Clear invalid backup
            await AsyncStorage.removeItem(SESSION_BACKUP_KEY);
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
            return;
          }

          if (data?.session && data.session.user) {
            console.log('🔄 AuthContext: Session recovered successfully for user:', data.session.user.email);
            setUser(data.session.user);
            setIsAuthenticated(true);
            await backupSession(data.session);
            fetchUserProfile(data.session.user.id);
            return;
          }
        }

        // If refresh failed, try to set user from backup data
        console.log('🔄 AuthContext: Using backup user data for recovery...');
        setUser(sessionData.user);
        setIsAuthenticated(true);
        fetchUserProfile(sessionData.user.id);
      })();
      
      // Add overall timeout for recovery
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Recovery timeout')), 4000);
      });
      
      await Promise.race([recoveryPromise, timeoutPromise]).catch(e => {
        console.warn('🔄 AuthContext: Recovery timed out:', e.message);
        // Clear potentially corrupted backup
        AsyncStorage.removeItem(SESSION_BACKUP_KEY).catch(() => {});
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      });
      
    } catch (error) {
      console.error('🔄 AuthContext: Error during session recovery:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
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
    
    // Get current session to backup
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await backupSession(session);
    }
    
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

  const handleUserSignedOut = async () => {
    console.log('AuthContext: handleUserSignedOut called - clearing all auth state');
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    
    // Clear backup session
    try {
      await AsyncStorage.removeItem(SESSION_BACKUP_KEY);
      console.log('AuthContext: Backup session cleared');
    } catch (error) {
      console.error('AuthContext: Error clearing backup session:', error);
    }
    
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
      await handleUserSignedOut();
      
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      // Even if there's an error, clear local state
      await handleUserSignedOut();
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
