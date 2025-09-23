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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import WebCreateProgramModal from './WebCreateProgramModal';
import WebCreateRoutineModal from './WebCreateRoutineModal';
import WebCreateExerciseModal from './WebCreateExerciseModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EditableProgramStructureModal({ visible, program, onClose, onSave }) {
  const [editedProgram, setEditedProgram] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // Modal states
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  useEffect(() => {
    if (program) {
      setEditedProgram(JSON.parse(JSON.stringify(program))); // Deep clone
      // Select first routine by default if available
      if (program.routines && program.routines.length > 0) {
        setSelectedRoutine(program.routines[0]);
      }
    }
  }, [program]);

  const handleProgramUpdated = () => {
    // Refresh program data
    onSave && onSave();
    setShowProgramModal(false);
  };

  const handleRoutineUpdated = () => {
    // Refresh program data
    onSave && onSave();
    setShowRoutineModal(false);
  };

  const handleExerciseUpdated = () => {
    // Refresh program data
    onSave && onSave();
    setShowExerciseModal(false);
  };

  const handleRoutineSelected = (routine) => {
    setSelectedRoutine(routine);
  };

  const getSelectedRoutineExercises = () => {
    if (!selectedRoutine) return [];
    return selectedRoutine.exercises || [];
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
                editedProgram.routines.map((routine, index) => (
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
                ))
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
              {getSelectedRoutineExercises().length > 0 ? (
                getSelectedRoutineExercises().map((exercise, index) => (
                  <View key={`${exercise.id}-${index}`} style={styles.exerciseCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.exerciseName}>{exercise.name || exercise.title}</Text>
                      <View style={styles.cardHeaderRight}>
                        <Text style={styles.exerciseOrder}>#{index + 1}</Text>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setSelectedExercise(exercise);
                            setShowExerciseModal(true);
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color="#F59E0B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.exerciseTarget}>{exercise.target}</Text>
                    <View style={styles.exerciseFooter}>
                      {exercise.difficulty && (
                        <View style={styles.difficultyBadge}>
                          <Text style={styles.difficultyText}>Difficulty: {exercise.difficulty}/5</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
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
});
