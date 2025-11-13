import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProgramsTable({
  programs,
  loading,
  searchQuery,
  programSortField,
  programSortDirection,
  setProgramSortField,
  setProgramSortDirection,
  reorderingProgramId,
  reorderProgram,
  handleViewProgramStructure,
  handleEditProgramStructure,
  handleDeleteProgram,
  activeDropdown,
  setActiveDropdown,
  styles
}) {
  let filteredPrograms = programs.filter(program =>
    program.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (programSortField === 'coach_program') {
    filteredPrograms = [...filteredPrograms].sort((a, b) => {
      const aValue = a.is_coach_program ? 1 : 0;
      const bValue = b.is_coach_program ? 1 : 0;
      if (programSortDirection === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }

  return (
    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Training Programs</Text>
        <Text style={styles.sectionSubtitle}>Manage and organize training programs</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      ) : (
        <View style={styles.modernTable}>
          <View style={styles.modernTableHeader}>
            <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Program</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Category</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Tier</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                if (programSortField === 'coach_program') {
                  setProgramSortDirection(programSortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setProgramSortField('coach_program');
                  setProgramSortDirection('asc');
                }
              }}
            >
              <View style={styles.sortableHeader}>
                <Text style={styles.modernTableHeaderText}>COACH Program</Text>
                {programSortField === 'coach_program' && (
                  <Ionicons
                    name={programSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#3B82F6"
                  />
                )}
              </View>
            </TouchableOpacity>
            <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Content</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Users</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Rating</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Order</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
          </View>
          <ScrollView style={styles.modernTableBody}>
            {filteredPrograms.length > 0 ? filteredPrograms.map(program => (
              <View key={program.id} style={styles.modernTableRow}>
                <View style={[styles.modernTableCell, { flex: 2 }]}>
                  <View style={styles.programInfoContainer}>
                    <View style={styles.programThumbnailContainer}>
                      {program.thumbnail_url ? (
                        <Image
                          source={{ uri: program.thumbnail_url }}
                          style={styles.programThumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.programThumbnailPlaceholder}>
                          <Ionicons name="image-outline" size={16} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.programInfo}>
                      <Text style={styles.programTitle}>{program.name}</Text>
                      <Text style={styles.programMeta}>Created {new Date(program.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                  <View style={styles.categoryWithPosition}>
                    <Text style={styles.positionNumber}>
                      ({filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) + 1})
                    </Text>
                    <View style={[styles.categoryPill, {
                      backgroundColor: program.category === 'Fundamentals' ? '#F0F9FF' : '#F8F4FF'
                    }]}>
                      <Text style={[styles.categoryPillText, {
                        color: program.category === 'Fundamentals' ? '#0369A1' : '#7C3AED'
                      }]}>{program.category}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <Text style={styles.tierText}>{program.tier || 'Beginner'}</Text>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={[styles.modernStatusChip,
                    program.is_coach_program ? styles.coachProgramChip : styles.studentProgramChip
                  ]}>
                    <Text style={[styles.modernStatusText,
                      program.is_coach_program ? styles.coachProgramText : styles.studentProgramText
                    ]}>
                      {program.is_coach_program ? 'Coach' : 'Student'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                  <Text style={styles.contentText}>
                    {program.routine_count || 0} routine{program.routine_count !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.contentSubtext}>
                    {program.exercise_count || 0} exercise{program.exercise_count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.usersContainer}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.usersText}>{program.added_count || 0}</Text>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={[styles.modernStatusChip,
                    program.is_published ? styles.publishedStatusChip : styles.draftStatusChip
                  ]}>
                    <Text style={[styles.modernStatusText,
                      program.is_published ? styles.publishedStatusText : styles.draftStatusText
                    ]}>{program.is_published ? 'Published' : 'Draft'}</Text>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  {program.rating ? (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingText}>{program.rating}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noRatingText}>—</Text>
                  )}
                </View>
                <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                  <View style={styles.reorderButtons}>
                    {reorderingProgramId === program.id ? (
                      <View style={styles.reorderingIndicator}>
                        <ActivityIndicator size="small" color="#6B7280" />
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.reorderButton,
                            filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 0 && styles.reorderButtonDisabled
                          ]}
                          onPress={() => reorderProgram(program.id, 'up')}
                          disabled={
                            reorderingProgramId !== null ||
                            filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 0
                          }
                        >
                          <Ionicons
                            name="chevron-up"
                            size={14}
                            color={
                              filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 0
                                ? '#D1D5DB'
                                : '#6B7280'
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.reorderButton,
                            filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) ===
                            filteredPrograms.filter(p => p.category === program.category).length - 1 && styles.reorderButtonDisabled
                          ]}
                          onPress={() => reorderProgram(program.id, 'down')}
                          disabled={
                            reorderingProgramId !== null ||
                            filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) ===
                            filteredPrograms.filter(p => p.category === program.category).length - 1
                          }
                        >
                          <Ionicons
                            name="chevron-down"
                            size={14}
                            color={
                              filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) ===
                              filteredPrograms.filter(p => p.category === program.category).length - 1
                                ? '#D1D5DB'
                                : '#6B7280'
                            }
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.modernActionButtons}>
                    <TouchableOpacity
                      style={styles.modernActionButton}
                      onPress={() => handleViewProgramStructure(program)}
                    >
                      <Ionicons name="eye-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modernActionButton}
                      onPress={() => handleEditProgramStructure(program)}
                    >
                      <Ionicons name="create-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.modernActionButton}
                        onPress={() => {
                          const newDropdown = activeDropdown === program.id ? null : program.id;
                          setActiveDropdown(newDropdown);
                        }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      {activeDropdown === program.id && (
                        <View style={styles.dropdownMenu}>
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleDeleteProgram(program)}
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
                <Ionicons name="library-outline" size={48} color="#9CA3AF" />
                <Text style={styles.comingSoonText}>No programs found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}


