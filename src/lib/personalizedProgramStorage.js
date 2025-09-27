// Local storage utility for personalized programs
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSONALIZED_PROGRAM_KEY = 'personalized_program';

/**
 * Save personalized program to local storage
 * @param {Object} program - The personalized program object
 * @param {string} userId - User ID to associate with the program
 * @returns {Promise<boolean>} Success status
 */
export const savePersonalizedProgram = async (program, userId) => {
  try {
    const programData = {
      ...program,
      userId,
      savedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    await AsyncStorage.setItem(PERSONALIZED_PROGRAM_KEY, JSON.stringify(programData));
    console.log('✅ Personalized program saved to local storage');
    return true;
  } catch (error) {
    console.error('❌ Error saving personalized program to local storage:', error);
    return false;
  }
};

/**
 * Load personalized program from local storage
 * @param {string} userId - User ID to match against stored program
 * @returns {Promise<Object|null>} The program object or null if not found
 */
export const loadPersonalizedProgram = async (userId) => {
  try {
    const storedData = await AsyncStorage.getItem(PERSONALIZED_PROGRAM_KEY);
    
    if (!storedData) {
      console.log('📭 No personalized program found in local storage');
      return null;
    }
    
    const programData = JSON.parse(storedData);
    
    // Check if program belongs to current user
    if (programData.userId !== userId) {
      console.log('🔒 Personalized program belongs to different user, clearing');
      await clearPersonalizedProgram();
      return null;
    }
    
    console.log('✅ Personalized program loaded from local storage');
    return programData;
  } catch (error) {
    console.error('❌ Error loading personalized program from local storage:', error);
    return null;
  }
};

/**
 * Check if personalized program exists for user
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} Whether program exists
 */
export const hasPersonalizedProgram = async (userId) => {
  try {
    const program = await loadPersonalizedProgram(userId);
    return program !== null;
  } catch (error) {
    console.error('❌ Error checking for personalized program:', error);
    return false;
  }
};

/**
 * Clear personalized program from local storage
 * @returns {Promise<boolean>} Success status
 */
export const clearPersonalizedProgram = async () => {
  try {
    await AsyncStorage.removeItem(PERSONALIZED_PROGRAM_KEY);
    console.log('🗑️ Personalized program cleared from local storage');
    return true;
  } catch (error) {
    console.error('❌ Error clearing personalized program:', error);
    return false;
  }
};

/**
 * Update program progress (for future evolution based on user logs)
 * @param {string} userId - User ID
 * @param {Object} progressData - Progress update data
 * @returns {Promise<boolean>} Success status
 */
export const updateProgramProgress = async (userId, progressData) => {
  try {
    const program = await loadPersonalizedProgram(userId);
    if (!program) {
      console.log('📭 No program found to update');
      return false;
    }
    
    // Add progress tracking
    const updatedProgram = {
      ...program,
      progress: {
        ...program.progress,
        ...progressData,
        lastUpdated: new Date().toISOString()
      }
    };
    
    return await savePersonalizedProgram(updatedProgram, userId);
  } catch (error) {
    console.error('❌ Error updating program progress:', error);
    return false;
  }
};
