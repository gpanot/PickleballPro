import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const supabaseUrl = 'https://qdlvidtnfqnqjgrhxwtz.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbHZpZHRuZnFucWpncmh4d3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzg3MTksImV4cCI6MjA5Nzc1NDcxOX0.zlRtmQrST5Z1JdBZXHbsSZ_GT-v__HJ_M7MJziOR7L0';

// On web, use synchronous localStorage directly so the Supabase JS client can
// read the session token synchronously before firing HTTP requests. Using the
// async AsyncStorage adapter on web causes every request to fire before the
// token resolves, resulting in 403s.
//
// On native (iOS/Android), AsyncStorage is required because localStorage
// doesn't exist.
const webStorage = Platform.OS === 'web' && typeof localStorage !== 'undefined'
  ? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    }
  : null;

const nativeStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

const storageAdapter = webStorage || nativeStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

// Auth state listener (kept for session refresh handling)
supabase.auth.onAuthStateChange((_event, _session) => {});

// Authentication functions

const EXISTING_USER_ERROR = {
  message: 'User already registered',
  code: 'user_already_exists',
};

/** Returns true when sign-up should be rejected because the account already exists. */
export function isExistingUserSignUpError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'user_already_exists' ||
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('duplicate key') ||
    msg.includes('users_email_key')
  );
}

// While sign-up is being validated, Supabase may emit a transient SIGNED_IN for
// duplicate emails before we sign out. Defer auth listener navigation until validation finishes.
let signUpValidationPending = false;

export function isSignUpValidationPending() {
  return signUpValidationPending;
}

function finishSignUpValidation() {
  signUpValidationPending = false;
}

async function abortDuplicateSignUp() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('abortDuplicateSignUp: signOut failed', e?.message);
  } finally {
    // Keep the gate up briefly so any stale SIGNED_IN from the aborted session is ignored.
    setTimeout(finishSignUpValidation, 150);
  }
}

export const signUp = async (email, password, userData = {}) => {
  signUpValidationPending = true;
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;

    // Supabase: empty identities means email is already registered (no new account)
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      await abortDuplicateSignUp();
      return { data: null, error: EXISTING_USER_ERROR };
    }

    // Confirm-email off: signUp can return a session for an existing account
    if (data?.session && data?.user?.created_at) {
      const accountAgeMs = Date.now() - new Date(data.user.created_at).getTime();
      if (accountAgeMs > 60_000) {
        await abortDuplicateSignUp();
        return { data: null, error: EXISTING_USER_ERROR };
      }
    }

    if (data.user) {
      // Strip fields that don't exist in the `users` table (e.g. role, sport_id
      // which are stored in auth.user_metadata / coaches table instead).
      const USERS_TABLE_FIELDS = [
        'name', 'dupr_rating', 'skill_rating', 'gender', 'training_goal',
        'time_commitment', 'intensity', 'focus_areas', 'tier',
      ];
      const safeUserData = Object.fromEntries(
        Object.entries(userData).filter(([k]) => USERS_TABLE_FIELDS.includes(k))
      );
      console.log('Creating user profile with data:', safeUserData);

      const profileData = {
        id: data.user.id,
        email: data.user.email,
        name: userData.name || normalizedEmail.split('@')[0],
        ...safeUserData,
      };

      const { error: profileError } = await supabase
        .from('users')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (profileError) {
        const profileMsg = profileError.message || '';
        const isDuplicateEmail =
          profileError.code === '23505' &&
          (profileMsg.includes('users_email_key') || profileMsg.includes('duplicate key'));

        if (isDuplicateEmail) {
          console.error('Error creating/updating user profile: duplicate email');
          await abortDuplicateSignUp();
          return { data: null, error: EXISTING_USER_ERROR };
        }

        let errorMessage = 'Unknown error';
        if (typeof profileError === 'string') {
          errorMessage = profileError;
        } else if (profileError?.message) {
          if (profileError.message.includes('<!DOCTYPE') || profileError.message.includes('<html')) {
            errorMessage = 'Server error: Received invalid response. Please try again.';
          } else {
            errorMessage = profileError.message;
          }
        } else if (profileError?.code) {
          errorMessage = `Database error (${profileError.code})`;
        }

        console.error('Error creating/updating user profile:', errorMessage);
      } else {
        console.log('✅ User profile created/updated successfully');
      }
    }

    finishSignUpValidation();
    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    if (isExistingUserSignUpError(error)) {
      await abortDuplicateSignUp();
      return { data: null, error: EXISTING_USER_ERROR };
    }
    finishSignUpValidation();
    return { data: null, error };
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
   
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

