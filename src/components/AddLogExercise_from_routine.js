import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from './WebIcon';
import { useLogbook } from '../context/LogbookContext';
import { getLogbookEntriesByUserId, createLogbookEntry } from '../lib/supabase';

export default function AddLogExercise_from_routine({
  visible,
  onClose,
  exercise,
  program,
  routine,
  existingResult,
  onResultSaved,
  studentId, // Add studentId prop to filter logs for specific student
}) {
  const insets = useSafeAreaInsets();
  const { addLogbookEntry, logbookEntries } = useLogbook();
  
  // Local state for the modal
  const [logResult, setLogResult] = useState(existingResult?.result || '');
  const [logNotes, setLogNotes] = useState(existingResult?.notes || '');
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Reset state when modal opens/closes or exercise changes
  React.useEffect(() => {
    if (visible && exercise) {
      setLogResult(existingResult?.result || '');
      setLogNotes(existingResult?.notes || '');
      loadExerciseHistory();
    }
  }, [visible, exercise, existingResult, logbookEntries]);

  // Load exercise history from logbook entries
  const loadExerciseHistory = async () => {
    if (!exercise) {
      setExerciseHistory([]);
      return;
    }

    setLoadingHistory(true);
    
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

      // Filter entries for this specific exercise
      const history = entries.filter(entry => {
        // Check if this entry has exerciseDetails and matches the current exercise name
        if (entry.exerciseDetails && entry.exerciseDetails.exerciseName) {
          return entry.exerciseDetails.exerciseName === exercise.name;
        }
        // Also check in notes for legacy format
        if (entry.notes && entry.notes.includes(exercise.name + ':')) {
          return true;
        }
        return false;
      });

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
      setLoadingHistory(false);
    }
  };

  const getExerciseCategory = (exercise) => {
    const exerciseName = exercise.name.toLowerCase();
    if (exerciseName.includes('dink')) return ['dinks'];
    if (exerciseName.includes('drive')) return ['drives'];
    if (exerciseName.includes('serve')) return ['serves'];
    if (exerciseName.includes('return')) return ['returns'];
    if (exerciseName.includes('volley') || exerciseName.includes('reset')) return ['volleys'];
    return ['dinks']; // Default fallback
  };

  const handleSubmitLog = () => {
    if (!logResult.trim()) {
      Alert.alert('Missing Information', 'Please enter your result.');
      return;
    }

    // Validate numeric input
    const numericResult = parseInt(logResult);
    if (isNaN(numericResult) || numericResult < 0 || numericResult > 99) {
      Alert.alert('Invalid Result', 'Please enter a number between 0 and 99.');
      return;
    }

    saveLogEntry();
  };

  const saveLogEntry = async () => {
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      hours: 0.5, // Default exercise duration
      feeling: 3, // Default neutral feeling
      trainingFocus: getExerciseCategory(exercise),
      notes: `${exercise.name}: ${logResult}${logNotes ? '\n' + logNotes : ''}`,
      exerciseDetails: {
        exerciseName: exercise.name,
        target: exercise.target,
        result: logResult,
        routineName: routine.name,
        programName: program.name
      },
      createdAt: new Date().toISOString(),
    };

    // If studentId is provided (coach logging for student), save directly to database
    // Otherwise, use context (student logging for themselves)
    if (studentId) {
      console.log('💾 [AddLogExercise] Saving log for student:', studentId);
      await createLogbookEntry(entry, studentId);
    } else {
      console.log('💾 [AddLogExercise] Saving log for current user');
      await addLogbookEntry(entry);
    }
    
    // Reload history to show the new entry
    loadExerciseHistory();
    
    // Prepare result data for parent component
    const resultData = {
      result: logResult,
      notes: logNotes,
      timestamp: new Date().toISOString(),
      exerciseName: exercise.name || exercise.title,
      target: exercise.target || exercise.goal
    };
    
    // Notify parent component about the saved result
    if (onResultSaved) {
      onResultSaved(exercise.routineExerciseId, resultData);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setLogResult('');
    setLogNotes('');
    onClose();
  };

  if (!exercise) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={handleClose}
          >
            <WebIcon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {existingResult ? 'Edit Log' : 'Log Exercise'}
          </Text>
          <TouchableOpacity
            style={[styles.modalSubmitButton, !logResult.trim() && styles.modalSubmitButtonDisabled]}
            onPress={handleSubmitLog}
            disabled={!logResult.trim()}
          >
            <Text style={[styles.modalSubmitButtonText, !logResult.trim() && styles.modalSubmitButtonTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.exerciseInfoSection}>
            <Text style={styles.modalExerciseName}>{exercise.name}</Text>
            <Text style={styles.modalExerciseDescription}>{exercise.description}</Text>
          </View>
          
          <View style={styles.targetSection}>
            <Text style={styles.targetLabel}>TARGET</Text>
            <Text style={styles.targetValue}>
              {exercise.target_value ? exercise.target_value : 'No data'}
            </Text>
          </View>
          
          <View style={styles.resultSection}>
            <Text style={styles.inputLabel}>Your Result *</Text>
            <View style={styles.resultInputContainer}>
              <TextInput
                style={styles.resultInput}
                value={logResult}
                onChangeText={(text) => {
                  // Only allow numbers and limit to 2 digits
                  const numericValue = text.replace(/[^0-9]/g, '');
                  if (numericValue === '' || (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 99)) {
                    setLogResult(numericValue);
                  }
                }}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={2}
                autoFocus
                textAlign="center"
              />
              <Text style={styles.resultUnit}>/ target</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={logNotes}
              onChangeText={setLogNotes}
              placeholder="How did it feel? Any observations..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Exercise History Section */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Previous Results</Text>
            
            {loadingHistory ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            ) : exerciseHistory.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <WebIcon name="history" size={24} color="#D1D5DB" />
                <Text style={styles.emptyHistoryText}>No previous results yet</Text>
                <Text style={styles.emptyHistorySubtext}>Your progress will appear here after saving</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {exerciseHistory.slice(0, 5).map((entry, index) => {
                  const entryDate = new Date(entry.date || entry.createdAt);
                  const formattedDate = entryDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  const result = entry.exerciseDetails?.result || 'N/A';
                  const target = entry.exerciseDetails?.target || exercise.target_value || 'N/A';
                  const notes = entry.exerciseDetails?.notes || '';
                  
                  return (
                    <View key={entry.id || index} style={styles.historyItem}>
                      <View style={styles.historyItemHeader}>
                        <View style={styles.historyDateContainer}>
                          <WebIcon name="calendar" size={14} color="#6B7280" />
                          <Text style={styles.historyDate}>{formattedDate}</Text>
                        </View>
                        <View style={styles.historyResultBadge}>
                          <Text style={styles.historyResultText}>
                            {result} / {target}
                          </Text>
                        </View>
                      </View>
                      {notes && (
                        <Text style={styles.historyNotes} numberOfLines={2}>
                          {notes}
                        </Text>
                      )}
                    </View>
                  );
                })}
                
                {exerciseHistory.length > 5 && (
                  <Text style={styles.historyMoreText}>
                    +{exerciseHistory.length - 5} more entries
                  </Text>
                )}
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
    margin: 0,
    padding: 0,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSubmitButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalSubmitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubmitButtonTextDisabled: {
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  exerciseInfoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modalExerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalExerciseDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  targetSection: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
    marginBottom: 8,
  },
  targetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  resultSection: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  resultInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resultInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 80,
    textAlign: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  resultUnit: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // History Section Styles
  historySection: {
    marginTop: 24,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  historyResultBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  historyResultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  historyNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 4,
  },
  historyMoreText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
