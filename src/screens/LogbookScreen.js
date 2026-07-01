import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SwipeableRow from '../components/SwipeableRow';
import EmptyState from '../components/EmptyState';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLogbook } from '../context/LogbookContext';
import { usePreload } from '../context/PreloadContext';
import skillsData from '../data/Commun_skills_tags.json';

const ENTRIES_PAGE_SIZE = 10;

export default function LogbookScreen({ navigation }) {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { logbookEntries, isLoading, deleteLogbookEntry, getLogbookSummary, refreshLogbook } = useLogbook();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLogbook();
    } finally {
      setRefreshing(false);
    }
  }, [refreshLogbook]);
  const insets = useSafeAreaInsets();

  // State for collapsible summary
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ENTRIES_PAGE_SIZE);

  // Feeling options
  const feelingOptions = [
    { value: 1, emoji: '😓', label: 'Struggling', color: '#EF4444' },
    { value: 2, emoji: '😕', label: 'Difficult', color: '#F97316' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#6B7280' },
    { value: 4, emoji: '😊', label: 'Good', color: '#10B981' },
    { value: 5, emoji: '🤩', label: 'Excellent', color: '#8B5CF6' },
  ];

  // Training focus options - extracted from common skills data
  const trainingFocusOptions = [
    ...skillsData.skillCategories.technical.skills.map(skill => ({
      value: skill.id,
      emoji: skill.emoji,
      label: skill.name,
      color: skill.color
    })),
    ...skillsData.skillCategories.movement.skills.map(skill => ({
      value: skill.id,
      emoji: skill.emoji,
      label: skill.name,
      color: skill.color
    }))
  ];

  // Session type options
  const sessionTypeOptions = [
    { value: 'training', emoji: '🏋️', label: 'Training', color: '#EF4444' },
    { value: 'social', emoji: '🎉', label: 'Social', color: '#8B5CF6' },
    { value: 'class', emoji: '🎓', label: 'Class', color: '#F59E0B' },
    { value: 'single', emoji: '👤', label: 'Single', color: '#6366F1' },
    { value: 'double', emoji: '👥', label: 'Double', color: '#10B981' },
  ];


  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this training session from ${formatDate(entry.date)}?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteLogbookEntry(entry.id);
            Alert.alert('Deleted', 'Training session has been deleted.');
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getFeelingData = (value) => {
    return feelingOptions.find(option => option.value === value) || feelingOptions[2];
  };

  const getTrainingFocusData = (value) => {
    return trainingFocusOptions.find(option => option.value === value) || trainingFocusOptions[0];
  };

  const getSessionTypeData = (value) => {
    return sessionTypeOptions.find(option => option.value === value) || sessionTypeOptions[0];
  };

  // Calculate coach recommendation score (0-100)
  const getCoachRecommendationScore = () => {
    if (logbookEntries.length === 0) return 50; // Default middle position

    // Criteria for needing a coach:
    // 1. Low average mood (last 5 sessions) - 40% weight
    // 2. High frequency of difficulty areas - 30% weight  
    // 3. Stagnant progress (same weak skills appearing repeatedly) - 20% weight
    // 4. Low session frequency - 10% weight

    let score = 0;

    // 1. Mood factor (40 points max)
    const moodScore = summary.last5AverageFeeling || 0;
    const moodFactor = Math.max(0, (3 - moodScore) / 2 * 40); // Lower mood = higher score
    score += moodFactor;

    // 2. Difficulty frequency (30 points max)
    const recentEntries = logbookEntries.slice(0, 10); // Last 10 sessions
    const entriesWithDifficulty = recentEntries.filter(entry => entry.difficulty && entry.difficulty.length > 0);
    const difficultyRate = entriesWithDifficulty.length / Math.max(recentEntries.length, 1);
    const difficultyFactor = difficultyRate * 30;
    score += difficultyFactor;

    // 3. Stagnant progress (20 points max)
    const weakSkillsCount = summary.topWeakSkills.length;
    const stagnationFactor = Math.min(weakSkillsCount / 3, 1) * 20;
    score += stagnationFactor;

    // 4. Session frequency (10 points max)
    const weeklyFrequency = summary.weekSessions;
    const frequencyFactor = weeklyFrequency < 2 ? 10 : Math.max(0, (3 - weeklyFrequency) / 3 * 10);
    score += frequencyFactor;

    return Math.min(Math.max(Math.round(score), 0), 100);
  };


  const summary = getLogbookSummary();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.headerTitle}>Logbook</Text>
        <Text style={styles.headerSubtitle}>Train with intention, reflect with clarity.</Text>
      </View>
      <TouchableOpacity 
        style={styles.avatarButton}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image 
              source={{ uri: user.avatarUrl }} 
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <TouchableOpacity 
        style={styles.summaryHeader}
        onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.summaryTitle}>Progress Snapshot</Text>
        <Ionicons 
          name={isSummaryExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {isSummaryExpanded && (
        <>
          {/* Total Hours Card */}
          <View style={styles.totalHoursCard}>
            <Text style={styles.totalHoursValue}>{`${summary.totalHours}h`}</Text>
              <Text style={styles.totalHoursLabel}>Hours Trained</Text>
            <Text style={styles.totalHoursSubtext}>{`${summary.totalSessions} sessions since ${formatDate(summary.firstSessionDate)}`}</Text>
          </View>

          {/* Session Type Hours */}
          {summary.sessionTypeHours && Object.keys(summary.sessionTypeHours).length > 0 && (
            <View style={styles.sessionTypeHoursCard}>
              <Text style={styles.sessionTypeHoursTitle}>Session Mix</Text>
              <View style={styles.sessionTypeHoursList}>
                {Object.entries(summary.sessionTypeHours)
                  .sort(([,a], [,b]) => b - a) // Sort by hours descending
                  .map(([type, hours]) => {
                    const typeData = getSessionTypeData(type);
                    return (
                      <View key={type} style={styles.sessionTypeHoursItem}>
                        <Text style={styles.sessionTypeHoursEmoji}>{typeData.emoji}</Text>
                        <Text style={[styles.sessionTypeHoursLabel, { color: typeData.color }]}>
                          {typeData.label}
                        </Text>
                        <Text style={styles.sessionTypeHoursValue}>{`${hours}h`}</Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          )}

          {/* Skills Overview */}
          <View style={styles.skillsContainer}>
            {/* Strong Skills - Left Column */}
            {summary.topStrongSkills && summary.topStrongSkills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsSectionTitle}>Strong Right Now</Text>
                <View style={styles.skillsList}>
                  {summary.topStrongSkills.map((item, index) => {
                    const skillData = getTrainingFocusData(item.skill);
                    return (
                      <View key={index} style={styles.skillItem}>
                        <Text style={[styles.skillName, { color: skillData.color }]}>
                          {skillData.label}
                        </Text>
                        <Text style={styles.skillCount}>{`${item.count}x`}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Weak Skills - Right Column */}
            {summary.topWeakSkills && summary.topWeakSkills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsSectionTitle}>Focus Next</Text>
                <View style={styles.skillsList}>
                  {summary.topWeakSkills.map((item, index) => {
                    const skillData = getTrainingFocusData(item.skill);
                    return (
                      <View key={index} style={styles.skillItem}>
                        <Text style={[styles.skillName, { color: skillData.color }]}>
                          {skillData.label}
                        </Text>
                        <Text style={styles.skillCount}>{`${item.count}x`}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Mood Trend — merged card */}
          {(summary.last5AverageFeeling > 0 || summary.weeklyAverageFeeling > 0) && (
            <View style={styles.moodTrendCard}>
              <Text style={styles.moodTrendTitle}>Energy Trend</Text>
              <View style={styles.moodTrendRow}>
                {summary.last5AverageFeeling > 0 && (
                  <View style={styles.moodTrendItem}>
                    <Text style={styles.moodTrendLabel}>Last 5 sessions</Text>
                    <View style={styles.feelingDisplay}>
                      <Text style={styles.feelingEmoji}>
                        {getFeelingData(Math.round(summary.last5AverageFeeling)).emoji}
                      </Text>
                      <Text style={[styles.feelingLabel, { color: getFeelingData(Math.round(summary.last5AverageFeeling)).color }]}>
                        {getFeelingData(Math.round(summary.last5AverageFeeling)).label}
                      </Text>
                    </View>
                  </View>
                )}
                {summary.last5AverageFeeling > 0 && summary.weeklyAverageFeeling > 0 && (
                  <View style={styles.moodTrendDivider} />
                )}
                {summary.weeklyAverageFeeling > 0 && (
                  <View style={styles.moodTrendItem}>
                    <Text style={styles.moodTrendLabel}>This week</Text>
                    <View style={styles.feelingDisplay}>
                      <Text style={styles.feelingEmoji}>
                        {getFeelingData(Math.round(summary.weeklyAverageFeeling)).emoji}
                      </Text>
                      <Text style={[styles.feelingLabel, { color: getFeelingData(Math.round(summary.weeklyAverageFeeling)).color }]}>
                        {getFeelingData(Math.round(summary.weeklyAverageFeeling)).label}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Coach Recommendation */}
          {logbookEntries.length >= 1 && (() => {
            const coachScore = getCoachRecommendationScore();
            return (
              <TouchableOpacity
                style={styles.coachRecommendationCard}
                onPress={() => navigation.navigate('Coach')}
                activeOpacity={0.7}
              >
                <Text style={styles.coachRecommendationTitle}>Thinking about coaching?</Text>
                <View style={styles.coachProgressContainer}>
                  <Text style={[
                    styles.coachProgressLabel,
                    coachScore <= 50 ? styles.coachProgressLabelBold : null
                  ]}>NO</Text>
                  <View style={styles.coachProgressBar}>
                    <View style={styles.coachProgressTrack} />
                    <View
                      style={[
                        styles.coachProgressBall,
                        { left: `${coachScore}%` }
                      ]}
                    >
                      <Image
                        source={require('../../assets/images/icon_ball.png')}
                        style={styles.ballImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <Text style={[
                    styles.coachProgressLabel,
                    coachScore > 50 ? styles.coachProgressLabelBold : null
                  ]}>YES</Text>
                </View>
                <Text style={styles.coachRecommendationSubtext}>
                  Based on your recent mood and training patterns
                </Text>
              </TouchableOpacity>
            );
          })()}

        </>
      )}
    </View>
  );


  const renderLogbookEntries = () => (
    <View style={styles.entriesContainer}>
      <Text style={styles.entriesTitle}>Recent Entries</Text>
      
      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      ) : logbookEntries.length === 0 ? (
        <EmptyState
          emoji="📔"
          title="No sessions logged yet"
          subtitle="Tap the + button to log your first training session and start tracking your progress."
          ctaLabel="Log a Session"
          onCta={() => navigation.navigate('AddTrainingSession')}
        />
      ) : (
        <View style={styles.entriesList}>
          {logbookEntries.slice(0, visibleCount).map((entry) => {
            const feelingData = getFeelingData(entry.feeling);
            
            // Handle both old single focus and new multiple focus formats
            const entryFocuses = Array.isArray(entry.trainingFocus) 
              ? entry.trainingFocus 
              : [entry.trainingFocus || 'dinks'];
            
            const sessionTypeData = getSessionTypeData(entry.sessionType);
            
            return (
              <SwipeableRow
                key={entry.id}
                onDelete={() => handleDeleteEntry(entry)}
              >
              <TouchableWithoutFeedback
                onPress={() => navigation.navigate('EditTrainingSession', { entry })}
              >
                <View style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryDateContainer}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      <Text style={styles.entryHours}>{`${entry.hours}h`}</Text>
                    </View>
                    <View style={styles.entryMetadata}>
                      <View style={styles.entrySessionType}>
                        <Text style={styles.entrySessionTypeEmoji}>{sessionTypeData.emoji}</Text>
                        <Text style={[styles.entrySessionTypeLabel, { color: sessionTypeData.color }]}>
                          {sessionTypeData.label}
                        </Text>
                      </View>
                      <View style={styles.entryFeeling}>
                        <Text style={styles.entryFeelingEmoji}>{feelingData.emoji}</Text>
                        <Text style={[styles.entryFeelingLabel, { color: feelingData.color }]}>
                          {feelingData.label}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.entryEditIcon}
                      onPress={() => navigation.navigate('EditTrainingSession', { entry })}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* What went good display */}
                  <View style={styles.entryFocusContainer}>
                    <Text style={styles.entryFocusTitle}>Went well</Text>
                    <View style={styles.entryFocusTags}>
                      {entryFocuses.map((focus, index) => {
                        const focusData = getTrainingFocusData(focus);
                        return (
                          <View key={index} style={[styles.entryFocusTag, { borderColor: focusData.color }]}>
                            <Text style={styles.entryFocusTagEmoji}>{focusData.emoji}</Text>
                            <Text style={[styles.entryFocusTagLabel, { color: focusData.color }]}>
                              {focusData.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  
                  {/* What went wrong display */}
                  {entry.difficulty && (
                    <View style={styles.entryDifficultyContainer}>
                      <Text style={styles.entryDifficultyTitle}>Needs attention</Text>
                      <View style={styles.entryDifficultyTags}>
                        {(Array.isArray(entry.difficulty) ? entry.difficulty : [entry.difficulty]).map((difficulty, index) => {
                          const difficultyData = getTrainingFocusData(difficulty);
                          return (
                            <View key={index} style={[styles.entryDifficultyTag, { borderColor: difficultyData.color }]}>
                              <Text style={styles.entryDifficultyTagEmoji}>{difficultyData.emoji}</Text>
                              <Text style={[styles.entryDifficultyTagLabel, { color: difficultyData.color }]}>
                                {difficultyData.label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  
                  {entry.notes && (
                    <Text style={styles.entryNotes}>{entry.notes}</Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
              </SwipeableRow>
            );
          })}

          {/* Load More */}
          {logbookEntries.length > visibleCount && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setVisibleCount(v => v + ENTRIES_PAGE_SIZE)}
              activeOpacity={0.7}
            >
              <Text style={styles.loadMoreText}>
                Load more ({logbookEntries.length - visibleCount} remaining)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        {renderHeader()}
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={['#6366F1']} />
        }
      >
        {renderSummary()}
        {renderLogbookEntries()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTrainingSession')}
        activeOpacity={0.8}
      >
        <WebIcon 
          name="add" 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAFF',
  },
  headerSafeArea: {
    backgroundColor: '#FCFAFF',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FCFAFF',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2E2343',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7A6E90',
    marginTop: 2,
  },
  avatarButton: {
    padding: 4,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1EAFE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B4785',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B6FD6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Summary styles
  summaryContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE8FA',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2E2343',
  },
  // Total Hours Card
  totalHoursCard: {
    backgroundColor: '#F8F3FF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE2FF',
  },
  totalHoursValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5B4785',
    marginBottom: 2,
  },
  totalHoursLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B558F',
    marginBottom: 2,
  },
  totalHoursSubtext: {
    fontSize: 11,
    color: '#8B7AAE',
    textAlign: 'center',
  },
  // Session Type Hours Card
  sessionTypeHoursCard: {
    backgroundColor: '#FBF9FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE8FA',
  },
  sessionTypeHoursTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#695985',
    marginBottom: 8,
    textAlign: 'center',
  },
  sessionTypeHoursList: {
    gap: 4,
  },
  sessionTypeHoursItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  sessionTypeHoursEmoji: {
    fontSize: 14,
  },
  sessionTypeHoursLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  sessionTypeHoursValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#695985',
    backgroundColor: '#F4EFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Skills Sections
  skillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  skillsSection: {
    flex: 1,
    backgroundColor: '#FCFAFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFE9FB',
  },
  skillsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4C3B6C',
    marginBottom: 8,
  },
  skillsList: {
    gap: 4,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  skillName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  skillCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#75658F',
    backgroundColor: '#F3EEFD',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  // Merged mood trend card
  moodTrendCard: {
    backgroundColor: '#F8F3FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE2FF',
    marginBottom: 12,
  },
  moodTrendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B4785',
    marginBottom: 10,
  },
  moodTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodTrendItem: {
    flex: 1,
    alignItems: 'center',
  },
  moodTrendLabel: {
    fontSize: 10,
    color: '#7A6E90',
    marginBottom: 4,
  },
  moodTrendDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#DACCF6',
    marginHorizontal: 8,
  },
  feelingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feelingEmoji: {
    fontSize: 16,
  },
  feelingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6A568D',
  },
  // Coach recommendation styles
  coachRecommendationCard: {
    backgroundColor: '#FCF7FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEDFFC',
  },
  coachRecommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A4BA8',
    marginBottom: 12,
    textAlign: 'center',
  },
  coachProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  coachProgressLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A6E90',
    width: 50,
    textAlign: 'center',
  },
  coachProgressLabelBold: {
    fontWeight: '900',
    color: '#2E2343',
    fontSize: 12,
  },
  coachProgressBar: {
    flex: 1,
    height: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  coachProgressTrack: {
    height: 4,
    backgroundColor: '#E0D7F4',
    borderRadius: 2,
  },
  coachProgressBall: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -15, // Center the ball on the position (increased from -10 to -15)
  },
  ballImage: {
    width: 27,
    height: 27,
  },
  coachRecommendationSubtext: {
    fontSize: 10,
    color: '#8261B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Entries styles
  entriesContainer: {
    margin: 16,
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2E2343',
    marginBottom: 12,
  },
  loadingState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE8FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#7A6E90',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE8FA',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E2343',
    marginBottom: 2,
  },
  entryHours: {
    fontSize: 14,
    color: '#7D59C0',
    fontWeight: '600',
  },
  entryMetadata: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  entrySessionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entrySessionTypeEmoji: {
    fontSize: 16,
  },
  entrySessionTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryFeeling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryFeelingEmoji: {
    fontSize: 20,
  },
  entryFeelingLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryFocusContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  entryFocusTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A6E90',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  entryFocusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryFocusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4FF',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  entryFocusTagEmoji: {
    fontSize: 12,
  },
  entryFocusTagLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Difficulty styles (reuse focus styles with different naming)
  entryDifficultyContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  entryDifficultyTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5A78',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  entryDifficultyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryDifficultyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F8',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  entryDifficultyTagEmoji: {
    fontSize: 12,
  },
  entryDifficultyTagLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  entryNotes: {
    fontSize: 13,
    color: '#65597A',
    lineHeight: 19,
    marginTop: 4,
  },
  entryEditIcon: {
    padding: 4,
    marginLeft: 4,
  },
  loadMoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5DCF7',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4FAE',
  },
  bottomSpacing: {
    height: 100, // Extra space to account for FAB
  },
});
