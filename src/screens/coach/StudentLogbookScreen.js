import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WebIcon from '../../components/WebIcon';
import { getLogbookEntriesByUserId } from '../../lib/supabase';

const PRIMARY_COLOR = '#27AE60';

export default function StudentLogbookScreen({ route, navigation }) {
  const { studentId, student } = route.params || {};
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  useEffect(() => {
    if (isFocused && studentId) {
      loadLogbookEntries();
    }
  }, [isFocused, studentId]);

  const loadLogbookEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getLogbookEntriesByUserId(studentId);
      
      if (error) {
        console.error('Error loading student logbook:', error);
        setLogbookEntries([]);
        return;
      }

      // Transform Supabase data to match local format
      const transformedEntries = (data || []).map(entry => {
        let trainingFocus = entry.training_focus;
        if (typeof trainingFocus === 'string') {
          try {
            trainingFocus = JSON.parse(trainingFocus);
          } catch (e) {
            trainingFocus = [trainingFocus];
          }
        }
        
        let difficulty = entry.difficulty;
        if (typeof difficulty === 'string') {
          try {
            difficulty = JSON.parse(difficulty);
          } catch (e) {
            difficulty = difficulty ? [difficulty] : [];
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
          createdAt: entry.created_at,
          exerciseDetails: entry.exercise_details || null,
        };
      });

      setLogbookEntries(transformedEntries);
    } catch (error) {
      console.error('Error loading student logbook:', error);
      setLogbookEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getLogbookSummary = () => {
    // Filter only entries with exercise details (coach-logged exercises)
    const exerciseEntries = logbookEntries.filter(entry => 
      entry.exerciseDetails && entry.exerciseDetails.exerciseName
    );

    if (exerciseEntries.length === 0) {
      return {
        totalExercises: 0,
        totalSessions: 0,
        firstLogDate: null,
        lastExercises: [],
        targetAccomplishment: null,
      };
    }

    const firstLogDate = exerciseEntries[exerciseEntries.length - 1]?.date;

    // Count unique days as sessions
    const uniqueDates = new Set(exerciseEntries.map(entry => entry.date));
    const totalSessions = uniqueDates.size;

    // Last 4 exercises
    const lastExercises = exerciseEntries.slice(0, 4).map(entry => ({
      date: entry.date,
      programName: entry.exerciseDetails.programName,
      routineName: entry.exerciseDetails.routineName,
      exerciseName: entry.exerciseDetails.exerciseName,
      target: entry.exerciseDetails.target,
      result: entry.exerciseDetails.result,
    }));

    // Calculate target accomplishment stats
    const exercisesWithNumericResults = exerciseEntries.filter(entry => {
      const target = parseInt(entry.exerciseDetails.target);
      const result = parseInt(entry.exerciseDetails.result);
      return !isNaN(target) && !isNaN(result) && target > 0;
    });

    let targetAccomplishment = null;
    if (exercisesWithNumericResults.length > 0) {
      let totalMetOrExceeded = 0;
      let totalSum = 0;
      
      exercisesWithNumericResults.forEach(entry => {
        const target = parseInt(entry.exerciseDetails.target);
        const result = parseInt(entry.exerciseDetails.result);
        
        if (result >= target) {
          totalMetOrExceeded++;
        }
        
        // Calculate percentage of target achieved
        totalSum += (result / target) * 100;
      });

      const successRate = Math.round((totalMetOrExceeded / exercisesWithNumericResults.length) * 100);
      const averageAchievement = Math.round(totalSum / exercisesWithNumericResults.length);

      targetAccomplishment = {
        successRate, // % of exercises that met or exceeded target
        averageAchievement, // Average % of target achieved
        totalExercises: exercisesWithNumericResults.length,
      };
    }

    return {
      totalExercises: exerciseEntries.length,
      totalSessions,
      firstLogDate,
      lastExercises,
      targetAccomplishment,
    };
  };

  const summary = getLogbookSummary();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>{student?.name || 'Student'}'s Logbook</Text>
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <TouchableOpacity 
        style={styles.summaryHeader}
        onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.summaryTitle}>Exercise Log Summary</Text>
        <Ionicons 
          name={isSummaryExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {isSummaryExpanded && (
        <>
          {/* Total Stats Card */}
          <View style={styles.totalStatsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.totalExercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            {summary.firstLogDate && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statDateLabel}>Since</Text>
                  <Text style={styles.statDate}>{formatDate(summary.firstLogDate)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Last 4 Exercises */}
          {summary.lastExercises && summary.lastExercises.length > 0 && (() => {
            const firstExercise = summary.lastExercises[0];
            let lastDate = null;
            let lastProgram = null;
            let lastRoutine = null;
            
            return (
              <View style={styles.lastExercisesCard}>
                <View style={styles.lastExercisesHeader}>
                  <Text style={styles.lastExercisesTitle}>Last Session Activity</Text>
                  <Text style={styles.lastExercisesDate}>{formatDate(firstExercise.date)}</Text>
                </View>
                <View style={styles.lastExercisesList}>
                  {summary.lastExercises.map((exercise, index) => {
                    const showDate = exercise.date !== lastDate && index > 0;
                    const showProgram = exercise.programName !== lastProgram || showDate;
                    const showRoutine = exercise.routineName !== lastRoutine || showDate;
                    
                    lastDate = exercise.date;
                    lastProgram = exercise.programName;
                    lastRoutine = exercise.routineName;
                    
                    return (
                      <View key={index}>
                        {showDate && (
                          <Text style={styles.exerciseDateDivider}>{formatDate(exercise.date)}</Text>
                        )}
                        <View style={styles.lastExerciseItem}>
                          {(showProgram || showRoutine) && (
                            <Text style={styles.lastExerciseMeta}>
                              {showProgram && exercise.programName}
                              {showProgram && showRoutine && ' / '}
                              {showRoutine && exercise.routineName}
                            </Text>
                          )}
                          <View style={styles.lastExerciseRow}>
                            <Text style={styles.lastExerciseName} numberOfLines={1}>{exercise.exerciseName}</Text>
                            <Text style={styles.lastExerciseResultText}>
                              {String(exercise.result).replace(/\s*attempts?/i, '')}/{String(exercise.target).replace(/\s*attempts?/i, '')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {/* Target Accomplishment Stats */}
          {summary.targetAccomplishment && (
            <View style={styles.accomplishmentCard}>
              <Text style={styles.accomplishmentTitle}>Target Accomplishment</Text>
              <View style={styles.accomplishmentStats}>
                <View style={styles.accomplishmentStatItem}>
                  <Text style={styles.accomplishmentStatValue}>
                    {summary.targetAccomplishment.successRate}%
                  </Text>
                  <Text style={styles.accomplishmentStatLabel}>Success Rate</Text>
                  <Text style={styles.accomplishmentStatSubtext}>Met or exceeded target</Text>
                </View>
                <View style={styles.accomplishmentDivider} />
                <View style={styles.accomplishmentStatItem}>
                  <Text style={styles.accomplishmentStatValue}>
                    {summary.targetAccomplishment.averageAchievement}%
                  </Text>
                  <Text style={styles.accomplishmentStatLabel}>Average Achievement</Text>
                  <Text style={styles.accomplishmentStatSubtext}>Of target completed</Text>
                </View>
              </View>
              <Text style={styles.accomplishmentFooter}>
                Based on {summary.targetAccomplishment.totalExercises} exercises
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderLogbookEntries = () => (
    <View style={styles.entriesContainer}>
      <Text style={styles.entriesTitle}>Exercise Log History</Text>
      
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : logbookEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <WebIcon name="document-text" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No exercises logged yet</Text>
          <Text style={styles.emptyStateText}>
            Exercise logs will appear here when you complete routines with this student.
          </Text>
        </View>
      ) : (
        <View style={styles.entriesList}>
          {logbookEntries.slice(0, 30).map((entry) => {
            // Check if this entry has exercise details (coach-logged exercise)
            const hasExerciseDetails = entry.exerciseDetails && entry.exerciseDetails.exerciseName;
            
            if (!hasExerciseDetails) {
              // Skip entries without exercise details (old personal logs)
              return null;
            }
            
            const exerciseDetails = entry.exerciseDetails;
            
            return (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateContainer}>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  </View>
                </View>
                
                {/* Exercise hierarchy: Program > Routine > Exercise */}
                <View style={styles.exerciseHierarchy}>
                  {exerciseDetails.programName && (
                    <Text style={styles.programName}>{exerciseDetails.programName}</Text>
                  )}
                  {exerciseDetails.routineName && (
                    <Text style={styles.routineName}>
                      {exerciseDetails.programName && ' > '}
                      {exerciseDetails.routineName}
                    </Text>
                  )}
                </View>
                
                {/* Exercise name */}
                <Text style={styles.exerciseName}>{exerciseDetails.exerciseName}</Text>
                
                  {/* Result display */}
                  <View style={styles.resultContainer}>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Target:</Text>
                      <Text style={styles.resultValue}>
                        {exerciseDetails.target ? String(exerciseDetails.target).replace(/\s*attempts?/i, '') : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Result:</Text>
                      <Text style={[styles.resultValue, styles.resultValueHighlight]}>
                        {exerciseDetails.result ? String(exerciseDetails.result).replace(/\s*attempts?/i, '') : 'N/A'}
                      </Text>
                    </View>
                  </View>
                
                {/* Notes */}
                {entry.notes && !entry.notes.startsWith(exerciseDetails.exerciseName + ':') && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}
              </View>
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
      >
        {renderSummary()}
        {renderLogbookEntries()}
        
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
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
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
  // Total Stats Card
  totalStatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  statDateLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  statDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  // Last Exercises Card
  lastExercisesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastExercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastExercisesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  lastExercisesDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  exerciseDateDivider: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  lastExercisesList: {
    gap: 4,
  },
  lastExerciseItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 8,
  },
  lastExerciseMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  lastExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lastExerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  lastExerciseResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  // Accomplishment Card
  accomplishmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accomplishmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  accomplishmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  accomplishmentStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  accomplishmentStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  accomplishmentStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  accomplishmentStatSubtext: {
    fontSize: 10,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  accomplishmentDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  accomplishmentFooter: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
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
    marginTop: 12,
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
    marginBottom: 12,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Exercise hierarchy
  exerciseHierarchy: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  programName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  routineName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  // Result display
  resultContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  entryNotes: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomSpacing: {
    height: 50,
  },
});