export const resetPasswordForEmail = async (email, redirectTo) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error sending password reset:', error);
    return { data: null, error };
  }
};

export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating password:', error);
    return { data: null, error };
  }
};

export const getCurrentUser = async () => {
  try {
    console.log('🔐 getCurrentUser: Starting user fetch...');
    
    // Check if we have a session first (more reliable on web)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 getCurrentUser: Session check - error:', !!sessionError, 'session valid:', !!session);
    
    if (sessionError) {
      if (sessionError.name === 'AuthSessionMissingError' || sessionError.message?.includes('Auth session missing')) {
        console.log('🔐 getCurrentUser: No session found (normal when not logged in)');
        return { user: null, profile: null, error: null };
      }
      throw sessionError;
    }
    
    // If no session, no user is logged in
    if (!session) {
      console.log('🔐 getCurrentUser: No session, returning null user');
      return { user: null, profile: null, error: null };
    }
    
    let user = session.user;
    console.log('🔐 getCurrentUser: User found from session:', user?.email);
    
    // Legacy fallback - try getUser() if session doesn't have user
    if (!user) {
      console.log('🔐 getCurrentUser: No user in session, trying getUser()...');
      const { data: { user: fallbackUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        if (error.name === 'AuthSessionMissingError' || error.message?.includes('Auth session missing')) {
          return { user: null, profile: null, error: null };
        }
        throw error;
      }
      
      if (!fallbackUser) {
        return { user: null, profile: null, error: null };
      }
      
      user = fallbackUser;
    }
    
    // If user exists, get their profile from our users table
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return { user, profile: null, error: null };
      }

      return { user, profile, error: null };
    }

    return { user: null, profile: null, error: null };
  } catch (error) {
    // Handle auth session missing error specifically
    if (error.name === 'AuthSessionMissingError' || error.message?.includes('Auth session missing')) {
      // This is expected when no user is signed in, not an actual error
      return { user: null, profile: null, error: null };
    }
    
    console.error('Error getting current user:', error);
    return { user: null, profile: null, error };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

// Admin functions
export const checkAdminAccess = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      // User is not an admin
      return { isAdmin: false, role: null, error: null };
    }

    return { isAdmin: true, role: data.role, error: null };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { isAdmin: false, role: null, error };
  }
};

export const createAdminUser = async (email, password, name, role = 'content_editor') => {
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        is_active: true
      });

    if (profileError) throw profileError;

    // Add admin role
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        role,
        is_active: true
      });

    if (adminError) throw adminError;

    return { data: authData, error: null };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { data: null, error };
  }
};

// API helper functions for your app

// 1. Get all published programs for Explore / Library catalog (lightweight — no nested exercises)
export const getPrograms = async () => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        description,
        category,
        tier,
        thumbnail_url,
        rating,
        added_count,
        order_index,
        created_at,
        skill_categories_json,
        routines (
          id,
          name,
          description,
          order_index,
          time_estimate_minutes
        )
      `)
      .eq('is_published', true)
      .or('is_coach_program.is.null,is_coach_program.eq.false') // Exclude coach-only programs from Library
      .order('category', { ascending: true })
      .order('order_index', { ascending: true })
      .order('is_featured', { ascending: false });

    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// 2. Get program details with full routine/exercise data
export const getProgramDetails = async (programId) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        routines (
          *,
          routine_exercises (
            order_index,
            custom_target_value,
            is_optional,
            exercises (*)
          )
        )
      `)
      .eq('id', programId)
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching program details:', error);
    return { data: null, error };
  }
};

