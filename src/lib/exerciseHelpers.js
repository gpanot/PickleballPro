// ===================================================================
// EXERCISE DATA HELPERS
// ===================================================================
// Helper functions to work with both enhanced JSONB schema and legacy schema
// for backward compatibility during migration period
// ===================================================================

/**
 * Transforms exercise data from database to app format
 * Handles both enhanced JSONB fields and legacy string fields
 */
export const transformExerciseData = (exercise) => {
  if (!exercise) return null;

  return {
    ...exercise,
    
    // Name: Ensure name field exists for logging compatibility
    name: exercise.name || exercise.title,
    
    // Tips: Use JSONB if available, fallback to legacy string format
    tips: exercise.tips_json 
      ? Array.isArray(exercise.tips_json) 
        ? exercise.tips_json 
        : []
      : exercise.tips 
        ? exercise.tips.split('\n').filter(tip => tip.trim())
        : [],
    
    // Skill Categories: Use JSONB if available, fallback to legacy comma-separated
    skillCategories: exercise.skill_categories_json
      ? Array.isArray(exercise.skill_categories_json)
        ? exercise.skill_categories_json
        : []
      : exercise.skill_category
        ? exercise.skill_category.split(',').filter(cat => cat.trim())
        : [],
    
    // Target: Create target string from target_value and target_unit for logging compatibility
    target: exercise.target_value && exercise.target_unit 
      ? `${exercise.target_value} ${exercise.target_unit}`
      : exercise.target || `${exercise.target_value || 10} attempts`,
    
    // TargetValue: Ensure targetValue field exists for LogResultComponent compatibility
    targetValue: exercise.targetValue || (exercise.target_value ? `${exercise.target_value}/10` : '10/10'),
    
    // Estimated Time: Use minutes if available, fallback to legacy text format
    estimatedTime: exercise.estimated_minutes 
      ? `${exercise.estimated_minutes} min`
      : exercise.estimated_time || '10 min',
    
    estimatedMinutes: exercise.estimated_minutes || 
      (exercise.estimated_time ? parseInt(exercise.estimated_time.replace(' min', '')) : 10)
  };
};

/**
 * Prepares exercise data for database insertion
 * Creates both enhanced JSONB and legacy formats for compatibility
 */
export const prepareExerciseForInsert = (exerciseData) => {
  const {
    title,
    targetCriteria,
    instructions,
    tips = [],
    skillCategories = [],
    estimatedTime,
    youtubeUrl,
    difficulty,
    userId
  } = exerciseData;

  // Parse estimated time to minutes
  const estimatedMinutes = estimatedTime 
    ? parseInt(estimatedTime.replace(' min', ''))
    : 10;

  return {
    title: title.trim(),
    code: title.trim().toUpperCase().replace(/\s+/g, '_'),
    description: targetCriteria.trim() || 'Complete the exercise successfully',
    goal: targetCriteria.trim() || 'Complete the exercise successfully',
    instructions: instructions.trim() || 'Follow the provided guidelines',
    
    // Enhanced JSONB fields
    tips_json: Array.isArray(tips) ? tips.filter(tip => tip.trim()) : [],
    skill_categories_json: Array.isArray(skillCategories) ? skillCategories : [],
    estimated_minutes: estimatedMinutes,
    
    // Legacy fields for backward compatibility
    tips: Array.isArray(tips) 
      ? tips.filter(tip => tip.trim()).join('\n') 
      : '',
    skill_category: Array.isArray(skillCategories) 
      ? skillCategories.join(',') 
      : '',
    estimated_time: estimatedTime || '10 min',
    
    youtube_url: youtubeUrl?.trim() || '',
    target_value: targetCriteria.trim() || 'Complete',
    difficulty: difficulty,
    is_published: false,
    created_by: userId
  };
};

/**
 * Formats exercise data for ExerciseDetailScreen
 * Ensures consistent format regardless of data source
 */
export const formatExerciseForDetail = (exercise) => {
  const transformed = transformExerciseData(exercise);
  
  return {
    code: transformed.code || "EXERCISE",
    title: transformed.title || "Exercise",
    level: `Difficulty Level ${transformed.difficulty || 1}`,
    goal: transformed.goal || transformed.description || "Complete the exercise",
    instructions: transformed.instructions || "No instructions provided",
    targetType: "count",
    targetValue: transformed.target_value || "Complete",
    difficulty: transformed.difficulty || 1,
    validationMode: "manual",
    estimatedTime: transformed.estimatedTime,
    equipment: ["Balls", "Paddle"], // Default equipment
    tips: transformed.tips.length > 0 
      ? transformed.tips 
      : ["Follow the instructions carefully"]
  };
};

/**
 * Validates exercise data before submission
 */
export const validateExerciseData = (exerciseData) => {
  const errors = [];
  
  if (!exerciseData.title?.trim()) {
    errors.push("Exercise name is required");
  }
  
  if (!exerciseData.targetCriteria?.trim()) {
    errors.push("Target/Success criteria is required");
  }
  
  if (!exerciseData.instructions?.trim()) {
    errors.push("Instructions are required");
  }
  
  if (!exerciseData.difficulty || exerciseData.difficulty < 1 || exerciseData.difficulty > 5) {
    errors.push("Difficulty must be between 1 and 5");
  }
  
  if (!exerciseData.skillCategories || exerciseData.skillCategories.length === 0) {
    errors.push("At least one skill category must be selected");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Query builder for exercises with enhanced schema support
 */
export const buildExerciseQuery = (supabase, options = {}) => {
  const {
    includeUnpublished = false,
    skillCategories = [],
    difficulty = null,
    createdBy = null,
    limit = null
  } = options;

  let query = supabase
    .from('exercises')
    .select(`
      *,
      tips_json,
      skill_categories_json,
      estimated_minutes
    `);

  // Filter by published status
  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  // Filter by skill categories (using JSONB containment)
  if (skillCategories.length > 0) {
    query = query.contains('skill_categories_json', skillCategories);
  }

  // Filter by difficulty
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  // Filter by creator
  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  // Limit results
  if (limit) {
    query = query.limit(limit);
  }

  // Default ordering
  query = query.order('created_at', { ascending: false });

  return query;
};

// Export for use in components
export default {
  transformExerciseData,
  prepareExerciseForInsert,
  formatExerciseForDetail,
  validateExerciseData,
  buildExerciseQuery
};
