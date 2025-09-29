import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLogbook } from '../context/LogbookContext';
import skillsData from '../data/Commun_skills_tags.json';

export default function LogbookScreen({ navigation }) {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { logbookEntries, isLoading, deleteLogbookEntry, getLogbookSummary } = useLogbook();
  const insets = useSafeAreaInsets();

  // State for collapsible summary
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

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
    { value: 'single', emoji: '👤', label: 'Single', color: '#3B82F6' },
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
      <Text style={styles.headerTitle}>Your Logbook</Text>
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
        <Text style={styles.summaryTitle}>Training Summary</Text>
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
            <Text style={styles.totalHoursValue}>{summary.totalHours}h</Text>
            <Text style={styles.totalHoursLabel}>Total Hours</Text>
            <Text style={styles.totalHoursSubtext}>
              {summary.totalSessions} sessions since {formatDate(summary.firstSessionDate)}
            </Text>
          </View>

          {/* Skills Overview */}
          <View style={styles.skillsContainer}>
            {/* Strong Skills - Left Column */}
            {summary.topStrongSkills && summary.topStrongSkills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsSectionTitle}>💪 Your Strong Skills</Text>
                <View style={styles.skillsList}>
                  {summary.topStrongSkills.map((item, index) => {
                    const skillData = getTrainingFocusData(item.skill);
                    return (
                      <View key={index} style={styles.skillItem}>
                        <Text style={[styles.skillName, { color: skillData.color }]}>
                          {skillData.label}
                        </Text>
                        <Text style={styles.skillCount}>{item.count}x</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Weak Skills - Right Column */}
            {summary.topWeakSkills && summary.topWeakSkills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsSectionTitle}>🎯 Areas to Improve</Text>
                <View style={styles.skillsList}>
                  {summary.topWeakSkills.map((item, index) => {
                    const skillData = getTrainingFocusData(item.skill);
                    return (
                      <View key={index} style={styles.skillItem}>
                        <Text style={[styles.skillName, { color: skillData.color }]}>
                          {skillData.label}
                        </Text>
                        <Text style={styles.skillCount}>{item.count}x</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Last 5 Sessions Average Mood */}
          {summary.last5AverageFeeling > 0 && (
            <View style={styles.last5FeelingCard}>
              <View style={styles.last5FeelingHeader}>
                <Text style={styles.last5FeelingTitle}>🎯 Last 5 Sessions Mood</Text>
                <View style={styles.feelingDisplay}>
                  <Text style={styles.feelingEmoji}>
                    {getFeelingData(Math.round(summary.last5AverageFeeling)).emoji}
                  </Text>
                  <Text style={styles.feelingLabel}>
                    {getFeelingData(Math.round(summary.last5AverageFeeling)).label}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Weekly Feeling Progress */}
          {summary.weeklyAverageFeeling > 0 && (
            <View style={styles.weeklyFeelingCard}>
              <View style={styles.weeklyFeelingHeader}>
                <Text style={styles.weeklyFeelingTitle}>📈 Weekly Progress Feeling</Text>
                <View style={styles.feelingDisplay}>
                  <Text style={styles.feelingEmoji}>
                    {getFeelingData(Math.round(summary.weeklyAverageFeeling)).emoji}
                  </Text>
                  <Text style={styles.feelingLabel}>
                    {getFeelingData(Math.round(summary.weeklyAverageFeeling)).label}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Coach Recommendation */}
          {logbookEntries.length >= 3 && (() => {
            const coachScore = getCoachRecommendationScore();
            return (
              <TouchableOpacity 
                style={styles.coachRecommendationCard}
                onPress={() => navigation.navigate('Coach')}
                activeOpacity={0.7}
              >
                <Text style={styles.coachRecommendationTitle}>🏓 Do you need a coach?</Text>
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
      <Text style={styles.entriesTitle}>Recent Sessions</Text>
      
      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      ) : logbookEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <WebIcon name="document-text" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No sessions logged yet</Text>
          <Text style={styles.emptyStateText}>
            Tap the + button below to log your first training session!
          </Text>
        </View>
      ) : (
        <View style={styles.entriesList}>
          {logbookEntries.slice(0, 10).map((entry) => {
            const feelingData = getFeelingData(entry.feeling);
            
            // Handle both old single focus and new multiple focus formats
            const entryFocuses = Array.isArray(entry.trainingFocus) 
              ? entry.trainingFocus 
              : [entry.trainingFocus || 'dinks'];
            
            const sessionTypeData = getSessionTypeData(entry.sessionType);
            
            return (
              <TouchableWithoutFeedback
                key={entry.id}
                onPress={() => navigation.navigate('EditTrainingSession', { entry })}
                onLongPress={() => handleDeleteEntry(entry)}
                delayLongPress={800}
              >
                <View style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryDateContainer}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      <Text style={styles.entryHours}>{entry.hours}h</Text>
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
                  </View>
                  
                  {/* What went good display */}
                  <View style={styles.entryFocusContainer}>
                    <Text style={styles.entryFocusTitle}>What went good:</Text>
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
                      <Text style={styles.entryDifficultyTitle}>What was difficult:</Text>
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
                  
                  {/* Visual hint for interactions */}
                  <View style={styles.entryHint}>
                    <Text style={styles.entryHintText}>Tap to edit • Hold to delete</Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
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
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
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
    flex: 1,
  },
  avatarButton: {
    padding: 4,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
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
    color: 'white',
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
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Summary styles
  summaryContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Total Hours Card
  totalHoursCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  totalHoursValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 2,
  },
  totalHoursLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 2,
  },
  totalHoursSubtext: {
    fontSize: 11,
    color: '#0891B2',
    textAlign: 'center',
  },
  // Skills Sections
  skillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  skillsSection: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skillsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
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
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  // Last 5 sessions feeling card
  last5FeelingCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 8,
  },
  last5FeelingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  last5FeelingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  weeklyFeelingCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 8,
  },
  weeklyFeelingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyFeelingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
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
    color: '#0369A1',
  },
  // Coach recommendation styles
  coachRecommendationCard: {
    backgroundColor: '#FEF7FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  coachRecommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
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
    color: '#6B7280',
    width: 50,
    textAlign: 'center',
  },
  coachProgressLabelBold: {
    fontWeight: '900',
    color: '#1F2937',
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
    backgroundColor: '#E5E7EB',
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
    color: '#9333EA',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Entries styles
  entriesContainer: {
    margin: 16,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingState: {
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
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  entryHours: {
    fontSize: 14,
    color: '#10B981',
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
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '600',
  },
  entryFocusContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  entryFocusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  entryFocusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryFocusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  entryFocusTagEmoji: {
    fontSize: 12,
  },
  entryFocusTagLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Difficulty styles (reuse focus styles with different naming)
  entryDifficultyContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  entryDifficultyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  entryDifficultyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryDifficultyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  entryDifficultyTagEmoji: {
    fontSize: 12,
  },
  entryDifficultyTagLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  entryHint: {
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  entryHintText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100, // Extra space to account for FAB
  },
});
