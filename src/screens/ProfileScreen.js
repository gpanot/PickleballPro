import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLogbook } from '../context/LogbookContext';
import { checkAdminAccess, supabase } from '../lib/supabase';

import { tiers, levels } from '../data/mockData';

const { width } = Dimensions.get('window');

// Storage constants for badges
const EXERCISE_RATINGS_KEY = '@pickleball_hero:exercise_ratings';
const COLLECTED_BADGES_KEY = '@pickleball_hero:collected_badges';
const PROGRAM_PROGRESS_KEY = '@pickleball_hero:program_progress';

// DUPR Programs data (simplified version)
const duprPrograms = {
  "dupr_programs": [
    {
      "dupr": 2.0,
      "program_id": "P-2.0",
      "sessions": [
        {
          "session_id": "P-2.0-S1",
          "title": "Foundations: Control & Consistency",
          "drills": [
            { "skill": "Serve", "level": 1, "title": "Serve Consistency", "goal": "7/10 serves in play" },
            { "skill": "Return", "level": 1, "title": "Return Consistency", "goal": "7/10 returns in play" },
            { "skill": "Dink", "level": 1, "title": "Dink Rally", "goal": "10 consecutive dinks" }
          ]
        }
      ]
    },
    {
      "dupr": 2.1,
      "program_id": "P-2.1",
      "sessions": [
        {
          "session_id": "P-2.1-S1",
          "title": "Expanding the Basics",
          "drills": [
            { "skill": "Serve", "level": 1, "title": "Serve Accuracy", "goal": "8/10 serves in play" },
            { "skill": "Reset", "level": 1, "title": "Basic Reset", "goal": "4/10 into NVZ" }
          ]
        }
      ]
    }
  ]
};

// Badge matrix data
const badgeMatrix = {
  "badge_sets": [
    {
      "dupr": 2.0,
      "badges": [
        {
          "id": "rookie_20",
          "name": "Rookie",
          "type": "program_completion",
          "program_id": "P-2.0",
          "tiers": { "single": true }
        },
        {
          "id": "dink_debut_20",
          "name": "Dink Debut",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 1,
          "metric": "streak",
          "thresholds": { "bronze": 10, "silver": 20, "gold": 30 }
        }
      ]
    },
    {
      "dupr": 2.1,
      "badges": [
        {
          "id": "serve_starter_21",
          "name": "Serve Starter",
          "type": "drill_threshold",
          "skill": "Serve",
          "level": 1,
          "metric": "count_in",
          "thresholds": { "bronze": "8/10", "silver": "9/10", "gold": "10/10" }
        },
        {
          "id": "reset_beginner_21",
          "name": "Reset Beginner",
          "type": "drill_threshold",
          "skill": "Reset",
          "level": 1,
          "metric": "count_success",
          "thresholds": { "bronze": "4/10", "silver": "6/10", "gold": "8/10" }
        }
      ]
    },
    {
      "dupr": 2.2,
      "badges": [
        {
          "id": "return_builder_22",
          "name": "Return Builder",
          "type": "drill_threshold",
          "skill": "Return",
          "level": 2,
          "metric": "count_deep",
          "thresholds": { "bronze": "7/10", "silver": "8/10", "gold": "9/10" }
        },
        {
          "id": "dink_builder_22",
          "name": "Dink Builder",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 2,
          "metric": "streak",
          "thresholds": { "bronze": 12, "silver": 18, "gold": 25 }
        }
      ]
    },
    {
      "dupr": 2.3,
      "badges": [
        {
          "id": "volley_starter_23",
          "name": "Volley Starter",
          "type": "drill_threshold",
          "skill": "Volley",
          "level": 1,
          "metric": "count_success",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "transition_beginner_23",
          "name": "Transition Beginner",
          "type": "drill_threshold",
          "skill": "Transition",
          "level": 1,
          "metric": "count_success",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        }
      ]
    },
    {
      "dupr": 2.4,
      "badges": [
        {
          "id": "return_sniper_24",
          "name": "Return Sniper",
          "type": "drill_threshold",
          "skill": "Return",
          "level": 3,
          "metric": "count_crosscourt",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "footwork_first_24",
          "name": "Footwork First",
          "type": "drill_threshold",
          "skill": "Transition",
          "level": 2,
          "metric": "count_balanced_entry",
          "thresholds": { "bronze": "7/10", "silver": "9/10", "gold": "10/10" }
        }
      ]
    },
    {
      "dupr": 2.5,
      "badges": [
        {
          "id": "drop_artist_25",
          "name": "Drop Artist",
          "type": "drill_threshold",
          "skill": "Drop",
          "level": 1,
          "metric": "count_nvz",
          "thresholds": { "bronze": "4/10", "silver": "6/10", "gold": "8/10" }
        },
        {
          "id": "dink_grinder_25",
          "name": "Dink Grinder",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 2,
          "metric": "streak_crosscourt",
          "thresholds": { "bronze": 15, "silver": 25, "gold": 35 }
        }
      ]
    },
    {
      "dupr": 2.6,
      "badges": [
        {
          "id": "corner_server_26",
          "name": "Corner Server",
          "type": "drill_threshold",
          "skill": "Serve",
          "level": 3,
          "metric": "count_corners",
          "thresholds": { "bronze": "4/8", "silver": "6/8", "gold": "8/8" }
        },
        {
          "id": "reset_wizard_26",
          "name": "Reset Wizard",
          "type": "drill_threshold",
          "skill": "Reset",
          "level": 2,
          "metric": "count_under_pressure",
          "thresholds": { "bronze": "5/10", "silver": "7/10", "gold": "9/10" }
        }
      ]
    },
    {
      "dupr": 2.7,
      "badges": [
        {
          "id": "extended_rally_27",
          "name": "Extended Rally",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 3,
          "metric": "streak",
          "thresholds": { "bronze": 20, "silver": 30, "gold": 40 }
        },
        {
          "id": "volley_wall_27",
          "name": "Volley Wall",
          "type": "drill_threshold",
          "skill": "Volley",
          "level": 2,
          "metric": "count_redirect",
          "thresholds": { "bronze": "5/10", "silver": "7/10", "gold": "9/10" }
        }
      ]
    },
    {
      "dupr": 2.8,
      "badges": [
        {
          "id": "quick_hands_28",
          "name": "Quick Hands",
          "type": "drill_threshold",
          "skill": "Speed-up",
          "level": 1,
          "metric": "count_wins",
          "thresholds": { "bronze": "3/5", "silver": "4/5", "gold": "5/5" }
        },
        {
          "id": "pressure_dinker_28",
          "name": "Pressure Dinker",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 3,
          "metric": "streak_pressure",
          "thresholds": { "bronze": 12, "silver": 20, "gold": 30 }
        }
      ]
    },
    {
      "dupr": 2.9,
      "badges": [
        {
          "id": "consistent_server_29",
          "name": "Consistent Server",
          "type": "drill_threshold",
          "skill": "Serve",
          "level": 3,
          "metric": "count_deep",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "target_returner_29",
          "name": "Target Returner",
          "type": "drill_threshold",
          "skill": "Return",
          "level": 3,
          "metric": "count_target_side",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "reset_pro_29",
          "name": "Reset Pro",
          "type": "drill_threshold",
          "skill": "Reset",
          "level": 3,
          "metric": "count_under_pressure",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        }
      ]
    },
    {
      "dupr": 3.0,
      "badges": [
        {
          "id": "solid_30",
          "name": "Solid 3.0",
          "type": "program_completion",
          "program_id": "P-3.0",
          "tiers": { "single": true }
        },
        {
          "id": "all_rounder_30",
          "name": "All-Rounder",
          "type": "skill_collection",
          "requirement": { "skills_at_or_above_level": 3, "count": { "bronze": 5, "silver": 8, "gold": 12 } }
        },
        {
          "id": "club_ready_30",
          "name": "Club Ready",
          "type": "meta_sessions",
          "thresholds": { "bronze": 20, "silver": 30, "gold": 50 }
        }
      ]
    }
  ]
};

