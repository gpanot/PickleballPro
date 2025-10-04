import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lenlkoqtczffweamgsxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbmxrb3F0Y3pmZndlYW1nc3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODc4NTMsImV4cCI6MjA3MzY2Mzg1M30.30bQPgg14boyWnITZoFOFxNzuZ8FXFPAqhsB8WRRjjA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add auth state listener for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Supabase Auth State Change:', event, session?.user?.email || 'No user');
  console.log('🔐 Supabase Session valid:', !!session);
  console.log('🔐 Supabase Access token present:', !!session?.access_token);
});

// Authentication functions
export const signUp = async (email, password, userData = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // Additional user metadata
      }
    });

    if (error) throw error;

    // If signup successful, create or update user profile in our users table
    if (data.user && !error) {
      console.log('Creating user profile with data:', userData);
      
      const profileData = {
        id: data.user.id,
        email: data.user.email,
        name: userData.name || email.split('@')[0], // Default name from email
        ...userData // Spread all onboarding data
      };
      
      console.log('Final profile data being saved:', profileData);
      
      // Use upsert to handle cases where profile already exists
      const { error: profileError } = await supabase
        .from('users')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.error('Error creating/updating user profile:', profileError);
        // Don't throw here as the auth user was created successfully
      } else {
        console.log('✅ User profile created/updated successfully');
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
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
        .single();

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
      .single();

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

// 1. Get all published programs for Explore screen
export const getPrograms = async () => {
  try {
    // Direct query without session validation - works with anonymous access
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
        routines (
          id,
          name,
          description,
          order_index,
          time_estimate_minutes,
          routine_exercises (
            order_index,
            custom_target_value,
            is_optional,
            exercises (*)
          )
        )
      `)
      .eq('is_published', true)
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
      .select('*')
      .eq('is_active', true);
    
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
  try {
    console.log('🏓 [SUPABASE] Creating logbook entry:', {
      userId: userId,
      entryData: entryData
    });
    
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert({
        user_id: userId,
        date: entryData.date,
        hours: entryData.hours,
        session_type: entryData.sessionType,
        training_focus: entryData.trainingFocus,
        difficulty: entryData.difficulty,
        feeling: entryData.feeling,
        notes: entryData.notes,
        location: entryData.location
      })
      .select()
      .single();

    if (error) {
      console.error('🏓 [SUPABASE] Error creating logbook entry:', error);
      throw error;
    }
    
    console.log('🏓 [SUPABASE] ✅ Logbook entry created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('🏓 [SUPABASE] ❌ Failed to create logbook entry:', error);
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
        training_focus: entryData.trainingFocus,
        difficulty: entryData.difficulty,
        feeling: entryData.feeling,
        notes: entryData.notes,
        location: entryData.location
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
    
    console.log('🔄 Supabase: ✅ Transform completed, result:', transformed.length, 'programs');
    console.log('🔄 Supabase: First transformed program sample:', JSON.stringify(transformed[0], null, 2));
    
    return transformed;
  } catch (error) {
    console.error('🔄 Supabase: Error transforming program data:', error);
    return [];
  }
};

// Helper function to transform coach data to match your current app structure
export const transformCoachData = (coaches) => {
  return coaches.map(coach => ({
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
    image: coach.avatar_url,
    phone: coach.phone,
    messagingPreferences: coach.messaging_preferences || {
      whatsapp: false,
      imessage: false,
      zalo: false
    }
  }));
};
