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
import { checkAdminAccess, supabase, getStudentCode } from '../lib/supabase';

import { tiers, levels } from '../data/mockData';

const { width } = Dimensions.get('window');

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
  
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [studentCode, setStudentCode] = useState(null);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkAdmin();
      loadUserAvatar();
      loadStudentCode(); // Load student code
    }
  }, [isAuthenticated, authUser]);

  const loadUserAvatar = async () => {
    try {
      if (!authUser?.id) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url, city')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // Check if error is due to missing column
        if (error.code === '42703' && (error.message.includes('avatar_url') || error.message.includes('city'))) {
          console.log('Avatar or city column not yet added to database. Please run the migration.');
          return;
        }
        console.error('Error loading avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarImage(data.avatar_url);
      }
      
      // Update user context with avatar and city
      setUser(prevUser => ({
        ...prevUser,
        avatarUrl: data.avatar_url || prevUser.avatarUrl,
        city: data.city || prevUser.city,
      }));
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

  const loadStudentCode = async () => {
    try {
      if (!authUser?.id) return;
      
      const { data, error } = await getStudentCode(authUser.id);
      if (error) {
        console.error('Error loading student code:', error);
        return;
      }
      
      if (data?.student_code) {
        setStudentCode(data.student_code);
      }
    } catch (error) {
      console.error('Error loading student code:', error);
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
          {/* Avatar */}
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
          
          {/* Name */}
          <TouchableOpacity onPress={handleNameEdit} activeOpacity={0.7} style={styles.nameContainer}>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
          </TouchableOpacity>
          
          {/* Email */}
          <Text style={styles.userEmail} numberOfLines={2} ellipsizeMode="tail">
            {authUser?.email || user.email || ''}
          </Text>
          
          {/* City */}
          {user.city && (
            <View style={styles.cityContainer}>
              <ModernIcon name="location" size={14} color="#6366F1" />
              <Text style={styles.cityText}>{user.city}</Text>
            </View>
          )}
          
          {/* Student Code */}
          {studentCode && (
            <View style={styles.studentCodeContainer}>
              <Text style={styles.studentCodeLabel}>Student Code:</Text>
              <Text style={styles.studentCodeValue}>{studentCode}</Text>
            </View>
          )}
          
          {/* DUPR Rating Section */}
          <View style={styles.duprSection}>
            <Text style={styles.duprLabel}>DUPR RATING</Text>
            <TouchableOpacity onPress={handleDuprEdit} activeOpacity={0.7}>
              <Text style={styles.duprRating}>{user.duprRating?.toFixed(3) || '2.000'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.syncButton} onPress={handleSyncDUPR}>
              <ModernIcon name="sync" size={14} color="#6366F1" />
              <Text style={styles.syncText}>Sync DUPR</Text>
            </TouchableOpacity>
          </View>
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
              style={[styles.modalButton, styles.modalButtonHalf, styles.cancelButton]} 
              onPress={() => setShowDuprModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonHalf, styles.saveButton]} 
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
              style={[styles.modalButton, styles.modalButtonHalf, styles.cancelButton]} 
              onPress={() => setShowNameModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonHalf, styles.saveButton]} 
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

      // Clear local storage (removed badge-related keys)

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
        <ScrollView 
          contentContainerStyle={styles.deleteAccountModalScrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.deleteAccountModalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.deleteAccountModalText}>
              Your data, logbook and programs will be deleted. Your account will be deleted permanently. You won't be able to restore your account and your data.
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
        </ScrollView>
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
          
          <View style={styles.deleteAccountModalButtons}>
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  profileContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    borderRadius: 48,
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
  nameContainer: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
    marginLeft: 6,
  },
  studentCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  studentCodeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0369A1',
    marginRight: 8,
  },
  studentCodeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  duprSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    maxWidth: 300,
  },
  duprLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 12,
  },
  duprRating: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginRight: 12,
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
  deleteAccountModalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  deleteAccountModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
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
    marginTop: 16,
  },
  modalButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalButtonHalf: {
    flex: 1,
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