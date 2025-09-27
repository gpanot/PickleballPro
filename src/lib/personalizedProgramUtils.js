// Utility functions for personalized program management
import { generatePersonalizedProgram } from './programGenerator';
import { savePersonalizedProgram, loadPersonalizedProgram } from './personalizedProgramStorage';

/**
 * Generate and save a personalized program for a user based on their profile data
 * @param {Object} user - User object with profile data
 * @returns {Promise<Object|null>} Generated program or null if failed
 */
export const generateAndSavePersonalizedProgram = async (user) => {
  try {
    console.log('🎯 Generating personalized program for user:', user?.id, user?.name);
    
    if (!user?.id) {
      console.warn('⚠️ Cannot generate program: No user ID');
      return null;
    }

    // Extract focus areas from user profile
    const focusAreas = user.focus_areas || [];
    
    console.log('🎯 User focus areas:', focusAreas);
    console.log('🎯 User DUPR rating:', user.duprRating || 3.0);
    
    // Generate the program
    const program = generatePersonalizedProgram(
      focusAreas,
      user.duprRating || 3.0,
      {
        name: user.name || 'Your',
        tier: user.tier || 'Intermediate'
      }
    );
    
    console.log('✅ Generated personalized program:', program.name);
    
    // Save to local storage
    const saved = await savePersonalizedProgram(program, user.id);
    
    if (saved) {
      console.log('✅ Personalized program saved successfully');
      return program;
    } else {
      console.error('❌ Failed to save personalized program');
      return null;
    }
  } catch (error) {
    console.error('❌ Error generating personalized program:', error);
    return null;
  }
};

/**
 * Get or create a personalized program for a user
 * @param {Object} user - User object with profile data
 * @returns {Promise<Object|null>} Existing or newly created program
 */
export const getOrCreatePersonalizedProgram = async (user) => {
  try {
    if (!user?.id) {
      console.warn('⚠️ Cannot get/create program: No user ID');
      return null;
    }

    // First try to load existing program
    console.log('🔍 Looking for existing personalized program...');
    const existingProgram = await loadPersonalizedProgram(user.id);
    
    if (existingProgram) {
      console.log('✅ Found existing personalized program:', existingProgram.name);
      return existingProgram;
    }
    
    // No existing program, generate a new one
    console.log('📝 No existing program found, generating new one...');
    return await generateAndSavePersonalizedProgram(user);
  } catch (error) {
    console.error('❌ Error getting/creating personalized program:', error);
    return null;
  }
};

/**
 * Check if user has the necessary data to create a meaningful personalized program
 * @param {Object} user - User object
 * @returns {boolean} Whether user has enough data
 */
export const canCreateMeaningfulProgram = (user) => {
  // A meaningful program can be created if we have at least:
  // - User ID (for saving)
  // - Name (for personalization)
  // Focus areas are optional as we have defaults
  return !!(user?.id && user?.name);
};

/**
 * Force regenerate a personalized program (for reset functionality)
 * @param {Object} user - User object with profile data
 * @returns {Promise<Object|null>} Newly generated program
 */
export const regeneratePersonalizedProgram = async (user) => {
  try {
    console.log('🔄 Force regenerating personalized program...');
    return await generateAndSavePersonalizedProgram(user);
  } catch (error) {
    console.error('❌ Error regenerating personalized program:', error);
    return null;
  }
};
