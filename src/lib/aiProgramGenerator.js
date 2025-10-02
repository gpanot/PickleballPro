// AI Program Generator for Pickleball Hero
// Generates personalized programs using real exercises from the database
// based on user DUPR rating and focus skills from onboarding

import { supabase } from './supabase';
import { transformExerciseData } from './exerciseHelpers';

/**
 * Determines difficulty tier based on DUPR rating
 * @param {number} duprRating - DUPR rating
 * @returns {string} Difficulty tier
 */
function getDifficultyTier(duprRating) {
  if (duprRating < 2.5) return 'Beginner';
  if (duprRating < 3.5) return 'Intermediate';
  if (duprRating < 4.5) return 'Advanced';
  return 'Elite';
}

/**
 * Gets maximum difficulty level based on DUPR rating
 * @param {number} duprRating - DUPR rating
 * @returns {number} Maximum difficulty (1-5)
 */
function getDifficultyFromDUPR(duprRating) {
  if (duprRating < 2.5) return 2; // Beginner: max difficulty 2
  if (duprRating < 3.5) return 3; // Intermediate: max difficulty 3
  if (duprRating < 4.5) return 4; // Advanced: max difficulty 4
  return 5; // Elite: all difficulties
}

/**
 * Generates an AI-powered personalized program based on user data
 * @param {Object} user - User context with DUPR rating and focus areas
 * @returns {Object} Complete program with routines and exercises from database
 */
export async function generateAIProgram(user) {
  console.log('🤖 AI Program Generator: Starting generation for user:', {
    duprRating: user?.duprRating,
    focusAreas: user?.focus_areas,
    name: user?.name,
    tier: user?.tier
  });

  try {
    // Validate user data
    if (!user?.duprRating || !user?.focus_areas || user.focus_areas.length === 0) {
      throw new Error('User must have DUPR rating and focus areas selected');
    }

    // Filter and validate focus areas
    const validFocusAreas = user.focus_areas.filter(area => area && typeof area === 'string' && area.trim().length > 0);
    if (validFocusAreas.length === 0) {
      throw new Error('No valid focus areas found. Please complete your skill preferences again.');
    }

    // Limit focus areas to prevent database query issues (max 6 skills for optimal performance)
    const focusAreas = validFocusAreas.length > 6 ? validFocusAreas.slice(0, 6) : validFocusAreas;
    
    if (validFocusAreas.length > 6) {
      console.log('🤖 Limiting focus areas from', validFocusAreas.length, 'to 6 for optimal matching');
    }

    const { duprRating, name, tier } = user;
    
    console.log('🤖 Using validated focus areas:', focusAreas);

    // Step 1: Fetch matching exercises from database
    console.log('🤖 Fetching exercises from database...');
    const exercises = await fetchMatchingExercises(duprRating, focusAreas);
    
    if (exercises.length === 0) {
      throw new Error('No exercises found in database matching your DUPR rating and focus areas. Please contact support or try adjusting your preferences.');
    }

    console.log(`🤖 Found ${exercises.length} matching exercises`);

    // Step 2: Create program structure
    const program = await createProgramStructure(user, exercises);

    console.log('🤖 AI Program Generated successfully:', {
      programName: program.name,
      routineCount: program.routines.length,
      totalExercises: program.routines.reduce((sum, r) => sum + r.exercises.length, 0)
    });

    return program;

  } catch (error) {
    console.error('🤖 AI Program Generator Error:', error);
    throw error;
  }
}


/**
 * Fetches exercises from database that match user's DUPR range and focus skills
 * @param {number} duprRating - User's DUPR rating (e.g., 3.2)
 * @param {Array} focusAreas - Array of focus skill IDs
 * @returns {Array} Array of matching exercises
 */
