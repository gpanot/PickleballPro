import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { checkAdminAccess } from '../lib/supabase';

import { tiers, levels } from '../data/mockData';

// Combined data for the merged profile/home screen

const recentActivity = [
  { id: 1, type: 'exercise', title: 'Dink Wall Drill', status: 'completed', time: '2 hours ago', points: '+15 XP' },
  { id: 2, type: 'level', title: 'Level 2: Drives', status: 'unlocked', time: '1 day ago', points: '+50 XP' },
  { id: 3, type: 'coach', title: 'Session with Sarah M.', status: 'scheduled', time: 'Tomorrow 2PM', points: '' },
  { id: 4, type: 'exercise', title: 'Cross-Court Dinks', status: 'completed', time: '3 days ago', points: '+12 XP' },
];


export default function ProfileScreen({ onLogout, navigation }) {
  const { user, resetAllOnboarding } = useUser();
  const { user: authUser, isAuthenticated, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkAdmin();
    }
  }, [isAuthenticated, authUser]);

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
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{authUser?.email || user.email || ''}</Text>
            </View>
          </View>
          
          <View style={styles.duprSection}>
            <Text style={styles.duprLabel}>DUPR Rating</Text>
            <Text style={styles.duprRating}>{user.duprRating?.toFixed(3) || '2.000'}</Text>
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
  duprRating: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
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
});