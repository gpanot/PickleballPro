// Supabase Configuration for PicklePro Mobile App
// Add this to your React Native app

export const supabaseConfig = {
  url: 'https://lenlkoqtczffweamgsxv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbmxrb3F0Y3pmZndlYW1nc3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODc4NTMsImV4cCI6MjA3MzY2Mzg1M30.30bQPgg14boyWnITZoFOFxNzuZ8FXFPAqhsB8WRRjjA'
};

// Example usage in your app:
/*
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabase-config';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Example API calls for your app:

// 1. Get all published programs for Explore screen
export const getPrograms = async () => {
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
    .eq('is_published', true)
    .order('order_index');
  
  return { data, error };
};

// 2. Get program details with full routine/exercise data
export const getProgramDetails = async (programId) => {
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
  
  return { data, error };
};

// 3. Log exercise completion
export const logExerciseCompletion = async (userId, exerciseId, resultData) => {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      exercise_id: exerciseId,
      result_value: resultData.result_value,
      target_value: resultData.target_value,
      passed: resultData.passed,
      attempts: resultData.attempts || 1,
      session_type: resultData.session_type || 'practice',
      notes: resultData.notes,
      feeling_rating: resultData.feeling_rating
    });
  
  return { data, error };
};

// 4. Get coaches for directory
export const getCoaches = async (filters = {}) => {
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
  
  return { data, error };
};

// 5. Logbook operations
export const createLogbookEntry = async (userId, entryData) => {
  const { data, error } = await supabase
    .from('logbook_entries')
    .insert({
      user_id: userId,
      ...entryData
    });
  
  return { data, error };
};

export const getLogbookEntries = async (userId) => {
  const { data, error } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  return { data, error };
};

// 6. User progress tracking
export const getUserProgress = async (userId) => {
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
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  
  return { data, error };
};
*/
