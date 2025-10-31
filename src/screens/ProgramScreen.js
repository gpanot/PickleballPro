import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { generateAIProgram, validateUserForAIGeneration, saveAIProgram, syncUnsyncedAIPrograms } from '../lib/aiProgramGenerator';
import { supabase, getPrograms, transformProgramData } from '../lib/supabase';
import { usePreload } from '../context/PreloadContext';
import WebIcon from '../components/WebIcon';
import WebLinearGradient from '../components/WebLinearGradient';

const { width, height } = Dimensions.get('window');

// Enhanced responsive thumbnail sizing for iPad portrait mode
const getThumbnailSize = (screenWidth, screenHeight) => {
  // Special optimization for iPad portrait mode (768x1024)
  if (screenWidth === 768 && screenHeight >= 1024) {
    return { width: 90, height: 135 }; // Larger thumbnails for iPad portrait
  }
  if (screenWidth >= 768) {
    return { width: 80, height: 120 }; // Larger thumbnails for tablets
  }
  return { width: 60, height: 100 }; // Default for phones
};

// Responsive design helper functions for Library tab (from ExploreTrainingScreen)
const getColumnsForWidth = (screenWidth, screenHeight) => {
  // Special handling for iPad portrait mode (768x1024)
  if (screenWidth === 768 && screenHeight >= 1024) return 3; // iPad portrait - 3 columns
  if (screenWidth >= 1024) return 4; // Large tablets landscape (iPad Pro, etc.)
  if (screenWidth >= 768) return 3;  // iPad mini, standard tablets
  if (screenWidth >= 480) return 2;  // Large phones, small tablets
  return 2; // Default for phones
};

const getCardWidth = (screenWidth, screenHeight) => {
  const columns = getColumnsForWidth(screenWidth, screenHeight);
  // Optimized padding for iPad portrait mode
  const padding = (screenWidth === 768 && screenHeight >= 1024) ? 24 : 16;
  const margin = 12; // Slightly larger margin for better spacing
  const totalHorizontalSpace = padding * 2 + margin * (columns - 1);
  return (screenWidth - totalHorizontalSpace) / columns;
};

const getHorizontalCardWidth = (screenWidth, screenHeight) => {
  const cardWidth = getCardWidth(screenWidth, screenHeight);
  return cardWidth * 0.85; // Slightly smaller for horizontal scroll
};

// Enhanced thumbnail height calculation for portrait mode
const getThumbnailHeight = (screenWidth, screenHeight) => {
  const cardWidth = getCardWidth(screenWidth, screenHeight);
  // For iPad portrait, use a better aspect ratio
  if (screenWidth === 768 && screenHeight >= 1024) {
    return Math.max(180, cardWidth * 0.8); // Taller thumbnails for portrait
  }
  return Math.max(160, cardWidth * 0.75);
};

