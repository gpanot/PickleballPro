import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProgramStructureModal({ visible, program, onClose }) {
  if (!program) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerInfo}>
              <Ionicons name="library-outline" size={24} color="#1F2937" />
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>{program.name} - Structure</Text>
                <Text style={styles.modalSubtitle}>
                  Program hierarchy showing routines and exercises in a horizontal tree view
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Tree Structure */}
          <ScrollView 
            style={styles.treeContainer}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.treeContent}>
              {/* Program Section */}
              <View style={styles.treeSection}>
                <View style={styles.programCard}>
                  <View style={styles.programIcon}>
                    <Ionicons name="library-outline" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.programName}>{program.name}</Text>
                  <Text style={styles.programTier}>{program.tier || 'Beginner'}</Text>
                  <Text style={styles.programCategory}>{program.category}</Text>
                  <Text style={styles.programMeta}>
                    {program.routines?.length || 0} routines • {
                      program.routines?.reduce((total, routine) => 
                        total + (routine.exercises?.length || 0), 0
                      ) || 0
                    } exercises
                  </Text>
                </View>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </View>

              {/* Routines Section */}
              <View style={styles.treeSection}>
                <ScrollView style={styles.routinesContainer} showsVerticalScrollIndicator={false}>
                  {program.routines && program.routines.length > 0 ? (
                    program.routines
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((routine, index) => (
                        <View key={routine.id} style={styles.routineCard}>
                          <View style={styles.routineHeader}>
                            <View style={styles.routineIcon}>
                              <Ionicons name="play-circle-outline" size={16} color="#10B981" />
                            </View>
                            <View style={styles.routineInfo}>
                              <Text style={styles.routineName}>{routine.name}</Text>
                              <Text style={styles.routineOrder}>Order: {routine.order_index || index + 1}</Text>
                            </View>
                          </View>
                          <Text style={styles.routineMeta}>
                            {routine.exercises?.length || 0} exercises
                          </Text>
                          
                          {/* Arrow to exercises */}
                          <View style={styles.smallArrowContainer}>
                            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                          </View>
                        </View>
                      ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No routines</Text>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </View>

              {/* Exercises Section */}
              <View style={styles.treeSection}>
                <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
                  {program.routines && program.routines.length > 0 ? (
                    program.routines
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((routine) => 
                        routine.exercises && routine.exercises.length > 0 ? (
                          routine.exercises
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((exercise, exerciseIndex) => (
                              <View key={`${routine.id}-${exercise.id}`} style={styles.exerciseCard}>
                                <View style={styles.exerciseHeader}>
                                  <View style={styles.exerciseIcon}>
                                    <Ionicons name="fitness-outline" size={14} color="#F59E0B" />
                                  </View>
                                  <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <Text style={styles.exerciseOrder}>
                                      {routine.order_index || 1}.{exerciseIndex + 1}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.exerciseDetails}>
                                  <View style={styles.exerciseTarget}>
                                    <Ionicons name="target-outline" size={12} color="#6B7280" />
                                    <Text style={styles.exerciseTargetText}>{exercise.target}</Text>
                                  </View>
                                  {exercise.difficulty && (
                                    <View style={styles.difficultyContainer}>
                                      <Text style={styles.difficultyText}>{exercise.difficulty}/5</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))
                        ) : null
                      )
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No exercises</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxWidth: 1200,
    width: '100%',
    maxHeight: '80%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#F3F4F6',
      },
    }),
  },
  treeContainer: {
    flex: 1,
    padding: 24,
  },
  treeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 400,
  },
  treeSection: {
    minWidth: 280,
    maxWidth: 280,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    minHeight: 200,
  },
  smallArrowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  // Program Card
  programCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  programTier: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  programCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  programMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Routines
  routinesContainer: {
    maxHeight: 400,
  },
  routineCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  routineOrder: {
    fontSize: 12,
    color: '#6B7280',
  },
  routineMeta: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  // Exercises
  exercisesContainer: {
    maxHeight: 400,
  },
  exerciseCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  exerciseOrder: {
    fontSize: 11,
    color: '#6B7280',
  },
  exerciseDetails: {
    gap: 4,
  },
  exerciseTarget: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseTargetText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  difficultyContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
