import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import WebCreateProgramModal from './WebCreateProgramModal';
import WebCreateRoutineModal from './WebCreateRoutineModal';
import WebCreateExerciseModal from './WebCreateExerciseModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EditableProgramStructureModal({ visible, program, onClose, onSave }) {
  const [editedProgram, setEditedProgram] = useState(program);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // Modal states
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  
  // Delete states
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reorderingRoutineId, setReorderingRoutineId] = useState(null);
  const [reorderingExerciseId, setReorderingExerciseId] = useState(null);

  // Function to refresh program data from database
  const refreshProgramData = async () => {
    if (!program?.id) return;
    
    try {
      console.log('🔄 Refreshing program data from database...');
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          routines (
            *,
            routine_exercises (
              id,
              order_index,
              custom_target_value,
              exercises (*)
            )
          )
        `)
        .eq('id', program.id)
        .single();

      if (error) throw error;
      
      // Transform the data to match the expected structure
      const transformedProgram = {
        ...data,
        routines: data.routines
          .sort((a, b) => a.order_index - b.order_index)
          .map(routine => ({
            ...routine,
            exercises: routine.routine_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map(re => ({
                routineExerciseId: re.id,
                exerciseId: re.exercises.id,
                id: re.exercises.code,
                name: re.exercises.title,
                target: `${re.custom_target_value || re.exercises.target_value} ${re.exercises.target_unit}`,
                difficulty: re.exercises.difficulty,
                description: re.exercises.description,
                order_index: re.order_index,
                skill_categories_json: re.exercises.skill_categories_json,
                tags: re.exercises.tags,
                dupr_range_min: re.exercises.dupr_range_min,
                dupr_range_max: re.exercises.dupr_range_max
              }))
          }))
      };

      console.log('📝 Refreshed program data:', transformedProgram);
      setEditedProgram(transformedProgram);
      
      // Update selected routine if needed
      if (selectedRoutine) {
        const updatedSelectedRoutine = transformedProgram.routines.find(r => r.id === selectedRoutine.id);
        if (updatedSelectedRoutine) {
          setSelectedRoutine(updatedSelectedRoutine);
        } else {
          // Selected routine was deleted, select first available or null
          setSelectedRoutine(transformedProgram.routines.length > 0 ? transformedProgram.routines[0] : null);
        }
      }
      
    } catch (error) {
      console.error('❌ Error refreshing program data:', error);
    }
  };

  useEffect(() => {
    if (program) {
      setEditedProgram(JSON.parse(JSON.stringify(program))); // Deep clone
      // Select first routine by default if available
      if (program.routines && program.routines.length > 0) {
        setSelectedRoutine(program.routines[0]);
      }
    }
  }, [program]);

  // Refresh program data when modal becomes visible to ensure tags are loaded
  useEffect(() => {
    if (visible && program?.id) {
      refreshProgramData();
    }
  }, [visible, program?.id]);

  const handleProgramUpdated = async () => {
    // Refresh program data
    onSave && onSave();
    await refreshProgramData();
    setShowProgramModal(false);
  };

  const handleRoutineUpdated = async () => {
    // Refresh program data
    onSave && onSave();
    await refreshProgramData();
    setShowRoutineModal(false);
  };

  const handleExerciseUpdated = async () => {
    // Refresh program data
    onSave && onSave();
    await refreshProgramData();
    setShowExerciseModal(false);
  };

  const handleRoutineSelected = (routine) => {
    setSelectedRoutine(routine);
  };

  const getSelectedRoutineExercises = () => {
    if (!selectedRoutine) return [];
    return selectedRoutine.exercises || [];
  };

  const handleDeleteRoutine = (routine) => {
    console.log('🗑️ Delete routine clicked:', routine.name, routine.id);
    setRoutineToDelete(routine);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDeleteRoutine = async () => {
    if (!routineToDelete) return;
    
    console.log('✅ Confirming routine deletion:', routineToDelete.name);
    
    try {
      setLoading(true);
      setShowDeleteConfirmation(false);
      
      console.log('🚀 Calling delete routine API...');
      
      // Delete the routine using the secure admin function
      const { data, error } = await supabase
        .rpc('delete_routine_as_admin', {
          routine_id: routineToDelete.id
        });

      console.log('📥 Delete routine RPC result:', { data, error });

      if (error) {
        console.error('❌ Error deleting routine:', error);
        throw error;
      }

      if (data !== true) {
        console.error('❌ Delete returned unexpected value:', data);
        throw new Error(`Delete operation returned: ${data}`);
      }

      console.log('✅ Routine deleted successfully');
      Alert.alert('Success', `Routine "${routineToDelete.name}" has been deleted successfully.`);
      
      // Update local state immediately
      console.log('🔄 Updating local program state...');
      setEditedProgram(prevProgram => {
        const updatedProgram = {
          ...prevProgram,
          routines: prevProgram.routines.filter(routine => routine.id !== routineToDelete.id)
        };
        console.log('📝 Updated program state:', updatedProgram);
        return updatedProgram;
      });
      
      // If the deleted routine was selected, clear selection or select another routine
      if (selectedRoutine?.id === routineToDelete.id) {
        console.log('🔄 Clearing selected routine as it was deleted');
        // Use the routine to delete to filter, not the current state
        setSelectedRoutine(prevSelected => {
          const remainingRoutines = editedProgram.routines.filter(routine => routine.id !== routineToDelete.id);
          const newSelection = remainingRoutines.length > 0 ? remainingRoutines[0] : null;
          console.log('📝 New selected routine:', newSelection?.name || 'None');
          return newSelection;
        });
      }
      
      // Refresh both local and parent data
      console.log('🔄 Calling parent onSave callback...');
      onSave && onSave();
      
      // Also refresh local data as backup
      console.log('🔄 Refreshing local data as backup...');
      await refreshProgramData();
      
    } catch (error) {
      console.error('💥 Error deleting routine:', error);
      Alert.alert('Error', `Failed to delete routine: ${error.message}`);
    } finally {
      setLoading(false);
      setRoutineToDelete(null);
    }
  };

  const handleCancelDeleteRoutine = () => {
    console.log('❌ Cancelled routine deletion');
    setShowDeleteConfirmation(false);
    setRoutineToDelete(null);
  };

  const routineExercises = getSelectedRoutineExercises();

  const reorderRoutine = async (routineId, direction) => {
    if (!editedProgram?.routines || editedProgram.routines.length < 2) return;
    if (reorderingRoutineId !== null) return;

    const routines = [...editedProgram.routines];
    const currentIndex = routines.findIndex(routine => routine.id === routineId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= routines.length) return;

    const reorderedRoutines = [...routines];
    const [movedRoutine] = reorderedRoutines.splice(currentIndex, 1);
    reorderedRoutines.splice(targetIndex, 0, movedRoutine);

    const normalizedRoutines = reorderedRoutines.map((routine, index) => ({
      ...routine,
      order_index: index
    }));

    setEditedProgram(prevProgram => ({
      ...prevProgram,
      routines: normalizedRoutines
    }));

    setSelectedRoutine(prevRoutine => {
      if (!prevRoutine) return prevRoutine;
      const updatedSelection = normalizedRoutines.find(routine => routine.id === prevRoutine.id);
      return updatedSelection || prevRoutine;
    });

    setReorderingRoutineId(routineId);

    try {
      const results = await Promise.all(
        normalizedRoutines.map((routine, index) =>
          supabase
            .from('routines')
            .update({ order_index: index })
            .eq('id', routine.id)
        )
      );

      const erroredResult = results.find(result => result?.error);
      if (erroredResult?.error) {
        throw erroredResult.error;
      }

      onSave && onSave();
      await refreshProgramData();
    } catch (error) {
      console.error('Error reordering routines:', error);
      Alert.alert('Error', `Failed to reorder routines: ${error.message}`);
      await refreshProgramData();
    } finally {
      setReorderingRoutineId(null);
    }
  };

  const reorderExercise = async (routineId, routineExerciseId, direction) => {
    if (!routineId || !routineExerciseId) return;
    if (reorderingExerciseId !== null) return;

    const routine = editedProgram?.routines?.find(r => r.id === routineId);
    if (!routine || !routine.exercises || routine.exercises.length < 2) return;

    const exercises = [...routine.exercises];
    const currentIndex = exercises.findIndex(exercise => exercise.routineExerciseId === routineExerciseId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    const reorderedExercises = [...exercises];
    const [movedExercise] = reorderedExercises.splice(currentIndex, 1);
    reorderedExercises.splice(targetIndex, 0, movedExercise);

    const normalizedExercises = reorderedExercises.map((exercise, index) => ({
      ...exercise,
      order_index: index
    }));

    setEditedProgram(prevProgram => {
      if (!prevProgram?.routines) {
        return prevProgram;
      }

      const updatedRoutines = prevProgram.routines.map(routineItem => {
        if (routineItem.id !== routineId) return routineItem;
        return {
          ...routineItem,
          exercises: normalizedExercises
        };
      });

      return {
        ...prevProgram,
        routines: updatedRoutines
      };
    });

    setSelectedRoutine(prevRoutine => {
      if (!prevRoutine || prevRoutine.id !== routineId) return prevRoutine;
      return {
        ...prevRoutine,
        exercises: normalizedExercises
      };
    });

    setReorderingExerciseId(routineExerciseId);

    try {
      const results = await Promise.all(
        normalizedExercises.map((exercise, index) =>
          supabase
            .from('routine_exercises')
            .update({ order_index: index })
            .eq('id', exercise.routineExerciseId)
        )
      );

      const erroredResult = results.find(result => result?.error);
      if (erroredResult?.error) {
        throw erroredResult.error;
      }

      onSave && onSave();
      await refreshProgramData();
    } catch (error) {
      console.error('Error reordering exercises:', error);
      Alert.alert('Error', `Failed to reorder exercises: ${error.message}`);
      await refreshProgramData();
    } finally {
      setReorderingExerciseId(null);
    }
  };


  if (!editedProgram) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>Edit Program Structure</Text>
              <Text style={styles.subtitle}>{editedProgram.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Three Column Layout */}
        <View style={styles.columnsContainer}>
          {/* Column 1: Program Details */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Ionicons name="library-outline" size={24} color="#3B82F6" />
              <Text style={styles.columnTitle}>Program</Text>
            </View>
            <ScrollView style={styles.columnContent}>
              <View style={styles.programCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.programName}>{editedProgram.name}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setShowProgramModal(true)}
                  >
                    <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.programDescription}>
                  {editedProgram.description || 'No description'}
                </Text>
                <View style={styles.programMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue}>{editedProgram.category}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Tier</Text>
                    <Text style={styles.metaValue}>{editedProgram.tier}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Routines</Text>
                    <Text style={styles.metaValue}>{editedProgram.routines?.length || 0}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Total Exercises</Text>
                    <Text style={styles.metaValue}>
                      {editedProgram.routines?.reduce((total, routine) => 
                        total + (routine.exercises?.length || 0), 0
                      ) || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Column 2: Routines */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Ionicons name="play-circle-outline" size={24} color="#10B981" />
              <Text style={styles.columnTitle}>Routines</Text>
            </View>
            <ScrollView style={styles.columnContent}>
              {editedProgram.routines && editedProgram.routines.length > 0 ? (
                editedProgram.routines.map((routine, index) => {
                  const isFirstRoutine = index === 0;
                  const isLastRoutine = index === editedProgram.routines.length - 1;
                  const disableMoveUp = isFirstRoutine || reorderingRoutineId !== null;
                  const disableMoveDown = isLastRoutine || reorderingRoutineId !== null;
                  const upIconColor = disableMoveUp ? '#D1D5DB' : '#10B981';
                  const downIconColor = disableMoveDown ? '#D1D5DB' : '#10B981';

                  return (
                    <View
                      key={routine.id}
                      style={[
                        styles.routineCard,
                        selectedRoutine?.id === routine.id && styles.selectedRoutineCard
                      ]}
                    >
                    <TouchableOpacity
                      style={styles.routineClickableArea}
                      onPress={() => handleRoutineSelected(routine)}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.routineName}>{routine.name}</Text>
                        <View style={styles.cardHeaderRight}>
                          <View style={styles.reorderControls}>
                            <TouchableOpacity
                              style={[
                                styles.reorderButton,
                                disableMoveUp && styles.reorderButtonDisabled
                              ]}
                              disabled={disableMoveUp}
                              onPress={(e) => {
                                e.stopPropagation();
                                if (!disableMoveUp) {
                                  reorderRoutine(routine.id, 'up');
                                }
                              }}
                            >
                              <Ionicons name="chevron-up" size={14} color={upIconColor} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.reorderButton,
                                disableMoveDown && styles.reorderButtonDisabled
                              ]}
                              disabled={disableMoveDown}
                              onPress={(e) => {
                                e.stopPropagation();
                                if (!disableMoveDown) {
                                  reorderRoutine(routine.id, 'down');
                                }
                              }}
                            >
                              <Ionicons name="chevron-down" size={14} color={downIconColor} />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.routineOrder}>#{index + 1}</Text>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedRoutine(routine);
                              setShowRoutineModal(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color="#10B981" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteRoutine(routine);
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.routineDescription}>
                        {routine.description || 'No description'}
                      </Text>
                      <View style={styles.routineStats}>
                        <Text style={styles.routineStat}>
                          {routine.exercises?.length || 0} exercises
                        </Text>
                        <Text style={styles.routineStat}>
                          {routine.time_estimate_minutes || 0} min
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No routines available</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Column 3: Exercises */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Ionicons name="fitness-outline" size={24} color="#F59E0B" />
              <Text style={styles.columnTitle}>
                Exercises {selectedRoutine ? `- ${selectedRoutine.name}` : ''}
              </Text>
            </View>
            <ScrollView style={styles.columnContent}>
              {routineExercises.length > 0 ? (
                routineExercises.map((exercise, index) => {
                  const hasRoutineExerciseId = Boolean(exercise.routineExerciseId);
                  const isFirstExercise = index === 0;
                  const isLastExercise = index === routineExercises.length - 1;
                  const disableMoveUp = isFirstExercise || reorderingExerciseId !== null || !hasRoutineExerciseId;
                  const disableMoveDown = isLastExercise || reorderingExerciseId !== null || !hasRoutineExerciseId;
                  const upIconColor = disableMoveUp ? '#FCD34D' : '#F59E0B';
                  const downIconColor = disableMoveDown ? '#FCD34D' : '#F59E0B';

                  return (
                    <View key={exercise.routineExerciseId || exercise.id || index} style={styles.exerciseCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.exerciseName}>{exercise.name || exercise.title}</Text>
                        <View style={styles.cardHeaderRight}>
                          <View style={styles.reorderControls}>
                            <TouchableOpacity
                              style={[
                                styles.reorderButton,
                                disableMoveUp && styles.reorderButtonDisabled
                              ]}
                              disabled={disableMoveUp}
                              onPress={() => {
                                if (!disableMoveUp && selectedRoutine) {
                                  reorderExercise(selectedRoutine.id, exercise.routineExerciseId, 'up');
                                }
                              }}
                            >
                              <Ionicons name="chevron-up" size={14} color={upIconColor} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.reorderButton,
                                disableMoveDown && styles.reorderButtonDisabled
                              ]}
                              disabled={disableMoveDown}
                              onPress={() => {
                                if (!disableMoveDown && selectedRoutine) {
                                  reorderExercise(selectedRoutine.id, exercise.routineExerciseId, 'down');
                                }
                              }}
                            >
                              <Ionicons name="chevron-down" size={14} color={downIconColor} />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.exerciseOrder}>#{index + 1}</Text>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={async () => {
                              try {
                                // Fetch complete exercise data from database using the code or id
                                let data = null;
                                let error = null;

                                const exerciseIdFromRoutine = exercise.exerciseId || null;

                                const { data: dataByCode, error: errorByCode } = await supabase
                                  .from('exercises')
                                  .select('*')
                                  .eq('code', exercise.id)
                                  .single();

                                if (!errorByCode && dataByCode) {
                                  data = dataByCode;
                                  error = errorByCode;
                                } else {
                                  const { data: dataById, error: errorById } = await supabase
                                    .from('exercises')
                                    .select('*')
                                    .eq('id', exerciseIdFromRoutine || exercise.id)
                                    .single();

                                  data = dataById;
                                  error = errorById;
                                }

                                if (error) throw error;

                                if (data) {
                                  const exerciseDetails = {
                                    ...data,
                                    routine_exercise_id: exercise.routineExerciseId || null,
                                    routine_id: selectedRoutine?.id || null,
                                    routine_name: selectedRoutine?.name || null,
                                    program_id: editedProgram?.id || null,
                                    program_name: editedProgram?.name || null
                                  };
                                  setSelectedExercise(exerciseDetails);
                                  setShowExerciseModal(true);
                                } else {
                                  Alert.alert('Error', 'Could not find exercise data');
                                }
                              } catch (error) {
                                console.error('Error fetching exercise data:', error);
                                Alert.alert('Error', 'Failed to load exercise data: ' + error.message);
                              }
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color="#F59E0B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.exerciseTarget}>{exercise.target}</Text>

                      {/* Tags Section */}
                      {(() => {
                        // Helper function to normalize tags/categories to an array
                        const normalizeToArray = (value) => {
                          if (!value) return [];
                          if (Array.isArray(value)) return value;
                          if (typeof value === 'string') {
                            try {
                              // Try to parse as JSON first
                              const parsed = JSON.parse(value);
                              return Array.isArray(parsed) ? parsed : [];
                            } catch (e) {
                              // If not JSON, treat as comma-separated string
                              return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                            }
                          }
                          return [];
                        };

                        const tags = normalizeToArray(exercise.skill_categories_json || exercise.tags);

                        if (tags.length === 0) return null;

                        return (
                          <View style={styles.tagsContainer}>
                            <Text style={styles.tagsLabel}>Tags: </Text>
                            <View style={styles.tagsRow}>
                              {tags.map((tag, tagIndex) => (
                                <Text key={tagIndex} style={styles.tagText}>
                                  {tag}{tagIndex < tags.length - 1 ? ' • ' : ''}
                                </Text>
                              ))}
                            </View>
                          </View>
                        );
                      })()}

                      {/* DUPR Range Section */}
                      {exercise.dupr_range_min && exercise.dupr_range_max && (
                        <View style={styles.duprRangeContainer}>
                          <Text style={styles.duprRangeLabel}>DUPR Range: </Text>
                          <View style={styles.duprRangeBadge}>
                            <Text style={styles.duprRangeText}>
                              {exercise.dupr_range_min}–{exercise.dupr_range_max}
                            </Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.exerciseFooter}>
                        {exercise.difficulty && (
                          <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyText}>Difficulty: {exercise.difficulty}/5</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {selectedRoutine ? 'No exercises in this routine' : 'Select a routine to view exercises'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Edit Modals */}
        <WebCreateProgramModal
          visible={showProgramModal}
          onClose={() => setShowProgramModal(false)}
          onSuccess={handleProgramUpdated}
          editingProgram={editedProgram}
        />

        <WebCreateRoutineModal
          visible={showRoutineModal}
          onClose={() => setShowRoutineModal(false)}
          onSuccess={handleRoutineUpdated}
          editingRoutine={selectedRoutine}
          programId={editedProgram.id}
        />

        <WebCreateExerciseModal
          visible={showExerciseModal}
          onClose={() => setShowExerciseModal(false)}
          onSuccess={handleExerciseUpdated}
          editingExercise={selectedExercise}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContainer}>
              <View style={styles.deleteModalHeader}>
                <Ionicons name="warning" size={24} color="#EF4444" />
                <Text style={styles.deleteModalTitle}>Delete Routine</Text>
              </View>
              
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete "{routineToDelete?.name}"? 
                {'\n\n'}
                This action cannot be undone and will also delete all exercises in this routine.
              </Text>
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity 
                  style={styles.deleteModalCancelButton}
                  onPress={handleCancelDeleteRoutine}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteModalConfirmButton}
                  onPress={handleConfirmDeleteRoutine}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteModalConfirmText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      paddingTop: 20,
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  columnContent: {
    flex: 1,
    padding: 20,
  },

  // Common Card Styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderControls: {
    flexDirection: 'column',
    marginRight: 8,
    alignItems: 'center',
  },
  reorderButton: {
    width: 28,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  routineClickableArea: {
    flex: 1,
  },

  // Program Card
  programCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  programName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  programMeta: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Routine Card
  routineCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  selectedRoutineCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#ECFDF5',
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  routineOrder: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routineDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  routineStats: {
    flexDirection: 'row',
    gap: 12,
  },
  routineStat: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  exerciseOrder: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  tagsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 4,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tagText: {
    fontSize: 10,
    color: '#9CA3AF',
    lineHeight: 14,
  },
  difficultyBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // DUPR Range Styles
  duprRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  duprRangeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 6,
    fontWeight: '500',
  },
  duprRangeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  duprRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Delete Modal Styles
  deleteModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    }),
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