export default function ProgramScreen({ navigation, route }) {
  const { user } = useUser();
  const { getDataWithFallback, hasPreloadedData, isDataLoading, refreshData, getDataError } = usePreload();
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = React.useState('programs'); // 'programs' or 'library'
  const [programs, setPrograms] = React.useState([]);
  const [showCreateProgramModal, setShowCreateProgramModal] = React.useState(false);
  const [newProgramName, setNewProgramName] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = React.useState(true);
  const [aiGenerationStep, setAiGenerationStep] = React.useState(0);
  
  // Library tab state (ExploreTrainingScreen content)
  const [explorePrograms, setExplorePrograms] = React.useState([]);
  const [libraryLoading, setLibraryLoading] = React.useState(true);
  const [libraryError, setLibraryError] = React.useState(null);
  const [libraryRefreshing, setLibraryRefreshing] = React.useState(false);
  const [savedCategoryOrder, setSavedCategoryOrder] = React.useState([]);
  
  // Animation for library loading
  const libraryRotateAnim = React.useRef(new Animated.Value(0)).current;
  
  // Animation for rotating ball
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const aiRotateAnim = React.useRef(new Animated.Value(0)).current;

  // Load programs when component mounts
  React.useEffect(() => {
    console.log('🔄 [ProgramScreen] Component mounted, loading programs...');
    console.log('👤 [ProgramScreen] Current user:', user?.id);
    loadPrograms();
    
    // Always preload library data for faster access
    fetchLibraryPrograms();
    fetchCategoryOrder();
  }, [user?.id]);

  // Reload library data when switching to Library tab (if not already loaded)
  React.useEffect(() => {
    if (currentView === 'library' && explorePrograms.length === 0 && !libraryLoading) {
      fetchLibraryPrograms();
      fetchCategoryOrder();
    }
  }, [currentView]);

  // Start rotation animation when loading
  React.useEffect(() => {
    if (isLoadingPrograms) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      
      return () => {
        rotateAnimation.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [isLoadingPrograms, rotateAnim]);

  // Start library rotation animation when loading
  React.useEffect(() => {
    if (libraryLoading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(libraryRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      
      return () => {
        rotateAnimation.stop();
        libraryRotateAnim.setValue(0);
      };
    }
  }, [libraryLoading, libraryRotateAnim]);

  // Start AI generation animation and progress steps
  React.useEffect(() => {
    if (isGeneratingAI) {
      // Start ball rotation animation
      const aiRotateAnimation = Animated.loop(
        Animated.timing(aiRotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      aiRotateAnimation.start();
      
      // Progress through different steps to make it feel complex
      const progressSteps = [
        { step: 0, delay: 0 },     // Analyzing your profile...
        { step: 1, delay: 2000 },  // Finding perfect exercises...
        { step: 2, delay: 4000 },  // Building your routines...
        { step: 3, delay: 6500 },  // Finalizing your program...
      ];
      
      const timeouts = progressSteps.map(({ step, delay }) => 
        setTimeout(() => setAiGenerationStep(step), delay)
      );
      
      return () => {
        aiRotateAnimation.stop();
        aiRotateAnim.setValue(0);
        timeouts.forEach(timeout => clearTimeout(timeout));
        setAiGenerationStep(0);
      };
    }
  }, [isGeneratingAI, aiRotateAnim]);

  // Handle new program added from Explore
  React.useEffect(() => {
    if (route.params?.newProgram) {
      const newProgram = route.params.newProgram;
      setPrograms(prev => {
        // Check if program already exists to avoid duplicates
        const exists = prev.some(p => p.name === newProgram.name);
        if (!exists) {
          return [...prev, newProgram];
        }
        return prev;
      });
      
      // Clear the parameter to avoid re-adding on subsequent navigations
      navigation.setParams({ newProgram: undefined });
    }
  }, [route.params?.newProgram, navigation]);

  // Static exercises for customized tab
  const staticExercises = {
    dinks: [
      { id: "1.1", name: "Dink Wall Drill", target: "15 consecutive soft dinks", difficulty: 2, description: "Practice consistent dinking against a wall" },
      { id: "1.2", name: "Cross-Court Dinks", target: "8 consecutive cross-court dinks", difficulty: 2, description: "Develop cross-court dinking accuracy" },
      { id: "1.3", name: "Dink Targets", target: "6/12 land in NVZ cones", difficulty: 3, description: "Precision dinking to specific targets" },
      { id: "s3.1", name: "Advanced Cross-Court Dinks", target: "12/15 in NVZ", difficulty: 3, description: "From Net Play Excellence session" }
    ],
    drives: [
      { id: "2.1", name: "FH Drive Depth", target: "7/10 beyond NVZ", difficulty: 2, description: "Forehand drive depth control" },
      { id: "2.2", name: "BH Drive Depth", target: "6/10 beyond NVZ", difficulty: 3, description: "Backhand drive depth control" },
      { id: "2.3", name: "Drive & Recover", target: "5-drive sequence", difficulty: 3, description: "Drive and return to ready position" },
      { id: "s4.1", name: "Power Drive Targets", target: "7/12 to corners", difficulty: 4, description: "From Power & Placement session" }
    ],
    serves: [
      { id: "6.1", name: "Deep Serve Mastery", target: "7/10 in back third", difficulty: 3, description: "Consistent deep serving" },
      { id: "6.2", name: "Spin Serve", target: "5/10 with visible spin", difficulty: 4, description: "Develop spin serve technique" },
      { id: "6.3", name: "Serve Placement Drill", target: "4/6 to chosen corner", difficulty: 3, description: "Precise serve placement" },
      { id: "s1.1", name: "Corner Placement Serves", target: "8/12 to chosen corners", difficulty: 3, description: "From Serve & Return Mastery session" }
    ],
    returns: [
      { id: "s1.2", name: "Deep Return Practice", target: "7/10 past midline", difficulty: 3, description: "Return serves deep into court" },
      { id: "s1.3", name: "Return & Approach", target: "5/8 successful approaches", difficulty: 4, description: "Return and move to net" },
      { id: "r1", name: "Defensive Returns", target: "6/10 successful defensive returns", difficulty: 3, description: "Master defensive return shots" }
    ],
    volleys: [
      { id: "s3.2", name: "Volley Positioning", target: "8/10 clean volleys", difficulty: 3, description: "Perfect volley positioning" },
      { id: "s3.3", name: "Attack the High Ball", target: "6/8 putaway attempts", difficulty: 4, description: "Aggressive high ball volleys" },
      { id: "v1", name: "Reflex Volleys", target: "10/15 quick volleys", difficulty: 4, description: "Improve volley reaction time" }
    ],
    others: [
      { id: "7.1", name: "Drop Consistency", target: "6/10 into NVZ", difficulty: 3, description: "Master the critical third shot" },
      { id: "7.2", name: "Target Drops", target: "4/10 to backhand corner", difficulty: 4, description: "Precision third shot drops" },
      { id: "s4.2", name: "Lob Placement", target: "5/8 over opponent", difficulty: 3, description: "Effective lob placement" },
      { id: "s5.3", name: "Court Positioning", target: "8/10 optimal positions", difficulty: 4, description: "Maintain optimal court position" },
      { id: "s6.3", name: "Endurance Rally", target: "25+ shot rallies", difficulty: 4, description: "Long rally endurance training" }
    ]
  };

  // Program management functions
  
  // Load programs from database and local storage
  const loadPrograms = async () => {
    try {
      console.log('📂 [ProgramScreen] loadPrograms called');
      setIsLoadingPrograms(true);
      
      if (!user?.id) {
        console.log('❌ [ProgramScreen] No user ID, skipping program load');
        setIsLoadingPrograms(false);
        return;
      }

      console.log('💾 [ProgramScreen] Attempting to load from database...');
      
      // Try to load from database first with routines
      try {
        console.log('🔍 [ProgramScreen] Loading programs with routines from database...');
        const { data: dbPrograms, error: dbError } = await supabase
          .from('programs')
          .select(`
            *,
            routines (
              id,
              name,
              description,
              order_index,
              time_estimate_minutes,
              is_published,
              created_at
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error('❌ [ProgramScreen] Database load failed:', dbError);
        } else {
          console.log('✅ [ProgramScreen] Loaded from database:', dbPrograms?.length || 0, 'programs');
          
          if (dbPrograms && dbPrograms.length > 0) {
            // Transform database programs to match local format
            const transformedPrograms = await Promise.all(dbPrograms.map(async (dbProgram) => {
              console.log('🔄 [ProgramScreen] Processing program:', dbProgram.name);
              console.log('📋 [ProgramScreen] Program routines:', dbProgram.routines?.length || 0);
              console.log('🖼️ [ProgramScreen] Program thumbnail URL:', dbProgram.thumbnail_url);
              
              // Handle thumbnail - convert URL to local format if needed
              let thumbnail = null;
              if (dbProgram.thumbnail_url) {
                try {
                  // For now, we'll use the URL directly - could download and cache locally later
                  thumbnail = { uri: dbProgram.thumbnail_url };
                  console.log('✅ [ProgramScreen] Thumbnail loaded from URL');
                } catch (error) {
                  console.error('❌ [ProgramScreen] Error loading thumbnail:', error);
                }
              }
              
              // Transform routines to match local format and load their exercises
              const routines = await Promise.all((dbProgram.routines || []).map(async (dbRoutine) => {
                console.log('🔄 [ProgramScreen] Loading exercises for routine:', dbRoutine.name);
                
                // Load exercises for this routine
                let exercises = [];
                try {
                  const { data: routineExercises, error: exerciseError } = await supabase
                    .from('routine_exercises')
                    .select(`
                      id,
                      order_index,
                      is_optional,
                      exercises (
                        id,
                        code,
                        title,
                        description,
                        goal_text,
                        skill_category,
                        skill_categories_json,
                        difficulty,
                        target_type,
                        target_value,
                        target_unit,
                        instructions,
                        tips_json,
                        estimated_minutes,
                        demo_video_url,
                        demo_image_url,
                        thumbnail_url,
                        tier_level,
                        tags,
                        is_published,
                        created_at
                      )
                    `)
                    .eq('routine_id', dbRoutine.id)
                    .order('order_index', { ascending: true });
                  
                  if (exerciseError) {
                    console.error('❌ [ProgramScreen] Error loading exercises for routine:', exerciseError);
                  } else {
                    exercises = (routineExercises || []).map(re => ({
                      ...re.exercises,
                      name: re.exercises.title, // Map title to name for compatibility
                      routineExerciseId: re.id,
                      routine_exercise_id: re.id,
                      order_index: re.order_index,
                      is_optional: re.is_optional,
                      // Add target formatting for compatibility
                      target: re.exercises.target_value && re.exercises.target_unit 
                        ? `${re.exercises.target_value} ${re.exercises.target_unit}`
                        : `${re.exercises.target_value || 10} attempts`
                    }));
                    console.log('✅ [ProgramScreen] Loaded', exercises.length, 'exercises for routine:', dbRoutine.name);
                  }
                } catch (error) {
                  console.error('❌ [ProgramScreen] Error loading exercises:', error);
                }
                
                return {
                  id: dbRoutine.id,
                  name: dbRoutine.name,
                  description: dbRoutine.description,
                  exercises: exercises, // ✅ Now properly loading exercises
                  createdAt: dbRoutine.created_at,
                  order_index: dbRoutine.order_index,
                  time_estimate_minutes: dbRoutine.time_estimate_minutes,
                  is_published: dbRoutine.is_published
                };
              }));
              
              console.log('📊 [ProgramScreen] Transformed routines for', dbProgram.name, ':', routines.length);
              
              return {
                id: dbProgram.id,
                name: dbProgram.name,
                description: dbProgram.description,
                thumbnail: thumbnail, // ✅ Now properly loading thumbnails
                thumbnailUrl: dbProgram.thumbnail_url, // Keep URL for reference
                routines: routines, // ✅ Now properly loading routines
                createdAt: dbProgram.created_at,
                category: dbProgram.category,
                tier: dbProgram.tier,
                isPublished: dbProgram.is_published,
                program_type: dbProgram.program_type,
                is_shareable: dbProgram.is_shareable,
                visibility: dbProgram.visibility
              };
            }));
            
            console.log('📊 [ProgramScreen] Final transformed programs:', transformedPrograms.length);
            transformedPrograms.forEach(program => {
              const totalExercises = program.routines.reduce((sum, routine) => sum + routine.exercises.length, 0);
              console.log(`📋 [ProgramScreen] Program "${program.name}": ${program.routines.length} routines, ${totalExercises} exercises, thumbnail: ${!!program.thumbnail}`);
              program.routines.forEach(routine => {
                console.log(`  📝 [ProgramScreen] Routine "${routine.name}": ${routine.exercises.length} exercises`);
              });
            });
            
            setPrograms(transformedPrograms);
            console.log('📊 [ProgramScreen] Set programs from database with routines and thumbnails');
            
            // Save to local storage as backup
            await AsyncStorage.setItem(`@user_programs_${user.id}`, JSON.stringify(transformedPrograms));
            console.log('💾 [ProgramScreen] Saved to local storage as backup');
            
            // After loading programs, sync any unsynced AI programs
            try {
              console.log('🔄 [ProgramScreen] Checking for unsynced AI programs...');
              const syncResult = await syncUnsyncedAIPrograms(transformedPrograms, setPrograms);
              if (syncResult.syncedCount > 0) {
                console.log(`✅ [ProgramScreen] Synced ${syncResult.syncedCount} AI programs to database`);
              }
            } catch (syncError) {
              console.error('❌ [ProgramScreen] Error syncing AI programs:', syncError);
            }
            
            return;
          }
        }
      } catch (dbError) {
        console.error('❌ [ProgramScreen] Database error:', dbError);
      }

      // Fallback to local storage
      console.log('📱 [ProgramScreen] Falling back to local storage...');
      try {
        const localPrograms = await AsyncStorage.getItem(`@user_programs_${user.id}`);
        if (localPrograms) {
          const parsedPrograms = JSON.parse(localPrograms);
          console.log('✅ [ProgramScreen] Loaded from local storage:', parsedPrograms.length, 'programs');
          setPrograms(parsedPrograms);
          
          // After loading from local storage, try to sync any unsynced AI programs
          try {
            console.log('🔄 [ProgramScreen] Checking for unsynced AI programs from local storage...');
            const syncResult = await syncUnsyncedAIPrograms(parsedPrograms, setPrograms);
            if (syncResult.syncedCount > 0) {
              console.log(`✅ [ProgramScreen] Synced ${syncResult.syncedCount} AI programs to database from local storage`);
            }
          } catch (syncError) {
            console.error('❌ [ProgramScreen] Error syncing AI programs from local storage:', syncError);
          }
        } else {
          console.log('📭 [ProgramScreen] No local programs found');
          setPrograms([]);
        }
      } catch (localError) {
        console.error('❌ [ProgramScreen] Local storage error:', localError);
        setPrograms([]);
      }

    } catch (error) {
      console.error('💥 [ProgramScreen] Unexpected error in loadPrograms:', error);
      setPrograms([]);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  // Save programs to local storage
  const savePrograms = async (programsToSave) => {
    try {
      if (user?.id) {
        console.log('💾 [ProgramScreen] Saving programs to local storage:', programsToSave.length);
        await AsyncStorage.setItem(`@user_programs_${user.id}`, JSON.stringify(programsToSave));
        console.log('✅ [ProgramScreen] Programs saved to local storage');
      }
    } catch (error) {
      console.error('❌ [ProgramScreen] Error saving programs:', error);
    }
  };

  // Update existing AI program function
  const updateAIProgramHandler = async () => {
    if (!existingAIProgram) {
      Alert.alert('Error', 'No existing AI program found to update.');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Update Your AI Program',
      `This will replace your current AI program "${existingAIProgram.name}" with a new one based on your current DUPR rating and focus areas.\n\nYour old program will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update Program', 
          style: 'default',
          onPress: async () => {
            try {
              console.log('🔄 [ProgramScreen] Updating AI program...');
              
              // Delete the existing AI program first
              await deleteExistingAIProgram(existingAIProgram.id);
              
              // Generate new AI program
              await generateAIProgramHandler();
              
            } catch (error) {
              console.error('❌ [ProgramScreen] Error updating AI program:', error);
              Alert.alert('Error', 'Failed to update AI program. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Delete existing AI program function
  const deleteExistingAIProgram = async (programId) => {
    try {
      console.log('🗑️ [ProgramScreen] Deleting existing AI program:', programId);
      
      // Delete from database if it's a UUID (database program)
      const isUUID = programId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID && user?.id) {
        console.log('💾 [ProgramScreen] Deleting AI program from database...');
        
        const { error } = await supabase.rpc('delete_program_as_user', {
          program_id: programId
        });
        
        if (error) {
          console.error('❌ [ProgramScreen] Database delete failed:', error);
          throw error;
        }
        
        console.log('✅ [ProgramScreen] AI program deleted from database');
      }
      
      // Update local state - remove the AI program
      setPrograms(prev => {
        const updated = prev.filter(p => p.id !== programId);
        // Save updated list to local storage
        savePrograms(updated);
        return updated;
      });
      
      console.log('✅ [ProgramScreen] AI program removed from local state');
      
    } catch (error) {
      console.error('💥 [ProgramScreen] Error deleting existing AI program:', error);
      throw error;
    }
  };

  // AI Program Generation function
  const generateAIProgramHandler = async () => {
    // Validate user can generate AI program
    let validation = validateUserForAIGeneration(user);
    
    // If validation fails due to focus areas, try refreshing the profile data
    if (!validation.isValid && validation.message.includes('Focus areas required')) {
      // Force refresh profile from database
      try {
        if (user?.id) {
          const { data: freshProfile } = await supabase
            .from('users')
            .select('focus_areas')
            .eq('id', user.id)
            .single();
          
          if (freshProfile?.focus_areas && Array.isArray(freshProfile.focus_areas) && freshProfile.focus_areas.length > 0) {
            // Update the user context with fresh data
            setUser(prevUser => ({
              ...prevUser,
              focus_areas: freshProfile.focus_areas
            }));
            // Wait a moment for state to update
            await new Promise(resolve => setTimeout(resolve, 100));
            validation = validateUserForAIGeneration({ ...user, focus_areas: freshProfile.focus_areas });
          }
        }
      } catch (error) {
        console.error('Error refreshing profile data:', error);
      }
    }
    
    if (!validation.isValid) {
      // Provide more helpful error message for focus areas issue
      if (validation.message.includes('Focus areas required')) {
        Alert.alert(
          'Cannot Generate AI Program', 
          'Focus areas are required to generate your personalized program. Please go back to the onboarding flow and select your focus areas again.\n\nTip: Try selecting fewer focus areas (3-5) if you selected many.'
        );
      } else {
        Alert.alert('Cannot Generate AI Program', validation.message);
      }
      return;
    }

    setIsGeneratingAI(true);

    try {
      console.log('🤖 Starting AI program generation...');
      
      // Generate the AI program
      const aiProgram = await generateAIProgram(user);
      
      // Save to database and local programs list
      const saveResult = await saveAIProgram(aiProgram, setPrograms);
      
      if (saveResult.success) {
        Alert.alert(
          'AI Program Created! 🤖',
          `"${aiProgram.name}" has been created with ${aiProgram.routines.length} routines tailored to your DUPR ${user.duprRating} level and focus areas.\n\n✅ Synced to your account - available on all devices!`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'AI Program Created! 🤖',
          `"${aiProgram.name}" has been created with ${aiProgram.routines.length} routines tailored to your DUPR ${user.duprRating} level and focus areas.\n\n⚠️ Saved locally only - will sync when connection is available.`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('AI Program Generation Error:', error);
      
      let title = 'Generation Failed';
      let message = error.message || 'Unable to generate AI program. Please check your internet connection and try again.';
      
      // Provide more specific guidance for database-related errors
      if (error.message && error.message.includes('No exercises found')) {
        title = 'No Matching Exercises Found';
        message = `We couldn't find exercises in our database that match your DUPR ${user.duprRating} level and focus areas (${user.focus_areas?.join(', ') || 'none selected'}).\n\nThis could be because:\n• Your DUPR level needs exercises to be added to our database\n• Your focus areas need more exercise content\n\nPlease contact support or try updating your focus areas in settings.`;
      }
      
      Alert.alert(title, message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Upload program thumbnail to Supabase Storage
  const uploadProgramThumbnail = async (imageUri, programName) => {
    try {
      console.log('📤 [ProgramScreen] Starting thumbnail upload...');
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Safety check: Prevent blob URLs from being uploaded
      if (imageUri.startsWith('blob:')) {
        console.warn('⚠️ [ProgramScreen] Blob URL detected, cannot upload:', imageUri);
        Alert.alert('Warning', 'Invalid image format. Program will be created without thumbnail.');
        return null;
      }

      // Generate a unique filename with user folder structure
      const fileExtension = 'jpg';
      const sanitizedProgramName = programName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${user.id}/${sanitizedProgramName}_${Date.now()}.${fileExtension}`;
      
      console.log('📋 [ProgramScreen] Upload details:', {
        userId: user.id,
        fileName,
        bucketName: 'program_thumbnails',
        sanitizedProgramName
      });
      
      // Read file as array buffer (works for both web and React Native)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('📊 [ProgramScreen] File size:', arrayBuffer.byteLength, 'bytes');
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('program_thumbnails')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('❌ [ProgramScreen] Storage upload error:', error);
        
        // Provide specific error messages for common issues
        if (error.message.includes('row-level security policy')) {
          console.log('🚨 [ProgramScreen] RLS policy error - bucket needs setup');
          Alert.alert(
            'Storage Setup Required',
            'The program thumbnails storage bucket needs to be set up. Creating program without thumbnail for now.'
          );
          return null;
        }
        
        if (error.message.includes('bucket') && error.message.includes('not found')) {
          console.log('🚨 [ProgramScreen] Bucket not found - needs creation');
          Alert.alert(
            'Storage Bucket Missing',
            'Program thumbnails bucket needs to be created. Creating program without thumbnail for now.'
          );
          return null;
        }
        
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('program_thumbnails')
        .getPublicUrl(fileName);

      // Safety check: Ensure the returned URL is not a blob URL
      if (publicUrl.startsWith('blob:')) {
        console.error('❌ [ProgramScreen] Generated URL is still a blob URL - upload may have failed');
        Alert.alert('Warning', 'Thumbnail upload failed. Program will be created without image.');
        return null;
      }

      console.log('✅ [ProgramScreen] Thumbnail uploaded successfully:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ [ProgramScreen] Error uploading thumbnail:', error);
      Alert.alert('Warning', 'Failed to upload thumbnail. Program will be created without image.');
      return null;
    }
  };

  const createProgram = async () => {
    console.log('🚀 [ProgramScreen] createProgram called');
    console.log('📝 [ProgramScreen] Program name:', newProgramName.trim());
    console.log('🖼️ [ProgramScreen] Has image:', !!selectedImage);
    console.log('👤 [ProgramScreen] Current user:', user?.id);
    
    if (!newProgramName.trim()) {
      console.log('❌ [ProgramScreen] Validation failed: Empty program name');
      Alert.alert('Error', 'Please enter a program name');
      return;
    }
    
    if (!user?.id) {
      console.log('❌ [ProgramScreen] Validation failed: No user ID');
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      console.log('🔄 [ProgramScreen] Starting program creation process...');
      
      let compressedThumbnail = null;
      let thumbnailUrl = null;
      
      if (selectedImage) {
        try {
          console.log('🖼️ [ProgramScreen] Processing image...');
          
          // Compress the selected image for local storage
          const manipResult = await ImageManipulator.manipulateAsync(
            selectedImage.uri,
            [{ resize: { width: 300, height: 300 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          compressedThumbnail = manipResult;
          console.log('✅ [ProgramScreen] Image compressed successfully');
          
          // Upload to Supabase Storage for database storage
          console.log('📤 [ProgramScreen] Uploading thumbnail to storage...');
          thumbnailUrl = await uploadProgramThumbnail(manipResult.uri, newProgramName.trim());
          
          if (thumbnailUrl) {
            console.log('✅ [ProgramScreen] Thumbnail uploaded to storage:', thumbnailUrl);
          } else {
            console.log('⚠️ [ProgramScreen] Thumbnail upload failed, continuing without URL');
          }
          
        } catch (error) {
          console.error('❌ [ProgramScreen] Error processing image:', error);
          Alert.alert('Warning', 'Failed to process image. Program will be created without thumbnail.');
        }
      }
      
      const newProgram = {
        id: Date.now().toString(),
        name: newProgramName.trim(),
        thumbnail: compressedThumbnail, // For local storage
        thumbnailUrl: thumbnailUrl, // For database storage
        routines: [],
        createdAt: new Date().toISOString(),
      };
      
      console.log('📋 [ProgramScreen] Program object created:', {
        id: newProgram.id,
        name: newProgram.name,
        hasThumbnail: !!newProgram.thumbnail,
        hasThumbnailUrl: !!newProgram.thumbnailUrl,
        routinesCount: newProgram.routines.length
      });
      
      // Save to database using the user function with thumbnail URL
      console.log('💾 [ProgramScreen] Attempting to save to database...');
      try {
        const { data: savedProgram, error: saveError } = await supabase.rpc('create_program_as_user', {
          program_name: newProgram.name,
          program_description: `User-created program: ${newProgram.name}`,
          program_category: 'Custom',
          program_tier: 'Beginner',
          program_is_published: false,
          program_thumbnail_url: thumbnailUrl // Now properly handling image upload!
        });
        
        if (saveError) {
          console.error('❌ [ProgramScreen] Database save failed:', saveError);
          console.log('📱 [ProgramScreen] Falling back to local storage only');
          Alert.alert('Warning', 'Program saved locally but could not sync to server. It will sync when connection is available.');
        } else {
          console.log('✅ [ProgramScreen] Program saved to database successfully:', savedProgram);
          
          // 🔧 CRITICAL FIX: RPC functions return arrays, so get the first element
          const programData = Array.isArray(savedProgram) ? savedProgram[0] : savedProgram;
          
          if (programData && programData.id) {
            console.log('🔄 [ProgramScreen] Updating program ID from timestamp to UUID:', {
              oldId: newProgram.id,
              newId: programData.id,
              idType: typeof programData.id
            });
            newProgram.id = programData.id;
            newProgram.program_id = programData.id; // Also set program_id for consistency
            newProgram.created_by = programData.created_by;
            newProgram.category = programData.category;
            newProgram.tier = programData.tier;
            newProgram.is_published = programData.is_published;
            console.log('✅ [ProgramScreen] Program object updated with database UUID');
          } else {
            console.log('⚠️ [ProgramScreen] No program data returned from database function');
          }
        }
      } catch (dbError) {
        console.error('❌ [ProgramScreen] Database operation failed:', dbError);
        console.log('📱 [ProgramScreen] Continuing with local storage only');
        Alert.alert('Warning', `Database save failed: ${dbError.message}. Program saved locally.`);
      }
      
      // Update local state
      console.log('📱 [ProgramScreen] Updating local state...');
      console.log('🔍 [ProgramScreen] Final program object before adding to state:', {
        id: newProgram.id,
        name: newProgram.name,
        idType: typeof newProgram.id,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newProgram.id)
      });
      
      setPrograms(prev => {
        const updated = [...prev, newProgram];
        console.log('📊 [ProgramScreen] Local programs count after add:', updated.length);
        
        // Save to local storage immediately
        savePrograms(updated);
        
        return updated;
      });
      
      // Clear form
      console.log('🧹 [ProgramScreen] Clearing form...');
      setNewProgramName('');
      setSelectedImage(null);
      setShowCreateProgramModal(false);
      
      console.log('✅ [ProgramScreen] Program creation completed successfully');
      
      // Show success message with thumbnail status
      const successMessage = thumbnailUrl 
        ? `Program "${newProgram.name}" created successfully with thumbnail!`
        : `Program "${newProgram.name}" created successfully!`;
      Alert.alert('Success', successMessage);
      
    } catch (error) {
      console.error('💥 [ProgramScreen] Unexpected error in createProgram:', error);
      Alert.alert('Error', `Failed to create program: ${error.message}`);
    }
  };

  // Image handling functions
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need photo library permissions to add program thumbnails.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingImage(true);
        const asset = result.assets[0];
        
        try {
          // Ensure square crop and reasonable size
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 400, height: 400 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          
          setSelectedImage(manipResult);
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process the selected image.');
        } finally {
          setIsProcessingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker.');
      setIsProcessingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const deleteProgram = async (programId) => {
    const programToDelete = programs.find(p => p.id === programId);
    
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${programToDelete?.name}"?\n\nThis action cannot be undone and will:\n• Delete all routines in this program\n• Delete all exercises from these routines\n• Remove this program from other users if it was shared\n\nThis will affect all users who have this program.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [ProgramScreen] Deleting program:', programId);
              
              // Delete from database if it's a UUID (database program)
              const isUUID = programId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
              
              if (isUUID && user?.id) {
                console.log('💾 [ProgramScreen] Deleting from database...');
                
                const { error } = await supabase.rpc('delete_program_as_user', {
                  program_id: programId
                });
                
                if (error) {
                  console.error('❌ [ProgramScreen] Database delete failed:', error);
                  Alert.alert('Error', `Failed to delete from database: ${error.message}`);
                  return;
                }
                
                console.log('✅ [ProgramScreen] Program deleted from database');
              }
              
              // Update local state
              setPrograms(prev => {
                const updated = prev.filter(p => p.id !== programId);
                // Save updated list to local storage
                savePrograms(updated);
                return updated;
              });
              
              Alert.alert('Success', 'Program deleted successfully');
              
            } catch (error) {
              console.error('💥 [ProgramScreen] Error deleting program:', error);
              Alert.alert('Error', `Failed to delete program: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const navigateToProgram = (program) => {
    navigation.navigate('ProgramDetail', { 
      program,
      onUpdateProgram: (updatedProgram) => {
        setPrograms(prev => prev.map(p => 
          p.id === updatedProgram.id ? updatedProgram : p
        ));
      }
    });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Simulate refresh delay - in a real app, this would reload data from an API
    setTimeout(() => {
      // You can add any refresh logic here, such as:
      // - Reloading programs from a database
      // - Updating the PersonalizedProgramCard
      // - Syncing with cloud storage
      console.log('Programs refreshed');
      setRefreshing(false);
    }, 1000);
  }, []);

  // Library tab functions (from ExploreTrainingScreen)
  const fetchLibraryPrograms = async () => {
    // Check if we have preloaded data first
    const preloadedPrograms = getDataWithFallback('programs');
    if (preloadedPrograms && preloadedPrograms.length > 0) {
      console.log('🚀 ProgramScreen: Using preloaded programs data for Library - INSTANT LOAD!');
      setExplorePrograms(preloadedPrograms);
      setLibraryLoading(false);
      setLibraryError(null);
      return;
    } else if (hasPreloadedData('programs')) {
      // We have preloaded data but it's empty
      console.log('📭 ProgramScreen: Preloaded programs data is empty for Library - INSTANT LOAD!');
      setExplorePrograms([]);
      setLibraryLoading(false);
      setLibraryError(null);
      return;
    }

    // No preloaded data, fetch normally
    const fetchTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch programs timeout after 20 seconds')), 20000)
    );
    
    const fetchOperation = async () => {
      try {
        setLibraryLoading(true);
        const { data, error } = await getPrograms();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setExplorePrograms([]);
          setLibraryError(null);
          return;
        }
        
        if (Array.isArray(data) && data.length === 0) {
          setExplorePrograms([]);
          setLibraryError(null);
          return;
        }
        
        // Transform the data to match your current app structure
        const transformedPrograms = transformProgramData(data);
        setExplorePrograms(transformedPrograms);
        setLibraryError(null);
      } catch (err) {
        setLibraryError(err.message || 'Failed to load programs');
        setExplorePrograms([]);
      } finally {
        setLibraryLoading(false);
      }
    };
    
    try {
      await Promise.race([fetchOperation(), fetchTimeout]);
    } catch (timeoutError) {
      setLibraryError('Request timed out. Please try again.');
      setExplorePrograms([]);
      setLibraryLoading(false);
    }
  };

  const fetchCategoryOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .rpc('get_category_order');
      
      if (orderError) {
        setSavedCategoryOrder([]);
      } else {
        setSavedCategoryOrder(orderData || []);
      }
    } catch (error) {
      setSavedCategoryOrder([]);
    }
  };

  const onLibraryRefresh = async () => {
    setLibraryRefreshing(true);
    try {
      // Try to refresh from preload context first
      const refreshedPrograms = await refreshData('programs');
      if (refreshedPrograms) {
        setExplorePrograms(refreshedPrograms);
        setLibraryError(null);
      } else {
        // Fallback to direct API call
        const { data, error } = await getPrograms();
        
        if (error) {
          throw error;
        }
        
        // Transform the data to match your current app structure
        const transformedPrograms = transformProgramData(data);
        setExplorePrograms(transformedPrograms);
        setLibraryError(null);
      }
      
      // Also refresh category order
      await fetchCategoryOrder();
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setLibraryRefreshing(false);
    }
  };

  const navigateToLibraryProgram = (program) => {
    navigation.navigate('ProgramDetail', { 
      program,
      source: 'library' 
    });
  };

  const getTotalExerciseCount = () => {
    return explorePrograms.reduce((total, program) => {
      const programExerciseCount = program.routines?.reduce((routineTotal, routine) => {
        return routineTotal + (routine.exercises?.length || 0);
      }, 0) || 0;
      return total + programExerciseCount;
    }, 0);
  };


  // Check if user already has an AI-generated program
  const hasAIProgram = programs.some(program => program.is_ai_generated);
  const existingAIProgram = programs.find(program => program.is_ai_generated);

  const renderLoadingScreen = () => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.loadingContainer}>
        <Animated.Image
          source={require('../../assets/images/icon_ball.png')}
          style={[
            styles.loadingBall,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
        <Text style={styles.loadingText}>Loading your programs...</Text>
      </View>
    );
  };

  const renderAIGenerationOverlay = () => {
    const aiSpin = aiRotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const progressMessages = [
      {
        title: "🧠 Analyzing Your Profile",
        subtitle: "Reviewing your DUPR rating and focus areas..."
      },
      {
        title: "🎯 Finding Perfect Exercises", 
        subtitle: "Matching exercises to your skill level..."
      },
      {
        title: "🏗️ Building Your Routines",
        subtitle: "Creating personalized training sessions..."
      },
      {
        title: "✨ Finalizing Your Program",
        subtitle: "Adding the finishing touches..."
      }
    ];

    const currentMessage = progressMessages[aiGenerationStep] || progressMessages[0];

    return (
      <Modal
        visible={isGeneratingAI}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // Prevent closing during generation
      >
        <View style={styles.aiGenerationOverlay}>
          <View style={styles.aiGenerationContent}>
            <Animated.Image
              source={require('../../assets/images/icon_ball.png')}
              style={[
                styles.aiGenerationBall,
                {
                  transform: [{ rotate: aiSpin }],
                },
              ]}
            />
            
            <Text style={styles.aiGenerationTitle}>
              {currentMessage.title}
            </Text>
            
            <Text style={styles.aiGenerationSubtitle}>
              {currentMessage.subtitle}
            </Text>
            
            <View style={styles.aiProgressContainer}>
              <View style={styles.aiProgressTrack}>
                <View 
                  style={[
                    styles.aiProgressFill, 
                    { width: `${((aiGenerationStep + 1) / 4) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.aiProgressText}>
                Step {aiGenerationStep + 1} of 4
              </Text>
            </View>
            
            <Text style={styles.aiGenerationNote}>
              🤖 Our AI is working hard to create your perfect program
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Library tab content (ExploreTrainingScreen content)
  const renderLibraryContent = () => {
    // Loading state
    if (libraryLoading) {
      const spin = libraryRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <View style={styles.loadingContainer}>
          <Animated.Image
            source={require('../../assets/images/icon_ball.png')}
            style={[
              styles.loadingBall,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      );
    }

    // Error state
    if (libraryError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load programs</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLibraryPrograms}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Get all unique categories from programs and sort them according to saved order
    const uniqueCategories = [...new Set(explorePrograms.map(p => p.category).filter(Boolean))];
    
    // Sort categories according to saved order
    let categories;
    if (savedCategoryOrder && savedCategoryOrder.length > 0) {
      // Create ordered list based on saved order
      const orderedCategories = [];
      
      // Add categories in saved order
      savedCategoryOrder.forEach(savedCat => {
        if (uniqueCategories.includes(savedCat.name)) {
          orderedCategories.push(savedCat.name);
        }
      });
      
      // Add any new categories that weren't in saved order
      const savedCategoryNames = savedCategoryOrder.map(sc => sc.name);
      const newCategories = uniqueCategories.filter(cat => !savedCategoryNames.includes(cat));
      orderedCategories.push(...newCategories);
      
      categories = orderedCategories;
    } else {
      categories = uniqueCategories;
    }
    
    // Define category icons for better visual appeal
    const getCategoryIcon = (category) => {
      switch (category.toLowerCase()) {
        case 'pro training': return '🏆';
        case 'fundamentals': return '📚';
        case 'technique': return '🎯';
        case 'fitness': return '💪';
        case 'strategy': return '🧠';
        case 'mental game': return '🧘';
        case 'conditioning': return '🏃';
        case 'drills': return '⚡';
        default: return '🏓';
      }
    };

    const exerciseCount = getTotalExerciseCount();

    return (
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={libraryRefreshing}
            onRefresh={onLibraryRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
      >
        {/* Library Header */}
        <View style={styles.libraryHeaderContainer}>
          <Text style={styles.libraryHeaderTitle}>Library</Text>
          <Text style={styles.libraryExerciseCount}>{exerciseCount} exercises</Text>
        </View>

        {/* Dynamically render all categories */}
        {categories.map((category) => {
          const categoryPrograms = explorePrograms.filter(p => p.category === category);
          
          if (categoryPrograms.length === 0) return null;
          
          const useHorizontalScroll = categoryPrograms.length >= 2;
          
          return (
            <View key={category} style={styles.libraryCategoriesSection}>
              <Text style={styles.librarySectionTitle}>{category}</Text>
              {useHorizontalScroll ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.libraryHorizontalScrollContent}
                  style={styles.libraryHorizontalScroll}
                >
                  {categoryPrograms.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.libraryHorizontalProgramCard}
                      onPress={() => navigateToLibraryProgram(program)}
                    >
                      <View style={styles.libraryThumbnailContainer}>
                        {program.thumbnail ? (
                          <Image 
                            source={{ uri: program.thumbnail }} 
                            style={styles.libraryProgramThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.libraryPlaceholderThumbnail}>
                            <Text style={styles.libraryPlaceholderText}>{getCategoryIcon(category)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.libraryProgramDetails}>
                        <Text style={styles.libraryProgramTitle}>{program.name}</Text>
                        <View style={styles.libraryRatingContainer}>
                          <WebIcon name="star" size={12} color="#FFB800" />
                          <Text style={styles.libraryRatingText}>{program.rating}</Text>
                          <Text style={styles.libraryAddedText}>• Added {program.addedCount.toLocaleString()} times</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.libraryProgramsGrid}>
                  {categoryPrograms.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.libraryProgramCard}
                      onPress={() => navigateToLibraryProgram(program)}
                    >
                      <View style={styles.libraryThumbnailContainer}>
                        {program.thumbnail ? (
                          <Image 
                            source={{ uri: program.thumbnail }} 
                            style={styles.libraryProgramThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.libraryPlaceholderThumbnail}>
                            <Text style={styles.libraryPlaceholderText}>{getCategoryIcon(category)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.libraryProgramDetails}>
                        <Text style={styles.libraryProgramTitle}>{program.name}</Text>
                        <View style={styles.libraryRatingContainer}>
                          <WebIcon name="star" size={12} color="#FFB800" />
                          <Text style={styles.libraryRatingText}>{program.rating}</Text>
                          <Text style={styles.libraryAddedText}>• Added {program.addedCount.toLocaleString()} times</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Empty state */}
        {explorePrograms.length === 0 && !libraryLoading && !libraryError && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No programs available</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  const renderProgramsContent = () => (
    <View style={styles.customizedContainer}>
      {programs.length === 0 ? (
        <View style={styles.emptyCustomList}>
          <Text style={styles.emptyCustomListIcon}>✨</Text>
          <Text style={styles.emptyCustomListTitle}>Get Started with AI</Text>
          <Text style={styles.emptyCustomListDescription}>
            Let our AI create a personalized training program based on your DUPR rating and focus areas. Get started in seconds!
          </Text>
          <TouchableOpacity
            style={styles.aiGenerateButtonLarge}
            onPress={generateAIProgramHandler}
            disabled={isGeneratingAI}
          >
            <Text style={styles.aiGenerateButtonLargeText}>
              {isGeneratingAI ? 'Creating Your Program...' : 'Generate Your AI Program'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addFirstProgramButtonSecondary}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <Text style={styles.addFirstProgramButtonSecondaryText}>Or create custom program</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.programsList}
          contentContainerStyle={styles.programsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          <View style={styles.programsHeader}>
            <Text style={styles.programsSubtitle}>Tap to open • Long press to delete</Text>
          </View>
          
          {programs.map((program) => (
            <View key={program.id} style={styles.programCard}>
              <TouchableOpacity
                style={styles.programContent}
                onPress={() => navigateToProgram(program)}
                onLongPress={() => deleteProgram(program.id)}
              >
                <View style={styles.programThumbnailContainer}>
                  {program.thumbnail ? (
                    <Image 
                      source={{ 
                        uri: typeof program.thumbnail === 'string' 
                          ? program.thumbnail 
                          : program.thumbnail.uri 
                      }} 
                      style={styles.programThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.programPlaceholder}>
                      <Text style={styles.placeholderText}>🏆</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {program.description ? (
                    <Text style={styles.programDescription}>{program.description}</Text>
                  ) : null}
                  <View style={styles.programStatsRow}>
                    <View style={styles.programStats}>
                      <Text style={styles.programStatsText}>
                        {program.routines.length} routine{program.routines.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.programStatsText}>•</Text>
                      <Text style={styles.programStatsText}>
                        {program.routines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0)} exercises
                      </Text>
                      {program.is_ai_generated && (
                        <>
                          <Text style={styles.programStatsText}>•</Text>
                          <Text style={[styles.programStatsText, styles.aiGeneratedText]}>
                            🤖 AI
                          </Text>
                          {program.is_synced_to_db === false && (
                            <>
                              <Text style={styles.programStatsText}>•</Text>
                              <Text style={[styles.programStatsText, styles.unsyncedText]}>
                                📱 Local
                              </Text>
                            </>
                          )}
                        </>
                      )}
                    </View>
                    <View style={styles.programActions}>
                      <Text style={styles.chevronText}>{'>'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {!hasAIProgram ? (
            <TouchableOpacity
              style={styles.aiGenerateButton}
              onPress={generateAIProgramHandler}
              disabled={isGeneratingAI}
            >
              <Text style={styles.aiGenerateButtonIcon}>🤖</Text>
              <Text style={styles.aiGenerateButtonText}>
                {isGeneratingAI ? 'Generating...' : 'Generate Your AI Program'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.aiUpdateButton}
              onPress={updateAIProgramHandler}
              disabled={isGeneratingAI}
            >
              <Text style={styles.aiUpdateButtonIcon}>🔄</Text>
              <Text style={styles.aiUpdateButtonText}>
                {isGeneratingAI ? 'Updating...' : 'Update Your AI Program'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addMoreProgramsButton}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <Text style={styles.addIconText}>+</Text>
            <Text style={styles.addMoreProgramsButtonText}>Create new program</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Level Up With Fun
          </Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setCurrentView('programs')}
            >
              <Text style={[styles.tabText, currentView === 'programs' && styles.activeTabText]}>
                Programs
              </Text>
              {currentView === 'programs' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setCurrentView('library')}
            >
              <Text style={[styles.tabText, currentView === 'library' && styles.activeTabText]}>
                Library
              </Text>
              {currentView === 'library' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {currentView === 'library' ? (
        renderLibraryContent()
      ) : isLoadingPrograms ? (
        renderLoadingScreen()
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {renderProgramsContent()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* AI Generation Loading Overlay */}
      {renderAIGenerationOverlay()}

      {/* Create Program Modal */}
      <Modal
        visible={showCreateProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateProgramModal(false);
          setNewProgramName('');
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowCreateProgramModal(false);
                setNewProgramName('');
                setSelectedImage(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Program</Text>
            <TouchableOpacity
              style={[styles.modalCreateButton, !newProgramName.trim() && styles.modalCreateButtonDisabled]}
              onPress={createProgram}
              disabled={!newProgramName.trim()}
            >
              <Text style={[styles.modalCreateText, !newProgramName.trim() && styles.modalCreateTextDisabled]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Program Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={newProgramName}
                onChangeText={setNewProgramName}
                placeholder="e.g., Master the Soft Game (4 weeks)"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              
              <Text style={styles.modalLabel}>Program Thumbnail</Text>
              <View style={styles.imageUploadSection}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: selectedImage.uri }} 
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadImageButton}
                    onPress={pickImage}
                    disabled={isProcessingImage}
                  >
                    <Text style={styles.uploadImageText}>
                      {isProcessingImage ? 'Processing...' : 'Add Thumbnail'}
                    </Text>
                    <Text style={styles.uploadImageSubtext}>
                      Square images work best
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Programs styles
  customizedContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyCustomList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyCustomListIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCustomListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCustomListDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  aiGenerateButtonIcon: {
    fontSize: 18,
    color: 'white',
  },
  aiGenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  aiUpdateButtonIcon: {
    fontSize: 18,
    color: 'white',
  },
  aiUpdateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiGenerateButtonLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiGenerateButtonLargeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  addFirstProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstProgramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addFirstProgramButtonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  addFirstProgramButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  programsList: {
    flex: 1,
  },
  programsContent: {
    padding: (width === 768 && height >= 1024) ? 24 : (width >= 768 ? 32 : 16), // Optimized for iPad portrait
    paddingBottom: 40,
  },
  programsHeader: {
    marginBottom: 16,
  },
  programsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  programsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programContent: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    alignItems: 'center',
  },
  programThumbnailContainer: {
    width: getThumbnailSize(width, height).width,
    height: getThumbnailSize(width, height).height,
    borderRadius: 8,
    marginRight: (width === 768 && height >= 1024) ? 20 : 16, // More spacing for iPad portrait
    overflow: 'hidden',
  },
  programThumbnail: {
    width: '100%',
    height: '100%',
  },
  programPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  programStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  programStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  aiGeneratedText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  unsyncedText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  programActions: {
    paddingLeft: 8,
  },
  addMoreProgramsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  addMoreProgramsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholderText: {
    fontSize: 24,
  },
  chevronText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCreateButton: {
    padding: 8,
  },
  modalCreateButtonDisabled: {
    opacity: 0.5,
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalCreateTextDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
  },
  modalForm: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInputMultiline: {
    height: 80,
    paddingTop: 12,
  },
  // Image upload styles
  imageUploadSection: {
    marginBottom: 16,
  },
  uploadImageButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  uploadImageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedImageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 24,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
  },
  loadingBall: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  // AI Generation Overlay styles
  aiGenerationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  aiGenerationContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  aiGenerationBall: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  aiGenerationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  aiGenerationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  aiProgressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  aiProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  aiProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
    transition: 'width 0.5s ease-in-out',
  },
  aiProgressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  aiGenerationNote: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
  },
  tab: {
    marginRight: 32,
    paddingBottom: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
  // Library tab styles (from ExploreTrainingScreen)
  libraryHeaderContainer: {
    paddingHorizontal: (width === 768 && height >= 1024) ? 24 : 16,
    paddingVertical: (width === 768 && height >= 1024) ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  libraryHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  libraryExerciseCount: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 4,
  },
  libraryCategoriesSection: {
    marginBottom: (width === 768 && height >= 1024) ? 28 : 32,
    paddingHorizontal: (width === 768 && height >= 1024) ? 24 : 16,
  },
  librarySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  libraryProgramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  libraryHorizontalScroll: {
    marginLeft: -16,
  },
  libraryHorizontalScrollContent: {
    paddingRight: (width === 768 && height >= 1024) ? 24 : 16,
  },
  libraryProgramCard: {
    width: getCardWidth(width, height),
    marginRight: 12,
    marginBottom: (width === 768 && height >= 1024) ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  libraryHorizontalProgramCard: {
    width: getHorizontalCardWidth(width, height),
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  libraryThumbnailContainer: {
    width: '100%',
    height: getThumbnailHeight(width, height),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  libraryProgramThumbnail: {
    width: '100%',
    height: '100%',
  },
  libraryPlaceholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  libraryProgramDetails: {
    padding: (width === 768 && height >= 1024) ? 14 : 12,
  },
  libraryProgramTitle: {
    fontSize: (width === 768 && height >= 1024) ? 15 : 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: (width === 768 && height >= 1024) ? 20 : 18,
  },
  libraryRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  libraryRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  libraryAddedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flexShrink: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
