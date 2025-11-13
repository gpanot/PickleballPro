import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  styles
}) {
  let filteredRoutines = routines.filter(routine =>
    routine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.programs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (routineFilterProgram) {
    filteredRoutines = filteredRoutines.filter(routine =>
      routine.programs?.name === routineFilterProgram
    );
  }

  if (routineSortField) {
    filteredRoutines = [...filteredRoutines].sort((a, b) => {
      const direction = routineSortDirection === 'asc' ? 1 : -1;

      switch (routineSortField) {
        case 'program': {
          const aValue = a.programs?.name || '';
          const bValue = b.programs?.name || '';
          return aValue.localeCompare(bValue) * direction;
        }
        case 'order': {
          const aValue = typeof a.order_index === 'number' ? a.order_index : Number.MAX_SAFE_INTEGER;
          const bValue = typeof b.order_index === 'number' ? b.order_index : Number.MAX_SAFE_INTEGER;
          return (aValue - bValue) * direction;
        }
        case 'status': {
          const aValue = a.is_published ? 1 : 0;
          const bValue = b.is_published ? 1 : 0;
          return (aValue - bValue) * direction;
        }
        case 'created': {
          const aValue = new Date(a.created_at).getTime();
          const bValue = new Date(b.created_at).getTime();
          return (aValue - bValue) * direction;
        }
        default:
          return 0;
      }
    });
  }

  const handleSortPress = (field) => {
    if (routineSortField === field) {
      setRoutineSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setRoutineSortField(field);
      setRoutineSortDirection('asc');
    }
  };

  const routineCount = filteredRoutines.length;

  return (
    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTextGroup}>
          <Text style={styles.sectionTitle}>
            {`Training Routines (${routineCount.toLocaleString()})`}
          </Text>
          <Text style={styles.sectionSubtitle}>Manage workout routines and sessions</Text>
        </View>
        <View style={styles.exerciseFiltersContainer}>
          <View style={[
            styles.routineFilterWrapper,
            showRoutineProgramFilterDropdown && styles.exerciseFilterWrapperActive
          ]}>
            <TouchableOpacity
              style={[
                styles.routineFilterDropdown,
                !routineFilterProgram && styles.dropdownPlaceholder
              ]}
              onPress={() => {
                setShowRoutineProgramFilterDropdown(prev => !prev);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !routineFilterProgram && styles.dropdownPlaceholderText
                ]}
              >
                {routineFilterProgram ? routineFilterProgram : 'All Programs'}
              </Text>
              <Ionicons
                name={showRoutineProgramFilterDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.contentSectionWrapper}>
      <View style={styles.modernTable}>
        {showRoutineProgramFilterDropdown && (
          <View style={styles.routineFilterDropdownContainer}>
            <View style={styles.routineFilterDropdownList}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setRoutineFilterProgram(null);
                    setShowRoutineProgramFilterDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>All Programs</Text>
                </TouchableOpacity>
                {routineProgramOptions.map(programName => (
                  <TouchableOpacity
                    key={programName}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRoutineFilterProgram(programName);
                      setShowRoutineProgramFilterDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{programName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        <View style={styles.modernTableHeader}>
          <View style={[styles.modernTableHeaderCell, { flex: 2 }]}>
            <Text style={styles.modernTableHeaderText}>Routine</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1.5 }]}>
            <TouchableOpacity onPress={() => handleSortPress('program')} style={styles.sortableHeader}>
              <Text style={styles.modernTableHeaderText}>Program</Text>
              {routineSortField === 'program' && (
                <Ionicons
                  name={routineSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#3B82F6"
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <TouchableOpacity onPress={() => handleSortPress('order')} style={styles.sortableHeader}>
              <Text style={styles.modernTableHeaderText}>Order</Text>
              {routineSortField === 'order' && (
                <Ionicons
                  name={routineSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#3B82F6"
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <TouchableOpacity onPress={() => handleSortPress('status')} style={styles.sortableHeader}>
              <Text style={styles.modernTableHeaderText}>Status</Text>
              {routineSortField === 'status' && (
                <Ionicons
                  name={routineSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#3B82F6"
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <TouchableOpacity onPress={() => handleSortPress('created')} style={styles.sortableHeader}>
              <Text style={styles.modernTableHeaderText}>Created</Text>
              {routineSortField === 'created' && (
                <Ionicons
                  name={routineSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#3B82F6"
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Actions</Text>
          </View>
        </View>

        <ScrollView style={styles.modernTableBody}>
          {filteredRoutines.length > 0 ? filteredRoutines.map(routine => (
            <View key={routine.id} style={styles.modernTableRow}>
              <View style={[styles.modernTableCell, { flex: 2 }]}>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                {routine.description && (
                  <Text style={styles.routineMeta}>{routine.description}</Text>
                )}
              </View>
              <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                <Text style={styles.cellText}>
                  {routine.programs?.name || 'No Program'}
                </Text>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <Text style={styles.cellText}>{routine.order_index}</Text>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <View style={[styles.statusBadge, routine.is_published ? styles.statusPublished : styles.statusDraft]}>
                  <Text style={[styles.statusText, routine.is_published ? styles.statusTextPublished : styles.statusTextDraft]}>
                    {routine.is_published ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <Text style={styles.cellText}>
                  {new Date(routine.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <View style={styles.modernActionButtons}>
                  <TouchableOpacity
                    style={styles.modernActionButton}
                    onPress={() => handleEditRoutine(routine)}
                  >
                    <Ionicons name="create-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.comingSoon}>
              <Ionicons name="library-outline" size={48} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>No routines found</Text>
              <Text style={styles.comingSoonSubtext}>Create your first routine to get started</Text>
            </View>
          )}
        </ScrollView>
      </View>
      </View>
    </View>
  );
}