// 3. Get coaches for directory
export const getCoaches = async (filters = {}) => {
  try {
    let query = supabase
      .from('coaches')
      .select(`
        *,
        users:user_id (
          avatar_url
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true);
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    if (filters.specialties && filters.specialties.length > 0) {
      query = query.contains('specialties', filters.specialties);
    }
    
    const { data, error } = await query.order('rating_avg', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return { data: null, error };
  }
};

// 4. Log exercise completion (for analytics)
export const logExerciseCompletion = async (exerciseCode, resultData) => {
  try {
    // First, get the exercise ID from the code
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id')
      .eq('code', exerciseCode)
      .single();

    if (exerciseError) throw exerciseError;

    // Log the completion
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        // user_id: userId, // TODO: Add when auth is implemented
        exercise_id: exercise.id,
        result_value: resultData.result_value,
        target_value: resultData.target_value,
        passed: resultData.passed,
        attempts: resultData.attempts || 1,
        session_type: resultData.session_type || 'practice',
        notes: resultData.notes,
        feeling_rating: resultData.feeling_rating
      })
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error logging exercise completion:', error);
    return { data: null, error };
  }
};

// 5. Logbook operations
export const createLogbookEntry = async (entryData, userId = null) => {
  const payload = {
    user_id: userId,
    date: entryData.date,
    hours: entryData.hours,
    session_type: entryData.sessionType,
    training_focus: Array.isArray(entryData.trainingFocus)
      ? JSON.stringify(entryData.trainingFocus)
      : entryData.trainingFocus,
    difficulty: Array.isArray(entryData.difficulty)
      ? JSON.stringify(entryData.difficulty)
      : entryData.difficulty,
    feeling: entryData.feeling,
    notes: entryData.notes,
    location: entryData.location,
    exercise_details: entryData.exerciseDetails || null
  };

  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('🏓 [SUPABASE] Error creating logbook entry:', error);
      throw error;
    }
    
    console.log('🏓 [SUPABASE] ✅ Logbook entry created successfully:', data?.id);
    return { data, error: null };
  } catch (error) {
    console.error('🏓 [SUPABASE] ❌ Failed to create logbook entry:', error?.message || error);
    return { data: null, error };
  }
};

export const getLogbookEntries = async (userId) => {
  try {
    if (!userId) {
      console.warn('getLogbookEntries: No userId provided, returning empty array');
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching logbook entries:', error);
    return { data: null, error };
  }
};

export const getLogbookEntriesByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user logbook entries:', error);
    return { data: null, error };
  }
};

export const updateLogbookEntry = async (id, entryData, userId = null) => {
  try {
    console.log('🏓 [SUPABASE] Updating logbook entry:', {
      id: id,
      userId: userId,
      entryData: entryData
    });
    
    const { data, error } = await supabase
      .from('logbook_entries')
      .update({
        user_id: userId,
        date: entryData.date,
        hours: entryData.hours,
        session_type: entryData.sessionType,
        training_focus: Array.isArray(entryData.trainingFocus)
          ? JSON.stringify(entryData.trainingFocus)
          : entryData.trainingFocus,
        difficulty: Array.isArray(entryData.difficulty)
          ? JSON.stringify(entryData.difficulty)
          : entryData.difficulty,
        feeling: entryData.feeling,
        notes: entryData.notes,
        location: entryData.location,
        exercise_details: entryData.exerciseDetails || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🏓 [SUPABASE] Error updating logbook entry:', error);
      throw error;
    }
    
    console.log('🏓 [SUPABASE] ✅ Logbook entry updated successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('🏓 [SUPABASE] ❌ Failed to update logbook entry:', error);
    return { data: null, error };
  }
};

export const deleteLogbookEntry = async (id) => {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting logbook entry:', error);
    return { data: null, error };
  }
};

// 6. User progress tracking
export const getUserProgress = async () => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        exercises (
          code,
          title,
          skill_category,
          difficulty
        )
      `)
      // .eq('user_id', userId) // TODO: Add when auth is implemented
      .order('completed_at', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return { data: null, error };
  }
};

function normalizeSkillCategoriesJson(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Helper function to transform program data to match your current app structure
export const transformProgramData = (programs) => {
  if (!programs || !Array.isArray(programs)) {
    return [];
  }
  
  try {
    const transformed = programs.map((program, index) => {
      
      return {
        id: program.id,
        name: program.name,
        description: program.description,
        category: program.category,
        tier: program.tier,
        thumbnail: program.thumbnail_url,
        thumbnail_url: program.thumbnail_url || null,
        skill_categories_json: normalizeSkillCategoriesJson(program.skill_categories_json),
        rating: parseFloat(program.rating) || 0,
        addedCount: program.added_count || 0,
        orderIndex: program.order_index || 0,
        routines: (program.routines || [])
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(routine => {
            return {
              id: routine.id,
              name: routine.name,
              description: routine.description,
              timeEstimate: `${routine.time_estimate_minutes || 0} min`,
              exercises: (routine.routine_exercises || [])
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map(re => {
                  if (!re.exercises) {
                    return null;
                  }
                  return {
                    // Basic fields for routine display
                    id: re.exercises.code,
                    name: re.exercises.title,
                    target: `${re.custom_target_value || re.exercises.target_value || 0} ${re.exercises.target_unit || ''}`,
                    difficulty: re.exercises.difficulty,
                    description: re.exercises.description,
                    routineExerciseId: re.exercises.id,
                    dupr_range_min: re.exercises.dupr_range_min,
                    dupr_range_max: re.exercises.dupr_range_max,
                    
                    // Complete exercise data for ExerciseDetail screen (preloaded)
                    completeExerciseData: {
                      ...re.exercises, // All database fields
                      // Apply transformations for compatibility
                      name: re.exercises.name || re.exercises.title,
                      target: re.exercises.target_value && re.exercises.target_unit 
                        ? `${re.exercises.target_value} ${re.exercises.target_unit}`
                        : re.exercises.target || `${re.exercises.target_value || 10} attempts`,
                      targetValue: re.exercises.targetValue || (re.exercises.target_value ? `${re.exercises.target_value}/10` : '10/10'),
                      tips: re.exercises.tips_json 
                        ? Array.isArray(re.exercises.tips_json) 
                          ? re.exercises.tips_json 
                          : []
                        : re.exercises.tips 
                          ? re.exercises.tips.split('\n').filter(tip => tip.trim())
                          : [],
                      skillCategories: re.exercises.skill_categories_json
                        ? Array.isArray(re.exercises.skill_categories_json)
                          ? re.exercises.skill_categories_json
                          : []
                        : re.exercises.skill_category
                          ? re.exercises.skill_category.split(',').filter(cat => cat.trim())
                          : [],
                      estimatedTime: re.exercises.estimated_minutes 
                        ? `${re.exercises.estimated_minutes} min`
                        : re.exercises.estimated_time || '10 min',
                      estimatedMinutes: re.exercises.estimated_minutes || 
                        (re.exercises.estimated_time ? parseInt(re.exercises.estimated_time.replace(' min', '')) : 10)
                    }
                  };
                })
                .filter(Boolean) // Remove null entries
            };
          }),
        createdAt: program.created_at
      };
    });
    
    return transformed;
  } catch (error) {
    console.error('🔄 Supabase: Error transforming program data:', error);
    return [];
  }
};

// Helper function to transform coach data to match your current app structure
export const transformCoachData = (coaches) => {
  return coaches.map(coach => {
    // Get user avatar URL - prioritize user avatar over coach avatar (same as AdminDashboard)
    // Handle both object and array cases from Supabase relationship
    const userAvatarUrl = Array.isArray(coach.users) 
      ? coach.users[0]?.avatar_url 
      : coach.users?.avatar_url;
    
    // Prioritize user avatar over coach avatar
    let avatarUrl = userAvatarUrl || coach.avatar_url;
    
    // Convert storage path to public URL if needed
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('blob:')) {
      // It's likely a storage path, convert to public URL
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarUrl);
        console.log(`🖼️ Converted coach avatar URL for ${coach.name}: ${avatarUrl} -> ${publicUrl}`);
        avatarUrl = publicUrl;
      } catch (error) {
        console.error('❌ Error converting avatar URL:', error);
        // Keep original URL if conversion fails
      }
    } else if (avatarUrl) {
      console.log(`🖼️ Coach ${coach.name} has avatar URL: ${avatarUrl}`);
    } else {
      console.log(`⚠️ Coach ${coach.name} has no avatar_url`);
    }
    
    return {
      id: coach.id,
      name: coach.name,
      bio: coach.bio,
      duprRating: coach.dupr_rating,
      hourlyRate: coach.hourly_rate ? 
        (coach.currency === 'VND' ? coach.hourly_rate : coach.hourly_rate / 100) : 0, // VND as-is, USD from cents
      currency: coach.currency || 'USD', // Default to USD if not specified
      rating: coach.rating_avg,
      reviewCount: coach.rating_count,
      specialties: coach.specialties,
      location: coach.latitude && coach.longitude 
        ? `${coach.location} (${coach.latitude},${coach.longitude})`
        : coach.location,
      latitude: coach.latitude,
      longitude: coach.longitude,
      verified: coach.is_verified,
      image: avatarUrl,
      phone: coach.phone,
      messagingPreferences: coach.messaging_preferences || {
        whatsapp: false,
        imessage: false,
        zalo: false
      }
    };
  });
};

