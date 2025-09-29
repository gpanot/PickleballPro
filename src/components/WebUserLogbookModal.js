import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLogbookEntriesByUserId } from '../lib/supabase';
import skillsData from '../data/Commun_skills_tags.json';

const WebUserLogbookModal = ({ visible, user, onClose }) => {
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalSessions: 0,
    averageFeeling: 0,
    mostFrequentFocus: 'N/A'
  });

  // Feeling options for display
  const feelingOptions = [
    { value: 1, emoji: '😓', label: 'Struggling', color: '#EF4444' },
    { value: 2, emoji: '😕', label: 'Difficult', color: '#F97316' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#6B7280' },
    { value: 4, emoji: '😊', label: 'Good', color: '#10B981' },
    { value: 5, emoji: '🤩', label: 'Excellent', color: '#8B5CF6' },
  ];

  // Session type options
  const sessionTypeOptions = [
    { value: 'singles', emoji: '🏓', label: 'Singles', color: '#3B82F6' },
    { value: 'doubles', emoji: '👥', label: 'Doubles', color: '#10B981' },
    { value: 'drilling', emoji: '🎯', label: 'Drilling', color: '#F59E0B' },
    { value: 'match', emoji: '🏆', label: 'Match', color: '#EF4444' },
    { value: 'training', emoji: '💪', label: 'Training', color: '#8B5CF6' },
    { value: 'social', emoji: '🎉', label: 'Social', color: '#EC4899' },
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
    })),
    ...skillsData.skillCategories.strategic.skills.map(skill => ({
      value: skill.id,
      emoji: skill.emoji,
      label: skill.name,
      color: skill.color
    })),
    ...skillsData.skillCategories.physical.skills.map(skill => ({
      value: skill.id,
      emoji: skill.emoji,
      label: skill.name,
      color: skill.color
    }))
  ];

  const getFeelingData = (feeling) => {
    return feelingOptions.find(option => option.value === feeling) || feelingOptions[2];
  };

  const getSessionTypeData = (sessionType) => {
    return sessionTypeOptions.find(option => option.value === sessionType) || sessionTypeOptions[0];
  };

  const getTrainingFocusData = (value) => {
    return trainingFocusOptions.find(option => option.value === value) || 
      { value, emoji: '🏓', label: value, color: '#6B7280' };
  };

  const fetchUserLogbook = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await getLogbookEntriesByUserId(user.id);

      if (error) throw error;

      // Transform data to match expected format
      const transformedEntries = (data || []).map(entry => {
        // Parse JSON strings back to arrays for training_focus
        let trainingFocus = entry.training_focus;
        if (typeof trainingFocus === 'string') {
          try {
            trainingFocus = JSON.parse(trainingFocus);
          } catch (e) {
            console.warn('Failed to parse training_focus JSON:', trainingFocus);
            trainingFocus = [trainingFocus]; // Fallback to single item array
          }
        }
        
        // Parse JSON strings back to arrays for difficulty
        let difficulty = entry.difficulty;
        if (typeof difficulty === 'string') {
          try {
            difficulty = JSON.parse(difficulty);
          } catch (e) {
            console.warn('Failed to parse difficulty JSON:', difficulty);
            difficulty = [difficulty]; // Fallback to single item array
          }
        }
        
        return {
          id: entry.id,
          date: entry.date,
          hours: entry.hours,
          sessionType: entry.session_type,
          trainingFocus: trainingFocus,
          difficulty: difficulty,
          feeling: entry.feeling,
          notes: entry.notes,
          location: entry.location,
          createdAt: entry.created_at
        };
      });

      // Sort entries by date (newest first)
      const sortedEntries = transformedEntries.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      setLogbookEntries(sortedEntries);
      
      // Calculate stats
      if (transformedEntries.length > 0) {
        const totalHours = transformedEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const totalSessions = transformedEntries.length;
        const averageFeeling = transformedEntries.reduce((sum, entry) => sum + (entry.feeling || 0), 0) / totalSessions;
        
        // Calculate most frequent training focus
        const focusCount = {};
        transformedEntries.forEach(entry => {
          if (entry.trainingFocus) {
            const focuses = Array.isArray(entry.trainingFocus) ? entry.trainingFocus : [entry.trainingFocus];
            focuses.forEach(focus => {
              focusCount[focus] = (focusCount[focus] || 0) + 1;
            });
          }
        });
        
        const mostFrequentFocus = Object.keys(focusCount).length > 0 
          ? Object.entries(focusCount).sort(([,a], [,b]) => b - a)[0][0]
          : 'N/A';

        // Calculate weak skills (most frequent in difficulty)
        const weaknessCounts = {};
        transformedEntries.forEach(entry => {
          if (entry.difficulty) {
            const entryDifficulties = Array.isArray(entry.difficulty) 
              ? entry.difficulty 
              : [entry.difficulty].filter(Boolean);
            
            entryDifficulties.forEach(skill => {
              if (skill) {
                weaknessCounts[skill] = (weaknessCounts[skill] || 0) + 1;
              }
            });
          }
        });

        // Get top 3 strong skills
        const topStrongSkills = Object.entries(focusCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([skill, count]) => ({ skill, count }));

        // Get top 3 weak skills
        const topWeakSkills = Object.entries(weaknessCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([skill, count]) => ({ skill, count }));

        // Calculate time periods
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Filter entries for time periods
        const thisWeekEntries = transformedEntries.filter(entry => 
          new Date(entry.date) >= weekStart
        );
        const thisMonthEntries = transformedEntries.filter(entry => 
          new Date(entry.date) >= monthStart
        );

        const thisWeekHours = thisWeekEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const thisMonthHours = thisMonthEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

        // Get first session date
        const sortedByDate = [...transformedEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstSessionDate = sortedByDate.length > 0 ? sortedByDate[0].date : new Date().toISOString().split('T')[0];

        setStats({
          totalHours: Math.round(totalHours * 10) / 10,
          totalSessions,
          averageFeeling: Math.round(averageFeeling * 10) / 10,
          mostFrequentFocus,
          topStrongSkills,
          topWeakSkills,
          thisWeekHours: Math.round(thisWeekHours * 10) / 10,
          thisWeekSessions: thisWeekEntries.length,
          thisMonthHours: Math.round(thisMonthHours * 10) / 10,
          thisMonthSessions: thisMonthEntries.length,
          firstSessionDate
        });
      }
    } catch (error) {
      console.error('Error fetching user logbook:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && user) {
      fetchUserLogbook();
    }
  }, [visible, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSimpleDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTrainingSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Training Summary</Text>
      
      {/* Total Hours Card */}
      <View style={styles.totalHoursCard}>
        <Text style={styles.totalHoursValue}>{stats.totalHours}h</Text>
        <Text style={styles.totalHoursLabel}>Total Hours</Text>
        <Text style={styles.totalHoursSubtext}>
          {stats.totalSessions} sessions since {formatSimpleDate(stats.firstSessionDate)}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatNumber}>{stats.thisWeekHours}h</Text>
          <Text style={styles.quickStatLabel}>This Week</Text>
          <Text style={styles.quickStatSubtext}>{stats.thisWeekSessions} sessions</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatNumber}>{stats.thisMonthHours}h</Text>
          <Text style={styles.quickStatLabel}>This Month</Text>
          <Text style={styles.quickStatSubtext}>{stats.thisMonthSessions} sessions</Text>
        </View>
        <View style={styles.quickStatCard}>
          <View style={styles.feelingStatContainer}>
            {stats.averageFeeling > 0 && (
              <Text style={styles.feelingEmoji}>
                {getFeelingData(Math.round(stats.averageFeeling)).emoji}
              </Text>
            )}
            <Text style={styles.quickStatNumber}>{stats.averageFeeling}</Text>
          </View>
          <Text style={styles.quickStatLabel}>Avg. Feeling</Text>
        </View>
      </View>

      {/* Skills Overview */}
      <View style={styles.skillsContainer}>
        {/* Strong Skills */}
        {stats.topStrongSkills && stats.topStrongSkills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsSectionTitle}>💪 Strong Skills</Text>
            <View style={styles.skillsList}>
              {stats.topStrongSkills.map((item, index) => {
                const skillData = getTrainingFocusData(item.skill);
                return (
                  <View key={index} style={styles.skillItem}>
                    <View style={styles.skillNameContainer}>
                      <Text style={styles.skillEmoji}>{skillData.emoji}</Text>
                      <Text style={[styles.skillName, { color: skillData.color }]}>
                        {skillData.label}
                      </Text>
                    </View>
                    <Text style={styles.skillCount}>{item.count}x</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Areas to Improve */}
        {stats.topWeakSkills && stats.topWeakSkills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsSectionTitle}>🎯 Areas to Improve</Text>
            <View style={styles.skillsList}>
              {stats.topWeakSkills.map((item, index) => {
                const skillData = getTrainingFocusData(item.skill);
                return (
                  <View key={index} style={styles.skillItem}>
                    <View style={styles.skillNameContainer}>
                      <Text style={styles.skillEmoji}>{skillData.emoji}</Text>
                      <Text style={[styles.skillName, { color: skillData.color }]}>
                        {skillData.label}
                      </Text>
                    </View>
                    <Text style={styles.skillCount}>{item.count}x</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderLogbookEntry = (entry) => {
    const feelingData = getFeelingData(entry.feeling);
    const sessionTypeData = getSessionTypeData(entry.sessionType);
    
    // Handle both single and multiple training focus
    const entryFocuses = Array.isArray(entry.trainingFocus) 
      ? entry.trainingFocus 
      : [entry.trainingFocus].filter(Boolean);

    return (
      <View key={entry.id} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryDateContainer}>
            <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
            <Text style={styles.entryHours}>{entry.hours} hour{entry.hours !== 1 ? 's' : ''}</Text>
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

        {entryFocuses.length > 0 && (
          <View style={styles.entryFocusContainer}>
            <Text style={styles.entryFocusTitle}>What went good:</Text>
            <View style={styles.entryFocusTags}>
              {entryFocuses.map((focus, index) => {
                const focusData = getTrainingFocusData(focus);
                return (
                  <View key={index} style={[styles.focusTag, { borderColor: focusData.color }]}>
                    <Text style={styles.focusTagEmoji}>{focusData.emoji}</Text>
                    <Text style={[styles.focusTagText, { color: focusData.color }]}>
                      {focusData.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Difficulty section */}
        {entry.difficulty && entry.difficulty.length > 0 && (
          <View style={styles.entryDifficultyContainer}>
            <Text style={styles.entryDifficultyTitle}>What was difficult:</Text>
            <View style={styles.entryDifficultyTags}>
              {(Array.isArray(entry.difficulty) ? entry.difficulty : [entry.difficulty]).map((difficulty, index) => {
                const difficultyData = getTrainingFocusData(difficulty);
                return (
                  <View key={index} style={[styles.difficultyTag, { borderColor: difficultyData.color }]}>
                    <Text style={styles.difficultyTagEmoji}>{difficultyData.emoji}</Text>
                    <Text style={[styles.difficultyTagText, { color: difficultyData.color }]}>
                      {difficultyData.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {entry.location && (
          <View style={styles.entryLocationContainer}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.entryLocation}>{entry.location}</Text>
          </View>
        )}

        {entry.notes && (
          <View style={styles.entryNotesContainer}>
            <Text style={styles.entryNotesTitle}>Notes:</Text>
            <Text style={styles.entryNotes}>{entry.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {user?.name || user?.email || 'User'}'s Logbook
            </Text>
            <Text style={styles.headerSubtitle}>
              Training session history
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={fetchUserLogbook}
              disabled={loading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={loading ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading logbook...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Training Summary */}
            {logbookEntries.length > 0 && renderTrainingSummary()}

            {/* Logbook Entries */}
            <View style={styles.entriesSection}>
              <Text style={styles.sectionTitle}>
                Training Sessions ({logbookEntries.length})
              </Text>
              
              {logbookEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No sessions logged</Text>
                  <Text style={styles.emptyStateText}>
                    This user hasn't logged any training sessions yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.entriesList}>
                  {logbookEntries.map(renderLogbookEntry)}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  feelingStatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feelingEmoji: {
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    }),
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  totalHoursCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalHoursValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  totalHoursLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  totalHoursSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  quickStatSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  skillsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  skillsSection: {
    flex: 1,
  },
  skillsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  skillsList: {
    gap: 6,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  skillNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  skillEmoji: {
    fontSize: 14,
  },
  skillName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  skillCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entriesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  entriesList: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 12,
    fontWeight: '600',
  },
  entryFeeling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryFeelingEmoji: {
    fontSize: 18,
  },
  entryFeelingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryFocusContainer: {
    marginBottom: 12,
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
    alignItems: 'center',
  },
  focusTag: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  focusTagEmoji: {
    fontSize: 12,
  },
  focusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryDifficultyContainer: {
    marginBottom: 12,
  },
  entryDifficultyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 6,
  },
  entryDifficultyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  difficultyTag: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyTagEmoji: {
    fontSize: 12,
  },
  difficultyTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  entryLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  entryNotesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  entryNotesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  entryNotes: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});

export default WebUserLogbookModal;