async function fetchMatchingExercises(duprRating, focusAreas) {
  try {
    console.log(`🤖 Querying exercises for DUPR ${duprRating} and focus areas:`, focusAreas);
    
    // First, let's check how many published exercises exist total
    const { data: allPublished, error: countError } = await supabase
      .from('exercises')
      .select('id, title, dupr_range_min, dupr_range_max, skill_categories_json, skill_category')
      .eq('is_published', true);
    
    console.log(`🤖 Total published exercises in database: ${allPublished?.length || 0}`);
    if (allPublished && allPublished.length > 0) {
      console.log(`🤖 Sample exercises:`, allPublished.slice(0, 3).map(ex => ({
        title: ex.title,
        dupr_range: `${ex.dupr_range_min}-${ex.dupr_range_max}`,
        skills: ex.skill_categories_json || ex.skill_category
      })));
    }

    // Query exercises with DUPR range overlap and skill category matching
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        tips_json,
        skill_categories_json,
        estimated_minutes
      `)
      .eq('is_published', true)
      .or(`and(dupr_range_min.lte.${duprRating},dupr_range_max.gte.${duprRating}),and(dupr_range_min.is.null,dupr_range_max.is.null)`)
      .order('difficulty', { ascending: true });

    console.log(`🤖 After DUPR filtering (${duprRating}): ${data?.length || 0} exercises found`);

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('No exercises found matching DUPR range');
      
      // Provide detailed debugging information
      const { data: withoutDupr } = await supabase
        .from('exercises')
        .select('id, title, dupr_range_min, dupr_range_max, skill_categories_json, skill_category')
        .eq('is_published', true)
        .limit(10);
      
      console.log('🤖 Sample exercises without DUPR filter:', withoutDupr?.map(ex => ({
        title: ex.title,
        dupr: `${ex.dupr_range_min || 'null'}-${ex.dupr_range_max || 'null'}`,
        skills: ex.skill_categories_json || ex.skill_category
      })));
      
      // Throw specific error with debugging info
      const totalCount = allPublished?.length || 0;
      throw new Error(`No exercises match DUPR ${duprRating} and focus areas [${focusAreas.join(', ')}]. Found ${totalCount} total published exercises in database.`);
    }

    // Filter exercises by focus areas (skill categories)
    const filteredExercises = data.filter(exercise => {
      // Check if exercise matches any focus area
      const exerciseSkills = exercise.skill_categories_json || 
                           (exercise.skill_category ? exercise.skill_category.split(',') : []);
      
      // If no skills defined, include exercise (might be general)
      if (exerciseSkills.length === 0) return true;
      
      // Check if any focus area matches exercise skills
      return focusAreas.some(focusArea => 
        exerciseSkills.some(skill => 
          skill.toLowerCase().includes(focusArea.toLowerCase()) || 
          focusArea.toLowerCase().includes(skill.toLowerCase())
        )
      );
    });

    console.log(`🤖 Filtered ${filteredExercises.length} exercises matching focus areas:`, focusAreas);
    
    if (filteredExercises.length === 0) {
      // We found exercises matching DUPR but none matching focus areas
      console.log('🤖 Found exercises matching DUPR but none matching focus areas');
      console.log('🤖 Available skills in DUPR-matching exercises:', 
        data.map(ex => ex.skill_categories_json || ex.skill_category).filter(Boolean)
      );
      
      throw new Error(`Found ${data.length} exercises for DUPR ${duprRating}, but none match your focus areas [${focusAreas.join(', ')}]. Available skills in database may use different names.`);
    }

    // Transform exercises to consistent format
    return filteredExercises.map(exercise => transformExerciseData(exercise));

  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}

/**
 * Creates the complete program structure with routines and exercises
 * @param {Object} user - User data
 * @param {Array} exercises - Available exercises from database
 * @returns {Object} Complete program structure
 */
async function createProgramStructure(user, exercises) {
  const { duprRating, focus_areas: focusAreas, name, tier } = user;

  // Determine difficulty level for routine generation
  const difficultyLevel = getDifficultyTier(duprRating);
  
  // Create 2 routines as requested with unique timestamps
  const baseTimestamp = Date.now();
  const routines = [
    {
      id: `ai_routine_1_${baseTimestamp}`,
      name: 'Foundation & Fundamentals',
      description: 'Build your core skills and establish consistent technique',
      order_index: 1,
      time_estimate_minutes: 45,
      exercises: []
    },
    {
      id: `ai_routine_2_${baseTimestamp + 1000}`, // Add 1 second to ensure uniqueness
      name: 'Advanced Skills & Strategy',
      description: 'Take your game to the next level with advanced techniques',
      order_index: 2,
      time_estimate_minutes: 50,
      exercises: []
    }
  ];

  // Distribute exercises across routines
  await distributeExercises(routines, exercises, focusAreas, duprRating);

  // Create the complete program
  const program = {
    id: `ai_program_${Date.now()}`,
    name: `${name || 'Your'} AI-Generated Program`,
    description: `Personalized training program for DUPR ${duprRating} focusing on: ${focusAreas.join(', ')}. Generated using AI analysis of your skills and goals.`,
    category: 'AI Generated',
    tier: tier || difficultyLevel,
    thumbnail: null, // Could add AI-generated thumbnail later
    routines: routines,
    createdAt: new Date().toISOString(),
    is_ai_generated: true,
    user_dupr_rating: duprRating,
    user_focus_areas: focusAreas
  };

  return program;
}

/**
 * Distributes exercises across the 2 routines with 3-4 exercises each
 * @param {Array} routines - Array of routine objects to populate
 * @param {Array} exercises - Available exercises
 * @param {Array} focusAreas - User's focus areas
 * @param {number} duprRating - User's DUPR rating
 */
async function distributeExercises(routines, exercises, focusAreas, duprRating) {
  // Group exercises by skill category
  const exercisesBySkill = groupExercisesBySkill(exercises);
  
  // Target: 3-4 exercises per routine
  const exercisesPerRoutine = [4, 3]; // First routine gets 4, second gets 3
  
  // Track used exercises to avoid duplicates
  const usedExerciseIds = new Set();

  for (let i = 0; i < routines.length; i++) {
    const routine = routines[i];
    const targetCount = exercisesPerRoutine[i];
    
    // For first routine: focus on fundamentals and primary focus areas
    // For second routine: focus on advanced skills and secondary focus areas
    const isFoundationRoutine = i === 0;
    
    const selectedExercises = selectExercisesForRoutine(
      exercisesBySkill,
      focusAreas,
      targetCount,
      isFoundationRoutine,
      duprRating,
      usedExerciseIds
    );

    // Add exercises to routine with proper order and preloaded data
    routine.exercises = selectedExercises.map((exercise, index) => ({
      ...exercise,
      routineExerciseId: `${routine.id}_ex_${index + 1}`,
      routine_exercise_id: `${routine.id}_ex_${index + 1}`, // Keep for database compatibility
      order_index: index + 1,
      
      // Include complete exercise data for instant navigation (no API calls needed)
      completeExerciseData: {
        ...exercise, // All database fields already available
        // Apply transformations for compatibility (same as supabase.js)
        name: exercise.name || exercise.title,
        target: exercise.target_value && exercise.target_unit 
          ? `${exercise.target_value} ${exercise.target_unit}`
          : exercise.target || `${exercise.target_value || 10} attempts`,
        targetValue: exercise.targetValue || (exercise.target_value ? `${exercise.target_value}/10` : '10/10'),
        tips: exercise.tips_json 
          ? Array.isArray(exercise.tips_json) 
            ? exercise.tips_json 
            : []
          : exercise.tips 
            ? exercise.tips.split('\n').filter(tip => tip.trim())
            : [],
        skillCategories: exercise.skill_categories_json
          ? Array.isArray(exercise.skill_categories_json)
            ? exercise.skill_categories_json
            : []
          : exercise.skill_category
            ? exercise.skill_category.split(',').filter(cat => cat.trim())
            : [],
        estimatedTime: exercise.estimated_minutes 
          ? `${exercise.estimated_minutes} min`
          : exercise.estimated_time || '10 min',
        estimatedMinutes: exercise.estimated_minutes || 
          (exercise.estimated_time ? parseInt(exercise.estimated_time.replace(' min', '')) : 10)
      }
    }));

    console.log(`🤖 Routine ${i + 1} (${routine.name}) populated with ${routine.exercises.length} exercises`);
  }
}

/**
 * Groups exercises by their skill categories
 * @param {Array} exercises - Array of exercises
 * @returns {Object} Object with skill categories as keys and exercise arrays as values
 */
function groupExercisesBySkill(exercises) {
  const grouped = {};
  
  exercises.forEach(exercise => {
    const skills = exercise.skillCategories || [];
    
    // If no skills, add to 'general' category
    if (skills.length === 0) {
      if (!grouped.general) grouped.general = [];
      grouped.general.push(exercise);
      return;
    }
    
    // Add exercise to each relevant skill category
    skills.forEach(skill => {
      const skillKey = skill.toLowerCase();
      if (!grouped[skillKey]) grouped[skillKey] = [];
      grouped[skillKey].push(exercise);
    });
  });
  
  console.log('🤖 Exercises grouped by skills:', Object.keys(grouped));
  return grouped;
}

/**
 * Selects exercises for a specific routine
 * @param {Object} exercisesBySkill - Exercises grouped by skill
 * @param {Array} focusAreas - User's focus areas
 * @param {number} targetCount - Number of exercises to select
 * @param {boolean} isFoundationRoutine - Whether this is the foundation routine
 * @param {number} duprRating - User's DUPR rating
 * @param {Set} usedExerciseIds - Set of already used exercise IDs
 * @returns {Array} Selected exercises for the routine
 */
function selectExercisesForRoutine(exercisesBySkill, focusAreas, targetCount, isFoundationRoutine, duprRating, usedExerciseIds) {
  const selectedExercises = [];
  const maxDifficulty = getDifficultyFromDUPR(duprRating);
  
  // Prioritize focus areas
  const prioritizedSkills = isFoundationRoutine 
    ? [...focusAreas, 'general'] // Foundation includes general skills
    : [...focusAreas.slice().reverse(), 'general']; // Advanced uses reverse order for variety

  // Select exercises from prioritized skills
  for (const skill of prioritizedSkills) {
    if (selectedExercises.length >= targetCount) break;
    
    const skillKey = skill.toLowerCase();
    const availableExercises = exercisesBySkill[skillKey] || [];
    
    // Filter by difficulty and exclude already used exercises
    const suitableExercises = availableExercises.filter(exercise => 
      !usedExerciseIds.has(exercise.id) &&
      (exercise.difficulty || 1) <= maxDifficulty
    );
    
    if (suitableExercises.length > 0) {
      // For foundation routine, prefer lower difficulty
      // For advanced routine, prefer higher difficulty
      const sortedExercises = suitableExercises.sort((a, b) => {
        const diffA = a.difficulty || 1;
        const diffB = b.difficulty || 1;
        return isFoundationRoutine ? diffA - diffB : diffB - diffA;
      });
      
      // Take one exercise from this skill
      const exercise = sortedExercises[0];
      selectedExercises.push(exercise);
      usedExerciseIds.add(exercise.id);
      
      console.log(`🤖 Selected exercise "${exercise.title || exercise.name}" (difficulty: ${exercise.difficulty}) for skill: ${skill}`);
    }
  }
  
  // If we still need more exercises, fill from any available exercises
  if (selectedExercises.length < targetCount) {
    const allExercises = Object.values(exercisesBySkill).flat();
    const remainingExercises = allExercises.filter(exercise => 
      !usedExerciseIds.has(exercise.id) &&
      (exercise.difficulty || 1) <= maxDifficulty
    );
    
    while (selectedExercises.length < targetCount && remainingExercises.length > 0) {
      const exercise = remainingExercises.shift();
      selectedExercises.push(exercise);
      usedExerciseIds.add(exercise.id);
    }
  }
  
  return selectedExercises;
}

/**
 * Saves the generated program to the database and user's local programs list
 * @param {Object} program - The generated program
 * @param {Function} updatePrograms - Function to update programs state
 */
export async function saveAIProgram(program, updatePrograms) {
  console.log('🤖 Saving AI-generated program to database:', program.name);
  
  try {
    // Step 1: Create the program in database
    console.log('🤖 Creating program in database...');
    const { data: savedProgram, error: programError } = await supabase.rpc('create_program_as_user', {
      program_name: program.name,
      program_description: program.description,
      program_category: program.category || 'AI Generated',
      program_tier: program.tier || 'Beginner',
      program_is_published: false,
      program_thumbnail_url: null,
      program_is_shareable: true,
      program_visibility: 'private'
    });

    if (programError) {
      console.error('❌ Failed to create program in database:', programError);
      throw programError;
    }

    const dbProgram = Array.isArray(savedProgram) ? savedProgram[0] : savedProgram;
    console.log('✅ Program created in database with ID:', dbProgram.id);

    // Step 2: Create routines and their exercises
    const savedRoutines = [];
    for (const routine of program.routines) {
      console.log('🤖 Creating routine:', routine.name);
      
      // Create routine in database
      const { data: savedRoutine, error: routineError } = await supabase.rpc('create_routine_as_user', {
        routine_program_id: dbProgram.id,
        routine_name: routine.name,
        routine_description: routine.description,
        routine_order_index: routine.order_index,
        routine_time_estimate_minutes: routine.time_estimate_minutes,
        routine_is_published: false
      });

      if (routineError) {
        console.error('❌ Failed to create routine:', routineError);
        throw routineError;
      }

      const dbRoutine = Array.isArray(savedRoutine) ? savedRoutine[0] : savedRoutine;
      console.log('✅ Routine created with ID:', dbRoutine.id);

      // Step 3: Create exercises and link them to routine
      const savedExercises = [];
      for (let i = 0; i < routine.exercises.length; i++) {
        const exercise = routine.exercises[i];
        console.log('🤖 Processing exercise:', exercise.title || exercise.name);

        // Check if exercise already exists in database by title (most reliable)
        let exerciseId = null;
        const exerciseTitle = exercise.title || exercise.name;
        
        const { data: existingExercise } = await supabase
          .from('exercises')
          .select('id')
          .eq('title', exerciseTitle)
          .maybeSingle();

        if (existingExercise) {
          console.log('🔍 Exercise already exists, using existing ID:', existingExercise.id);
          exerciseId = existingExercise.id;
        } else {
          // Create new exercise with unique code
          console.log('➕ Creating new exercise in database');
          const uniqueCode = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const { data: createdExercise, error: exerciseError } = await supabase.rpc('create_exercise_as_user', {
            exercise_code: uniqueCode,
            exercise_title: exerciseTitle,
            exercise_description: exercise.description || `AI-generated exercise: ${exerciseTitle}`,
            exercise_instructions: exercise.instructions || exercise.description || 'Follow the exercise instructions',
            exercise_goal: exercise.goal_text || exercise.target || 'Complete the exercise',
            exercise_difficulty: exercise.difficulty || 3,
            exercise_target_value: exercise.target_value || 10,
            exercise_target_unit: exercise.target_unit || 'attempts',
            exercise_estimated_minutes: exercise.estimated_minutes || 10,
            exercise_skill_category: exercise.skill_category || 'general',
            exercise_skill_categories_json: JSON.stringify(exercise.skill_categories_json || []),
            exercise_is_published: false
          });

          if (exerciseError) {
            console.error('❌ Failed to create exercise:', exerciseError);
            throw exerciseError;
          }

          const dbExercise = Array.isArray(createdExercise) ? createdExercise[0] : createdExercise;
          exerciseId = dbExercise.id;
          console.log('✅ Exercise created with ID:', exerciseId);
        }

        // Step 4: Link exercise to routine
        console.log('🔗 Linking exercise to routine...');
        const { error: linkError } = await supabase
          .from('routine_exercises')
          .insert({
            routine_id: dbRoutine.id,
            exercise_id: exerciseId,
            order_index: i + 1,
            is_optional: exercise.is_optional || false
          });

        if (linkError) {
          console.error('❌ Failed to link exercise to routine:', linkError);
          throw linkError;
        }

        // Add exercise data for local storage
        savedExercises.push({
          ...exercise,
          id: exerciseId,
          routine_exercise_id: `${dbRoutine.id}_${exerciseId}`,
          order_index: i + 1
        });
      }

      // Add routine data for local storage
      savedRoutines.push({
        ...routine,
        id: dbRoutine.id,
        exercises: savedExercises
      });
    }

    // Step 5: Update program object with database IDs
    const finalProgram = {
      ...program,
      id: dbProgram.id,
      program_id: dbProgram.id,
      created_by: dbProgram.created_by,
      category: dbProgram.category,
      tier: dbProgram.tier,
      is_published: dbProgram.is_published,
      routines: savedRoutines,
      createdAt: dbProgram.created_at,
      is_synced_to_db: true // Flag to indicate this program is in database
    };

    console.log('🤖 AI Program successfully saved to database with full structure');

    // Step 6: Update local state
    updatePrograms(prevPrograms => {
      // Check if program already exists to avoid duplicates
      const exists = prevPrograms.some(p => p.id === finalProgram.id);
      if (exists) {
        console.log('🤖 Program already exists in local state, not adding duplicate');
        return prevPrograms;
      }
      
      return [...prevPrograms, finalProgram];
    });

    console.log('🤖 AI Program saved successfully to both database and local state');
    return { success: true, program: finalProgram };

  } catch (error) {
    console.error('❌ Failed to save AI program to database:', error);
    
    // Fallback: save to local storage only
    console.log('📱 Falling back to local storage only...');
    updatePrograms(prevPrograms => {
      const exists = prevPrograms.some(p => p.id === program.id);
      if (exists) {
        console.log('🤖 Program already exists, not adding duplicate');
        return prevPrograms;
      }
      
      return [...prevPrograms, { ...program, is_synced_to_db: false }];
    });

    return { success: false, error: error.message, program: { ...program, is_synced_to_db: false } };
  }
}

/**
 * Validates if user can generate an AI program
 * @param {Object} user - User context
 * @returns {Object} Validation result with isValid boolean and message
 */
export function validateUserForAIGeneration(user) {
  if (!user) {
    return {
      isValid: false,
      message: 'User not found. Please complete onboarding first.'
    };
  }

  if (!user.duprRating || user.duprRating < 2.0 || user.duprRating > 8.0) {
    return {
      isValid: false,
      message: 'Valid DUPR rating required (2.0-8.0). Please update your profile.'
    };
  }

  if (!user.focus_areas || user.focus_areas.length === 0) {
    return {
      isValid: false,
      message: 'Focus areas required. Please complete your skill preferences in onboarding.'
    };
  }

  // Additional validation: check if focus_areas is a valid array with valid strings
  if (!Array.isArray(user.focus_areas)) {
    return {
      isValid: false,
      message: 'Invalid focus areas format. Please complete your skill preferences again.'
    };
  }

  const validFocusAreas = user.focus_areas.filter(area => area && typeof area === 'string' && area.trim().length > 0);
  if (validFocusAreas.length === 0) {
    return {
      isValid: false,
      message: 'No valid focus areas found. Please complete your skill preferences again.'
    };
  }

  return {
    isValid: true,
    message: 'Ready to generate your AI program!'
  };
}

/**
 * Syncs any unsynced AI programs to the database
 * Call this when user logs in or when connection is restored
 * @param {Array} programs - Array of user programs
 * @param {Function} updatePrograms - Function to update programs state
 */
export async function syncUnsyncedAIPrograms(programs, updatePrograms) {
  console.log('🔄 Checking for unsynced AI programs...');
  
  const unsyncedPrograms = programs.filter(program => 
    program.is_ai_generated && !program.is_synced_to_db
  );
  
  if (unsyncedPrograms.length === 0) {
    console.log('✅ No unsynced AI programs found');
    return { success: true, syncedCount: 0 };
  }
  
  console.log(`🔄 Found ${unsyncedPrograms.length} unsynced AI programs, attempting to sync...`);
  
  let syncedCount = 0;
  const updatedPrograms = [...programs];
  
  for (const program of unsyncedPrograms) {
    try {
      console.log(`🔄 Syncing program: ${program.name}`);
      
      // Remove the old unsynced program from the list
      const programIndex = updatedPrograms.findIndex(p => p.id === program.id);
      if (programIndex !== -1) {
        updatedPrograms.splice(programIndex, 1);
      }
      
      // Save to database (this will add it back with proper database IDs)
      const saveResult = await saveAIProgram(program, (updateFn) => {
        // Don't use the callback here, we'll update manually
      });
      
      if (saveResult.success) {
        // Add the synced program to our updated list
        updatedPrograms.push(saveResult.program);
        syncedCount++;
        console.log(`✅ Successfully synced program: ${program.name}`);
      } else {
        // Re-add the unsynced program if sync failed
        updatedPrograms.push(program);
        console.log(`❌ Failed to sync program: ${program.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Error syncing program ${program.name}:`, error);
      // Re-add the unsynced program if sync failed
      if (!updatedPrograms.find(p => p.id === program.id)) {
        updatedPrograms.push(program);
      }
    }
  }
  
  // Update the programs state with all changes
  updatePrograms(() => updatedPrograms);
  
  console.log(`🔄 Sync complete: ${syncedCount}/${unsyncedPrograms.length} programs synced`);
  
  return {
    success: syncedCount > 0,
    syncedCount,
    totalAttempted: unsyncedPrograms.length
  };
}
