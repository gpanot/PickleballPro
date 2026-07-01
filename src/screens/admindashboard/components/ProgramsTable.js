import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pagination from './Pagination';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = Platform.OS !== 'web' || SCREEN_WIDTH < 768;

const DEFAULT_PAGE_SIZE = 50;

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
  handlePublishProgram,
  publishingProgramId,
  sessionRole,
  activeDropdown,
  setActiveDropdown,
  styles,
}) {
  const isManagerSession = sessionRole === 'manager';
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  let filteredPrograms = programs.filter(
    (program) =>
      program.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (programSortField === 'coach_program') {
    filteredPrograms = [...filteredPrograms].sort((a, b) => {
      const aValue = a.is_coach_program ? 1 : 0;
      const bValue = b.is_coach_program ? 1 : 0;
      return programSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }

  const totalCount = filteredPrograms.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredPrograms.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };

  const SortIcon = ({ field }) =>
    programSortField === field ? (
      <Ionicons
        name={programSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
        size={13}
        color="#3B82F6"
        style={{ marginLeft: 4 }}
      />
    ) : (
      <Ionicons name="swap-vertical-outline" size={13} color="#CBD5E1" style={{ marginLeft: 4 }} />
    );

  return (
    <View style={styles.contentSection}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Training Programs
            <Text style={{ color: '#9CA3AF', fontWeight: '400', fontSize: 15 }}>
              {' '}({totalCount.toLocaleString()})
            </Text>
          </Text>
          <Text style={styles.sectionSubtitle}>Manage and organize training programs</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      ) : (
        <ScrollView horizontal={IS_MOBILE} showsHorizontalScrollIndicator={IS_MOBILE}>
        <View style={[styles.modernTable, IS_MOBILE && { minWidth: 700 }]}>
          {/* Table header */}
          <View style={styles.modernTableHeader}>
            <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Program</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Category</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Tier</Text>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                if (programSortField === 'coach_program') {
                  setProgramSortDirection(programSortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setProgramSortField('coach_program');
                  setProgramSortDirection('asc');
                }
              }}
            >
              <Text style={styles.modernTableHeaderText}>Content For</Text>
              <SortIcon field="coach_program" />
            </TouchableOpacity>
            <Text style={[styles.modernTableHeaderText, { flex: 1.2 }]}>Routines / Exs</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Users</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Status</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 0.7 }]}>Rating</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 0.6 }]}>Order</Text>
            <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
          </View>

          {/* Table body */}
          {paginated.length > 0 ? (
            paginated.map((program) => (
              <TouchableOpacity
                key={program.id}
                activeOpacity={1}
                onMouseEnter={() => Platform.OS === 'web' && setHoveredRow(program.id)}
                onMouseLeave={() => Platform.OS === 'web' && setHoveredRow(null)}
                style={[
                  styles.modernTableRow,
                  hoveredRow === program.id && { backgroundColor: '#F8FAFC' },
                ]}
              >
                {/* Program */}
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
                      <Text style={styles.programTitle} numberOfLines={1}>{program.name}</Text>
                      <Text style={styles.programMeta}>
                        Created {new Date(program.created_at).toLocaleDateString()}
                      </Text>
                      {isManagerSession && program._authorName && !program._isOwnProgram && (
                        <View style={{
                          marginTop: 3,
                          alignSelf: 'flex-start',
                          backgroundColor: '#EFF6FF',
                          borderRadius: 4,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}>
                          <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '500' }}>
                            by {program._authorName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Category */}
                <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                  <View style={styles.categoryWithPosition}>
                    <Text style={styles.positionNumber}>
                      ({filteredPrograms.filter((p) => p.category === program.category).findIndex((p) => p.id === program.id) + 1})
                    </Text>
                    <View style={[styles.categoryPill, { backgroundColor: '#F0F9FF' }]}>
                      <Text style={[styles.categoryPillText, { color: '#0369A1' }]} numberOfLines={1}>
                        {program.category}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tier */}
                <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                  <Text style={styles.tierText}>{program.tier || 'Beginner'}</Text>
                </View>

                {/* Content for */}
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={[styles.modernStatusChip,
                    program.is_coach_program ? styles.coachProgramChip : styles.studentProgramChip]}>
                    <Text style={[styles.modernStatusText,
                      program.is_coach_program ? styles.coachProgramText : styles.studentProgramText]}>
                      {program.is_coach_program ? 'Coach' : 'Student'}
                    </Text>
                  </View>
                </View>

                {/* Content counts */}
                <View style={[styles.modernTableCell, { flex: 1.2 }]}>
                  <Text style={styles.contentText}>
                    {program.routine_count || 0} routines
                  </Text>
                  <Text style={styles.contentSubtext}>
                    {program.exercise_count || 0} exercises
                  </Text>
                </View>

                {/* Users */}
                <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                  <View style={styles.usersContainer}>
                    <Ionicons name="people" size={14} color="#6B7280" />
                    <Text style={styles.usersText}>{(program.added_count || 0).toLocaleString()}</Text>
                  </View>
                </View>

                {/* Status */}
                <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                  <View style={[styles.modernStatusChip,
                    program.is_published ? styles.publishedStatusChip : styles.draftStatusChip]}>
                    <Text style={[styles.modernStatusText,
                      program.is_published ? styles.publishedStatusText : styles.draftStatusText]}>
                      {program.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                  {isManagerSession && !program.is_published && program.academy_id && (
                    <TouchableOpacity
                      style={{
                        marginTop: 4,
                        backgroundColor: '#F0FDF4',
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      onPress={() => handlePublishProgram && handlePublishProgram(program)}
                      disabled={publishingProgramId === program.id}
                    >
                      {publishingProgramId === program.id
                        ? <ActivityIndicator size="small" color="#16A34A" />
                        : <Ionicons name="cloud-upload-outline" size={11} color="#16A34A" />
                      }
                      <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>
                        Publish
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rating */}
                <View style={[styles.modernTableCell, { flex: 0.7 }]}>
                  {program.rating ? (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.ratingText}>{program.rating}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noRatingText}>—</Text>
                  )}
                </View>

                {/* Order */}
                <View style={[styles.modernTableCell, { flex: 0.6 }]}>
                  <View style={styles.reorderButtons}>
                    {reorderingProgramId === program.id ? (
                      <View style={styles.reorderingIndicator}>
                        <ActivityIndicator size="small" color="#6B7280" />
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.reorderButton,
                            filteredPrograms.filter((p) => p.category === program.category)
                              .findIndex((p) => p.id === program.id) === 0 && styles.reorderButtonDisabled]}
                          onPress={() => reorderProgram(program.id, 'up')}
                          disabled={reorderingProgramId !== null ||
                            filteredPrograms.filter((p) => p.category === program.category)
                              .findIndex((p) => p.id === program.id) === 0}
                        >
                          <Ionicons name="chevron-up" size={12} color={
                            filteredPrograms.filter((p) => p.category === program.category)
                              .findIndex((p) => p.id === program.id) === 0 ? '#D1D5DB' : '#6B7280'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reorderButton,
                            filteredPrograms.filter((p) => p.category === program.category)
                              .findIndex((p) => p.id === program.id) ===
                            filteredPrograms.filter((p) => p.category === program.category).length - 1 &&
                            styles.reorderButtonDisabled]}
                          onPress={() => reorderProgram(program.id, 'down')}
                          disabled={reorderingProgramId !== null ||
                            filteredPrograms.filter((p) => p.category === program.category)
                              .findIndex((p) => p.id === program.id) ===
                            filteredPrograms.filter((p) => p.category === program.category).length - 1}
                        >
                          <Ionicons name="chevron-down" size={12} color={
                            filteredPrograms.filter((p) => p.category === program.category)
                              .findIndex((p) => p.id === program.id) ===
                            filteredPrograms.filter((p) => p.category === program.category).length - 1
                              ? '#D1D5DB' : '#6B7280'} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.modernActionButtons}>
                    <TouchableOpacity
                      style={styles.modernActionButton}
                      onPress={() => handleViewProgramStructure(program)}
                    >
                      <Ionicons name="eye-outline" size={15} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modernActionButton}
                      onPress={() => handleEditProgramStructure(program)}
                    >
                      <Ionicons name="create-outline" size={15} color="#6B7280" />
                    </TouchableOpacity>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.modernActionButton}
                        onPress={() => setActiveDropdown(activeDropdown === program.id ? null : program.id)}
                      >
                        <Ionicons name="ellipsis-horizontal" size={15} color="#6B7280" />
                      </TouchableOpacity>
                      {activeDropdown === program.id && (
                        <View style={styles.dropdownMenu}>
                          <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDeleteProgram(program)}>
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
                <Ionicons name="library-outline" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.comingSoonText, { fontWeight: '600', color: '#374151' }]}>
                {searchQuery ? 'No programs match your search' : 'No programs yet'}
              </Text>
              {searchQuery ? (
                <Text style={[styles.comingSoonSubtext, { marginTop: 4 }]}>
                  Try adjusting your search: "{searchQuery}"
                </Text>
              ) : (
                <Text style={[styles.comingSoonSubtext, { marginTop: 4 }]}>
                  Create your first program to get started
                </Text>
              )}
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
              itemLabel="programs"
            />
          )}
        </View>
        </ScrollView>
      )}
    </View>
  );
}