// Badge icons mapping
const getBadgeIcon = (badgeId, skillType) => {
  const iconMap = {
    // Skill-based icons
    'Serve': '🎯',
    'Return': '↩️',
    'Dink': '🏓',
    'Drop': '🎯',
    'Volley': '⚡',
    'Reset': '🔄',
    'Speed-up': '💨',
    'Transition': '🏃',
    
    // Special badges
    'rookie': '🔰',
    'solid': '🏆',
    'all_rounder': '⭐',
    'club_ready': '🎖️'
  };
  
  // Try skill-based mapping first
  if (skillType && iconMap[skillType]) {
    return iconMap[skillType];
  }
  
  // Fallback to badge name patterns
  for (const [key, icon] of Object.entries(iconMap)) {
    if (badgeId.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return '🏅'; // Default badge icon
};

// Combined data for the merged profile/home screen

const recentActivity = [
  { id: 1, type: 'exercise', title: 'Dink Wall Drill', status: 'completed', time: '2 hours ago', points: '+15 XP' },
  { id: 2, type: 'level', title: 'Level 2: Drives', status: 'unlocked', time: '1 day ago', points: '+50 XP' },
  { id: 3, type: 'coach', title: 'Session with Sarah M.', status: 'scheduled', time: 'Tomorrow 2PM', points: '' },
  { id: 4, type: 'exercise', title: 'Cross-Court Dinks', status: 'completed', time: '3 days ago', points: '+12 XP' },
];


export default function ProfileScreen({ onLogout, navigation }) {
  const { user, resetAllOnboarding, setUser } = useUser();
  const { user: authUser, isAuthenticated, signOut } = useAuth();
  const { getLogbookSummary } = useLogbook();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDuprModal, setShowDuprModal] = useState(false);
  const [duprInput, setDuprInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarImage, setAvatarImage] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Badge-related state
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [exerciseRatings, setExerciseRatings] = useState(new Map());
  const [collectedBadges, setCollectedBadges] = useState(new Set());
  const [programProgress, setProgramProgress] = useState(new Map());
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState('all'); // 'all', 'unlocked', 'collected'
  const [selectedDuprLevel, setSelectedDuprLevel] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkAdmin();
      loadUserAvatar();
      loadBadgeData(); // Load badge data when profile screen mounts
    }
  }, [isAuthenticated, authUser]);

  const loadUserAvatar = async () => {
    try {
      if (!authUser?.id) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // Check if error is due to missing column
        if (error.code === '42703' && error.message.includes('avatar_url')) {
          console.log('Avatar column not yet added to database. Please run the migration: add_avatar_url_migration.sql');
          return;
        }
        console.error('Error loading avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarImage(data.avatar_url);
        setUser(prevUser => ({
          ...prevUser,
          avatarUrl: data.avatar_url
        }));
      }
    } catch (error) {
      console.error('Error loading user avatar:', error);
    }
  };

  const checkAdmin = async () => {
    try {
      const { isAdmin: adminStatus } = await checkAdminAccess(authUser.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };
  

  const handleSyncDUPR = () => {
    if (user.ratingType === 'dupr') {
      Alert.alert(
        'Sync DUPR Rating',
        'This will update your rating from your official DUPR account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sync Now', onPress: () => Alert.alert('Success', 'DUPR rating synced successfully!') }
        ]
      );
    } else {
      Alert.alert(
        'Update Rating',
        'You can update your rating anytime. This helps us provide better training recommendations.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update', onPress: () => Alert.alert('Feature Coming Soon', 'Rating update feature will be available in the next update.') }
        ]
      );
    }
  };

  const handleSettings = () => {
    navigation?.navigate('AppSettings');
  };

  const handleHelpSupport = () => {
    navigation?.navigate('HelpSupport');
  };

  const handleLogout = () => {
    console.log('handleLogout called!');
    
    // For web, bypass the Alert and logout directly (Alert doesn't work well on web)
    if (Platform.OS === 'web') {
      console.log('Web platform detected - logging out directly...');
      performLogout();
      return;
    }
    
    // For mobile, show confirmation alert
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: performLogout
        }
      ]
    );
  };
  
  const performLogout = async () => {
    console.log('performLogout called - signing out from Supabase...');
    try {
      // Reset onboarding state first to ensure clean logout
      console.log('Resetting onboarding state to return to IntroScreen...');
      resetAllOnboarding();
      
      await signOut();
      console.log('Successfully signed out from Supabase');
      
      // Also call the onLogout prop if available (for additional cleanup)
      if (onLogout) {
        console.log('Calling onLogout prop for additional cleanup...');
        onLogout();
      }
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleDuprEdit = () => {
    setDuprInput((user.duprRating || 2.000).toFixed(3));
    setShowDuprModal(true);
  };

  const validateDuprFormat = (value) => {
    // DUPR format: x.xxx (one digit before decimal, three after)
    const duprPattern = /^\d\.\d{3}$/;
    return duprPattern.test(value);
  };

  const saveDuprRating = async () => {
    if (!validateDuprFormat(duprInput)) {
      Alert.alert('Invalid Format', 'DUPR rating must be in format x.xxx (e.g., 3.500)');
      return;
    }

    const newRating = parseFloat(duprInput);
    if (newRating < 1.000 || newRating > 8.000) {
      Alert.alert('Invalid Range', 'DUPR rating must be between 1.000 and 8.000');
      return;
    }

    try {
      // Update in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ dupr_rating: newRating })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Error updating DUPR rating in database:', updateError);
        Alert.alert('Error', 'Failed to update DUPR rating. Please try again.');
        return;
      }

      // Update local state only after successful database update
      setUser(prevUser => ({
        ...prevUser,
        duprRating: newRating
      }));
      
      setShowDuprModal(false);
      Alert.alert('Success', 'DUPR rating updated successfully!');
    } catch (error) {
      console.error('Error saving DUPR rating:', error);
      Alert.alert('Error', 'Failed to update DUPR rating. Please try again.');
    }
  };

  const handleNameEdit = () => {
    setNameInput(user.name || '');
    setShowNameModal(true);
  };

  const validateName = (name) => {
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 50;
  };

  const saveName = async () => {
    if (!validateName(nameInput)) {
      Alert.alert('Invalid Name', 'Name must be between 2 and 50 characters long.');
      return;
    }

    try {
      const trimmedName = nameInput.trim();
      
      // Update in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: trimmedName })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Error updating name in database:', updateError);
        Alert.alert('Error', 'Failed to update name. Please try again.');
        return;
      }

      // Update local state only after successful database update
      setUser(prevUser => ({
        ...prevUser,
        name: trimmedName
      }));
      
      setShowNameModal(false);
      Alert.alert('Success', 'Name updated successfully!');
    } catch (error) {
      console.error('Error saving name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'web') {
      pickAvatarImage();
    } else {
      Alert.alert(
        'Update Profile Picture',
        'Choose a new profile picture',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Choose Photo', onPress: pickAvatarImage }
        ]
      );
    }
  };

  const pickAvatarImage = async () => {
    try {
      setIsUploadingAvatar(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to update your profile picture.');
        setIsUploadingAvatar(false);
        return;
      }

      // Launch image picker without cropping
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // No built-in cropping
        quality: 1.0, // High quality for custom cropping
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Navigate to custom crop screen
        navigation.navigate('CropAvatar', {
          imageUri: asset.uri,
          onCropComplete: async (croppedUri) => {
            try {
              // Upload the cropped image to Supabase
              await uploadAvatarToSupabase(croppedUri);
            } catch (error) {
              console.error('Error uploading cropped image:', error);
              Alert.alert('Error', 'Failed to upload the cropped image.');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const uploadAvatarToSupabase = async (imageUri) => {
    try {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Safety check: Prevent blob URLs from being uploaded
      if (imageUri.startsWith('blob:')) {
        console.warn('⚠️ [ProfileScreen] Blob URL detected, cannot upload:', imageUri);
        Alert.alert('Error', 'Invalid image format. Please select a different image.');
        return;
      }

      // Generate a unique filename with user folder structure
      const fileExtension = 'jpg';
      const fileName = `${authUser.id}/avatar_${Date.now()}.${fileExtension}`;
      
      console.log('Upload details:', {
        userId: authUser.id,
        fileName,
        bucketName: 'avatars',
        folderName: authUser.id
      });
      
      // Read file as array buffer (works for both web and React Native)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('File size:', arrayBuffer.byteLength, 'bytes');
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Provide specific error messages for common issues
        if (error.message.includes('row-level security policy')) {
          Alert.alert(
            'Storage Setup Required',
            'The avatar storage bucket needs to be set up. Please:\n\n1. Create an "avatars" bucket in Supabase Storage (make it PUBLIC)\n2. Run the storage policies SQL script\n\nSee AVATAR_SETUP_GUIDE.md for detailed instructions.'
          );
          return;
        }
        
        if (error.message.includes('bucket') && error.message.includes('not found')) {
          Alert.alert(
            'Storage Bucket Missing',
            'Please create an "avatars" bucket in your Supabase Storage dashboard and make it public.'
          );
          return;
        }
        
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Safety check: Ensure the returned URL is not a blob URL
      if (publicUrl.startsWith('blob:')) {
        console.error('❌ [ProfileScreen] Generated URL is still a blob URL - upload may have failed');
        Alert.alert('Error', 'Image upload failed. Please try again.');
        return;
      }

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id);

      if (updateError) {
        // Check if error is due to missing column
        if (updateError.code === '42703' && updateError.message.includes('avatar_url')) {
          Alert.alert(
            'Database Update Needed', 
            'The avatar feature requires a database update. Please contact your administrator to run the avatar migration.'
          );
          return;
        }
        throw updateError;
      }

      // Update local state
      setAvatarImage(publicUrl);
      setUser(prevUser => ({
        ...prevUser,
        avatarUrl: publicUrl
      }));

      Alert.alert('Success', 'Profile picture updated successfully!');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    }
  };

  // Badge-related helper functions
  const loadBadgeData = async () => {
    try {
      setBadgesLoading(true);
      const [ratingsJson, savedCollectedBadges, savedProgramProgress] = await Promise.all([
        AsyncStorage.getItem(EXERCISE_RATINGS_KEY),
        loadCollectedBadges(),
        loadProgramProgress()
      ]);
      
      if (ratingsJson) {
        const ratingsArray = JSON.parse(ratingsJson);
        setExerciseRatings(new Map(ratingsArray));
      }
      
      setCollectedBadges(savedCollectedBadges);
      setProgramProgress(savedProgramProgress);
    } catch (error) {
      console.error('Error loading badge data:', error);
    } finally {
      setBadgesLoading(false);
    }
  };

  const loadCollectedBadges = async () => {
    try {
      const badgesJson = await AsyncStorage.getItem(COLLECTED_BADGES_KEY);
      if (badgesJson) {
        const badgesArray = JSON.parse(badgesJson);
        return new Set(badgesArray);
      }
      return new Set();
    } catch (error) {
      console.error('Error loading collected badges:', error);
      return new Set();
    }
  };

  const loadProgramProgress = async () => {
    try {
      const progressJson = await AsyncStorage.getItem(PROGRAM_PROGRESS_KEY);
      if (progressJson) {
        const progressObject = JSON.parse(progressJson);
        return new Map(Object.entries(progressObject));
      }
      return new Map();
    } catch (error) {
      console.error('Error loading program progress:', error);
      return new Map();
    }
  };

  const getSkillKey = (skillName) => {
    const skillMap = {
      'serve': 'serve',
      'return': 'return', 
      'drive': 'drive',
      'dink': 'dinking',
      'drop': 'thirdShot',
      'volley': 'volleys',
      'reset': 'resets',
      'speed-up': 'speedUps',
      'transition': 'transition',
      'strategy': 'strategy'
    };
    
    const normalizedName = skillName.toLowerCase();
    return skillMap[normalizedName] || normalizedName;
  };

  const calculateBadgeProgress = (badge) => {
    // If badge is collected, it should be unlocked
    if (collectedBadges.has(badge.id)) {
      return { isUnlocked: true, progress: 1.0 };
    }
    
    // Calculate based on actual progress
    if (badge.type === 'program_completion') {
      const programId = badge.program_id;
      const programStatus = programProgress.get(programId);
      
      if (programStatus && programStatus.completed) {
        return { isUnlocked: true, progress: 1.0 };
      }
      
      return { isUnlocked: false, progress: programStatus ? programStatus.progress : 0 };
    }
    
    if (badge.type === 'drill_threshold') {
      const skillKey = getSkillKey(badge.skill);
      
      // Count completed exercises for this skill at this DUPR level
      const completedCount = Array.from(exerciseRatings.keys())
        .filter(key => key.startsWith(`${badge.dupr}-${skillKey}-`)).length;

      // Simple logic: 1+ completed = unlocked
      if (completedCount >= 1) return { isUnlocked: true, progress: 1.0 };
      
      return { isUnlocked: false, progress: 0 };
    }
    
    // For other badge types, return locked
    return { isUnlocked: false, progress: 0 };
  };

  const getAllBadges = () => {
    return badgeMatrix.badge_sets.flatMap(set => 
      set.badges.map(badge => ({
        ...badge,
        dupr: set.dupr,
        progress: calculateBadgeProgress(badge)
      }))
    );
  };

  const getFilteredBadges = () => {
    let badges = getAllBadges();
    
    // Filter by status
    if (badgeFilter === 'unlocked') {
      badges = badges.filter(badge => badge.progress.isUnlocked);
    } else if (badgeFilter === 'collected') {
      badges = badges.filter(badge => collectedBadges.has(badge.id));
    }
    
    // Filter by DUPR level
    if (selectedDuprLevel) {
      badges = badges.filter(badge => badge.dupr === selectedDuprLevel);
    }
    
    return badges;
  };

  const getDuprLevels = () => {
    return [...new Set(badgeMatrix.badge_sets.map(set => set.dupr))].sort();
  };

  const getBadgeStats = () => {
    const allBadges = getAllBadges();
    const unlockedCount = allBadges.filter(badge => badge.progress.isUnlocked).length;
    const collectedCount = allBadges.filter(badge => collectedBadges.has(badge.id)).length;
    
    return {
      total: allBadges.length,
      unlocked: unlockedCount,
      collected: collectedCount
    };
  };

  const handleBadgesPress = () => {
    loadBadgeData();
    setShowBadgesModal(true);
  };

  const getDaysActive = () => {
    const logbookSummary = getLogbookSummary();
    if (!logbookSummary.firstSessionDate) {
      return '-';
    }
    
    const firstSessionDate = new Date(logbookSummary.firstSessionDate);
    const today = new Date();
    const timeDiff = today.getTime() - firstSessionDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  };

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
          size={24} 
          color="#007AFF" 
        />
      </TouchableOpacity>
      <Text style={styles.topBarTitle}>Profile</Text>
      <View style={styles.topBarRightSpace} />
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.profileCard}>
        <View style={styles.profileContent}>
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
              activeOpacity={0.8}
            >
              {(user.avatarUrl || avatarImage) ? (
                <>
                  <Image 
                    source={{ uri: user.avatarUrl || avatarImage }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  {isUploadingAvatar && (
                    <View style={styles.avatarOverlay}>
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.avatarText}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </Text>
                  {isUploadingAvatar && (
                    <View style={styles.avatarOverlay}>
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <TouchableOpacity onPress={handleNameEdit} activeOpacity={0.7}>
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{user.name || 'User'}</Text>
                  <ModernIcon name="edit" size={14} color="#6B7280" style={styles.nameEditIcon} />
                </View>
              </TouchableOpacity>
              <Text style={styles.userEmail}>{authUser?.email || user.email || ''}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.duprSection} onPress={handleDuprEdit}>
            <Text style={styles.duprLabel}>DUPR Rating</Text>
            <View style={styles.duprRatingContainer}>
              <Text style={styles.duprRating}>{user.duprRating?.toFixed(3) || '2.000'}</Text>
              <ModernIcon name="edit" size={16} color="#6B7280" />
            </View>
            <TouchableOpacity style={styles.syncButton} onPress={handleSyncDUPR}>
              <ModernIcon name="sync" size={14} color="#6366F1" />
              <Text style={styles.syncText}>Sync DUPR</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );



  const renderRecentActivity = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <ModernIcon 
                name={activity.type === 'exercise' ? 'training' : activity.type === 'level' ? 'star' : 'coach'} 
                size={16} 
                color="#6B7280" 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            {activity.points && (
              <Text style={styles.activityPoints}>{activity.points}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );


  const renderOverallStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Overall Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.overallStatCard}>
          <Text style={styles.statNumber}>-</Text>
          <Text style={styles.statLabel}>Levels Completed</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.overallStatCard}
          onPress={handleBadgesPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{getBadgeStats().unlocked}</Text>
          <Text style={styles.statLabel}>Badges Earned</Text>
        </TouchableOpacity>
        
        <View style={styles.overallStatCard}>
          <Text style={styles.statNumber}>{getDaysActive()}</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
        
        <View style={styles.overallStatCard}>
          <Text style={styles.statNumber}>-</Text>
          <Text style={styles.statLabel}>Exercises Done</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      {/* Admin Dashboard Button - Only show for admins */}
      {isAdmin && (
        <TouchableOpacity 
          style={[styles.settingsItem, { backgroundColor: '#F0F9FF' }]} 
          onPress={() => navigation?.navigate('Admin')}
        >
          <View style={styles.settingsItemLeft}>
            <ModernIcon name="settings" size={20} color="#3B82F6" />
            <Text style={[styles.settingsItemText, { color: '#3B82F6', fontWeight: '600' }]}>
              Admin Dashboard
            </Text>
          </View>
          <ModernIcon name="action" size={8} color="#3B82F6" />
        </TouchableOpacity>
      )}
      
      {/* Create Coach Profile Button */}
      <TouchableOpacity 
        style={[styles.settingsItem, { backgroundColor: '#F0FDF4' }]} 
        onPress={() => navigation?.navigate('CreateCoachProfile')}
      >
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="coach" size={20} color="#059669" />
          <Text style={[styles.settingsItemText, { color: '#059669', fontWeight: '600' }]}>
            Create Your Coach Profile
          </Text>
        </View>
        <ModernIcon name="action" size={8} color="#059669" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingsItem} onPress={handleSettings}>
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="settings" size={20} color="#6B7280" />
          <Text style={styles.settingsItemText}>App Settings</Text>
        </View>
        <ModernIcon name="action" size={8} color="#9CA3AF" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingsItem} onPress={handleHelpSupport}>
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="help" size={20} color="#6B7280" />
          <Text style={styles.settingsItemText}>Help & Support</Text>
        </View>
        <ModernIcon name="action" size={8} color="#9CA3AF" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.settingsItem, styles.logoutItem, { backgroundColor: '#FEF2F2' }]} 
        onPress={() => {
          console.log('Logout TouchableOpacity pressed!');
          handleLogout();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="logout" size={20} color="#EF4444" />
          <Text style={[styles.settingsItemText, styles.logoutText]}>Logout</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderBadgeCard = (badge) => {
    const icon = getBadgeIcon(badge.id, badge.skill);
    const { isUnlocked, progress } = badge.progress;
    const isCollected = collectedBadges.has(badge.id);
    
    return (
      <View
        key={badge.id}
        style={[
          styles.badgeCard,
          !isUnlocked && styles.badgeCardLocked,
          isUnlocked && !isCollected && styles.badgeCardUnlocked,
          isUnlocked && isCollected && styles.badgeCardCollected,
        ]}
      >
        {/* Badge Ring with Progress */}
        <View style={styles.badgeIconContainer}>
          <View style={[
            styles.badgeRing,
            isUnlocked && { borderColor: '#10B981' }
          ]}>
            <Text style={[
              styles.badgeIcon,
              !isUnlocked && styles.badgeIconLocked
            ]}>
              {icon}
            </Text>
          </View>
          
          {/* Progress Ring */}
          {isUnlocked && !isCollected && (
            <View style={styles.progressRing}>
              <View style={[
                styles.progressFill,
                { transform: [{ rotate: `${progress * 360}deg` }] }
              ]} />
            </View>
          )}
          
        </View>
        
        {/* Badge Info */}
        <Text style={[
          styles.badgeName,
          !isUnlocked && styles.badgeNameLocked
        ]}>
          {badge.name}
        </Text>
        
        <Text style={[
          styles.badgeLabel,
          !isUnlocked && styles.badgeLabelLocked
        ]}>
          DUPR {badge.dupr}
        </Text>
        
        {/* Badge Type Indicator */}
        <View style={styles.badgeTypeContainer}>
          <Text style={[
            styles.badgeType,
            !isUnlocked && styles.badgeTypeLocked
          ]}>
            {badge.type === 'program_completion' ? 'Program' : 
             badge.type === 'drill_threshold' ? 'Skill' : 'Special'}
          </Text>
        </View>
      </View>
    );
  };

  const renderBadgeStats = () => {
    const stats = getBadgeStats();
    
    return (
      <View style={styles.badgeStatsContainer}>
        <View style={styles.badgeStatItem}>
          <Text style={styles.badgeStatNumber}>{stats.collected}</Text>
          <Text style={styles.badgeStatLabel}>Collected</Text>
        </View>
        <View style={styles.badgeStatDivider} />
        <View style={styles.badgeStatItem}>
          <Text style={styles.badgeStatNumber}>{stats.unlocked}</Text>
          <Text style={styles.badgeStatLabel}>Unlocked</Text>
        </View>
        <View style={styles.badgeStatDivider} />
        <View style={styles.badgeStatItem}>
          <Text style={styles.badgeStatNumber}>{stats.total}</Text>
          <Text style={styles.badgeStatLabel}>Total</Text>
        </View>
      </View>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, badgeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setBadgeFilter('all')}
        >
          <Text style={[styles.filterTabText, badgeFilter === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, badgeFilter === 'unlocked' && styles.filterTabActive]}
          onPress={() => setBadgeFilter('unlocked')}
        >
          <Text style={[styles.filterTabText, badgeFilter === 'unlocked' && styles.filterTabTextActive]}>
            Unlocked
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, badgeFilter === 'collected' && styles.filterTabActive]}
          onPress={() => setBadgeFilter('collected')}
        >
          <Text style={[styles.filterTabText, badgeFilter === 'collected' && styles.filterTabTextActive]}>
            Collected
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderDuprFilter = () => (
    <View style={styles.duprFilterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.duprFilterContent}
      >
        <TouchableOpacity
          style={[styles.duprChip, !selectedDuprLevel && styles.duprChipActive]}
          onPress={() => setSelectedDuprLevel(null)}
        >
          <Text style={[styles.duprChipText, !selectedDuprLevel && styles.duprChipTextActive]}>
            All Levels
          </Text>
        </TouchableOpacity>
        
        {getDuprLevels().map(dupr => (
          <TouchableOpacity
            key={dupr}
            style={[styles.duprChip, selectedDuprLevel === dupr && styles.duprChipActive]}
            onPress={() => setSelectedDuprLevel(selectedDuprLevel === dupr ? null : dupr)}
          >
            <Text style={[styles.duprChipText, selectedDuprLevel === dupr && styles.duprChipTextActive]}>
              DUPR {dupr}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderBadgesModal = () => (
    <Modal
      visible={showBadgesModal}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowBadgesModal(false)}
    >
      <View style={styles.badgesModalContainer}>
        {/* Header */}
        <View style={styles.badgesModalHeader}>
          <TouchableOpacity 
            style={styles.badgesModalBackButton}
            onPress={() => setShowBadgesModal(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.badgesModalTitle}>Your Badges</Text>
          <View style={styles.badgesModalRightSpace} />
        </View>

        {/* Stats */}
        {renderBadgeStats()}

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* DUPR Level Filter */}
        {renderDuprFilter()}

        {/* Content */}
        <ScrollView 
          style={styles.badgesModalContent}
          contentContainerStyle={styles.badgesGrid}
          showsVerticalScrollIndicator={false}
        >
          {badgesLoading ? (
            <View style={styles.badgesLoadingContainer}>
              <Text style={styles.badgesLoadingText}>Loading badges...</Text>
            </View>
          ) : (
            getFilteredBadges().map(renderBadgeCard)
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderDuprEditModal = () => (
    <Modal
      visible={showDuprModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDuprModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit DUPR Rating</Text>
          <Text style={styles.modalSubtitle}>Enter your rating in format x.xxx</Text>
          
          <TextInput
            style={styles.duprInput}
            value={duprInput}
            onChangeText={setDuprInput}
            placeholder="3.500"
            keyboardType="numeric"
            maxLength={5}
            autoFocus={true}
            selectTextOnFocus={true}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowDuprModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={saveDuprRating}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderNameEditModal = () => (
    <Modal
      visible={showNameModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowNameModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Name</Text>
          <Text style={styles.modalSubtitle}>Enter your display name</Text>
          
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Your Name"
            maxLength={50}
            autoFocus={true}
            selectTextOnFocus={true}
            autoCapitalize="words"
            autoCorrect={false}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowNameModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={saveName}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handlePrivacyPolicyPress = async () => {
    const url = 'https://prism-8db991.ingress-haven.ewp.live/privacy-policy-piklepro-pickleball-hero/';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Privacy Policy link');
      }
    } catch (error) {
      console.error('Error opening Privacy Policy:', error);
      Alert.alert('Error', 'Failed to open Privacy Policy link');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Starting account deletion for user:', authUser.id);

      // Delete user's programs first (to maintain referential integrity)
      const { error: programsError } = await supabase
        .from('user_programs')
        .delete()
        .eq('user_id', authUser.id);

      if (programsError) {
        console.error('Error deleting user programs:', programsError);
      }

      // Delete user's logbook entries
      const { error: logbookError } = await supabase
        .from('logbook_entries')
        .delete()
        .eq('user_id', authUser.id);

      if (logbookError) {
        console.error('Error deleting logbook entries:', logbookError);
      }

      // Delete user's feedback entries
      const { error: feedbackError } = await supabase
        .from('feedback')
        .delete()
        .eq('user_id', authUser.id);

      if (feedbackError) {
        console.error('Error deleting feedback entries:', feedbackError);
      }

      // Delete user's coach profile if exists
      const { error: coachError } = await supabase
        .from('coaches')
        .delete()
        .eq('user_id', authUser.id);

      if (coachError) {
        console.error('Error deleting coach profile:', coachError);
      }

      // Delete user's coach reviews if exists
      const { error: reviewsError } = await supabase
        .from('coach_reviews')
        .delete()
        .eq('user_id', authUser.id);

      if (reviewsError) {
        console.error('Error deleting coach reviews:', reviewsError);
      }

      // Finally, delete the user record
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', authUser.id);

      if (userError) {
        console.error('Error deleting user record:', userError);
        throw userError;
      }

      // Delete user's avatar from storage if exists
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', authUser.id)
          .single();

        if (userData?.avatar_url) {
          const fileName = userData.avatar_url.split('/').pop();
          const { error: storageError } = await supabase.storage
            .from('avatars')
            .remove([`${authUser.id}/${fileName}`]);

          if (storageError) {
            console.error('Error deleting avatar from storage:', storageError);
          }
        }
      } catch (error) {
        console.error('Error handling avatar deletion:', error);
      }

      // Clear local storage
      await AsyncStorage.multiRemove([
        EXERCISE_RATINGS_KEY,
        COLLECTED_BADGES_KEY,
        PROGRAM_PROGRESS_KEY
      ]);

      console.log('Account deletion completed successfully');

      // Sign out the user
      await signOut();
      
      // Reset onboarding state
      resetAllOnboarding();

      // Close modals
      setShowDeleteAccountModal(false);
      setShowDeleteConfirmationModal(false);

      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        'Failed to delete account. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderDeleteAccountModal = () => (
    <Modal
      visible={showDeleteAccountModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteAccountModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteAccountModalContent}>
          <Text style={styles.modalTitle}>Delete Account</Text>
          <Text style={styles.deleteAccountModalText}>
            To delete your account and its data, go to Program screen and Logbook screen, tap and hold to delete a program or a log. Once the last entry is deleted (all your data are now deleted).
          </Text>
          
          <View style={styles.deleteAccountModalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.deleteAccountButton]} 
              onPress={() => {
                setShowDeleteAccountModal(false);
                setShowDeleteConfirmationModal(true);
              }}
            >
              <Text style={styles.deleteAccountButtonText}>Delete My Account</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowDeleteAccountModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteConfirmationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirmationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
          <Text style={styles.modalSubtitle}>
            This action cannot be undone. All your data including programs, logbook entries, and account information will be permanently deleted.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowDeleteConfirmationModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.deleteAccountButton]} 
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        {renderTopBar()}
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderProfileSection()}
        {renderOverallStats()}
        {renderSettings()}
        
        {/* Delete Account Link */}
        <View style={styles.deleteAccountContainer}>
          <TouchableOpacity 
            onPress={() => setShowDeleteAccountModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteAccountText}>How do I delete my account</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderDuprEditModal()}
      {renderNameEditModal()}
      {renderBadgesModal()}
      {renderDeleteAccountModal()}
      {renderDeleteConfirmationModal()}
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
    zIndex: 1000,
  },
  // Top Bar styles
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -4, // Align with iOS guidelines
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  topBarRightSpace: {
    width: 40, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Profile Section
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  profileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
  },
  uploadingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  nameEditIcon: {
    opacity: 0.6,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  duprSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 120,
  },
  duprLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  duprRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  duprRating: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 4,
  },
  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  // Recent Activity
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  // Overall Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overallStatCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  // Settings
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
  },
  bottomSpacing: {
    height: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteAccountModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  duprInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  nameInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  deleteAccountModalButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteAccountButton: {
    backgroundColor: '#EF4444',
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Badge Modal Styles
  badgesModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  badgesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgesModalBackButton: {
    padding: 8,
    marginLeft: -4,
  },
  badgesModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  badgesModalRightSpace: {
    width: 40,
  },
  
  // Badge Stats
  badgeStatsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  badgeStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  badgeStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  
  // Filter Tabs
  filterTabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: 'white',
  },
  
  // DUPR Filter
  duprFilterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  duprFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  duprChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  duprChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  duprChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  duprChipTextActive: {
    color: 'white',
  },
  
  badgesModalContent: {
    flex: 1,
  },
  badgesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  badgesLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: (width - 48) / 3,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeCardLocked: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  badgeCardUnlocked: {
    borderColor: '#10B981',
    backgroundColor: 'white',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
  },
  badgeCardCollected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    borderWidth: 3,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
  },
  badgeIconContainer: {
    position: 'relative',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  badgeRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    position: 'absolute',
    borderTopColor: '#10B981',
    transform: [{ rotate: '-90deg' }],
  },
  progressFill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#10B981',
    position: 'absolute',
  },
  badgeIcon: {
    fontSize: 24,
    zIndex: 2,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeLabelLocked: {
    color: '#D1D5DB',
  },
  badgeTypeContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeType: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badgeTypeLocked: {
    color: '#D1D5DB',
  },
  // Delete Account styles
  deleteAccountContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  deleteAccountText: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  deleteAccountModalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
});