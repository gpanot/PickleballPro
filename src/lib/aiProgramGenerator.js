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
 * Saves the generated program to the user's local programs list
 * @param {Object} program - The generated program
 * @param {Function} updatePrograms - Function to update programs state
 */
export function saveAIProgram(program, updatePrograms) {
  console.log('🤖 Saving AI-generated program:', program.name);
  
  updatePrograms(prevPrograms => {
    // Check if program already exists to avoid duplicates
    const exists = prevPrograms.some(p => p.id === program.id);
    if (exists) {
      console.log('🤖 Program already exists, not adding duplicate');
      return prevPrograms;
    }
    
    return [...prevPrograms, program];
  });
  
  console.log('🤖 AI Program saved successfully');
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
