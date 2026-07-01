import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pagination from './Pagination';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = Platform.OS !== 'web' || SCREEN_WIDTH < 768;
const DEFAULT_PAGE_SIZE = 50;

export default function RoutinesTable({
  routines,
  loading,
  searchQuery,
  routineFilterProgram,
  setRoutineFilterProgram,
  routineProgramOptions,
  showRoutineProgramFilterDropdown,
  setShowRoutineProgramFilterDropdown,
  routineSortField,
  routineSortDirection,
  setRoutineSortField,
  setRoutineSortDirection,
  handleEditRoutine,
  styles,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, routineFilterProgram]);

  let filteredRoutines = routines.filter(
    (routine) =>
      routine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.programs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (routineFilterProgram) {
    filteredRoutines = filteredRoutines.filter(
      (routine) => routine.programs?.name === routineFilterProgram
    );
  }

  const handleSortPress = (field) => {
    if (routineSortField === field) {
      setRoutineSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setRoutineSortField(field);
      setRoutineSortDirection('asc');
    }
  };

  if (routineSortField) {
    filteredRoutines = [...filteredRoutines].sort((a, b) => {
      const dir = routineSortDirection === 'asc' ? 1 : -1;
      switch (routineSortField) {
        case 'program':
          return (a.programs?.name || '').localeCompare(b.programs?.name || '') * dir;
        case 'order': {
          const av = typeof a.order_index === 'number' ? a.order_index : Infinity;
          const bv = typeof b.order_index === 'number' ? b.order_index : Infinity;
          return (av - bv) * dir;
        }
        case 'status':
          return ((a.is_published ? 1 : 0) - (b.is_published ? 1 : 0)) * dir;
        case 'created':
          return (new Date(a.created_at) - new Date(b.created_at)) * dir;
        default:
          return 0;
      }
    });
  }

  const totalCount = filteredRoutines.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredRoutines.slice((safePage - 1) * pageSize, safePage * pageSize);

  const SortHeader = ({ field, label, flex }) => (
    <TouchableOpacity
      onPress={() => handleSortPress(field)}
      style={{ flex, flexDirection: 'row', alignItems: 'center' }}
    >
      <Text style={styles.modernTableHeaderText}>{label}</Text>
      {routineSortField === field ? (
        <Ionicons
          name={routineSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
          size={13} color="#3B82F6" style={{ marginLeft: 4 }}
        />
      ) : (
        <Ionicons name="swap-vertical-outline" size={13} color="#CBD5E1" style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );

  const hasActiveFilters = !!(routineFilterProgram || searchQuery);

  return (
    <View style={styles.contentSection}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTextGroup}>
          <Text style={styles.sectionTitle}>
            Training Routines
            <Text style={{ color: '#9CA3AF', fontWeight: '400', fontSize: 15 }}>
              {' '}({totalCount.toLocaleString()}{totalCount !== routines.length ? ` of ${routines.length}` : ''})
            </Text>
          </Text>
          <Text style={styles.sectionSubtitle}>Manage workout routines and sessions</Text>
        </View>

        <View style={styles.exerciseFiltersContainer}>
          {/* Program filter */}
          <View style={[styles.routineFilterWrapper, showRoutineProgramFilterDropdown && styles.exerciseFilterWrapperActive]}>
            <TouchableOpacity
              style={[styles.routineFilterDropdown, !routineFilterProgram && styles.dropdownPlaceholder]}
              onPress={() => setShowRoutineProgramFilterDropdown((prev) => !prev)}
            >
              <Text style={[styles.dropdownText, !routineFilterProgram && styles.dropdownPlaceholderText]} numberOfLines={1}>
                {routineFilterProgram || 'All Programs'}
              </Text>
              <Ionicons name={showRoutineProgramFilterDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {routineFilterProgram && (
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' }}
              onPress={() => setRoutineFilterProgram(null)}
            >
              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal={IS_MOBILE} showsHorizontalScrollIndicator={IS_MOBILE}>
      <View style={styles.contentSectionWrapper}>
        <View style={[styles.modernTable, IS_MOBILE && { minWidth: 600 }]}>
          {/* Program filter dropdown */}
          {showRoutineProgramFilterDropdown && (
            <View style={styles.routineFilterDropdownContainer}>
              <ScrollView style={styles.routineFilterDropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.dropdownOption}
                  onPress={() => { setRoutineFilterProgram(null); setShowRoutineProgramFilterDropdown(false); }}>
                  <Text style={[styles.dropdownOptionText, { color: '#9CA3AF' }]}>All Programs</Text>
                </TouchableOpacity>
                {routineProgramOptions.map((name) => (
                  <TouchableOpacity key={name}
                    style={[styles.dropdownOption, routineFilterProgram === name && { backgroundColor: '#F0F9FF' }]}
                    onPress={() => { setRoutineFilterProgram(name); setShowRoutineProgramFilterDropdown(false); }}>
                    <Text style={[styles.dropdownOptionText, routineFilterProgram === name && { color: '#0369A1', fontWeight: '600' }]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Table header */}
          <View style={styles.modernTableHeader}>
            <Text style={[styles.modernTableHeaderText, { flex: 2.5 }]}>Routine</Text>
            <SortHeader field="program" label="Program" flex={1.8} />
            <SortHeader field="order" label="Order" flex={0.7} />
            <SortHeader field="status" label="Status" flex={0.9} />
            <SortHeader field="created" label="Created" flex={1} />
            <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Actions</Text>
          </View>

          {/* Rows */}
          {paginated.length > 0 ? (
            paginated.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                activeOpacity={1}
                onMouseEnter={() => Platform.OS === 'web' && setHoveredRow(routine.id)}
                onMouseLeave={() => Platform.OS === 'web' && setHoveredRow(null)}
                style={[
                  styles.modernTableRow,
                  hoveredRow === routine.id && { backgroundColor: '#F8FAFC' },
                ]}
              >
                {/* Routine name + description */}
                <View style={[styles.modernTableCell, { flex: 2.5 }]}>
                  <Text style={styles.routineTitle} numberOfLines={1}>{routine.name}</Text>
                  {routine.description && (
                    <Text style={styles.routineMeta} numberOfLines={2}>{routine.description}</Text>
                  )}
                </View>

                {/* Program */}
                <View style={[styles.modernTableCell, { flex: 1.8 }]}>
                  {routine.programs?.name ? (
                    <View style={[styles.categoryPill, { backgroundColor: '#F0F9FF', alignSelf: 'flex-start' }]}>
                      <Text style={[styles.categoryPillText, { color: '#0369A1' }]} numberOfLines={1}>
                        {routine.programs.name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: '#9CA3AF' }}>—</Text>
                  )}
                </View>

                {/* Order */}
                <View style={[styles.modernTableCell, { flex: 0.7 }]}>
                  {routine.order_index != null ? (
                    <View style={{
                      width: 28, height: 28, borderRadius: 6,
                      backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: '#E5E7EB',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>
                        {routine.order_index}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: '#9CA3AF' }}>—</Text>
                  )}
                </View>

                {/* Status */}
                <View style={[styles.modernTableCell, { flex: 0.9 }]}>
                  <View style={[styles.modernStatusChip,
                    routine.is_published ? styles.publishedStatusChip : styles.draftStatusChip]}>
                    <Text style={[styles.modernStatusText,
                      routine.is_published ? styles.publishedStatusText : styles.draftStatusText]}>
                      {routine.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>

                {/* Created */}
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    {new Date(routine.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* Actions */}
                <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                  <TouchableOpacity style={styles.modernActionButton} onPress={() => handleEditRoutine(routine)}>
                    <Ionicons name="create-outline" size={15} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.comingSoon, { paddingVertical: 48 }]}>
              <View style={{
                width: 56, height: 56, borderRadius: 12,
                backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Ionicons name="list-outline" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.comingSoonText, { fontWeight: '600', color: '#374151' }]}>
                {hasActiveFilters ? 'No routines match your filters' : 'No routines yet'}
              </Text>
              <Text style={[styles.comingSoonSubtext, { marginTop: 4 }]}>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : routineFilterProgram
                  ? `No routines in "${routineFilterProgram}"`
                  : 'Create your first routine to get started'}
              </Text>
            </View>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <Pagination
              totalItems={totalCount}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              itemLabel="routines"
            />
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}
