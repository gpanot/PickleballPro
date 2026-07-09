import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pagination from './Pagination';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = Platform.OS !== 'web' || SCREEN_WIDTH < 768;
const DEFAULT_PAGE_SIZE = 50;

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
  styles,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, exerciseFilterProgram, exerciseFilterRoutine]);

  let filteredExercises = exercises.filter(
    (exercise) =>
      exercise.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.skill_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exercise.dupr_range_min && exercise.dupr_range_max &&
        `${exercise.dupr_range_min}–${exercise.dupr_range_max}`.includes(searchQuery))
  );

  if (exerciseFilterProgram) {
    filteredExercises = filteredExercises.filter((exercise) =>
      (exercise.linkedPrograms || []).some((program) => program?.name === exerciseFilterProgram)
    );
  }

  if (exerciseFilterRoutine) {
    filteredExercises = filteredExercises.filter((exercise) =>
      (exercise.linkedRoutines || []).some((routine) => routine?.name === exerciseFilterRoutine)
    );
  }

  if (exerciseSortField === 'program') {
    filteredExercises = [...filteredExercises].sort((a, b) => {
      const aValue = a.primaryProgramName || '';
      const bValue = b.primaryProgramName || '';
      return exerciseSortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  } else if (exerciseSortField === 'routine') {
    filteredExercises = [...filteredExercises].sort((a, b) => {
      const aValue = a.primaryRoutineName || '';
      const bValue = b.primaryRoutineName || '';
      return exerciseSortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  const totalCount = filteredExercises.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredExercises.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };

  const SortButton = ({ field, label, flex }) => (
    <TouchableOpacity
      style={{ flex, flexDirection: 'row', alignItems: 'center' }}
      onPress={() => {
        if (exerciseSortField === field) {
          setExerciseSortDirection(exerciseSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setExerciseSortField(field);
          setExerciseSortDirection('asc');
        }
      }}
    >
      <Text style={styles.modernTableHeaderText}>{label}</Text>
      {exerciseSortField === field ? (
        <Ionicons
          name={exerciseSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
          size={13} color="#3B82F6" style={{ marginLeft: 4 }}
        />
      ) : (
        <Ionicons name="swap-vertical-outline" size={13} color="#CBD5E1" style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );

  const hasActiveFilters = !!(exerciseFilterProgram || exerciseFilterRoutine || searchQuery);

  return (
    <View style={styles.contentSection}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTextGroup}>
          <Text style={styles.sectionTitle}>
            Exercise Library
            <Text style={{ color: '#9CA3AF', fontWeight: '400', fontSize: 15 }}>
              {' '}({totalCount.toLocaleString()}{totalCount !== exercises.length ? ` of ${exercises.length}` : ''})
            </Text>
          </Text>
          <Text style={styles.sectionSubtitle}>Manage individual exercises and drills</Text>
        </View>
        <View style={styles.exerciseFiltersContainer}>
          {/* Program filter */}
          <View style={[styles.exerciseFilterWrapper, showProgramFilterDropdown && styles.exerciseFilterWrapperActive]}>
            <TouchableOpacity
              style={[styles.dropdown, styles.exerciseFilterDropdown, !exerciseFilterProgram && styles.dropdownPlaceholder]}
              onPress={() => { setShowProgramFilterDropdown((prev) => !prev); setShowRoutineFilterDropdown(false); }}
            >
              <Text style={[styles.dropdownText, !exerciseFilterProgram && styles.dropdownPlaceholderText]} numberOfLines={1}>
                {exerciseFilterProgram || 'All Programs'}
              </Text>
              <Ionicons name={showProgramFilterDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Routine filter */}
          <View style={[styles.exerciseFilterWrapper, showRoutineFilterDropdown && styles.exerciseFilterWrapperActive]}>
            <TouchableOpacity
              style={[styles.dropdown, styles.exerciseFilterDropdown, !exerciseFilterRoutine && styles.dropdownPlaceholder]}
              onPress={() => { setShowRoutineFilterDropdown((prev) => !prev); setShowProgramFilterDropdown(false); }}
            >
              <Text style={[styles.dropdownText, !exerciseFilterRoutine && styles.dropdownPlaceholderText]} numberOfLines={1}>
                {exerciseFilterRoutine || 'All Routines'}
              </Text>
              <Ionicons name={showRoutineFilterDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Clear filters */}
          {hasActiveFilters && (exerciseFilterProgram || exerciseFilterRoutine) && (
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' }}
              onPress={() => { setExerciseFilterProgram(null); setExerciseFilterRoutine(null); }}
            >
              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter dropdowns */}
      {showProgramFilterDropdown && (
        <View style={styles.exerciseFilterDropdownContainer}>
          <ScrollView style={styles.exerciseFilterDropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExerciseFilterProgram(null); setShowProgramFilterDropdown(false); }}>
              <Text style={[styles.dropdownOptionText, { color: '#9CA3AF' }]}>All Programs</Text>
            </TouchableOpacity>
            {exerciseProgramOptions.map((name) => (
              <TouchableOpacity key={name} style={[styles.dropdownOption, exerciseFilterProgram === name && { backgroundColor: '#F0F9FF' }]}
                onPress={() => { setExerciseFilterProgram(name); setShowProgramFilterDropdown(false); }}>
                <Text style={[styles.dropdownOptionText, exerciseFilterProgram === name && { color: '#0369A1', fontWeight: '600' }]}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showRoutineFilterDropdown && (
        <View style={styles.exerciseFilterAbsoluteDropdown}>
          <ScrollView style={styles.exerciseFilterDropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.dropdownOption} onPress={() => { setExerciseFilterRoutine(null); setShowRoutineFilterDropdown(false); }}>
              <Text style={[styles.dropdownOptionText, { color: '#9CA3AF' }]}>All Routines</Text>
            </TouchableOpacity>
            {exerciseRoutineOptions.map((name) => (
              <TouchableOpacity key={name} style={[styles.dropdownOption, exerciseFilterRoutine === name && { backgroundColor: '#F0F9FF' }]}
                onPress={() => { setExerciseFilterRoutine(name); setShowRoutineFilterDropdown(false); }}>
                <Text style={[styles.dropdownOptionText, exerciseFilterRoutine === name && { color: '#0369A1', fontWeight: '600' }]}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.contentSectionWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        ) : (
          <ScrollView horizontal={IS_MOBILE} showsHorizontalScrollIndicator={IS_MOBILE}>
          <View style={[styles.modernTable, IS_MOBILE && { minWidth: 700 }]}>
            {/* Table header */}
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Exercise</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.8 }]}>Description</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 0.9 }]}>Difficulty</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.3 }]}>Categories</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Level</Text>
              <SortButton field="program" label="Program" flex={1.1} />
              <SortButton field="routine" label="Routine" flex={1.1} />
              <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Type</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 0.9 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 0.9 }]}>Actions</Text>
            </View>

            {/* Rows */}
            {paginated.length > 0 ? (
              paginated.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  activeOpacity={1}
                  onMouseEnter={() => Platform.OS === 'web' && setHoveredRow(exercise.id)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoveredRow(null)}
                  style={[
                    styles.modernTableRow,
                    hoveredRow === exercise.id && { backgroundColor: '#F8FAFC' },
                  ]}
                >
                  {/* Exercise */}
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <Text style={styles.exerciseTitle} numberOfLines={1}>{exercise.title || exercise.code}</Text>
                    {exercise.code && exercise.title !== exercise.code && (
                      <Text style={styles.exerciseMeta}>{exercise.code}</Text>
                    )}
                    {exercise.estimated_minutes && (
                      <Text style={styles.exerciseMeta}>⏱ {exercise.estimated_minutes} min</Text>
                    )}
                  </View>

                  {/* Description */}
                  <View style={[styles.modernTableCell, { flex: 1.8 }]}>
                    <Text style={styles.exerciseDescription} numberOfLines={2}>
                      {exercise.description || exercise.instructions || '—'}
                    </Text>
                    {exercise.goal && (
                      <Text style={styles.exerciseGoal} numberOfLines={1}>Goal: {exercise.goal}</Text>
                    )}
                  </View>

                  {/* Difficulty */}
                  <View style={[styles.modernTableCell, { flex: 0.9 }]}>
                    <View style={styles.difficultyStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= (exercise.difficulty || 1) ? 'star' : 'star-outline'}
                          size={11}
                          color={star <= (exercise.difficulty || 1) ? '#F59E0B' : '#E5E7EB'}
                        />
                      ))}
                    </View>
                    <Text style={styles.difficultyText}>{exercise.difficulty || 1}/5</Text>
                  </View>

                  {/* Categories */}
                  <View style={[styles.modernTableCell, { flex: 1.3 }]}>
                    <View style={styles.exerciseCategoriesContainer}>
                      {exercise.skill_categories_json && Array.isArray(exercise.skill_categories_json)
                        ? exercise.skill_categories_json.slice(0, 2).map((cat, i) => (
                            <View key={i} style={styles.exerciseCategoryTag}>
                              <Text style={styles.exerciseCategoryText}>{cat}</Text>
                            </View>
                          ))
                        : exercise.skill_category
                        ? exercise.skill_category.split(',').slice(0, 2).map((cat, i) => (
                            <View key={i} style={styles.exerciseCategoryTag}>
                              <Text style={styles.exerciseCategoryText}>{cat.trim()}</Text>
                            </View>
                          ))
                        : <Text style={styles.noCategoryText}>—</Text>}
                      {(exercise.skill_categories_json?.length > 2 ||
                        exercise.skill_category?.split(',').length > 2) && (
                        <Text style={styles.moreCategoriesText}>
                          +{(exercise.skill_categories_json?.length || exercise.skill_category?.split(',').length || 0) - 2} more
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* DUPR range */}
                  <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                    {exercise.dupr_range_min && exercise.dupr_range_max ? (
                      <View style={styles.duprRangeBadge}>
                        <Text style={styles.duprRangeText}>{exercise.dupr_range_min}–{exercise.dupr_range_max}</Text>
                      </View>
                    ) : (
                      <Text style={styles.noDuprRangeText}>—</Text>
                    )}
                  </View>

                  {/* Program */}
                  <View style={[styles.modernTableCell, { flex: 1.1 }]}>
                    {exercise.linkedPrograms?.length > 0 ? (
                      <View style={styles.exerciseProgramContainer}>
                        <Text style={styles.programNameText} numberOfLines={1}>{exercise.linkedPrograms[0].name}</Text>
                        {exercise.linkedPrograms.length > 1 && (
                          <Text style={styles.moreProgramsText}>+{exercise.linkedPrograms.length - 1} more</Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noProgramText}>—</Text>
                    )}
                  </View>

                  {/* Routine */}
                  <View style={[styles.modernTableCell, { flex: 1.1 }]}>
                    {exercise.linkedRoutines?.length > 0 ? (
                      <View style={styles.exerciseRoutineContainer}>
                        <Text style={styles.routineNameText} numberOfLines={1}>{exercise.linkedRoutines[0].name}</Text>
                        {exercise.linkedRoutines.length > 1 && (
                          <Text style={styles.moreRoutinesText}>+{exercise.linkedRoutines.length - 1} more</Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noRoutineText}>—</Text>
                    )}
                  </View>

                  {/* Type */}
                  <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                    <View style={[styles.exerciseTypeBadge,
                      exercise.created_by ? styles.userCreatedBadge : styles.defaultBadge]}>
                      <Text style={[styles.exerciseTypeText,
                        exercise.created_by ? styles.userCreatedText : styles.defaultText]}>
                        {exercise.created_by ? 'User' : 'Default'}
                      </Text>
                    </View>
                  </View>

                  {/* Status toggle */}
                  <View style={[styles.modernTableCell, { flex: 0.9 }]}>
                    <TouchableOpacity
                      style={[styles.modernStatusChip,
                        exercise.is_published ? styles.publishedStatusChip : styles.draftStatusChip]}
                      onPress={() => togglePublishStatus('exercise', exercise.id, exercise.is_published)}
                    >
                      <Text style={[styles.modernStatusText,
                        exercise.is_published ? styles.publishedStatusText : styles.draftStatusText]}>
                        {exercise.is_published ? 'Published' : 'Draft'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Actions */}
                  <View style={[styles.modernTableCell, { flex: 0.9 }]}>
                    <View style={styles.modernActionButtons}>
                      <TouchableOpacity style={styles.modernActionButton}>
                        <Ionicons name="eye-outline" size={15} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modernActionButton} onPress={() => handleEditExercise(exercise)}>
                        <Ionicons name="create-outline" size={15} color="#6B7280" />
                      </TouchableOpacity>
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                          style={styles.modernActionButton}
                          onPress={() => setActiveDropdown(activeDropdown === exercise.id ? null : exercise.id)}
                        >
                          <Ionicons name="ellipsis-horizontal" size={15} color="#6B7280" />
                        </TouchableOpacity>
                        {activeDropdown === exercise.id && (
                          <View style={styles.dropdownMenu}>
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDeleteExercise(exercise)}>
                              <Ionicons name="trash-outline" size={15} color="#EF4444" />
                              <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.comingSoon, { paddingVertical: 48 }]}>
                <View style={{
                  width: 56, height: 56, borderRadius: 12,
                  backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <Ionicons name="fitness-outline" size={28} color="#9CA3AF" />
                </View>
                <Text style={[styles.comingSoonText, { fontWeight: '600', color: '#374151' }]}>
                  {hasActiveFilters ? 'No exercises match your filters' : 'No exercises yet'}
                </Text>
                <Text style={[styles.comingSoonSubtext, { marginTop: 4 }]}>
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : hasActiveFilters
                    ? 'Try changing the program or routine filter'
                    : 'Create your first exercise to get started'}
                </Text>
              </View>
            )}

            {/* Pagination */}
            {totalCount > 0 && (
              <Pagination
                totalItems={totalCount}
                currentPage={safePage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                itemLabel="exercises"
              />
            )}
          </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
