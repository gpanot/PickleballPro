// =====================================================
// USER PROGRAMS API - STANDARDIZED FUNCTIONS
// Mirrors admin API structure for consistency
// =====================================================

import { supabase } from './supabase';

// =====================================================
// PROGRAM CRUD OPERATIONS (MIRROR ADMIN STRUCTURE)
// =====================================================

/**
 * Create program as user (mirrors createProgramAsAdmin)
 */
export const createProgramAsUser = async (programData) => {
  try {
    const { data, error } = await supabase.rpc('create_program_as_user', {
      program_name: programData.name,
      program_description: programData.description || null,
      program_category: programData.category || 'Custom',
      program_tier: programData.tier || 'Beginner',
      program_rating: programData.rating || 0.0,
      program_added_count: 0,
      program_is_published: programData.is_published || false,
      program_thumbnail_url: programData.thumbnail_url || null,
      program_is_shareable: programData.is_shareable !== false,
      program_visibility: programData.visibility || 'private',
      program_is_coach_program: programData.is_coach_program || false
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error creating program as user:', error);
    return { data: null, error };
  }
};

/**
 * Update program as user (mirrors updateProgramAsAdmin)
 */
export const updateProgramAsUser = async (programId, updates) => {
  try {
    const { data, error } = await supabase.rpc('update_program_as_user', {
      program_id: programId,
      program_name: updates.name,
      program_description: updates.description,
      program_category: updates.category,
      program_tier: updates.tier,
      program_rating: updates.rating,
      program_added_count: updates.added_count,
      program_is_published: updates.is_published,
      program_thumbnail_url: updates.thumbnail_url,
      program_is_shareable: updates.is_shareable,
      program_visibility: updates.visibility,
      program_is_coach_program: updates.is_coach_program
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error updating program as user:', error);
    return { data: null, error };
  }
};

/**
 * Delete program as user (mirrors deleteProgramAsAdmin)
 */
export const deleteProgramAsUser = async (programId) => {
  try {
    const { data, error } = await supabase.rpc('delete_program_as_user', {
      program_id: programId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting program as user:', error);
    return { data: null, error };
  }
};

// =====================================================
// ROUTINE CRUD OPERATIONS (MIRROR ADMIN STRUCTURE)
// =====================================================

/**
 * Create routine as user (mirrors createRoutineAsAdmin)
 */
export const createRoutineAsUser = async (routineData) => {
  try {
    const { data, error } = await supabase.rpc('create_routine_as_user', {
      routine_program_id: routineData.program_id,
      routine_name: routineData.name,
      routine_description: routineData.description || null,
      routine_order_index: routineData.order_index || 0,
      routine_time_estimate_minutes: routineData.time_estimate_minutes || null,
      routine_is_published: routineData.is_published || false
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error creating routine as user:', error);
    return { data: null, error };
  }
};

/**
 * Update routine as user (mirrors updateRoutineAsAdmin)
 */
export const updateRoutineAsUser = async (routineId, updates) => {
  try {
    const { data, error } = await supabase.rpc('update_routine_as_user', {
      routine_id: routineId,
      routine_name: updates.name,
      routine_description: updates.description,
      routine_order_index: updates.order_index,
      routine_time_estimate_minutes: updates.time_estimate_minutes,
      routine_is_published: updates.is_published
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error updating routine as user:', error);
    return { data: null, error };
  }
};

/**
 * Delete routine as user (mirrors deleteRoutineAsAdmin)
 */
export const deleteRoutineAsUser = async (routineId) => {
  try {
    const { data, error } = await supabase.rpc('delete_routine_as_user', {
      routine_id: routineId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting routine as user:', error);
    return { data: null, error };
  }
};

// =====================================================
// PROGRAM COLLECTION OPERATIONS
// =====================================================

/**
 * Get user's programs (created + added + shared)
 */
export const getUserPrograms = async () => {
  try {
    const { data, error } = await supabase.rpc('get_user_programs');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user programs:', error);
    return { data: null, error };
  }
};

/**
 * Add program to user's collection (from Explore)
 */
export const addProgramToUserCollection = async (programId) => {
  try {
    const { data, error } = await supabase.rpc('add_program_to_user_collection', {
      program_id: programId
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error adding program to user collection:', error);
    return { data: null, error };
  }
};

/**
 * Get user's program statistics
 */
export const getUserProgramStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_user_program_stats');

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error getting user program stats:', error);
    return { data: null, error };
  }
};

// =====================================================
// PROGRAM SHARING OPERATIONS
// =====================================================

/**
 * Share program with another user
 */
export const shareProgramAsUser = async (programId, targetEmail, message) => {
  try {
    const { data, error } = await supabase.rpc('share_program_as_user', {
      program_id: programId,
      target_user_email: targetEmail,
      share_message: message
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error sharing program:', error);
    return { data: null, error };
  }
};

/**
 * Accept shared program
 */
export const acceptSharedProgram = async (shareId) => {
  try {
    const { data, error } = await supabase.rpc('accept_shared_program', {
      share_id: shareId
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error accepting shared program:', error);
    return { data: null, error };
  }
};

/**
 * Get pending program shares for user
 */
export const getPendingProgramShares = async () => {
  try {
    const { data, error } = await supabase.rpc('get_pending_program_shares');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting pending shares:', error);
    return { data: null, error };
  }
};

// =====================================================
// EXPLORE SCREEN ENHANCEMENTS
// =====================================================

/**
 * Get all published programs (admin + user created)
 * Enhanced version of existing getPrograms function
 */
export const getAllPublishedPrograms = async () => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        creator:users!created_by(name, email),
        routines(
          *,
          routine_exercises(
            order_index,
            custom_target_value,
            is_optional,
            exercises(*)
          )
        )
      `)
      .eq('is_published', true)
      .order('program_type', { ascending: true })  // Admin programs first
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to include creator info and program source
    const transformedData = data.map(program => ({
      ...program,
      creator_name: program.creator?.name || 'Unknown',
      creator_email: program.creator?.email,
      is_official: program.program_type === 'admin',
      is_community: program.program_type === 'user'
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error getting published programs:', error);
    return { data: null, error };
  }
};

// =====================================================
// SYNC AND MIGRATION HELPERS
// =====================================================

/**
 * Sync local program to database (for offline support)
 */
export const syncLocalProgramToDatabase = async (localProgramData) => {
  try {
    const { data, error } = await supabase.rpc('sync_local_program_to_database', {
      local_program_data: localProgramData
    });

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error syncing local program:', error);
    return { data: null, error };
  }
};

// =====================================================
// UNIFIED PROGRAM QUERIES (ADMIN + USER)
// =====================================================

/**
 * Get program by ID (works for both admin and user programs)
 */
export const getProgramById = async (programId) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        creator:users!created_by(name, email),
        routines(
          *,
          routine_exercises(
            order_index,
            custom_target_value,
            is_optional,
            exercises(*)
          )
        )
      `)
      .eq('id', programId)
      .single();

    if (error) throw error;

    // Add creator info and source flags
    const transformedData = {
      ...data,
      creator_name: data.creator?.name || 'Unknown',
      creator_email: data.creator?.email,
      is_official: data.program_type === 'admin',
      is_community: data.program_type === 'user'
    };

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error getting program by ID:', error);
    return { data: null, error };
  }
};

/**
 * Search programs (admin + user created)
 */
export const searchPrograms = async (searchTerm, filters = {}) => {
  try {
    let query = supabase
      .from('programs')
      .select(`
        *,
        creator:users!created_by(name, email)
      `)
      .eq('is_published', true);

    // Apply search term
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
    }

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.tier) {
      query = query.eq('tier', filters.tier);
    }
    if (filters.program_type) {
      query = query.eq('program_type', filters.program_type);
    }

    // Order results
    query = query.order('program_type', { ascending: true })  // Admin first
                 .order('rating', { ascending: false })      // Higher rated first
                 .order('added_count', { ascending: false }); // More popular first

    const { data, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedData = data.map(program => ({
      ...program,
      creator_name: program.creator?.name || 'Unknown',
      creator_email: program.creator?.email,
      is_official: program.program_type === 'admin',
      is_community: program.program_type === 'user'
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error searching programs:', error);
    return { data: null, error };
  }
};

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

export default {
  // Program CRUD (mirrors admin)
  createProgramAsUser,
  updateProgramAsUser,
  deleteProgramAsUser,
  
  // Routine CRUD (mirrors admin)
  createRoutineAsUser,
  updateRoutineAsUser,
  deleteRoutineAsUser,
  
  // Collection management
  getUserPrograms,
  addProgramToUserCollection,
  getUserProgramStats,
  
  // Sharing functions
  shareProgramAsUser,
  acceptSharedProgram,
  getPendingProgramShares,
  
  // Enhanced explore
  getAllPublishedPrograms,
  getProgramById,
  searchPrograms,
  
  // Sync helpers
  syncLocalProgramToDatabase
};
