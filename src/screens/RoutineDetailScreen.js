import React from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebIcon from '../components/WebIcon';
import { useLogbook } from '../context/LogbookContext';

export default function RoutineDetailScreen({ navigation, route }) {
  const { program, routine: initialRoutine, onUpdateRoutine, autoOpenExercisePicker } = route.params;
  const insets = useSafeAreaInsets();
  const [routine, setRoutine] = React.useState(initialRoutine);
  const { addLogbookEntry } = useLogbook();
  
  // Quick log modal state
  const [showQuickLogModal, setShowQuickLogModal] = React.useState(false);
  const [selectedExercise, setSelectedExercise] = React.useState(null);
  const [logResult, setLogResult] = React.useState('');
  const [logNotes, setLogNotes] = React.useState('');

  // Update routine in parent when it changes
  React.useEffect(() => {
    if (onUpdateRoutine) {
      onUpdateRoutine(routine);
    }
  }, [routine, onUpdateRoutine]);

  // Auto-open exercise picker if flag is set (when coming from routine creation)
  React.useEffect(() => {
    if (autoOpenExercisePicker) {
      // Small delay to ensure screen is fully loaded
      const timer = setTimeout(() => {
        openExercisePicker();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoOpenExercisePicker]);

  // Static exercises for exercise picker (would move to context in real app)
  const staticExercises = {
    dinks: [
      { id: "1.1", name: "Dink Wall Drill", target: "15 consecutive soft dinks", difficulty: 2, description: "Practice consistent dinking against a wall" },
      { id: "1.2", name: "Cross-Court Dinks", target: "8 consecutive cross-court dinks", difficulty: 2, description: "Develop cross-court dinking accuracy" },
      { id: "1.3", name: "Dink Targets", target: "6/12 land in NVZ cones", difficulty: 3, description: "Precision dinking to specific targets" },
      { id: "s3.1", name: "Advanced Cross-Court Dinks", target: "12/15 in NVZ", difficulty: 3, description: "From Net Play Excellence session" }
    ],
    drives: [
      { id: "2.1", name: "FH Drive Depth", target: "7/10 beyond NVZ", difficulty: 2, description: "Forehand drive depth control" },
      { id: "2.2", name: "BH Drive Depth", target: "6/10 beyond NVZ", difficulty: 3, description: "Backhand drive depth control" },
      { id: "2.3", name: "Drive & Recover", target: "5-drive sequence", difficulty: 3, description: "Drive and return to ready position" },
      { id: "s4.1", name: "Power Drive Targets", target: "7/12 to corners", difficulty: 4, description: "From Power & Placement session" }
    ],
    serves: [
      { id: "6.1", name: "Deep Serve Mastery", target: "7/10 in back third", difficulty: 3, description: "Consistent deep serving" },
      { id: "6.2", name: "Spin Serve", target: "5/10 with visible spin", difficulty: 4, description: "Develop spin serve technique" },
      { id: "6.3", name: "Serve Placement Drill", target: "4/6 to chosen corner", difficulty: 3, description: "Precise serve placement" },
      { id: "s1.1", name: "Corner Placement Serves", target: "8/12 to chosen corners", difficulty: 3, description: "From Serve & Return Mastery session" }
    ],
    returns: [
      { id: "s1.2", name: "Deep Return Practice", target: "7/10 past midline", difficulty: 3, description: "Return serves deep into court" },
      { id: "s1.3", name: "Return & Approach", target: "5/8 successful approaches", difficulty: 4, description: "Return and move to net" },
      { id: "r1", name: "Defensive Returns", target: "6/10 successful defensive returns", difficulty: 3, description: "Master defensive return shots" }
    ],
    volleys: [
      { id: "s3.2", name: "Volley Positioning", target: "8/10 clean volleys", difficulty: 3, description: "Perfect volley positioning" },
      { id: "s3.3", name: "Attack the High Ball", target: "6/8 putaway attempts", difficulty: 4, description: "Aggressive high ball volleys" },
      { id: "v1", name: "Reflex Volleys", target: "10/15 quick volleys", difficulty: 4, description: "Improve volley reaction time" }
    ],
    others: [
      { id: "7.1", name: "Drop Consistency", target: "6/10 into NVZ", difficulty: 3, description: "Master the critical third shot" },
      { id: "7.2", name: "Target Drops", target: "4/10 to backhand corner", difficulty: 4, description: "Precision third shot drops" },
      { id: "s4.2", name: "Lob Placement", target: "5/8 over opponent", difficulty: 3, description: "Effective lob placement" },
      { id: "s5.3", name: "Court Positioning", target: "8/10 optimal positions", difficulty: 4, description: "Maintain optimal court position" },
      { id: "s6.3", name: "Endurance Rally", target: "25+ shot rallies", difficulty: 4, description: "Long rally endurance training" }
    ]
  };

  // Exercise management functions
  const addExerciseToRoutine = (exercise) => {
    setRoutine(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), { ...exercise, routineExerciseId: Date.now() }]
    }));
  };

  const removeExerciseFromRoutine = (routineExerciseId) => {
    setRoutine(prev => ({
      ...prev,
      exercises: (prev.exercises || []).filter(ex => ex.routineExerciseId !== routineExerciseId)
    }));
  };

  const moveExerciseUp = (index) => {
    if (index > 0) {
      setRoutine(prev => {
        const newExercises = [...(prev.exercises || [])];
        [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
        return { ...prev, exercises: newExercises };
      });
    }
  };

  const moveExerciseDown = (index) => {
    setRoutine(prev => {
      const exercises = prev.exercises || [];
      if (index < exercises.length - 1) {
        const newExercises = [...exercises];
        [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
        return { ...prev, exercises: newExercises };
      }
      return prev;
    });
  };

  const openExercisePicker = () => {
    const alreadyAddedIds = (routine.exercises || []).map(ex => ex.id);
    navigation.navigate('ExercisePicker', {
      onAddExercise: addExerciseToRoutine,
      alreadyAddedIds: alreadyAddedIds,
      staticExercises: staticExercises
    });
  };

  // Quick log functions
  const handleAddLog = (exercise) => {
    setSelectedExercise(exercise);
    setLogResult('');
    setLogNotes('');
    setShowQuickLogModal(true);
  };

  const handleSubmitLog = () => {
    if (!logResult.trim()) {
      Alert.alert('Missing Information', 'Please enter your result.');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      hours: 0.5, // Default exercise duration
      feeling: 3, // Default neutral feeling
      trainingFocus: getExerciseCategory(selectedExercise),
      notes: `${selectedExercise.name}: ${logResult}${logNotes ? '\n' + logNotes : ''}`,
      exerciseDetails: {
        exerciseName: selectedExercise.name,
        target: selectedExercise.target,
        result: logResult,
        routineName: routine.name,
        programName: program.name
      },
      createdAt: new Date().toISOString(),
    };

    addLogbookEntry(entry);
    setShowQuickLogModal(false);
    
    Alert.alert(
      'Success', 
      'Exercise logged successfully!',
      [{ text: 'OK' }]
    );
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

  const closeQuickLogModal = () => {
    setShowQuickLogModal(false);
    setSelectedExercise(null);
    setLogResult('');
    setLogNotes('');
  };

  const exercises = routine.exercises || [];

  const renderExercisesContent = () => (
    <View style={styles.exercisesContainer}>
      {exercises.length === 0 ? (
        <View style={styles.emptyExercisesList}>
          <Text style={styles.emptyExercisesIcon}>💪</Text>
          <Text style={styles.emptyExercisesTitle}>No Exercises Yet</Text>
          <Text style={styles.emptyExercisesDescription}>
            Add exercises to this routine to create your training plan.
          </Text>
          <TouchableOpacity
            style={styles.addFirstExerciseButton}
            onPress={openExercisePicker}
          >
            <WebIcon name="add" size={20} color="white" />
            <Text style={styles.addFirstExerciseButtonText}>Add First Exercise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.exercisesList}
          contentContainerStyle={styles.exercisesContent}
        >
          <View style={styles.exercisesHeader}>
            <View style={styles.exercisesHeaderTop}>
              <Text style={styles.exercisesTitle}>Exercises ({exercises.length})</Text>
              <TouchableOpacity
                style={styles.addExerciseHeaderButton}
                onPress={openExercisePicker}
              >
                <WebIcon name="add" size={16} color="#3B82F6" />
                <Text style={styles.addExerciseHeaderButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.exercisesSubtitle}>Tap to practice • Long press to remove</Text>
          </View>
          
          {exercises.map((exercise, index) => (
            <View key={exercise.routineExerciseId} style={styles.exerciseCard}>
              <View style={styles.exerciseReorderHandle}>
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => moveExerciseUp(index)}
                  disabled={index === 0}
                >
                  <WebIcon 
                    name="chevron-up" 
                    size={16} 
                    color={index === 0 ? "#D1D5DB" : "#6B7280"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => moveExerciseDown(index)}
                  disabled={index === exercises.length - 1}
                >
                  <WebIcon 
                    name="chevron-down" 
                    size={16} 
                    color={index === exercises.length - 1 ? "#D1D5DB" : "#6B7280"} 
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.exerciseContent}
                onPress={() => navigation.navigate('ExerciseDetail', {
                  exercise: {
                    code: exercise.id,
                    title: exercise.name,
                    level: `${program.name} - ${routine.name}`,
                    goal: exercise.description,
                    instructions: `Practice the ${exercise.name} exercise.\n\nTarget: ${exercise.target}\n\nDifficulty: ${exercise.difficulty}/5`,
                    targetType: "count",
                    targetValue: exercise.target.includes('/') ? exercise.target : "6/10",
                    difficulty: exercise.difficulty,
                    validationMode: "manual",
                    estimatedTime: "10-15 min",
                    equipment: ["Balls", "Partner/Coach"],
                    tips: [
                      "Focus on technique over power",
                      "Take your time with each attempt",
                      "Reset between attempts"
                    ],
                    previousAttempts: []
                  }
                })}
                onLongPress={() => removeExerciseFromRoutine(exercise.routineExerciseId)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseTarget}>Target: {exercise.target}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                </View>
                
                <View style={styles.exerciseActions}>
                  <View style={styles.exerciseButtonsContainer}>
                    <View style={[
                      styles.exerciseButton,
                      { backgroundColor: '#3B82F6' }
                    ]}>
                      <Text style={[
                        styles.exerciseButtonText,
                        { color: 'white' }
                      ]}>
                        Details
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.exerciseButton,
                        styles.addLogButton,
                        { backgroundColor: '#10B981' }
                      ]}
                      onPress={() => handleAddLog(exercise)}
                    >
                      <Text style={[
                        styles.exerciseButtonText,
                        { color: 'white' }
                      ]}>
                        Add Log
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderQuickLogModal = () => (
    <Modal
      visible={showQuickLogModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeQuickLogModal}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeQuickLogModal}
          >
            <WebIcon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Log Exercise</Text>
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
          {selectedExercise && (
            <>
              <View style={styles.exerciseInfoSection}>
                <Text style={styles.modalExerciseName}>{selectedExercise.name}</Text>
                <Text style={styles.modalExerciseTarget}>Target: {selectedExercise.target}</Text>
                <Text style={styles.modalExerciseDescription}>{selectedExercise.description}</Text>
              </View>
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Result *</Text>
                <TextInput
                  style={styles.resultInput}
                  value={logResult}
                  onChangeText={setLogResult}
                  placeholder="e.g., 7/10, completed, 15 reps"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  autoFocus
                />
              </View>
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={logNotes}
                  onChangeText={setLogNotes}
                  placeholder="Additional observations or comments..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{routine.name}</Text>
            <Text style={styles.headerSubtitle}>from {program.name}</Text>
            {routine.description ? (
              <Text style={styles.headerDescription}>{routine.description}</Text>
            ) : null}
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderExercisesContent()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderQuickLogModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  headerDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Exercises styles
  exercisesContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyExercisesList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyExercisesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyExercisesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyExercisesDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  exercisesList: {
    flex: 1,
  },
  exercisesContent: {
    padding: 16,
    paddingBottom: 40,
  },
  exercisesHeader: {
    marginBottom: 16,
  },
  exercisesHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exercisesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addExerciseHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  addExerciseHeaderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  exercisesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseReorderHandle: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    flexDirection: 'column',
    gap: 2,
  },
  reorderButton: {
    padding: 4,
    borderRadius: 4,
  },
  exerciseContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseButtonsContainer: {
    flexDirection: 'column',
    gap: 6,
  },
  exerciseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    minWidth: 80,
    alignItems: 'center',
  },
  addLogButton: {
    borderColor: '#10B981',
  },
  exerciseButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 24,
  },
  // Modal styles
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalExerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalExerciseTarget: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalExerciseDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 48,
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
});
