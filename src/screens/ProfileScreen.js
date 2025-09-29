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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { checkAdminAccess, supabase } from '../lib/supabase';

import { tiers, levels } from '../data/mockData';

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
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDuprModal, setShowDuprModal] = useState(false);
  const [duprInput, setDuprInput] = useState('');
  const [avatarImage, setAvatarImage] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkAdmin();
      loadUserAvatar();
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
  const completedLevels = levels.filter(level => level.completed).length;
  const totalLevels = levels.length;
  

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
    Alert.alert('Settings', 'Settings page will be available in the next update.');
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

  const saveDuprRating = () => {
    if (!validateDuprFormat(duprInput)) {
      Alert.alert('Invalid Format', 'DUPR rating must be in format x.xxx (e.g., 3.500)');
      return;
    }

    const newRating = parseFloat(duprInput);
    if (newRating < 1.000 || newRating > 8.000) {
      Alert.alert('Invalid Range', 'DUPR rating must be between 1.000 and 8.000');
      return;
    }

    setUser(prevUser => ({
      ...prevUser,
      duprRating: newRating
    }));
    setShowDuprModal(false);
    Alert.alert('Success', 'DUPR rating updated successfully!');
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
              <Text style={styles.userName}>{user.name || 'User'}</Text>
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
          <Text style={styles.statNumber}>{completedLevels}</Text>
          <Text style={styles.statLabel}>Levels Completed</Text>
        </View>
        
        <View style={styles.overallStatCard}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Badges Earned</Text>
        </View>
        
        <View style={styles.overallStatCard}>
          <Text style={styles.statNumber}>47</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
        
        <View style={styles.overallStatCard}>
          <Text style={styles.statNumber}>156</Text>
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
      
      <TouchableOpacity style={styles.settingsItem}>
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
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderDuprEditModal()}
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
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
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
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
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
});