import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExercisesTable({
  exercises,
  loading,
  searchQuery,
  exerciseSortField,
  exerciseSortDirection,
  setExerciseSortField,
  setExerciseSortDirection,
  exerciseFilterProgram,
  setExerciseFilterProgram,
  exerciseFilterRoutine,
  setExerciseFilterRoutine,
  exerciseProgramOptions,
  exerciseRoutineOptions,
  showProgramFilterDropdown,
  setShowProgramFilterDropdown,
  showRoutineFilterDropdown,
  setShowRoutineFilterDropdown,
  togglePublishStatus,
  handleEditExercise,
  handleDeleteExercise,
  activeDropdown,
  setActiveDropdown,
  styles
}) {
  let filteredExercises = exercises.filter(exercise =>
    exercise.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.skill_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exercise.dupr_range_min && exercise.dupr_range_max &&
      `${exercise.dupr_range_min}–${exercise.dupr_range_max}`.includes(searchQuery))
  );

  if (exerciseFilterProgram) {
    filteredExercises = filteredExercises.filter(exercise =>
      (exercise.linkedPrograms || []).some(program => program?.name === exerciseFilterProgram)
    );
  }

  if (exerciseFilterRoutine) {
    filteredExercises = filteredExercises.filter(exercise =>
      (exercise.linkedRoutines || []).some(routine => routine?.name === exerciseFilterRoutine)
    );
  }

  if (exerciseSortField === 'program') {
    filteredExercises = [...filteredExercises].sort((a, b) => {
      const aValue = a.primaryProgramName || '';
      const bValue = b.primaryProgramName || '';
      if (exerciseSortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  } else if (exerciseSortField === 'routine') {
    filteredExercises = [...filteredExercises].sort((a, b) => {
      const aValue = a.primaryRoutineName || '';
      const bValue = b.primaryRoutineName || '';
      if (exerciseSortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  }

  return (
    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTextGroup}>
          <Text style={styles.sectionTitle}>Exercise Library</Text>
          <Text style={styles.sectionSubtitle}>Manage individual exercises and drills</Text>
        </View>
        <View style={styles.exerciseFiltersContainer}>
          <View style={[
            styles.exerciseFilterWrapper,
            showProgramFilterDropdown && styles.exerciseFilterWrapperActive
          ]}>
            <TouchableOpacity
              style={[
                styles.dropdown,
                styles.exerciseFilterDropdown,
                !exerciseFilterProgram && styles.dropdownPlaceholder
              ]}
              onPress={() => {
                setShowProgramFilterDropdown(prev => !prev);
                setShowRoutineFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !exerciseFilterProgram && styles.dropdownPlaceholderText
                ]}
              >
                {exerciseFilterProgram ? exerciseFilterProgram : 'All Programs'}
              </Text>
              <Ionicons
                name={showProgramFilterDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
            {showProgramFilterDropdown && (
              <View style={styles.exerciseFilterDropdownList}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setExerciseFilterProgram(null);
                      setShowProgramFilterDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>All Programs</Text>
                  </TouchableOpacity>
                  {exerciseProgramOptions.map(programName => (
                    <TouchableOpacity
                      key={programName}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setExerciseFilterProgram(programName);
                        setShowProgramFilterDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{programName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={[
            styles.exerciseFilterWrapper,
            showRoutineFilterDropdown && styles.exerciseFilterWrapperActive
          ]}>
            <TouchableOpacity
              style={[
                styles.dropdown,
                styles.exerciseFilterDropdown,
                !exerciseFilterRoutine && styles.dropdownPlaceholder
              ]}
              onPress={() => {
                setShowRoutineFilterDropdown(prev => !prev);
                setShowProgramFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !exerciseFilterRoutine && styles.dropdownPlaceholderText
                ]}
              >
                {exerciseFilterRoutine ? exerciseFilterRoutine : 'All Routines'}
              </Text>
              <Ionicons
                name={showRoutineFilterDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
            {showRoutineFilterDropdown && (
              <View style={styles.exerciseFilterDropdownList}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setExerciseFilterRoutine(null);
                      setShowRoutineFilterDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>All Routines</Text>
                  </TouchableOpacity>
                  {exerciseRoutineOptions.map(routineName => (
                    <TouchableOpacity
                      key={routineName}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setExerciseFilterRoutine(routineName);
                        setShowRoutineFilterDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{routineName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : (
        <View style={styles.modernTable}>
          <View style={styles.modernTableHeader}>
            <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Exercise</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Description</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Difficulty</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Categories</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Range</Text>
            <TouchableOpacity
              style={{ flex: 1.2 }}
              onPress={() => {
                if (exerciseSortField === 'program') {
                  setExerciseSortDirection(exerciseSortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setExerciseSortField('program');
                  setExerciseSortDirection('asc');
                }
              }}
            >
              <View style={styles.sortableHeader}>
                <Text style={styles.modernTableHeaderText}>Program</Text>
                {exerciseSortField === 'program' && (
                  <Ionicons
                    name={exerciseSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#3B82F6"
                  />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1.2 }}
              onPress={() => {
                if (exerciseSortField === 'routine') {
                  setExerciseSortDirection(exerciseSortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setExerciseSortField('routine');
                  setExerciseSortDirection('asc');
                }
              }}
            >
              <View style={styles.sortableHeader}>
                <Text style={styles.modernTableHeaderText}>Routine</Text>
                {exerciseSortField === 'routine' && (
                  <Ionicons
                    name={exerciseSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#3B82F6"
                  />
                )}
              </View>
            </TouchableOpacity>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Type</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
          </View>
          <ScrollView style={styles.modernTableBody}>
            {filteredExercises.length > 0 ? filteredExercises.map(exercise => (
              <View key={exercise.id} style={styles.modernTableRow}>
                <View style={[styles.modernTableCell, { flex: 2 }]}>
                  <View style={styles.exerciseInfoContainer}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseTitle}>{exercise.title || exercise.code}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.code && exercise.title !== exercise.code && `Code: ${exercise.code}`}
                      </Text>
                      {exercise.estimated_minutes && (
                        <Text style={styles.exerciseMeta}>
                          ⏱️ {exercise.estimated_minutes} min
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.modernTableCell, { flex: 2 }]}>
                  <Text style={styles.exerciseDescription} numberOfLines={2}>
                    {exercise.description || exercise.instructions || '—'}
                  </Text>
                  {exercise.goal && (
                    <Text style={styles.exerciseGoal} numberOfLines={1}>
                      Goal: {exercise.goal}
                    </Text>
                  )}
                </View>

                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.difficultyContainer}>
                    <View style={styles.difficultyStars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= (exercise.difficulty || 1) ? 'star' : 'star-outline'}
                          size={12}
                          color={star <= (exercise.difficulty || 1) ? '#F59E0B' : '#E5E7EB'}
                        />
                      ))}
                    </View>
                    <Text style={styles.difficultyText}>{exercise.difficulty || 1}/5</Text>
                  </View>
                </View>

                <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                  <View style={styles.exerciseCategoriesContainer}>
                    {exercise.skill_categories_json && Array.isArray(exercise.skill_categories_json) ? (
                      exercise.skill_categories_json.slice(0, 2).map((category, index) => (
                        <View key={index} style={styles.exerciseCategoryTag}>
                          <Text style={styles.exerciseCategoryText}>{category}</Text>
                        </View>
                      ))
                    ) : exercise.skill_category ? (
                      exercise.skill_category.split(',').slice(0, 2).map((category, index) => (
                        <View key={index} style={styles.exerciseCategoryTag}>
                          <Text style={styles.exerciseCategoryText}>{category.trim()}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noCategoryText}>—</Text>
                    )}
                    {((exercise.skill_categories_json && exercise.skill_categories_json.length > 2) ||
                      (exercise.skill_category && exercise.skill_category.split(',').length > 2)) && (
                      <Text style={styles.moreCategoriesText}>
                        +{((exercise.skill_categories_json && exercise.skill_categories_json.length) ||
                          (exercise.skill_category && exercise.skill_category.split(',').length) || 0) - 2} more
                      </Text>
                    )}
                  </View>
                </View>

                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  {exercise.dupr_range_min && exercise.dupr_range_max ? (
                    <View style={styles.duprRangeBadge}>
                      <Text style={styles.duprRangeText}>
                        {exercise.dupr_range_min}–{exercise.dupr_range_max}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noDuprRangeText}>—</Text>
                  )}
                </View>

                <View style={[styles.modernTableCell, { flex: 1.2 }]}>
                  {exercise.linkedPrograms && exercise.linkedPrograms.length > 0 ? (
                    <View style={styles.exerciseProgramContainer}>
                      <Text style={styles.programNameText}>{exercise.linkedPrograms[0].name}</Text>
                      {exercise.linkedPrograms.length > 1 && (
                        <Text style={styles.moreProgramsText}>+{exercise.linkedPrograms.length - 1} more</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noProgramText}>—</Text>
                  )}
                </View>

                <View style={[styles.modernTableCell, { flex: 1.2 }]}>
                  {exercise.linkedRoutines && exercise.linkedRoutines.length > 0 ? (
                    <View style={styles.exerciseRoutineContainer}>
                      <Text style={styles.routineNameText}>{exercise.linkedRoutines[0].name}</Text>
                      {exercise.linkedRoutines.length > 1 && (
                        <Text style={styles.moreRoutinesText}>+{exercise.linkedRoutines.length - 1} more</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noRoutineText}>—</Text>
                  )}
                </View>

                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={[
                    styles.exerciseTypeBadge,
                    exercise.created_by ? styles.userCreatedBadge : styles.defaultBadge
                  ]}>
                    <Text style={[
                      styles.exerciseTypeText,
                      exercise.created_by ? styles.userCreatedText : styles.defaultText
                    ]}>
                      {exercise.created_by ? 'User' : 'Default'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[
                      styles.modernStatusChip,
                      exercise.is_published ? styles.publishedStatusChip : styles.draftStatusChip
                    ]}
                    onPress={() => togglePublishStatus('exercise', exercise.id, exercise.is_published)}
                  >
                    <Text style={[
                      styles.modernStatusText,
                      exercise.is_published ? styles.publishedStatusText : styles.draftStatusText
                    ]}>
                      {exercise.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.modernActionButtons}>
                    <TouchableOpacity style={styles.modernActionButton}>
                      <Ionicons name="eye-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modernActionButton}
                      onPress={() => handleEditExercise(exercise)}
                    >
                      <Ionicons name="create-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.modernActionButton}
                        onPress={() => {
                          const newDropdown = activeDropdown === exercise.id ? null : exercise.id;
                          setActiveDropdown(newDropdown);
                        }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      {activeDropdown === exercise.id && (
                        <View style={styles.dropdownMenu}>
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleDeleteExercise(exercise)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )) : (
              <View style={styles.comingSoon}>
                <Ionicons name="fitness-outline" size={48} color="#9CA3AF" />
                <Text style={styles.comingSoonText}>No exercises found</Text>
                <Text style={styles.comingSoonSubtext}>
                  {searchQuery ? 'Try adjusting your search criteria' : 'Create your first exercise to get started'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}


