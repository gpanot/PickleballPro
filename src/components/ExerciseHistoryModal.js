import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from './WebIcon';
import { useLogbook } from '../context/LogbookContext';
import { getLogbookEntriesByUserId } from '../lib/supabase';

export default function ExerciseHistoryModal({
  visible,
  onClose,
  exercise,
  studentId, // Optional: for coach viewing student history
}) {
  const insets = useSafeAreaInsets();
  const { logbookEntries } = useLogbook();
  
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && exercise) {
      loadExerciseHistory();
    }
  }, [visible, exercise, logbookEntries]);

  const loadExerciseHistory = async () => {
    if (!exercise) {
      console.log('⚠️ [ExerciseHistoryModal] No exercise provided');
      setExerciseHistory([]);
      return;
    }

    console.log('🔍 [ExerciseHistoryModal] Loading history for exercise:', exercise);
    console.log('🔍 [ExerciseHistoryModal] Exercise name:', exercise.name);
    console.log('🔍 [ExerciseHistoryModal] StudentId:', studentId);

    setLoading(true);
    
    try {
      let entries = [];
      
      // If studentId is provided, fetch logs for that specific student
      // Otherwise, use logs from context (current user)
      if (studentId) {
        const { data, error } = await getLogbookEntriesByUserId(studentId);
        if (data && !error) {
          // Transform Supabase data to match local format
          entries = data.map(entry => {
            let trainingFocus = entry.training_focus;
            if (typeof trainingFocus === 'string') {
              try {
                trainingFocus = JSON.parse(trainingFocus);
              } catch (e) {
                trainingFocus = [trainingFocus];
              }
            }
            
            return {
              id: entry.id,
              date: entry.date,
              hours: entry.hours,
              sessionType: entry.session_type,
              trainingFocus: trainingFocus,
              feeling: entry.feeling,
              notes: entry.notes,
              location: entry.location,
              createdAt: entry.created_at,
              exerciseDetails: entry.exercise_details || null,
            };
          });
        }
      } else {
        // Use context's logbook entries for current user
        entries = logbookEntries || [];
      }

      // Debug logging
      console.log('📊 [ExerciseHistoryModal] Total entries found:', entries.length);
      console.log('📊 [ExerciseHistoryModal] Looking for exercise:', exercise.name);
      console.log('📊 [ExerciseHistoryModal] Sample entry:', entries[0]);
      
      // Filter entries for this specific exercise
      const history = entries.filter(entry => {
        // Check if this entry has exerciseDetails and matches the current exercise name
        if (entry.exerciseDetails && entry.exerciseDetails.exerciseName) {
          const matches = entry.exerciseDetails.exerciseName === exercise.name;
          console.log('📊 [ExerciseHistoryModal] Checking exerciseDetails:', entry.exerciseDetails.exerciseName, 'vs', exercise.name, '=', matches);
          return matches;
        }
        // Also check in notes for legacy formats
        if (entry.notes) {
          // Check for "Exercise Name: result" format
          if (entry.notes.includes(exercise.name + ':')) {
            console.log('📊 [ExerciseHistoryModal] Found match in notes (format 1):', entry.notes);
            return true;
          }
          // Check for "• Exercise Name: result" format (bullet points)
          if (entry.notes.includes('• ' + exercise.name + ':')) {
            console.log('📊 [ExerciseHistoryModal] Found match in notes (format 2):', entry.notes);
            return true;
          }
        }
        return false;
      });

      console.log('📊 [ExerciseHistoryModal] Filtered history count:', history.length);
      
      // Sort by date (most recent first)
      const sortedHistory = history.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
      });

      setExerciseHistory(sortedHistory);
    } catch (error) {
      console.error('Error loading exercise history:', error);
      setExerciseHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (!exercise) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <WebIcon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Exercise History</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.exerciseInfoSection}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            <View style={styles.targetBadge}>
              <Text style={styles.targetLabel}>TARGET</Text>
              <Text style={styles.targetValue}>
                {exercise.target_value || exercise.target || 'No data'}
              </Text>
            </View>
          </View>
          
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Your Results</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : exerciseHistory.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <WebIcon name="history" size={48} color="#D1D5DB" />
                <Text style={styles.emptyHistoryText}>No results yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Your progress will appear here after logging exercises
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {exerciseHistory.map((entry, index) => {
                  const entryDate = new Date(entry.date || entry.createdAt);
                  const formattedDate = entryDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  const result = entry.exerciseDetails?.result || 'N/A';
                  const target = entry.exerciseDetails?.target || exercise.target_value || exercise.target || 'N/A';
                  const notes = entry.exerciseDetails?.notes || entry.notes || '';
                  
                  // Calculate if passed
                  const resultNum = parseInt(result);
                  const targetNum = parseInt(target);
                  const passed = !isNaN(resultNum) && !isNaN(targetNum) && resultNum >= targetNum;
                  
                  return (
                    <View key={entry.id || index} style={styles.historyItem}>
                      <View style={styles.historyItemHeader}>
                        <View style={styles.historyDateContainer}>
                          <WebIcon name="calendar" size={16} color="#6B7280" />
                          <Text style={styles.historyDate}>{formattedDate}</Text>
                        </View>
                        <View style={[
                          styles.historyResultBadge,
                          passed && styles.historyResultBadgePassed
                        ]}>
                          <Text style={[
                            styles.historyResultText,
                            passed && styles.historyResultTextPassed
                          ]}>
                            {result} / {target}
                          </Text>
                          {passed && (
                            <WebIcon name="checkmark-circle" size={16} color="#10B981" />
                          )}
                        </View>
                      </View>
                      {notes && (
                        <Text style={styles.historyNotes} numberOfLines={3}>
                          {notes}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  exerciseInfoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  exerciseDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  targetBadge: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
    marginBottom: 6,
  },
  targetValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  historySection: {
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyHistoryContainer: {
    backgroundColor: 'white',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  historyResultBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyResultBadgePassed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  historyResultText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  historyResultTextPassed: {
    color: '#10B981',
  },
  historyNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

