import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import styles from '../adminDashboardStyles';

export default function CoachesTab({ user, onEditCoach }) {
  const [coaches, setCoaches] = useState([]);
  const [coachStats, setCoachStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coachStatusFilter, setCoachStatusFilter] = useState('all');
  const [coachVerifiedFilter, setCoachVerifiedFilter] = useState('all');
  const [showCoachFilterDropdown, setShowCoachFilterDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [coachToDelete, setCoachToDelete] = useState(null);
  const [showDeleteCoachConfirmation, setShowDeleteCoachConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasCoachFilters = coachStatusFilter !== 'all' || coachVerifiedFilter !== 'all';

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select(`*, users:user_id(id, avatar_url)`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const manageableCoaches = (data || []).filter(c => c.name && c.name.trim() !== '');
      setCoaches(manageableCoaches);

      if (data) {
        const total = data.length;
        const verified = data.filter(c => c.is_verified).length;
        const active = data.filter(c => c.is_active).length;
        const ratingsSum = data.reduce((sum, c) => sum + (c.rating_avg || 0), 0);
        setCoachStats({ total, verified, active, avgRating: total > 0 ? (ratingsSum / total).toFixed(1) : 0 });
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      Alert.alert('Error', 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoach = (coach) => {
    setCoachToDelete(coach);
    setShowDeleteCoachConfirmation(true);
    setActiveDropdown(null);
  };

  const handleConfirmDeleteCoach = async () => {
    if (!coachToDelete) return;
    setDeleting(true);
    setShowDeleteCoachConfirmation(false);
    try {
      const { data: userProfile, error: userError } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      if (userError) throw new Error(`User profile check failed: ${userError.message}`);
      if (!userProfile?.is_admin) throw new Error('You do not have admin privileges');

      const updatePayload = {
        email: null, bio: null, avatar_url: null, location: null,
        specialties: null, hourly_rate: null, rating_avg: null, rating_count: null,
        dupr_rating: null, is_verified: false, is_active: false,
        updated_at: new Date().toISOString(), name: '',
      };
      const { error: resetError } = await supabase.from('coaches').update(updatePayload).eq('id', coachToDelete.id);
      if (resetError) {
        if (resetError.message?.includes('name') || resetError.message?.includes('NOT NULL')) {
          const { name, ...retryPayload } = updatePayload;
          const { error: retryError } = await supabase.from('coaches').update(retryPayload).eq('id', coachToDelete.id);
          if (retryError) throw retryError;
        } else {
          throw resetError;
        }
      }
      Alert.alert('Success', `Coach "${coachToDelete.name}" has been reset and removed from the management view.`);
      fetchCoaches();
    } catch (error) {
      Alert.alert('Error', `Failed to reset coach: ${error.message}`);
    } finally {
      setDeleting(false);
      setCoachToDelete(null);
    }
  };

  const clearCoachFilters = () => { setCoachStatusFilter('all'); setCoachVerifiedFilter('all'); };

  const renderFilterOption = (label, value, currentValue, onSelect) => (
    <TouchableOpacity
      key={value}
      style={[styles.coachFilterOption, currentValue === value && styles.coachFilterOptionActive]}
      onPress={() => { onSelect(value); setShowCoachFilterDropdown(false); }}
    >
      {currentValue === value && <Ionicons name="checkmark" size={14} color="#0369A1" />}
      <Text style={[styles.coachFilterOptionText, currentValue === value && styles.coachFilterOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getCoachInitials = (name) => {
    if (!name?.trim()) return 'C';
    const names = name.trim().split(' ');
    return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();
  };

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch =
      coach.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = coachStatusFilter === 'all' || (coachStatusFilter === 'active' && coach.is_active) || (coachStatusFilter === 'inactive' && !coach.is_active);
    const matchesVerified = coachVerifiedFilter === 'all' || (coachVerifiedFilter === 'verified' && coach.is_verified) || (coachVerifiedFilter === 'pending' && !coach.is_verified);
    return matchesSearch && matchesStatus && matchesVerified;
  });

  return (
    <View style={styles.content}>
      {/* Stats */}
      <View style={styles.coachStatsGrid}>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.total || '0'}</Text>
          <Text style={styles.coachStatLabel}>Total Coaches</Text>
          <Text style={styles.coachStatSubtext}>Registered coaches</Text>
        </View>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.verified || '0'}</Text>
          <Text style={styles.coachStatLabel}>Verified</Text>
          <Text style={styles.coachStatSubtext}>Verified profiles</Text>
        </View>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.active || '0'}</Text>
          <Text style={styles.coachStatLabel}>Active</Text>
          <Text style={styles.coachStatSubtext}>Currently active</Text>
        </View>
        <View style={styles.coachStatCard}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.avgRating || '0'}</Text>
          </View>
          <Text style={styles.coachStatLabel}>Avg Rating</Text>
          <Text style={styles.coachStatSubtext}>Average coach rating</Text>
        </View>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>—</Text>
          <Text style={styles.coachStatLabel}>Total Students</Text>
          <Text style={styles.coachStatSubtext}>Not tracked yet</Text>
        </View>
      </View>

      {/* Directory */}
      <View style={styles.coachDirectorySection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Coach Directory</Text>
            <Text style={styles.sectionSubtitle}>Manage coach profiles and verification status</Text>
          </View>
        </View>

        {/* Search + Filter */}
        <View style={[styles.searchFilterBar, showCoachFilterDropdown && styles.searchFilterBarActive]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput style={styles.searchInput} placeholder="Search coaches..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9CA3AF" />
          </View>
          <View style={styles.coachFilterButtonWrap}>
            <TouchableOpacity
              style={[styles.filterButton, hasCoachFilters && styles.filterButtonActive]}
              onPress={() => setShowCoachFilterDropdown(prev => !prev)}
            >
              <Ionicons name="funnel-outline" size={20} color={hasCoachFilters ? '#0369A1' : '#6B7280'} />
              <Text style={[styles.filterButtonText, hasCoachFilters && styles.filterButtonTextActive]}>Filter</Text>
              {hasCoachFilters ? <View style={styles.filterActiveDot} /> : null}
            </TouchableOpacity>
            {showCoachFilterDropdown && (
              <View style={styles.coachFilterDropdown}>
                <Text style={styles.coachFilterSectionLabel}>Status</Text>
                {renderFilterOption('All statuses', 'all', coachStatusFilter, setCoachStatusFilter)}
                {renderFilterOption('Active', 'active', coachStatusFilter, setCoachStatusFilter)}
                {renderFilterOption('Inactive', 'inactive', coachStatusFilter, setCoachStatusFilter)}
                <Text style={[styles.coachFilterSectionLabel, styles.coachFilterSectionLabelSpaced]}>Verification</Text>
                {renderFilterOption('All coaches', 'all', coachVerifiedFilter, setCoachVerifiedFilter)}
                {renderFilterOption('Verified', 'verified', coachVerifiedFilter, setCoachVerifiedFilter)}
                {renderFilterOption('Pending', 'pending', coachVerifiedFilter, setCoachVerifiedFilter)}
                {hasCoachFilters ? (
                  <TouchableOpacity style={styles.coachFilterClearButton} onPress={clearCoachFilters}>
                    <Text style={styles.coachFilterClearText}>Clear filters</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading coaches...</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Coach</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Rating & Reviews</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Specialties</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Location</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Rate</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Students</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            <View>
              {filteredCoaches.length === 0 ? (
                <View style={styles.comingSoon}>
                  <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.comingSoonText}>{loading ? 'Loading coaches...' : 'No coaches found'}</Text>
                  {!loading && (searchQuery || hasCoachFilters) && (
                    <Text style={styles.comingSoonSubtext}>
                      {searchQuery && hasCoachFilters ? 'Try adjusting your search or filters' : searchQuery ? 'Try adjusting your search' : 'Try adjusting your filters'}
                    </Text>
                  )}
                </View>
              ) : (
                filteredCoaches.map(coach => (
                  <View
                    key={coach.id}
                    style={[styles.modernTableRow, activeDropdown === `coach_${coach.id}` && { zIndex: 1000, elevation: 10 }]}
                  >
                    <View style={[styles.modernTableCell, { flex: 2 }]}>
                      <View style={styles.coachInfoContainer}>
                        <View style={styles.coachAvatar}>
                          {(() => {
                            const userAvatarUrl = Array.isArray(coach.users) ? coach.users[0]?.avatar_url : coach.users?.avatar_url;
                            const avatarUrl = userAvatarUrl || coach.avatar_url;
                            return avatarUrl ? (
                              <Image source={{ uri: avatarUrl }} style={styles.coachAvatarImage} resizeMode="cover" />
                            ) : (
                              <Text style={styles.coachAvatarText}>{getCoachInitials(coach.name)}</Text>
                            );
                          })()}
                          {coach.is_verified && <View style={styles.verifiedIcon}><Ionicons name="checkmark" size={10} color="#FFFFFF" /></View>}
                        </View>
                        <View style={styles.coachDetails}>
                          <Text style={styles.coachName}>{coach.name}</Text>
                          <Text style={styles.coachEmail}>{coach.email}</Text>
                          <Text style={styles.coachDupr}>Rating: {coach.dupr_rating}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.ratingText}>{coach.rating_avg || 0}</Text>
                        <Text style={styles.reviewCount}>({coach.rating_count || 0})</Text>
                      </View>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                      <View style={styles.specialtiesContainer}>
                        {(coach.specialties || []).slice(0, 2).map((specialty, index) => (
                          <View key={index} style={styles.specialtyTag}><Text style={styles.specialtyText}>{specialty}</Text></View>
                        ))}
                        {(coach.specialties || []).length > 2 && <Text style={styles.moreSpecialties}>+{(coach.specialties || []).length - 2}</Text>}
                      </View>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text style={styles.locationText}>{coach.location}</Text>
                      </View>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <Text style={styles.hourlyRate}>{coach.hourly_rate ? `$${(coach.hourly_rate / 100).toFixed(0)}/hr` : '—'}</Text>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <View style={styles.studentsContainer}>
                        <Ionicons name="people" size={16} color="#6B7280" />
                        <Text style={styles.studentsText}>—</Text>
                      </View>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <View style={styles.statusContainer}>
                        <View style={[styles.modernStatusChip, coach.is_active ? styles.activeStatusChip : styles.inactiveStatusChip]}>
                          <Text style={[styles.modernStatusText, coach.is_active ? styles.activeStatusText : styles.inactiveStatusText]}>
                            {coach.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        {coach.is_verified ? (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Ionicons name="time-outline" size={12} color="#F59E0B" />
                            <Text style={styles.pendingText}>Pending</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <View style={styles.modernActionButtons}>
                        <TouchableOpacity style={styles.modernActionButton}>
                          <Ionicons name="eye-outline" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modernActionButton} onPress={() => onEditCoach?.(coach)}>
                          <Ionicons name="create-outline" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <View style={styles.dropdownContainer}>
                          <TouchableOpacity
                            style={styles.modernActionButton}
                            onPress={() => setActiveDropdown(prev => prev === `coach_${coach.id}` ? null : `coach_${coach.id}`)}
                          >
                            <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          {activeDropdown === `coach_${coach.id}` && (
                            <View style={styles.dropdownMenu}>
                              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDeleteCoach(coach)}>
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </View>

      {/* Delete Coach Confirmation */}
      {showDeleteCoachConfirmation && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Coach</Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to reset "{coachToDelete?.name}"?{'\n\n'}
              This will reset all coach information to a new profile state. The coach will no longer be visible in Coach Management. This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => { setShowDeleteCoachConfirmation(false); setCoachToDelete(null); }}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={handleConfirmDeleteCoach} disabled={deleting}>
                {deleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteModalConfirmText}>Reset Coach</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
