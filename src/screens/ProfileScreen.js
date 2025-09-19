import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';

import { tiers, levels } from '../data/mockData';

// Combined data for the merged profile/home screen
const quickActions = [
  { id: 1, title: 'Continue Training', icon: 'training', color: '#3B82F6', description: 'Resume your progress' },
  { id: 2, title: 'Find Coach', icon: 'coach', color: '#10B981', description: 'Book a session' },
  { id: 3, title: 'View Progress', icon: 'progress', color: '#8B5CF6', description: 'Track your stats' },
  { id: 4, title: 'Challenges', icon: 'challenge', color: '#F59E0B', description: 'Extra practice' },
];

const recentActivity = [
  { id: 1, type: 'exercise', title: 'Dink Wall Drill', status: 'completed', time: '2 hours ago', points: '+15 XP' },
  { id: 2, type: 'level', title: 'Level 2: Drives', status: 'unlocked', time: '1 day ago', points: '+50 XP' },
  { id: 3, type: 'coach', title: 'Session with Sarah M.', status: 'scheduled', time: 'Tomorrow 2PM', points: '' },
  { id: 4, type: 'exercise', title: 'Cross-Court Dinks', status: 'completed', time: '3 days ago', points: '+12 XP' },
];


export default function ProfileScreen({ onLogout }) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const completedLevels = levels.filter(level => level.completed).length;
  const totalLevels = levels.length;
  const unlockedBadges = user.badges.filter(badge => badge.unlocked);
  

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
    console.log('onLogout prop:', onLogout);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            console.log('Logout confirmed, calling onLogout...');
            if (onLogout) {
              onLogout();
            } else {
              console.log('onLogout is not available!');
            }
          }
        }
      ]
    );
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <WebLinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.profileGradient}
      >
        <View style={styles.profileContent}>
          <View style={styles.profileTop}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || 'User'}</Text>
              </View>
            </View>
            
            <View style={styles.duprCard}>
              <Text style={styles.duprRating}>{user.duprRating?.toFixed(3) || '2.000'}</Text>
              <TouchableOpacity style={styles.syncButton} onPress={handleSyncDUPR}>
                <ModernIcon name="sync" size={14} color="white" />
                <Text style={styles.syncText}>DUPR sync</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </WebLinearGradient>
    </View>
  );


  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.id} style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
              <ModernIcon name={action.icon} size={24} color="white" focused={true} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>
          </TouchableOpacity>
        ))}
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

  const renderAchievements = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      
      <View style={styles.badgesGrid}>
        {user.badges.slice(0, 6).map((badge) => (
          <View 
            key={badge.id} 
            style={[
              styles.badgeCard,
              !badge.unlocked && styles.badgeCardLocked
            ]}
          >
            <Text style={[
              styles.badgeEmoji,
              !badge.unlocked && styles.badgeEmojiLocked
            ]}>
              {badge.emoji}
            </Text>
            <Text style={[
              styles.badgeName,
              !badge.unlocked && styles.badgeNameLocked
            ]}>
              {badge.name}
            </Text>
            {!badge.unlocked && (
              <View style={styles.lockedOverlay}>
                <ModernIcon name="settings" size={16} color="#9CA3AF" />
              </View>
            )}
          </View>
        ))}
      </View>
      
      <View style={styles.badgesSummary}>
        <Text style={styles.badgesSummaryText}>
          {unlockedBadges.length} of {user.badges.length} achievements unlocked
        </Text>
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
          <Text style={styles.statNumber}>{unlockedBadges.length}</Text>
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
        {renderProfileHeader()}
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderQuickActions()}
        {renderRecentActivity()}
        {renderAchievements()}
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
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Profile Header
  profileHeader: {
    marginBottom: 0,
  },
  profileGradient: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  profileContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  duprCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  duprRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
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
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
  // Achievements
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badgeCard: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeEmojiLocked: {
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  badgesSummary: {
    alignItems: 'center',
  },
  badgesSummaryText: {
    fontSize: 12,
    color: '#6B7280',
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