// Coach functions
export const checkCoachAccess = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('coaches')
      .select('id, user_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return { isCoach: false, coachId: null, error: null };
    }

    return { isCoach: true, coachId: data.id, error: null };
  } catch (error) {
    console.error('Error checking coach access:', error);
    return { isCoach: false, coachId: null, error };
  }
};

// Student code functions
export const getStudentCode = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('student_code')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    
    // If no row yet or no student code, generate one
    if (!data || !data.student_code) {
      const studentCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
      const { error: updateError } = await supabase
        .from('users')
        .update({ student_code: studentCode })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      return { data: { student_code: studentCode }, error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting student code:', error);
    return { data: null, error };
  }
};

// SCHEMA NOTE: coach_students.coach_id references coaches.id (NOT auth.users.id / public.users.id).
// To reach academy_members from a coach_students row, you must first look up coaches.user_id,
// then join to academy_members.user_id. Do not compare coach_students.coach_id directly with
// auth.uid() or any user_id — it will silently match nothing.
export const addStudentByCode = async (coachId, studentCode) => {
  const normalizedCode = String(studentCode ?? '').trim();
  console.log('[addStudentByCode] start', { coachId, studentCode: normalizedCode });

  try {
    if (!coachId) {
      console.warn('[addStudentByCode] missing coachId');
      return {
        data: null,
        error: {
          message: 'Coach profile not loaded. Please go back and reopen Academy.',
          code: 'MISSING_COACH_ID',
        },
      };
    }

    // Find user by student code
    const { data: studentData, error: studentError } = await supabase
      .from('users')
      .select('id, name, email, student_code')
      .eq('student_code', normalizedCode)
      .maybeSingle();

    console.log('[addStudentByCode] lookup result', {
      coachId,
      studentCode: normalizedCode,
      studentError: studentError?.message ?? null,
      studentErrorCode: studentError?.code ?? null,
      studentErrorDetails: studentError?.details ?? null,
      found: !!studentData,
      studentId: studentData?.id ?? null,
      studentName: studentData?.name ?? null,
    });

    if (studentError) {
      return {
        data: null,
        error: {
          message: `Database error while looking up student code: ${studentError.message}`,
          code: studentError.code || 'LOOKUP_ERROR',
          debug: { step: 'lookup', coachId, studentCode: normalizedCode },
        },
      };
    }

    if (!studentData) {
      return {
        data: null,
        error: {
          message:
            'No student found with this code. The player may not have a code yet — ask them to open Profile once so it is generated.',
          code: 'STUDENT_NOT_FOUND',
          debug: { step: 'lookup', coachId, studentCode: normalizedCode },
        },
      };
    }

    // Check if relationship already exists (active or inactive)
    const { data: existingRelation, error: relationCheckError } = await supabase
      .from('coach_students')
      .select('id, is_active')
      .eq('coach_id', coachId)
      .eq('student_id', studentData.id)
      .maybeSingle();

    console.log('[addStudentByCode] relationship check', {
      coachId,
      studentId: studentData.id,
      existingRelation,
      relationCheckError: relationCheckError?.message ?? null,
    });

    if (relationCheckError) {
      return {
        data: null,
        error: {
          message: `Database error checking coach-student link: ${relationCheckError.message}`,
          code: relationCheckError.code || 'RELATION_CHECK_ERROR',
          debug: { step: 'relation_check', coachId, studentId: studentData.id },
        },
      };
    }

    // Resolve academy_id for the coach (D3: academy-first if coach belongs to academy)
    // Done before the reactivation branch so the same value is used in both paths.
    let coachAcademyId = null;
    const { data: coachRow } = await supabase
      .from('coaches')
      .select('user_id')
      .eq('id', coachId)
      .single();
    if (coachRow?.user_id) {
      const { data: memberRow } = await supabase
        .from('academy_members')
        .select('academy_id')
        .eq('user_id', coachRow.user_id)
        .maybeSingle();
      coachAcademyId = memberRow?.academy_id ?? null;
    }

    if (existingRelation) {
      // If relationship exists and is inactive, reactivate it (also refresh academy_id)
      if (!existingRelation.is_active) {
        const { data, error: reactivateError } = await supabase
          .from('coach_students')
          .update({ is_active: true, academy_id: coachAcademyId })
          .eq('id', existingRelation.id)
          .select()
          .single();

        if (reactivateError) throw reactivateError;

        return { data: { ...data, student: studentData }, error: null };
      }
      
      // If relationship exists and is active, return error
      return { data: null, error: { message: 'Student already added' } };
    }

    // Create new coach-student relationship
    const { data, error } = await supabase
      .from('coach_students')
      .insert({
        coach_id: coachId,
        student_id: studentData.id,
        is_active: true,
        academy_id: coachAcademyId, // NULL for solo coaches, academy uuid for academy coaches
      })
      .select()
      .single();

    console.log('[addStudentByCode] insert result', {
      coachId,
      studentId: studentData.id,
      success: !error,
      insertError: error?.message ?? null,
      insertErrorCode: error?.code ?? null,
    });

    if (error) throw error;

    return { data: { ...data, student: studentData }, error: null };
  } catch (error) {
    console.error('Error adding student by code:', error);
    return { data: null, error };
  }
};

export const getCoachStudents = async (coachId) => {
  try {
    const { data, error } = await supabase
      .from('coach_students')
      .select(`
        id,
        created_at,
        students:student_id (
          id,
          name,
          email,
          avatar_url,
          dupr_rating,
          tier,
          student_code
        )
      `)
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error getting coach students:', error);
    return { data: null, error };
  }
};

// Get coach_id for a student
export const getStudentCoach = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('coach_students')
      .select('coach_id')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) // Get most recent coach first
      .limit(1); // Get only the first result

    if (error) throw error;

    // Check if we got any results
    if (!data || data.length === 0) {
      return { coachId: null, error: { message: 'No active coach found' } };
    }

    return { coachId: data[0]?.coach_id, error: null };
  } catch (error) {
    console.error('Error getting student coach:', error);
    return { coachId: null, error };
  }
};
