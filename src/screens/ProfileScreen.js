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
  Clipboard,
} from 'react-native';
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
import { useTheme } from '../context/ThemeContext';
import { checkAdminAccess, checkCoachAccess, supabase, getStudentCode } from '../lib/supabase';
import { getSport } from '../lib/sportConfig';
import StartAcademyModal from '../components/StartAcademyModal';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import { PRIVACY_POLICY_URL } from '../lib/legalUrls';

import { tiers, levels } from '../data/mockData';

const { width } = Dimensions.get('window');



export default function ProfileScreen({ onLogout, navigation }) {
  const { user, resetAllOnboarding, setUser } = useUser();
  const { user: authUser, isAuthenticated, signOut } = useAuth();
  const { getLogbookSummary } = useLogbook();
  const { logbookTheme: t, isDark } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [showStartAcademyModal, setShowStartAcademyModal] = useState(false);
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
      if (!adminStatus) {
        // Check manager status (must come before coach check — broader tier)
        const { data: managerRow } = await supabase
          .from('academy_members')
          .select('academy_id')
          .eq('user_id', authUser.id)
          .eq('role', 'manager')
          .maybeSingle();
        if (managerRow) {
          setIsManager(true);
          // Manager may also be a coach — fetch both
          const { isCoach: coachStatus } = await checkCoachAccess(authUser.id);
          setIsCoach(coachStatus);
        } else {
          const { isCoach: coachStatus } = await checkCoachAccess(authUser.id);
          setIsCoach(coachStatus);
        }
      }
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
    const rs = getSport(user?.sportId).ratingSystem;
    if (user.ratingType === 'dupr') {
      Alert.alert(
        `Sync ${rs.label} Rating`,
        `This will update your rating from your official ${rs.label} account.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sync Now', onPress: () => Alert.alert('Success', `${rs.label} rating synced successfully!`) }
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
    const rs = getSport(user?.sportId).ratingSystem;
    setDuprInput((user.duprRating || rs.min).toFixed(3));
    setShowDuprModal(true);
  };

  const validateDuprFormat = (value) => {
    // Accept decimal numbers: up to 1 integer digit and up to 3 decimal places
    const pattern = /^\d(\.\d{1,3})?$/;
    return pattern.test(value);
  };

  const saveDuprRating = async () => {
    const rs = getSport(user?.sportId).ratingSystem;
    if (!validateDuprFormat(duprInput)) {
      Alert.alert('Invalid Format', `${rs.label} rating must be a number (e.g., ${rs.placeholder})`);
      return;
    }

    const newRating = parseFloat(duprInput);
    if (newRating < rs.min || newRating > rs.max) {
      Alert.alert('Invalid Range', rs.inputHint);
      return;
    }

    try {
      // Update in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ dupr_rating: newRating })
        .eq('id', authUser.id);

      if (updateError) {
        console.error(`Error updating ${rs.label} rating in database:`, updateError);
        Alert.alert('Error', `Failed to update ${rs.label} rating. Please try again.`);
        return;
      }

      // Update local state only after successful database update
      setUser(prevUser => ({
        ...prevUser,
        duprRating: newRating
      }));
      
      setShowDuprModal(false);
      Alert.alert('Success', `${rs.label} rating updated successfully!`);
    } catch (error) {
      console.error(`Error saving ${rs.label} rating:`, error);
      Alert.alert('Error', `Failed to update ${rs.label} rating. Please try again.`);
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
    pickAvatarImage();
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

  const renderProfileSection = () => (
    <View style={[styles.section, { paddingHorizontal: t.headerPaddingH }]}>
      <View style={[styles.profileCard, { backgroundColor: t.surface, borderColor: t.border, borderWidth: isDark ? 1 : 0 }]}>
        <View style={styles.profileRow}>
          <TouchableOpacity 
            style={[styles.avatarContainer, { backgroundColor: t.accentPurple, shadowColor: t.accentPurple }]}
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            activeOpacity={0.8}
          >
            {(user.avatarUrl || avatarImage) ? (
              <>
                <Image source={{ uri: user.avatarUrl || avatarImage }} style={styles.avatarImage} resizeMode="cover" />
                {isUploadingAvatar && (
                  <View style={styles.avatarOverlay}>
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={[styles.avatarText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodyBold }]}>
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

          <View style={styles.profileInfo}>
            <TouchableOpacity onPress={handleNameEdit} activeOpacity={0.7} style={styles.nameContainer}>
              <Text style={[styles.userName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]} numberOfLines={1}>{user.name || 'User'}</Text>
              <Ionicons name="pencil-outline" size={13} color={t.textMuted} style={styles.editIcon} />
            </TouchableOpacity>
            <Text style={[styles.userEmail, { color: t.textMuted, fontFamily: t.fontBody }]} numberOfLines={1} ellipsizeMode="tail">
              {authUser?.email || user.email || ''}
            </Text>
            <View style={styles.profileMeta}>
              {user.city && (
                <View style={styles.cityChip}>
                  <ModernIcon name="location" size={12} color={t.accentPurple} />
                  <Text style={[styles.cityText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>{user.city}</Text>
                </View>
              )}
              {studentCode && (
                <TouchableOpacity
                  style={[styles.studentCodeContainer, { backgroundColor: isDark ? t.surfaceRaised : '#EEF2FF', borderColor: isDark ? t.border : '#C7D2FE' }]}
                  onPress={() => {
                    Clipboard.setString(studentCode);
                    Alert.alert('Copied!', 'Your student code has been copied to clipboard.');
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="card-outline" size={12} color={t.accentPurple} style={{ marginRight: 3 }} />
                  <Text style={[styles.studentCodeLabel, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>Code: </Text>
                  <Text style={[styles.studentCodeValue, { color: isDark ? t.accentPurple : '#4F46E5' }]}>{studentCode}</Text>
                  <Ionicons name="copy-outline" size={11} color={t.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.duprSection, { backgroundColor: isDark ? t.surfaceRaised : '#F8FAFC', borderColor: isDark ? t.border : '#E2E8F0' }]}>
          <Text style={[styles.duprLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>{getSport(user?.sportId).ratingSystem.label.toUpperCase()} RATING</Text>
          <TouchableOpacity onPress={handleDuprEdit} activeOpacity={0.7} style={styles.duprEditRow}>
            <Text style={[styles.duprRating, { color: t.textPrimary, fontFamily: t.fontDisplay }]}>{user.duprRating?.toFixed(3) || '2.000'}</Text>
            <Ionicons name="pencil-outline" size={13} color={t.textMuted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );



  const renderOverallStats = () => {
    const logbookSummary = getLogbookSummary();
    const totalSessions = logbookSummary.totalSessions || 0;
    const totalHours = logbookSummary.totalHours || 0;
    const daysActive = getDaysActive();

    if (totalSessions === 0) return null;

    return (
      <View style={[styles.section, { paddingHorizontal: t.headerPaddingH }]}>
        <Text style={[styles.sectionTitle, {
          color: isDark ? t.sectionLabelColor : t.textPrimary,
          fontFamily: isDark ? t.fontBodySemibold : t.fontBodyBold,
          fontSize: isDark ? t.sectionLabelSize + 2 : 18,
          letterSpacing: isDark ? t.sectionLabelTracking : 0,
          textTransform: isDark ? 'uppercase' : 'none',
        }]}>Your Stats</Text>
        <View style={[styles.statsRow, { backgroundColor: t.surface, borderColor: t.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>{totalSessions}</Text>
            <Text style={[styles.statLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Sessions</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? t.border : '#E5E7EB' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>{totalHours}h</Text>
            <Text style={[styles.statLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Total Hours</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? t.border : '#E5E7EB' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>{daysActive}</Text>
            <Text style={[styles.statLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Days Active</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSettings = () => (
    <View style={[styles.section, { paddingHorizontal: t.headerPaddingH }]}>
      <Text style={[styles.sectionTitle, {
        color: isDark ? t.sectionLabelColor : t.textPrimary,
        fontFamily: isDark ? t.fontBodySemibold : t.fontBodyBold,
        fontSize: isDark ? t.sectionLabelSize + 2 : 18,
        letterSpacing: isDark ? t.sectionLabelTracking : 0,
        textTransform: isDark ? 'uppercase' : 'none',
      }]}>Settings</Text>
      
      {(isAdmin || isManager || isCoach) && (
        <TouchableOpacity
          style={[styles.settingsItem, { backgroundColor: isDark ? t.accentPurpleMuted : '#EEF2FF', borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
          onPress={() => navigation?.navigate('Admin')}
        >
          <View style={styles.settingsItemLeft}>
            <ModernIcon name="settings" size={20} color={t.accentPurple} />
            <Text style={[styles.settingsItemText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
              {isAdmin ? 'Admin Dashboard' : isManager ? 'Academy Dashboard' : 'Coach Dashboard'}
            </Text>
          </View>
          <ModernIcon name="action" size={8} color={t.accentPurple} />
        </TouchableOpacity>
      )}

      {!isAdmin && isCoach && !isManager && (
        <TouchableOpacity
          style={[styles.settingsItem, { backgroundColor: isDark ? '#16A34A18' : '#F0FDF4', borderColor: isDark ? '#16A34A44' : 'transparent', borderWidth: isDark ? 1 : 0 }]}
          onPress={() => setShowStartAcademyModal(true)}
        >
          <View style={styles.settingsItemLeft}>
            <Ionicons name="school-outline" size={20} color="#16A34A" />
            <Text style={[styles.settingsItemText, { color: '#16A34A', fontFamily: t.fontBodySemibold }]}>Start Your Academy</Text>
          </View>
          <ModernIcon name="action" size={8} color="#16A34A" />
        </TouchableOpacity>
      )}

      {!isAdmin && (
        <TouchableOpacity 
          style={[styles.settingsItem, { backgroundColor: isDark ? t.accentPurpleMuted : '#EEF2FF', borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]} 
          onPress={() => navigation?.navigate('CreateCoachProfile')}
        >
          <View style={styles.settingsItemLeft}>
            <ModernIcon name="coach" size={20} color={t.accentPurple} />
            <Text style={[styles.settingsItemText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
              {isCoach ? 'Edit Coach Profile' : 'Become a Coach'}
            </Text>
          </View>
          <ModernIcon name="action" size={8} color={t.accentPurple} />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={[styles.settingsItem, { backgroundColor: t.surface, borderColor: t.border, borderWidth: isDark ? 1 : 0 }]} onPress={handleSettings}>
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="settings" size={20} color={t.textMuted} />
          <Text style={[styles.settingsItemText, { color: t.textSecondary, fontFamily: t.fontBody }]}>App Settings</Text>
        </View>
        <ModernIcon name="action" size={8} color={t.textMuted} />
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.settingsItem, { backgroundColor: t.surface, borderColor: t.border, borderWidth: isDark ? 1 : 0 }]} onPress={handleHelpSupport}>
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="help" size={20} color={t.textMuted} />
          <Text style={[styles.settingsItemText, { color: t.textSecondary, fontFamily: t.fontBody }]}>Help & Support</Text>
        </View>
        <ModernIcon name="action" size={8} color={t.textMuted} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.settingsItem, styles.logoutItem, { backgroundColor: isDark ? '#EF444418' : '#FEF2F2', borderColor: isDark ? '#EF444444' : 'transparent', borderWidth: isDark ? 1 : 0 }]} 
        onPress={() => { handleLogout(); }}
        activeOpacity={0.7}
      >
        <View style={styles.settingsItemLeft}>
          <ModernIcon name="logout" size={20} color="#EF4444" />
          <Text style={[styles.settingsItemText, { color: '#EF4444', fontFamily: t.fontBodySemibold }]}>Logout</Text>
        </View>
      </TouchableOpacity>
    </View>
  );


  const renderDuprEditModal = () => {
    const rs = getSport(user?.sportId).ratingSystem;
    return (
      <Modal
        visible={showDuprModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDuprModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {rs.label} Rating</Text>
            <Text style={styles.modalSubtitle}>{rs.inputHint}</Text>
            
            <TextInput
              style={styles.duprInput}
              value={duprInput}
              onChangeText={setDuprInput}
              placeholder={rs.placeholder}
              keyboardType="numeric"
              maxLength={6}
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
  };

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
    const url = PRIVACY_POLICY_URL;
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
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell tokens={t} isDark={isDark} background="bg" bordered title="Profile" onBack={() => navigation.goBack()} />
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
      {renderNameEditModal()}
      {renderDeleteAccountModal()}
      {renderDeleteConfirmationModal()}

      {/* Start Academy bootstrap modal (GAP-01 / GAP-10) */}
      <StartAcademyModal
        visible={showStartAcademyModal}
        onClose={() => setShowStartAcademyModal(false)}
        onSuccess={() => {
          setShowStartAcademyModal(false);
          // Re-run role check so the button immediately switches to "Academy Dashboard"
          checkAdmin();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    ...(Platform.OS === 'web' && {
      height: '100%',
      overflow: 'hidden',
      minHeight: 0,
    }),
  },
  headerSafeArea: {
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
      minHeight: 0,
    }),
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Profile Section
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  editIcon: {
    marginLeft: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 0,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    marginLeft: 3,
  },
  studentCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  studentCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    marginRight: 1,
  },
  studentCodeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  duprSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  duprLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 12,
  },
  duprEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  duprRating: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
  },
  sectionTitle: {
    marginBottom: 12,
  },
  // Recent Activity
  activityList: {
    backgroundColor: 'white',
    borderRadius: 16,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  // Settings
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
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