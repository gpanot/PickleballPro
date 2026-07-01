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
  Platform,
  Image,
  Animated,
  ToastAndroid,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PartyPopper } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebIcon from '../components/WebIcon';
import { supabase, getProgramDetails } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import EnrollmentConfirmSheet from '../components/training/EnrollmentConfirmSheet';
import PreviewModeBanner from '../components/training/PreviewModeBanner';
import { useActiveTraining } from '../hooks/useActiveTraining';

export default function ProgramDetailScreen({ navigation, route }) {
  const { program: initialProgram, onUpdateProgram, source, studentId, studentName, onAssign, isStudentView } = route.params;
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  // Library enrollment (used when source === 'library' or 'explore')
  const {
    primaryTrack,
    skillSlotsFull,
    enrollWithRole,
    saveProgram,
    loadTracks,
  } = useActiveTraining();
  const [enrollSheetVisible, setEnrollSheetVisible] = React.useState(false);
  const [enrollSheetRole, setEnrollSheetRole] = React.useState(null);
  const [enrollLoading, setEnrollLoading] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState(null);

  React.useEffect(() => {
    if (source === 'library' || source === 'explore') {
      // Pre-load active tracks so EnrollmentConfirmSheet can show replace warning
      loadTracks();
    }
  }, []);

  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleEnrollConfirm = async (role) => {
    setEnrollLoading(true);
    try {
      await enrollWithRole(program.id, role);
      setEnrollSheetVisible(false);
      const roleLabel = role === 'primary' ? 'primary focus' : 'skill focus';
      showToast(`${program.name} is now your ${roleLabel}`);
      // Navigate to My Training tab
      navigation.navigate('Training2', { initialView: 'myTraining' });
    } catch (err) {
      Alert.alert('Could not enroll', err?.message || 'Please try again.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSaveForLater = async () => {
    try {
      await saveProgram(program.id, user?.id);
      showToast('Saved to your collection');
    } catch (err) {
      Alert.alert('Error', 'Could not save program. Please try again.');
    }
  };
  
  // Ensure program has routines array
  const normalizedProgram = {
    ...initialProgram,
    routines: initialProgram?.routines || []
  };
  
  const [program, setProgram] = React.useState(normalizedProgram);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = React.useState(false);
  const [newRoutineName, setNewRoutineName] = React.useState('');
  const [showEditProgramModal, setShowEditProgramModal] = React.useState(false);
  const [editProgramName, setEditProgramName] = React.useState(program.name || '');
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const [shareToken, setShareToken] = React.useState(program.share_token || null);
  const [isGeneratingShare, setIsGeneratingShare] = React.useState(false);
  const [isShareSectionExpanded, setIsShareSectionExpanded] = React.useState(true);
  const [chevronRotation] = React.useState(new Animated.Value(0));
  const [isProgramAlreadyAssigned, setIsProgramAlreadyAssigned] = React.useState(false);
  const [isCheckingAssignment, setIsCheckingAssignment] = React.useState(true);

  // Progress tracker — which routine IDs have been "completed" (opened & scrolled through)
  const [completedRoutineIds, setCompletedRoutineIds] = React.useState([]);
  const PROGRESS_KEY = `@pickleHero_progress_${program.id}`;

  // Load + save progress
  React.useEffect(() => {
    AsyncStorage.getItem(PROGRESS_KEY).then(v => {
      if (v) setCompletedRoutineIds(JSON.parse(v));
    }).catch(() => {});
  }, [PROGRESS_KEY]);

  // Catalog programs are loaded without nested exercises — fetch full detail on open
  React.useEffect(() => {
    const catalogSources = ['library', 'explore', 'training'];
    if (!catalogSources.includes(source) || !program?.id) return;

    const routines = program.routines || [];
    const needsFullLoad =
      routines.length === 0 ||
      routines.some(
        (routine) =>
          !(routine.routine_exercises?.length || routine.exercises?.length)
      );

    if (!needsFullLoad) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await getProgramDetails(program.id);
        if (cancelled || error || !data) return;
        setProgram({
          ...data,
          routines: data.routines || [],
        });
      } catch (err) {
        console.warn('[ProgramDetailScreen] Failed to load full program details:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [program.id, source]);

  const markRoutineCompleted = React.useCallback((routineId) => {
    setCompletedRoutineIds(prev => {
      if (prev.includes(routineId)) return prev;
      const next = [...prev, routineId];
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [PROGRESS_KEY]);

  // Load persistent share section state
  React.useEffect(() => {
    const loadShareSectionState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('shareSectionExpanded');
        if (savedState !== null) {
          const isExpanded = JSON.parse(savedState);
          setIsShareSectionExpanded(isExpanded);
          // Set initial chevron rotation based on saved state
          chevronRotation.setValue(isExpanded ? 0 : 1);
        }
      } catch (error) {
        console.log('Failed to load share section state:', error);
      }
    };
    loadShareSectionState();
  }, []);

  // Check if program is already assigned to student (for coach assignment mode)
  React.useEffect(() => {
    const checkProgramAssignment = async () => {
      if (source === 'coach_assignment' && studentId && program.id) {
        try {
          console.log('🔍 Checking if program is already assigned to student:', { studentId, programId: program.id });
          setIsCheckingAssignment(true);
          
          const { data: existing, error: checkError } = await supabase
            .from('user_programs')
            .select('id')
            .eq('user_id', studentId)
            .eq('program_id', program.id)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('❌ Error checking program assignment:', checkError);
          }
          
          const isAssigned = !!existing;
          setIsProgramAlreadyAssigned(isAssigned);
          console.log(isAssigned ? '✅ Program already assigned' : '📝 Program not assigned yet');
        } catch (error) {
          console.error('💥 Error checking program assignment:', error);
        } finally {
          setIsCheckingAssignment(false);
        }
      } else {
        setIsCheckingAssignment(false);
      }
    };
    
    checkProgramAssignment();
  }, [source, studentId, program.id]);

  // Update program in parent (would be better with context/state management)
  React.useEffect(() => {
    navigation.setParams({ program });
    // Also update the parent screen's programs list
    if (onUpdateProgram) {
      onUpdateProgram(program);
    }
  }, [program, navigation, onUpdateProgram]);

  // Routine management functions
  const createRoutine = async () => {
    console.log('🚀 [ProgramDetailScreen] createRoutine called');
    console.log('📝 [ProgramDetailScreen] Routine name:', newRoutineName.trim());
    console.log('🏠 [ProgramDetailScreen] Program ID:', program?.id);
    console.log('👤 [ProgramDetailScreen] Current user:', user?.id);
    
    if (!newRoutineName.trim()) {
      console.log('❌ [ProgramDetailScreen] Validation failed: Empty routine name');
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    
    if (!program?.id) {
      console.log('❌ [ProgramDetailScreen] Validation failed: No program ID');
      Alert.alert('Error', 'Program not found');
      return;
    }
    
    if (!user?.id) {
      console.log('❌ [ProgramDetailScreen] Validation failed: No user ID');
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      console.log('🔄 [ProgramDetailScreen] Starting routine creation process...');
      
      const newRoutine = {
        id: Date.now().toString(),
        name: newRoutineName.trim(),
        exercises: [],
        createdAt: new Date().toISOString(),
      };
      
      console.log('📋 [ProgramDetailScreen] Routine object created:', {
        id: newRoutine.id,
        name: newRoutine.name,
        programId: program.id,
        exercisesCount: newRoutine.exercises.length
      });
      
      // 🚨 ISSUE: This was only saving to LOCAL STATE, not to database!
      console.log('⚠️ [ProgramDetailScreen] WARNING: Previously only saved to local state - NOT to database!');
      console.log('🔧 [ProgramDetailScreen] Now attempting to save to database using user function...');
      
      // Try to save to database using the user function
      console.log('💾 [ProgramDetailScreen] Attempting to save routine to database...');
      try {
        const { data: savedRoutine, error: saveError } = await supabase.rpc('create_routine_as_user', {
          routine_program_id: program.id,
          routine_name: newRoutine.name,
          routine_description: `User-created routine: ${newRoutine.name}`,
          routine_order_index: (program.routines?.length || 0) + 1,
          routine_time_estimate_minutes: 30, // Default estimate
          routine_is_published: false
        });
        
        if (saveError) {
          console.error('❌ [ProgramDetailScreen] Database save failed:', saveError);
          console.log('📱 [ProgramDetailScreen] Falling back to local storage only');
          Alert.alert('Warning', 'Routine saved locally but could not sync to server. It will sync when connection is available.');
        } else {
          console.log('✅ [ProgramDetailScreen] Routine saved to database successfully:', savedRoutine);
          
          // 🔧 CRITICAL FIX: RPC functions return arrays, so get the first element
          const routineData = Array.isArray(savedRoutine) ? savedRoutine[0] : savedRoutine;
          
          if (routineData && routineData.id) {
            console.log('🔄 [ProgramDetailScreen] Updating routine ID from timestamp to UUID:', {
              oldId: newRoutine.id,
              newId: routineData.id,
              idType: typeof routineData.id
            });
            newRoutine.id = routineData.id;
            newRoutine.program_id = routineData.program_id;
            newRoutine.order_index = routineData.order_index;
            newRoutine.time_estimate_minutes = routineData.time_estimate_minutes;
            newRoutine.is_published = routineData.is_published;
            console.log('✅ [ProgramDetailScreen] Routine object updated with database UUID');
          } else {
            console.log('⚠️ [ProgramDetailScreen] No routine data returned from database function');
          }
        }
      } catch (dbError) {
        console.error('❌ [ProgramDetailScreen] Database operation failed:', dbError);
        console.log('📱 [ProgramDetailScreen] Continuing with local storage only');
        Alert.alert('Warning', `Database save failed: ${dbError.message}. Routine saved locally.`);
      }
      
      // Update local state (this was the only thing happening before)
      console.log('📱 [ProgramDetailScreen] Updating local state...');
      const updatedProgram = {
        ...program,
        routines: [...(program.routines || []), newRoutine]
      };
      
      console.log('📊 [ProgramDetailScreen] Local routines count after add:', updatedProgram.routines.length);
      setProgram(updatedProgram);
      
      // Clear form
      console.log('🧹 [ProgramDetailScreen] Clearing form...');
      setNewRoutineName('');
      setShowCreateRoutineModal(false);
      
      console.log('✅ [ProgramDetailScreen] Routine creation completed successfully');
      
      // Navigate to RoutineDetail first, then automatically open ExercisePicker
      console.log('🧭 [ProgramDetailScreen] Navigating to RoutineDetail...');
      navigation.navigate('RoutineDetail', { 
        program: updatedProgram,
        routine: newRoutine,
        onUpdateRoutine: (updatedRoutine) => {
          console.log('🔄 [ProgramDetailScreen] Updating routine from RoutineDetail:', updatedRoutine.id);
          setProgram(prev => ({
            ...prev,
            routines: prev.routines.map(r => 
              r.id === updatedRoutine.id ? updatedRoutine : r
            )
          }));
        },
        autoOpenExercisePicker: true // Flag to automatically open exercise picker
      });
      
    } catch (error) {
      console.error('💥 [ProgramDetailScreen] Unexpected error in createRoutine:', error);
      Alert.alert('Error', `Failed to create routine: ${error.message}`);
    }
  };

  const deleteRoutine = async (routineId) => {
    const routineToDelete = program.routines.find(r => r.id === routineId);
    
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routineToDelete?.name}"?\n\nThis action cannot be undone and will:\n• Delete all exercises from this routine\n• Remove this routine from other users if the program was shared\n\nThis will affect all users who have this program.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [ProgramDetailScreen] Deleting routine:', routineId);
              
              // Delete from database if it's a UUID (database routine)
              const isUUID = routineId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
              
              if (isUUID && user?.id) {
                console.log('💾 [ProgramDetailScreen] Deleting from database...');
                
                const { error } = await supabase.rpc('delete_routine_as_user', {
                  routine_id: routineId
                });
                
                if (error) {
                  console.error('❌ [ProgramDetailScreen] Database delete failed:', error);
                  Alert.alert('Error', `Failed to delete from database: ${error.message}`);
                  return;
                }
                
                console.log('✅ [ProgramDetailScreen] Routine deleted from database');
              }
              
              // Update local state
              const updatedProgram = {
                ...program,
                routines: program.routines.filter(r => r.id !== routineId)
              };
              setProgram(updatedProgram);
              
              // Update parent if callback exists
              if (onUpdateProgram) {
                onUpdateProgram(updatedProgram);
              }
              
              Alert.alert('Success', 'Routine deleted successfully');
              
            } catch (error) {
              console.error('💥 [ProgramDetailScreen] Error deleting routine:', error);
              Alert.alert('Error', `Failed to delete routine: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const navigateToRoutine = (routine) => {
    // Only mark completed on explicit session complete — not on tap
    if (source !== 'library' && source !== 'explore' && source !== 'training') {
      markRoutineCompleted(routine.id);
    }
    console.log('🔍 [ProgramDetailScreen] Navigating to routine:', routine.name);
    console.log('📦 [ProgramDetailScreen] Routine data structure:', {
      id: routine.id,
      name: routine.name,
      hasRoutineExercises: !!routine.routine_exercises,
      routineExercisesCount: routine.routine_exercises?.length || 0,
      hasExercises: !!routine.exercises,
      exercisesCount: routine.exercises?.length || 0
    });
    
    // Transform routine_exercises to flat exercises array if needed
    const transformedRoutine = {
      ...routine,
      exercises: routine.exercises || (routine.routine_exercises || []).map((re, index) => ({
        ...re.exercises,
        name: re.exercises?.title || re.exercises?.name,
        routineExerciseId: re.id || `temp_${index}`,
        routine_exercise_id: re.id,
        order_index: re.order_index,
        is_optional: re.is_optional,
        custom_target_value: re.custom_target_value,
        // Add target formatting for compatibility
        target: re.exercises?.target_value && re.exercises?.target_unit 
          ? `${re.exercises.target_value} ${re.exercises.target_unit}`
          : (re.exercises?.target_value ? `${re.exercises.target_value} attempts` : '10 attempts')
      }))
    };
    
    console.log('✅ [ProgramDetailScreen] Transformed exercises count:', transformedRoutine.exercises?.length || 0);
    
    navigation.navigate('RoutineDetail', { 
      program,
      routine: transformedRoutine,
      source,
      isStudentView: isStudentView, // Pass student view flag to RoutineDetail
      studentId: studentId, // Pass student ID so logs are saved to student
      onUpdateRoutine: (updatedRoutine) => {
        setProgram(prev => ({
          ...prev,
          routines: prev.routines.map(r => 
            r.id === updatedRoutine.id ? updatedRoutine : r
          )
        }));
      }
    });
  };

  const addToMyPrograms = () => {
    Alert.alert(
      'Add to My Programs',
      `Do you want to add "${program.name}" to your personal program list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Program', 
          onPress: () => {
            // Create a new program object with a new ID and timestamp for the user's collection
            const newProgram = {
              ...program,
              id: Date.now().toString(), // New ID for user's collection
              addedFromExplore: true,
              addedAt: new Date().toISOString(),
            };
            
            // Navigate back to main Programs screen and pass the new program
            navigation.navigate('Training2', { 
              newProgram: newProgram 
            });
            
            Alert.alert('Success', 'Program added to your list!');
          }
        }
      ]
    );
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

  // Upload program thumbnail to Supabase Storage
  const uploadProgramThumbnail = async (imageUri, programName) => {
    try {
      console.log('📤 [ProgramDetailScreen] Starting thumbnail upload...');
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Safety check: Prevent blob URLs from being uploaded
      if (imageUri.startsWith('blob:')) {
        console.warn('⚠️ [ProgramDetailScreen] Blob URL detected, cannot upload:', imageUri);
        Alert.alert('Warning', 'Invalid image format. Program will be updated without image.');
        return null;
      }

      // Generate a unique filename with user folder structure
      const fileExtension = 'jpg';
      const sanitizedProgramName = programName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${user.id}/${sanitizedProgramName}_${Date.now()}.${fileExtension}`;
      
      // Read file as array buffer
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('program_thumbnails')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('❌ [ProgramDetailScreen] Storage upload error:', error);
        Alert.alert('Warning', 'Failed to upload thumbnail. Program will be updated without image.');
        return null;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('program_thumbnails')
        .getPublicUrl(fileName);

      // Safety check: Ensure the returned URL is not a blob URL
      if (publicUrl.startsWith('blob:')) {
        console.error('❌ [ProgramDetailScreen] Generated URL is still a blob URL - upload may have failed');
        Alert.alert('Warning', 'Thumbnail upload failed. Program will be updated without image.');
        return null;
      }

      console.log('✅ [ProgramDetailScreen] Thumbnail uploaded successfully:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ [ProgramDetailScreen] Error uploading thumbnail:', error);
      Alert.alert('Warning', 'Failed to upload thumbnail. Program will be updated without image.');
      return null;
    }
  };

  const editProgram = async () => {
    if (!editProgramName.trim()) {
      Alert.alert('Error', 'Please enter a program name');
      return;
    }

    try {
      let thumbnailUrl = program.thumbnailUrl;
      let compressedThumbnail = program.thumbnail;

      // Handle image upload if new image selected
      if (selectedImage) {
        try {
          // Upload to Supabase Storage for database storage
          thumbnailUrl = await uploadProgramThumbnail(selectedImage.uri, editProgramName.trim());
          compressedThumbnail = selectedImage; // For local storage
        } catch (error) {
          console.error('❌ [ProgramDetailScreen] Error processing image:', error);
          Alert.alert('Warning', 'Failed to process image. Program will be updated without thumbnail.');
        }
      }

      const updatedProgram = {
        ...program,
        name: editProgramName.trim(),
        thumbnail: compressedThumbnail,
        thumbnailUrl: thumbnailUrl,
      };

      // Update in database if it's a UUID (database program)
      const isUUID = program.id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID && user?.id) {
        try {
          const { error } = await supabase.rpc('update_program_as_user', {
            program_id: program.id,
            program_name: updatedProgram.name,
            program_description: updatedProgram.description,
            program_thumbnail_url: thumbnailUrl
          });

          if (error) {
            console.error('❌ [ProgramDetailScreen] Database update failed:', error);
            Alert.alert('Warning', 'Program updated locally but could not sync to server.');
          } else {
            console.log('✅ [ProgramDetailScreen] Program updated in database');
          }
        } catch (dbError) {
          console.error('❌ [ProgramDetailScreen] Database operation failed:', dbError);
          Alert.alert('Warning', `Database update failed: ${dbError.message}. Program updated locally.`);
        }
      }

      // Update local state
      setProgram(updatedProgram);
      
      // Update parent if callback exists
      if (onUpdateProgram) {
        onUpdateProgram(updatedProgram);
      }

      // Clear form and close modal
      setSelectedImage(null);
      setShowEditProgramModal(false);
      
      Alert.alert('Success', 'Program updated successfully!');

    } catch (error) {
      console.error('💥 [ProgramDetailScreen] Error updating program:', error);
      Alert.alert('Error', `Failed to update program: ${error.message}`);
    }
  };

  // Sharing functionality
  const generateShareToken = async () => {
    if (shareToken) return shareToken; // Already have a token
    
    setIsGeneratingShare(true);
    try {
      // Generate a unique share token
      const token = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update program in database if it's a UUID (database program)
      const isUUID = program.id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID && user?.id) {
        try {
          const { error } = await supabase.rpc('update_program_as_user', {
            program_id: program.id,
            program_name: program.name,
            program_description: program.description,
            program_thumbnail_url: program.thumbnailUrl,
            program_share_token: token,
            program_is_shareable: true
          });

          if (error) {
            console.error('❌ [ProgramDetailScreen] Failed to save share token to database:', error);
            Alert.alert('Warning', 'Share token saved locally but could not sync to server.');
          } else {
            console.log('✅ [ProgramDetailScreen] Share token saved to database');
          }
        } catch (dbError) {
          console.error('❌ [ProgramDetailScreen] Database operation failed:', dbError);
          Alert.alert('Warning', `Database update failed: ${dbError.message}. Share token saved locally.`);
        }
      }

      // Update local state
      setShareToken(token);
      setProgram(prev => ({ ...prev, share_token: token, is_shareable: true }));
      
      return token;
    } catch (error) {
      console.error('💥 [ProgramDetailScreen] Error generating share token:', error);
      Alert.alert('Error', 'Failed to generate share link');
      return null;
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const getShareUrl = async () => {
    const token = await generateShareToken();
    if (!token) return null;
    
    // Deep link structure: pickleballhero://program/share/{program_id}?token={share_token}
    return `pickleballhero://program/share/${program.id}?token=${token}`;
  };

  const handleShare = async () => {
    try {
      const shareUrl = await getShareUrl();
      if (!shareUrl) return;

      const result = await Share.share({
        message: `Check out this pickleball training program: "${program.name}"\n\n${shareUrl}`,
        url: shareUrl, // iOS only
        title: `${program.name} - Pickleball Training Program`,
      });

      if (result.action === Share.sharedAction) {
        console.log('✅ [ProgramDetailScreen] Program shared successfully');
        
        // Update share count in database (optional)
        const isUUID = program.id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        if (isUUID && user?.id) {
          try {
            await supabase.rpc('increment_program_share_count', {
              program_id: program.id
            });
          } catch (error) {
            console.log('⚠️ [ProgramDetailScreen] Failed to update share count:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ [ProgramDetailScreen] Error sharing program:', error);
      Alert.alert('Error', 'Failed to share program');
    }
  };

  // Toggle share section expand/collapse
  const toggleShareSection = async () => {
    const newExpandedState = !isShareSectionExpanded;
    setIsShareSectionExpanded(newExpandedState);
    
    // Animate chevron rotation
    Animated.timing(chevronRotation, {
      toValue: newExpandedState ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Save state to AsyncStorage
    try {
      await AsyncStorage.setItem('shareSectionExpanded', JSON.stringify(newExpandedState));
    } catch (error) {
      console.log('Failed to save share section state:', error);
    }
  };

  const renderRoutinesContent = () => (
    <View style={styles.routinesContainer}>
      {program.routines.length === 0 ? (
        <View style={styles.emptyRoutinesList}>
          <Text style={styles.emptyRoutinesIcon}>📋</Text>
          <Text style={styles.emptyRoutinesTitle}>No Routines Yet</Text>
          <Text style={styles.emptyRoutinesDescription}>
            {source === 'explore' 
              ? 'Preview this program and add it to your personal collection.'
              : 'Create your first routine to organize exercises within this program.'
            }
          </Text>
          {source !== 'explore' && source !== 'coach' && source !== 'coach_assignment' && (
            <TouchableOpacity
              style={styles.addFirstRoutineButton}
              onPress={() => setShowCreateRoutineModal(true)}
            >
              <WebIcon 
                name="add" 
                size={20} 
                color="white" 
              />
              <Text style={styles.addFirstRoutineButtonText}>
                Create First Routine
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.routinesList}
          contentContainerStyle={styles.routinesContent}
        >
          <View style={styles.routinesHeader}>
            <Text style={styles.routinesTitle}>Sessions ({program.routines.length})</Text>
            <Text style={styles.routinesSubtitle}>
              {(source === 'explore' || source === 'coach' || source === 'library' || source === 'coach_assignment') ? 'Tap to preview routine' : 'Tap to open • Long press to delete'}
            </Text>
          </View>

          {/* Progress tracker bar */}
          {program.routines.length > 0 && (() => {
            const total = program.routines.length;
            const done = completedRoutineIds.filter(id => program.routines.some(r => r.id === id)).length;
            const pct = total > 0 ? done / total : 0;
            return (
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Your progress</Text>
                  <Text style={styles.progressCount}>{done} / {total} sessions</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
                </View>
                {done === total && done > 0 && (
                  <View style={styles.progressCompleteRow}>
                    <PartyPopper size={16} color="#059669" strokeWidth={2.5} />
                    <Text style={styles.progressComplete}>Program completed!</Text>
                  </View>
                )}
              </View>
            );
          })()}
          
          {program.routines.map((routine) => {
            const isDone = completedRoutineIds.includes(routine.id);
            return (
              <View key={routine.id} style={[styles.routineCard, isDone && styles.routineCardDone]}>
                <TouchableOpacity
                  style={styles.routineContent}
                  onPress={() => navigateToRoutine(routine)}
                  onLongPress={(source === 'explore' || source === 'coach' || source === 'library' || source === 'coach_assignment') ? undefined : () => deleteRoutine(routine.id)}
                >
                  <View style={styles.routineInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isDone && (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      )}
                      <Text style={[styles.routineName, isDone && { color: '#6B7280' }]}>{routine.name}</Text>
                    </View>
                    {routine.description ? (
                      <Text style={styles.routineDescription}>{routine.description}</Text>
                    ) : null}
                    <View style={styles.routineStats}>
                      <Text style={styles.routineStatsText}>
                        {routine.exercises?.length || 0} exercise{(routine.exercises?.length || 0) !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.routineActions}>
                    <Text style={styles.chevronText}>{'>'}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}

          {source !== 'explore' && source !== 'coach' && source !== 'coach_assignment' && (
            <TouchableOpacity
              style={styles.addMoreRoutinesButton}
              onPress={() => setShowCreateRoutineModal(true)}
            >
              <WebIcon 
                name="add" 
                size={20} 
                color="white" 
              />
              <Text style={styles.addMoreRoutinesButtonText}>
                Add new session
              </Text>
            </TouchableOpacity>
          )}

          {/* Sharing Section - Only show for owned programs (not from explore, library, coach, or coach_assignment) */}
          {source !== 'explore' && source !== 'library' && source !== 'coach' && source !== 'coach_assignment' && (
            <View style={styles.sharingSection}>
              <TouchableOpacity 
                style={styles.sharingSectionHeader}
                onPress={toggleShareSection}
                activeOpacity={0.7}
              >
                <View style={styles.sharingSectionHeaderContent}>
                  <View>
                    <Text style={styles.sharingSectionTitle}>Share Program</Text>
                    <Text style={styles.sharingSectionSubtitle}>
                      Let others add this program to their collection
                    </Text>
                  </View>
                  <Animated.View
                    style={[
                      styles.chevronContainer,
                      {
                        transform: [{
                          rotate: chevronRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        }],
                      },
                    ]}
                  >
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </Animated.View>
                </View>
              </TouchableOpacity>

              {isShareSectionExpanded && (
                <View style={styles.sharingContent}>
                {/* QR Code */}
                <View style={styles.qrCodeContainer}>
                  {shareToken || !isGeneratingShare ? (
                    <QRCode
                      value={shareToken ? `pickleballhero://program/share/${program.id}?token=${shareToken}` : 'generating...'}
                      size={120}
                      color="#1F2937"
                      backgroundColor="white"
                      logo={require('../../assets/images/icon_ball.png')}
                      logoSize={24}
                      logoBackgroundColor="white"
                      logoMargin={2}
                      logoBorderRadius={12}
                    />
                  ) : (
                    <View style={styles.qrCodePlaceholder}>
                      <Text style={styles.qrCodePlaceholderText}>
                        {isGeneratingShare ? 'Generating...' : 'Tap Share to Generate QR'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Program Info */}
                <View style={styles.shareInfo}>
                  <Text style={styles.shareProgramName}>{program.name}</Text>
                  <Text style={styles.shareDescription}>
                    {program.routines.length} session{program.routines.length !== 1 ? 's' : ''} • {' '}
                    {program.routines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0)} exercises
                  </Text>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                  disabled={isGeneratingShare}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.shareButtonText}>
                    {isGeneratingShare ? 'Generating...' : 'Share Link'}
                  </Text>
                </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{program.name}</Text>
            {program.description ? (
              <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {program.description}
              </Text>
            ) : null}
          </View>
          
          {(source !== 'explore' && source !== 'coach_assignment') && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                Alert.alert(
                  'Program Options',
                  'Choose an action',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Edit Program',
                      onPress: () => {
                        setEditProgramName(program.name || '');
                        setSelectedImage(null);
                        setShowEditProgramModal(true);
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Preview mode banner for Library / Explore */}
      {(source === 'library' || source === 'explore') && (
        <PreviewModeBanner onEnroll={() => { setEnrollSheetRole(null); setEnrollSheetVisible(true); }} />
      )}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          (source === 'explore' || source === 'library' || source === 'coach_assignment') && styles.scrollContentWithFixedButton
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderRoutinesContent()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Library / Explore enrollment footer — hierarchical CTAs */}
      {(source === 'explore' || source === 'library') && (
        <View style={[styles.fixedButtonContainer, styles.libraryFooter, { paddingBottom: insets.bottom + 8 }]}>
          {/* Primary: Set as primary focus */}
          <TouchableOpacity
            style={styles.libraryPrimaryBtn}
            onPress={() => { setEnrollSheetRole('primary'); setEnrollSheetVisible(true); }}
            activeOpacity={0.85}
            accessibilityLabel="Set as primary focus"
            accessibilityRole="button"
          >
            <Text style={styles.libraryPrimaryBtnText}>Set as primary focus</Text>
          </TouchableOpacity>

          {/* Secondary: Add as skill focus */}
          {!skillSlotsFull ? (
            <TouchableOpacity
              style={styles.librarySecondaryBtn}
              onPress={() => { setEnrollSheetRole('skill_1'); setEnrollSheetVisible(true); }}
              activeOpacity={0.85}
              accessibilityLabel="Add as skill focus"
              accessibilityRole="button"
            >
              <Text style={styles.librarySecondaryBtnText}>Add as skill focus</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.librarySecondaryBtn, { opacity: 0.4 }]}>
              <Text style={styles.librarySecondaryBtnText}>Skill slots full (2/2)</Text>
            </View>
          )}

          {/* Tertiary: Save for later */}
          <TouchableOpacity onPress={handleSaveForLater} style={styles.librarySaveLink}>
            <Text style={styles.librarySaveLinkText}>Save for later</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Enrollment confirm sheet */}
      <EnrollmentConfirmSheet
        visible={enrollSheetVisible}
        program={program}
        initialRole={enrollSheetRole}
        existingPrimary={primaryTrack}
        skillSlotsFull={skillSlotsFull}
        onConfirm={handleEnrollConfirm}
        onCancel={() => setEnrollSheetVisible(false)}
        loading={enrollLoading}
      />

      {/* iOS toast */}
      {toastMessage && Platform.OS !== 'android' && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastBox}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
      
      {/* Fixed Assign Button for Coach Assignment Mode */}
      {source === 'coach_assignment' && !isStudentView && !isProgramAlreadyAssigned && !isCheckingAssignment && (
        <View style={[styles.fixedButtonContainer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={styles.fixedAssignButton}
            onPress={async () => {
              try {
                console.log('🎯 Assigning program to student:', { studentId, programId: program.id, programName: program.name });
                
                // Assign program to student
                console.log('📝 Inserting program assignment...');
                const { error } = await supabase
                  .from('user_programs')
                  .insert({
                    user_id: studentId,
                    program_id: program.id,
                    access_type: 'shared'
                  });
                
                if (error) {
                  console.error('❌ Error inserting program:', error);
                  throw error;
                }
                
                console.log('✅ Program assigned successfully');
                
                // Update local state to hide button
                setIsProgramAlreadyAssigned(true);
                
                Alert.alert('Success', `Assigned "${program.name}" to ${studentName || 'student'}.`, [
                  { 
                    text: 'OK',
                    onPress: () => {
                      console.log('🔙 Navigating back to PlayerProfile...');
                      // Navigate back to PlayerProfile (2 screens back)
                      navigation.pop(2);
                    }
                  }
                ]);
              } catch (error) {
                console.error('💥 Error assigning program:', error);
                Alert.alert('Error', 'Failed to assign program. Please try again.');
              }
            }}
          >
            <Ionicons 
              name="person-add" 
              size={20} 
              color="white" 
            />
            <Text style={styles.fixedAssignButtonText}>
              Assign to {studentName || 'Student'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Routine Modal */}
      <Modal
        visible={showCreateRoutineModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateRoutineModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateRoutineModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Session</Text>
            <TouchableOpacity
              style={[styles.modalCreateButton, !newRoutineName.trim() && styles.modalCreateButtonDisabled]}
              onPress={createRoutine}
              disabled={!newRoutineName.trim()}
            >
              <Text style={[styles.modalCreateText, !newRoutineName.trim() && styles.modalCreateTextDisabled]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Session Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={newRoutineName}
                onChangeText={setNewRoutineName}
                placeholder="e.g., Session A - Dinking Focus"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Program Modal */}
      <Modal
        visible={showEditProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditProgramModal(false);
          setEditProgramName(program.name || '');
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowEditProgramModal(false);
                setEditProgramName(program.name || '');
                setSelectedImage(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Program</Text>
            <TouchableOpacity
              style={[styles.modalCreateButton, !editProgramName.trim() && styles.modalCreateButtonDisabled]}
              onPress={editProgram}
              disabled={!editProgramName.trim()}
            >
              <Text style={[styles.modalCreateText, !editProgramName.trim() && styles.modalCreateTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Program Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={editProgramName}
                onChangeText={setEditProgramName}
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
                ) : program.thumbnail || program.thumbnailUrl ? (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ 
                        uri: typeof program.thumbnail === 'string' 
                          ? program.thumbnail 
                          : program.thumbnail?.uri || program.thumbnailUrl
                      }} 
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={pickImage}
                      disabled={isProcessingImage}
                    >
                      <Text style={styles.changeImageText}>
                        {isProcessingImage ? 'Processing...' : 'Change'}
                      </Text>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWithFixedButton: {
    paddingBottom: 100, // Extra padding to account for fixed button
  },
  // Routines styles
  routinesContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyRoutinesList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyRoutinesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyRoutinesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRoutinesDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstRoutineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  routinesList: {
    flex: 1,
  },
  routinesContent: {
    padding: 16,
    paddingBottom: 40,
  },
  routinesHeader: {
    marginBottom: 16,
  },
  routinesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  routinesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  routineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routineCardDone: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    opacity: 0.85,
  },
  progressContainer: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressCompleteRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressComplete: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  routineContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  routineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineButton: {
    padding: 8,
  },
  chevronText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addMoreRoutinesButton: {
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
  addMoreRoutinesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addToProgramsButton: {
    backgroundColor: '#8B5CF6',
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
  bottomSpacing: {
    height: 24,
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
  changeImageButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Sharing section styles
  sharingSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sharingSectionHeader: {
    marginBottom: 20,
  },
  sharingSectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevronContainer: {
    padding: 4,
  },
  sharingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sharingSectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  sharingContent: {
    alignItems: 'center',
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  qrCodePlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  shareInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shareProgramName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  shareDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Fixed button styles
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedAddToProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fixedAddToProgramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  fixedAssignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fixedAssignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Library enrollment footer
  libraryFooter: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'column',
  },
  libraryPrimaryBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  libraryPrimaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  librarySecondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  librarySecondaryBtnText: { color: '#6366F1', fontSize: 15, fontWeight: '600' },
  librarySaveLink: { alignItems: 'center', paddingVertical: 10 },
  librarySaveLinkText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },

  // Toast
  toastOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toastBox: {
    backgroundColor: 'rgba(17,24,39,0.88)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
