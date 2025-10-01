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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from './WebIcon';
import { useLogbook } from '../context/LogbookContext';

export default function AddLogExercise_from_routine({
  visible,
  onClose,
  exercise,
  program,
  routine,
  existingResult,
  onResultSaved
}) {
  const insets = useSafeAreaInsets();
  const { addLogbookEntry } = useLogbook();
  
  // Local state for the modal
  const [logResult, setLogResult] = useState(existingResult?.result || '');
  const [logNotes, setLogNotes] = useState(existingResult?.notes || '');
  const [difficulty, setDifficulty] = useState(existingResult?.difficulty || 3);

  // Reset state when modal opens/closes or exercise changes
  React.useEffect(() => {
    if (visible && exercise) {
      setLogResult(existingResult?.result || '');
      setLogNotes(existingResult?.notes || '');
      setDifficulty(existingResult?.difficulty || 3);
    }
  }, [visible, exercise, existingResult]);

  // Difficulty options - same as in AddTrainingSessionScreen
  const difficultyOptions = [
    { value: 1, emoji: '🤩', label: 'Very Easy', color: '#10B981' },
    { value: 2, emoji: '😊', label: 'Easy', color: '#6B7280' },
    { value: 3, emoji: '😐', label: 'Moderate', color: '#F59E0B' },
    { value: 4, emoji: '😕', label: 'Hard', color: '#F97316' },
    { value: 5, emoji: '😓', label: 'Very Hard', color: '#EF4444' },
  ];

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

    // Check if difficulty is challenging (3, 4, or 5) and prompt for redo
    if (difficulty >= 3) {
      Alert.alert(
        'It looks like it was challenging!',
        'Do you want to redo this exercise in the future?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => saveLogEntry(false)
          },
          {
            text: 'Yes',
            onPress: () => saveLogEntry(true)
          }
        ]
      );
    } else {
      saveLogEntry(false);
    }
  };

  const saveLogEntry = (wantsRedo) => {
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
        difficulty: difficulty,
        wantsRedo: wantsRedo,
        routineName: routine.name,
        programName: program.name
      },
      createdAt: new Date().toISOString(),
    };

    addLogbookEntry(entry);
    
    // Save redo preference locally (for future use)
    if (wantsRedo) {
      // Store locally that this exercise should be redone
      // For now, we'll just store it in the result data
      console.log(`User wants to redo exercise: ${exercise.name}`);
    }
    
    // Prepare result data for parent component
    const resultData = {
      result: logResult,
      notes: logNotes,
      difficulty: difficulty,
      wantsRedo: wantsRedo,
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
    setDifficulty(3);
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
            <Text style={styles.inputLabel}>Was it difficult for you?</Text>
            <View style={styles.difficultySelector}>
              {difficultyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.difficultyOption,
                    difficulty === option.value && { 
                      backgroundColor: option.color + '20',
                      borderColor: option.color,
                    }
                  ]}
                  onPress={() => setDifficulty(option.value)}
                >
                  <Text style={styles.difficultyOptionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.difficultyOptionLabel,
                    difficulty === option.value && { color: option.color }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
  // Difficulty selector styles
  difficultySelector: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    minWidth: 55,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  difficultyOptionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  difficultyOptionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
  },
});
