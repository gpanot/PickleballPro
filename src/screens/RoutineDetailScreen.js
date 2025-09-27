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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebIcon from '../components/WebIcon';
import AddLogExercise_from_routine from '../components/AddLogExercise_from_routine';
import { useLogbook } from '../context/LogbookContext';
import { supabase } from '../lib/supabase';

export default function RoutineDetailScreen({ navigation, route }) {
  const { program, routine: initialRoutine, onUpdateRoutine, autoOpenExercisePicker, source } = route.params;
  const insets = useSafeAreaInsets();
  const [routine, setRoutine] = React.useState(initialRoutine);
  const { addLogbookEntry } = useLogbook();
  
  // Quick log modal state
  const [showQuickLogModal, setShowQuickLogModal] = React.useState(false);
  const [selectedExercise, setSelectedExercise] = React.useState(null);
  
  // Session start modal state
  const [showSessionStartModal, setShowSessionStartModal] = React.useState(false);
  
  // Track logged results for each exercise
  const [exerciseResults, setExerciseResults] = React.useState({});
  
  // Session timer state
  const [isSessionActive, setIsSessionActive] = React.useState(false);
  const [sessionTime, setSessionTime] = React.useState(0);
  const timerRef = React.useRef(null);

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

  // Timer management
  React.useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSessionActive]);

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
    setShowQuickLogModal(true);
  };

  const handleResultSaved = (routineExerciseId, resultData) => {
    // Store the result for this exercise
    setExerciseResults(prev => ({
      ...prev,
      [routineExerciseId]: resultData
    }));
  };

  // Get difficulty emoji based on difficulty level
  const getDifficultyEmoji = (difficulty) => {
    const difficultyMap = {
      1: '🤩', // Very Easy
      2: '😊', // Easy  
      3: '😐', // Moderate
      4: '😕', // Hard
      5: '😓'  // Very Hard
    };
    return difficultyMap[difficulty] || '😐';
  };

  const closeQuickLogModal = () => {
    setShowQuickLogModal(false);
    setSelectedExercise(null);
  };

  // Session timer functions
  const startSession = () => {
    setShowSessionStartModal(true);
  };

  const confirmStartSession = () => {
    setShowSessionStartModal(false);
    setIsSessionActive(true);
    setSessionTime(0);
  };

  const cancelSession = () => {
    setIsSessionActive(false);
    setSessionTime(0);
  };

  const completeSession = () => {
    const sessionTimeInHours = Math.round((sessionTime / 3600) * 2) / 2; // Round to nearest 0.5 hour
    const finalSessionTime = Math.max(sessionTimeInHours, 1.0); // Minimum 1.0 hours for training sessions
    
    setIsSessionActive(false);
    
    Alert.alert(
      'Session Completed!', 
      'Do you want to save your results in your Logbook?',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            setSessionTime(0);
          }
        },
        {
          text: 'Save to Logbook',
          onPress: () => {
            setSessionTime(0);
            
            // Prepare exercise logs for the session
            console.log('Exercise results:', exerciseResults);
            const exerciseLogs = Object.entries(exerciseResults)
              .filter(([_, result]) => result.result && result.result.trim())
              .map(([routineExerciseId, result]) => {
                console.log('Processing exercise result for routineExerciseId', routineExerciseId, ':', result);
                return {
                  exerciseName: result.exerciseName || `Exercise ${routineExerciseId}`,
                  target: result.target || '',
                  result: result.result,
                  notes: result.notes || ''
                };
              });
            
            // Navigate to AddTrainingSession with pre-filled data
            navigation.navigate('AddTrainingSession', {
              prefillData: {
                sessionType: 'training',
                hours: finalSessionTime,
                routineName: routine.name,
                programName: program.name,
                exerciseLogs: exerciseLogs
              }
            });
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const exercises = routine.exercises || [];

  const renderExercisesContent = () => (
    <View style={styles.exercisesContainer}>
      {exercises.length === 0 ? (
        <View style={styles.emptyExercisesList}>
          <Text style={styles.emptyExercisesIcon}>💪</Text>
          <Text style={styles.emptyExercisesTitle}>No Exercises Yet</Text>
          <Text style={styles.emptyExercisesDescription}>
            {source === 'explore' 
              ? 'This routine doesn\'t have any exercises yet.'
              : 'Add exercises to this routine to create your training plan.'
            }
          </Text>
          {source !== 'explore' && (
            <TouchableOpacity
              style={styles.addFirstExerciseButton}
              onPress={openExercisePicker}
            >
              <WebIcon name="add" size={20} color="white" />
              <Text style={styles.addFirstExerciseButtonText}>Add First Exercise</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.exercisesList}
          contentContainerStyle={styles.exercisesContent}
        >
          <View style={styles.exercisesHeader}>
            <View style={styles.exercisesHeaderTop}>
              <Text style={styles.exercisesTitle}>Exercises ({exercises.length})</Text>
              {source !== 'explore' && (
                <TouchableOpacity
                  style={styles.addExerciseHeaderButton}
                  onPress={openExercisePicker}
                >
                  <WebIcon name="add" size={16} color="#3B82F6" />
                  <Text style={styles.addExerciseHeaderButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.exercisesSubtitle}>
              {source === 'explore' ? 'Preview exercises in this routine' : 'Tap to practice • Long press to remove'}
            </Text>
          </View>
          
          {exercises.map((exercise, index) => (
            <View key={exercise.routineExerciseId} style={styles.exerciseCard}>
              {source !== 'explore' && (
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
              )}
              
              <TouchableOpacity
                style={styles.exerciseContent}
                onPress={async () => {
                  try {
                    // Fetch complete exercise data from database using the exercise code
                    const { data, error } = await supabase
                      .from('exercises')
                      .select('*')
                      .eq('code', exercise.id)  // exercise.id is actually the code
                      .single();
                    
                    if (error) throw error;
                    
                    if (data) {
                      // Navigate with complete database exercise data
                      navigation.navigate('ExerciseDetail', {
                        exercise: data,
                        rawExercise: data
                      });
                    } else {
                      // Fallback to simplified exercise if database fetch fails
                      const exerciseTarget = exercise.target || exercise.goal || 'Complete the exercise';
                      const exerciseName = exercise.name || exercise.title || 'Exercise';
                      const exerciseDescription = exercise.description || exercise.goal || 'Complete the exercise';
                      
                      navigation.navigate('ExerciseDetail', {
                        exercise: {
                          code: exercise.id,
                          title: exerciseName,
                          level: `${program.name} - ${routine.name}`,
                          goal: exerciseDescription,
                          instructions: `Practice the ${exerciseName} exercise.\n\nTarget: ${exerciseTarget}\n\nDifficulty: ${exercise.difficulty}/5`,
                          targetType: exercise.targetType || "count",
                          targetValue: (exercise.target && exercise.target.includes && exercise.target.includes('/')) ? exercise.target : exercise.targetValue || "6/10",
                          difficulty: exercise.difficulty,
                          validationMode: "manual",
                          estimatedTime: exercise.timeEstimate ? `${exercise.timeEstimate} min` : "10-15 min",
                          equipment: ["Balls", "Partner/Coach"],
                          tips: [
                            "Focus on technique over power",
                            "Take your time with each attempt",
                            "Reset between attempts"
                          ],
                          previousAttempts: []
                        }
                      });
                    }
                  } catch (error) {
                    console.error('Error fetching exercise data:', error);
                    // Fallback to simplified exercise data
                    const exerciseTarget = exercise.target || exercise.goal || 'Complete the exercise';
                    const exerciseName = exercise.name || exercise.title || 'Exercise';
                    const exerciseDescription = exercise.description || exercise.goal || 'Complete the exercise';
                    
                    navigation.navigate('ExerciseDetail', {
                      exercise: {
                        code: exercise.id,
                        title: exerciseName,
                        level: `${program.name} - ${routine.name}`,
                        goal: exerciseDescription,
                        instructions: `Practice the ${exerciseName} exercise.\n\nTarget: ${exerciseTarget}\n\nDifficulty: ${exercise.difficulty}/5`,
                        targetType: exercise.targetType || "count",
                        targetValue: (exercise.target && exercise.target.includes && exercise.target.includes('/')) ? exercise.target : exercise.targetValue || "6/10",
                        difficulty: exercise.difficulty,
                        validationMode: "manual",
                        estimatedTime: exercise.timeEstimate ? `${exercise.timeEstimate} min` : "10-15 min",
                        equipment: ["Balls", "Partner/Coach"],
                        tips: [
                          "Focus on technique over power",
                          "Take your time with each attempt",
                          "Reset between attempts"
                        ],
                        previousAttempts: []
                      }
                    });
                  }
                }}
                onLongPress={source === 'explore' ? undefined : () => removeExerciseFromRoutine(exercise.routineExerciseId)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name || exercise.title}</Text>
                  <Text style={styles.exerciseTarget}>Target: {exercise.target || exercise.goal}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description || exercise.goal}</Text>
                </View>
                
                {source !== 'explore' && (
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
                          exerciseResults[exercise.routineExerciseId] 
                            ? { backgroundColor: '#059669' } 
                            : { backgroundColor: '#10B981' }
                        ]}
                        onPress={() => handleAddLog(exercise)}
                      >
                        <Text style={[
                          styles.exerciseButtonText,
                          { color: 'white' }
                        ]}>
                          {exerciseResults[exercise.routineExerciseId] 
                            ? `${exerciseResults[exercise.routineExerciseId].result} ${getDifficultyEmoji(exerciseResults[exercise.routineExerciseId].difficulty)}`
                            : 'Add Log'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderSessionControls = () => {
    if (exercises.length === 0 || source === 'explore') {
      return null;
    }

    return (
      <View style={styles.sessionControlsFixed}>
              {!isSessionActive ? (
                <TouchableOpacity
                  style={styles.startSessionButton}
                  onPress={startSession}
                >
                  <Text style={styles.startSessionButtonText}>Start this session</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.activeSessionContainer}>
                  <View style={styles.timerContainer}>
              <WebIcon name="time" size={18} color="#3B82F6" />
                    <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
                  </View>
                  
                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelSession}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={completeSession}
                    >
                      <Text style={styles.completeButtonText}>Completed</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
    );
  };

  const renderExercisesContentUpdated = () => (
    <View style={styles.exercisesContainer}>
      {exercises.length === 0 ? (
        <View style={styles.emptyExercisesList}>
          <Text style={styles.emptyExercisesIcon}>💪</Text>
          <Text style={styles.emptyExercisesTitle}>No Exercises Yet</Text>
          <Text style={styles.emptyExercisesDescription}>
            {source === 'explore' 
              ? 'This routine doesn\'t have any exercises yet.'
              : 'Add exercises to this routine to create your training plan.'
            }
          </Text>
          {source !== 'explore' && (
            <TouchableOpacity
              style={styles.addFirstExerciseButton}
              onPress={openExercisePicker}
            >
              <WebIcon name="add" size={20} color="white" />
              <Text style={styles.addFirstExerciseButtonText}>Add First Exercise</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.exercisesList}
          contentContainerStyle={styles.exercisesContent}
        >
          <View style={styles.exercisesHeader}>
            <View style={styles.exercisesHeaderTop}>
              <Text style={styles.exercisesTitle}>Exercises ({exercises.length})</Text>
              {source !== 'explore' && (
                <TouchableOpacity
                  style={styles.addExerciseHeaderButton}
                  onPress={openExercisePicker}
                >
                  <WebIcon name="add" size={16} color="#3B82F6" />
                  <Text style={styles.addExerciseHeaderButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.exercisesSubtitle}>
              {source === 'explore' ? 'Preview exercises in this routine' : 'Tap to practice • Long press to remove'}
            </Text>
          </View>
          
          {exercises.map((exercise, index) => (
            <View key={exercise.routineExerciseId} style={styles.exerciseCard}>
              {source !== 'explore' && (
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
              )}
              
              <TouchableOpacity
                style={styles.exerciseContent}
                onPress={async () => {
                  try {
                    // Fetch complete exercise data from database using the exercise code
                    const { data, error } = await supabase
                      .from('exercises')
                      .select('*')
                      .eq('code', exercise.id)  // exercise.id is actually the code
                      .single();
                    
                    if (error) throw error;
                    
                    if (data) {
                      // Navigate with complete database exercise data
                      navigation.navigate('ExerciseDetail', {
                        exercise: data,
                        rawExercise: data
                      });
                    } else {
                      // Fallback to simplified exercise if database fetch fails
                      const exerciseTarget = exercise.target || exercise.goal || 'Complete the exercise';
                      const exerciseName = exercise.name || exercise.title || 'Exercise';
                      const exerciseDescription = exercise.description || exercise.goal || 'Complete the exercise';
                      
                      navigation.navigate('ExerciseDetail', {
                        exercise: {
                          code: exercise.id,
                          title: exerciseName,
                          level: `${program.name} - ${routine.name}`,
                          goal: exerciseDescription,
                          instructions: `Practice the ${exerciseName} exercise.\n\nTarget: ${exerciseTarget}\n\nDifficulty: ${exercise.difficulty}/5`,
                          targetType: exercise.targetType || "count",
                          targetValue: (exercise.target && exercise.target.includes && exercise.target.includes('/')) ? exercise.target : exercise.targetValue || "6/10",
                          difficulty: exercise.difficulty,
                          validationMode: "manual",
                          estimatedTime: exercise.timeEstimate ? `${exercise.timeEstimate} min` : "10-15 min",
                          equipment: ["Balls", "Partner/Coach"],
                          tips: [
                            "Focus on technique over power",
                            "Take your time with each attempt",
                            "Reset between attempts"
                          ],
                          previousAttempts: []
                        }
                      });
                    }
                  } catch (error) {
                    console.error('Error fetching exercise data:', error);
                    // Fallback to simplified exercise data
                    const exerciseTarget = exercise.target || exercise.goal || 'Complete the exercise';
                    const exerciseName = exercise.name || exercise.title || 'Exercise';
                    const exerciseDescription = exercise.description || exercise.goal || 'Complete the exercise';
                    
                    navigation.navigate('ExerciseDetail', {
                      exercise: {
                        code: exercise.id,
                        title: exerciseName,
                        level: `${program.name} - ${routine.name}`,
                        goal: exerciseDescription,
                        instructions: `Practice the ${exerciseName} exercise.\n\nTarget: ${exerciseTarget}\n\nDifficulty: ${exercise.difficulty}/5`,
                        targetType: exercise.targetType || "count",
                        targetValue: (exercise.target && exercise.target.includes && exercise.target.includes('/')) ? exercise.target : exercise.targetValue || "6/10",
                        difficulty: exercise.difficulty,
                        validationMode: "manual",
                        estimatedTime: exercise.timeEstimate ? `${exercise.timeEstimate} min` : "10-15 min",
                        equipment: ["Balls", "Partner/Coach"],
                        tips: [
                          "Focus on technique over power",
                          "Take your time with each attempt",
                          "Reset between attempts"
                        ],
                        previousAttempts: []
                      }
                    });
                  }
                }}
                onLongPress={source === 'explore' ? undefined : () => removeExerciseFromRoutine(exercise.routineExerciseId)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name || exercise.title}</Text>
                  <Text style={styles.exerciseTarget}>Target: {exercise.target || exercise.goal}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description || exercise.goal}</Text>
                </View>
                
                {source !== 'explore' && (
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
                          exerciseResults[exercise.routineExerciseId] 
                            ? { backgroundColor: '#059669' } 
                            : { backgroundColor: '#10B981' }
                        ]}
                        onPress={() => handleAddLog(exercise)}
                      >
                        <Text style={[
                          styles.exerciseButtonText,
                          { color: 'white' }
                        ]}>
                          {exerciseResults[exercise.routineExerciseId] 
                            ? `${exerciseResults[exercise.routineExerciseId].result} ${getDifficultyEmoji(exerciseResults[exercise.routineExerciseId].difficulty)}`
                            : 'Add Log'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderSessionStartModal = () => (
    <Modal
      visible={showSessionStartModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowSessionStartModal(false)}
    >
      <View style={styles.sessionModalOverlay}>
        <View style={[styles.sessionModalContainer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.sessionModalContent}>
            {/* Header with fun emoji and title */}
            <View style={styles.sessionModalHeader}>
              <Text style={styles.sessionModalEmoji}>🎾</Text>
              <Text style={styles.sessionModalTitle}>Ready to Play!</Text>
              <Text style={styles.sessionModalSubtitle}>Let's start your training session</Text>
            </View>
            
            {/* Main message */}
            <View style={styles.sessionModalMessage}>
              <Text style={styles.sessionModalText}>
                Your training session is about to begin! Complete the exercises and log your results as you go.
              </Text>
              <Text style={styles.sessionModalText}>
                At the end of your session, you can save all your progress to your Logbook.
              </Text>
            </View>
            
            {/* Session info */}
            <View style={styles.sessionModalInfo}>
              <View style={styles.sessionInfoItem}>
                <WebIcon name="fitness" size={20} color="#10B981" />
                <Text style={styles.sessionInfoText}>{exercises.length} exercises to complete</Text>
              </View>
              <View style={styles.sessionInfoItem}>
                <WebIcon name="time" size={20} color="#3B82F6" />
                <Text style={styles.sessionInfoText}>Track your session time</Text>
              </View>
              <View style={styles.sessionInfoItem}>
                <WebIcon name="checkmark-circle" size={20} color="#F59E0B" />
                <Text style={styles.sessionInfoText}>Log results for each exercise</Text>
              </View>
            </View>
            
            {/* Action buttons */}
            <View style={styles.sessionModalActions}>
              <TouchableOpacity
                style={styles.sessionModalCancelButton}
                onPress={() => setShowSessionStartModal(false)}
              >
                <Text style={styles.sessionModalCancelText}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sessionModalStartButton}
                onPress={confirmStartSession}
              >
                <Text style={styles.sessionModalStartText}>Let's Go! 💪</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );


  return (
    <>
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
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderExercisesContentUpdated()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderSessionControls()}
      {renderSessionStartModal()}
    </View>
    
    <AddLogExercise_from_routine
      visible={showQuickLogModal}
      onClose={closeQuickLogModal}
      exercise={selectedExercise}
      program={program}
      routine={routine}
      existingResult={selectedExercise ? exerciseResults[selectedExercise.routineExerciseId] : null}
      onResultSaved={handleResultSaved}
    />
  </>
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
    height: 120, // Add extra spacing to account for fixed session controls
  },
  // Session Start Modal styles
  sessionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sessionModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  sessionModalContent: {
    padding: 24,
  },
  sessionModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sessionModalEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  sessionModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  sessionModalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  sessionModalMessage: {
    marginBottom: 24,
  },
  sessionModalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  sessionModalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sessionInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  sessionModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionModalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  sessionModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sessionModalStartButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionModalStartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  // Session timer styles
  sessionControls: {
    marginTop: 24,
    marginBottom: 16,
  },
  sessionControlsFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    padding: 16,
    paddingBottom: 34, // Account for home indicator on newer devices
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  startSessionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startSessionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  activeSessionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
