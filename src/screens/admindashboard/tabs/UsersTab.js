import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import skillsData from '../../../data/Commun_skills_tags.json';
import SkillIcon from '../../../components/SkillIcon';
import styles from '../adminDashboardStyles';

const getSkillNamesFromFocusAreas = (focusAreas) => {
  if (!Array.isArray(focusAreas) || focusAreas.length === 0) return [];
  const allSkills = Object.values(skillsData.skillCategories).flatMap(cat => cat.skills);
  return focusAreas.map(id => allSkills.find(s => s.id === id)).filter(Boolean);
};

const getTierColor = (tier) => {
  switch (tier) {
    case 'Beginner': return '#10B981';
    case 'Intermediate': return '#3B82F6';
    case 'Advanced': return '#8B5CF6';
    case 'Pro': return '#EF4444';
    default: return '#6B7280';
  }
};

export default function UsersTab({ sessionRole, coachId, user, onEditUser, onViewUserLogbook }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCoachSession = sessionRole === 'coach';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let data, error;
      if (isCoachSession) {
        const { data: linkRows, error: linkError } = await supabase.from('coach_students').select('student_id').eq('coach_id', coachId);
        if (linkError) throw linkError;
        const studentIds = (linkRows || []).map(r => r.student_id).filter(Boolean);
        if (studentIds.length === 0) { setUsers([]); setLoading(false); return; }
        const result = await supabase.from('users')
          .select('id, name, email, avatar_url, created_at, updated_at, is_active, is_admin, is_manager, tier, dupr_rating, goal, onboarding_completed, time_commitment, focus_areas, rating_type, student_code')
          .in('id', studentIds).order('created_at', { ascending: false });
        data = result.data; error = result.error;
      } else {
        const result = await supabase.from('users')
          .select('id, name, email, avatar_url, created_at, updated_at, is_active, is_admin, is_manager, tier, dupr_rating, goal, onboarding_completed, time_commitment, focus_areas, rating_type, student_code')
          .order('created_at', { ascending: false }).limit(50);
        data = result.data; error = result.error;
      }
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    Alert.alert('Delete User', `Are you sure you want to delete "${userName}"? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
            Alert.alert('Success', `User "${userName}" has been deleted successfully.`);
            fetchUsers();
          } catch (err) {
            Alert.alert('Error', `Failed to delete user: ${err.message}`);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleResetUserPassword = (u) => {
    setActiveDropdown(null);
    setUserToResetPassword(u);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const handleGenerateRandomPassword = () => {
    setNewPassword(Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!');
  };

  const handleConfirmPasswordReset = async () => {
    if (!userToResetPassword || !newPassword || newPassword.length < 6) { Alert.alert('Error', 'Please enter a password of at least 6 characters'); return; }
    setResetting(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('You must be logged in to reset passwords');

      const { data: functionResult, error: functionError } = await supabase.functions.invoke('reset-user-password', { body: { userId: userToResetPassword.id, newPassword } });
      if (functionError) {
        if (functionError.message?.includes('404') || functionError.message?.includes('not found')) {
          throw new Error('Password reset function is not deployed.');
        }
        throw new Error(functionError.message || 'Failed to reset password');
      }
      if (functionResult?.error) throw new Error(functionResult.error);

      const passwordToCopy = newPassword;
      setShowResetPasswordModal(false);
      Alert.alert(
        'Password Reset Successful',
        `New password for ${userToResetPassword.name || userToResetPassword.email}:\n\n${passwordToCopy}\n\nPlease save this password securely and share it with the user.`,
        [
          {
            text: 'Copy Password',
            onPress: () => {
              if (Platform.OS === 'web' && navigator.clipboard) {
                navigator.clipboard.writeText(passwordToCopy);
                Alert.alert('Copied', 'Password copied to clipboard');
              }
            },
          },
          { text: 'OK' },
        ]
      );
      setUserToResetPassword(null);
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', `Failed to reset password: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUserInitials = (name, email) => {
    if (name?.trim()) {
      const names = name.trim().split(' ');
      return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const getTimeSince = (ds) => {
    if (!ds) return 'Never';
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(ds)) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return '1 day ago';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.student_code?.toString().includes(searchQuery)
  );

  return (
    <View style={styles.content}>
      {/* Stats */}
      <View style={styles.userStatsGrid}>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{users.length}</Text>
          <Text style={styles.userStatLabel}>Total Users</Text>
          <Text style={styles.userStatSubtext}>All registered users</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{users.filter(u => u.is_active).length}</Text>
          <Text style={styles.userStatLabel}>Active Users</Text>
          <Text style={styles.userStatSubtext}>Currently active</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>+{users.filter(u => new Date(u.created_at) >= oneMonthAgo).length}</Text>
          <Text style={styles.userStatLabel}>New This Month</Text>
          <Text style={styles.userStatSubtext}>New registrations</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>
            {users.length > 0 ? Math.round((users.filter(u => u.onboarding_completed).length / users.length) * 100) : 0}%
          </Text>
          <Text style={styles.userStatLabel}>Onboarding Rate</Text>
          <Text style={styles.userStatSubtext}>Completed onboarding</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{users.filter(u => u.dupr_rating).length}</Text>
          <Text style={styles.userStatLabel}>Rated Users</Text>
          <Text style={styles.userStatSubtext}>Users with skill rating</Text>
        </View>
      </View>

      {/* User Accounts Section */}
      <View style={styles.userAccountsSection}>
        <View style={styles.searchFilterBar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput style={styles.searchInput} placeholder="Search users..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9CA3AF" />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="funnel-outline" size={20} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.comingSoon}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.comingSoonText}>No users found</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>User</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Profile</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Tier</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Skill Rating</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Skills</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Activity</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Progress</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            <View>
              {filteredUsers.map(u => (
                <View key={u.id} style={[styles.modernTableRow, activeDropdown === `user_${u.id}` && { zIndex: 1000, elevation: 10 }]}>
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <View style={styles.userInfoContainer}>
                      <View style={styles.userAvatar}>
                        {u.avatar_url
                          ? <Image source={{ uri: u.avatar_url }} style={styles.userAvatarImage} resizeMode="cover" />
                          : <Text style={styles.userAvatarText}>{getUserInitials(u.name, u.email)}</Text>}
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{u.name || 'No Name'}</Text>
                        <Text style={styles.userEmail}>{u.email}</Text>
                        <Text style={styles.userJoined}>Joined {formatDate(u.created_at)}</Text>
                        {u.student_code ? <Text style={styles.userStudentCode}>Code {u.student_code}</Text> : null}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    {(() => {
                      const role = u.is_admin ? 'admin' : u.is_manager ? 'manager' : 'player';
                      const cfg = { admin: { label: 'Admin', bg: '#FEF2F2', color: '#DC2626' }, manager: { label: 'Manager', bg: '#FFF7ED', color: '#EA580C' }, player: { label: 'Player', bg: '#F0FDF4', color: '#16A34A' } }[role];
                      return <View style={[styles.tierBadge, { backgroundColor: cfg.bg }]}><Text style={[styles.tierText, { color: cfg.color }]}>{cfg.label}</Text></View>;
                    })()}
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    {u.tier
                      ? <View style={[styles.tierBadge, { backgroundColor: getTierColor(u.tier) + '20' }]}><Text style={[styles.tierText, { color: getTierColor(u.tier) }]}>{u.tier}</Text></View>
                      : <Text style={styles.noDuprText}>Not set</Text>}
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    {u.dupr_rating ? <Text style={styles.duprText}>{parseFloat(u.dupr_rating).toFixed(3)}</Text> : <Text style={styles.noDuprText}>—</Text>}
                  </View>

                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <View style={styles.skillsContainer}>
                      {u.focus_areas && u.focus_areas.length > 0 ? (
                        <>
                          {getSkillNamesFromFocusAreas(u.focus_areas).slice(0, 3).map(skill => (
                            <View key={skill.id} style={[styles.skillTag, { backgroundColor: skill.color + '20' }]}>
                              <SkillIcon skillId={skill.id} size={14} color={skill.color} />
                              <Text style={[styles.skillText, { color: skill.color }]}>{skill.name}</Text>
                            </View>
                          ))}
                          {u.focus_areas.length > 3 && <Text style={styles.moreSkillsText}>+{u.focus_areas.length - 3} more</Text>}
                        </>
                      ) : (
                        <Text style={styles.noSkillsText}>No skills selected</Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                    <Text style={styles.activityText}>Time: {u.time_commitment || 'Not set'}</Text>
                    <Text style={styles.activitySubtext}>Rating: {u.rating_type || 'none'}</Text>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={[styles.progressBadge, u.onboarding_completed ? styles.onboardedBadge : styles.incompleteBadge]}>
                      <View style={[styles.progressDot, { backgroundColor: u.onboarding_completed ? '#10B981' : '#F59E0B' }]} />
                      <Text style={[styles.progressText, { color: u.onboarding_completed ? '#10B981' : '#F59E0B' }]}>
                        {u.onboarding_completed ? 'Completed' : 'Incomplete'}
                      </Text>
                    </View>
                    <Text style={styles.goalText}>Goal: {u.goal || 'Not set'}</Text>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={[styles.modernStatusChip, u.is_active ? styles.activeStatusChip : styles.inactiveStatusChip]}>
                      <Text style={[styles.modernStatusText, u.is_active ? styles.activeStatusText : styles.inactiveStatusText]}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <Text style={styles.lastActivityText}>Last: {getTimeSince(u.updated_at)}</Text>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.modernActionButtons}>
                      <TouchableOpacity style={styles.modernActionButton}><Ionicons name="eye-outline" size={16} color="#6B7280" /></TouchableOpacity>
                      <TouchableOpacity style={styles.modernActionButton} onPress={() => onEditUser?.(u)}>
                        <Ionicons name="create-outline" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modernActionButton}><Ionicons name="mail-outline" size={16} color="#6B7280" /></TouchableOpacity>
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity style={styles.modernActionButton} onPress={() => setActiveDropdown(prev => prev === `user_${u.id}` ? null : `user_${u.id}`)}>
                          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        {activeDropdown === `user_${u.id}` && (
                          <View style={styles.dropdownMenu}>
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setActiveDropdown(null); onViewUserLogbook?.(u); }}>
                              <Ionicons name="book-outline" size={16} color="#3B82F6" />
                              <Text style={styles.dropdownItemText}>User logbook</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleResetUserPassword(u)}>
                              <Ionicons name="key-outline" size={16} color="#F59E0B" />
                              <Text style={styles.dropdownItemText}>Reset Pwd</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setActiveDropdown(null); handleDeleteUser(u.id, u.name || u.email); }}>
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                              <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="key" size={24} color="#F59E0B" />
              <Text style={styles.deleteModalTitle}>Reset Password</Text>
            </View>
            <Text style={styles.deleteModalMessage}>Set a new password for "{userToResetPassword?.name || userToResetPassword?.email}"</Text>
            <View style={{ marginTop: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginRight: 10 }}>New Password</Text>
                <TouchableOpacity onPress={handleGenerateRandomPassword} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shuffle" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Generate</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChangeText={setNewPassword}
                autoFocus
                placeholderTextColor="#9CA3AF"
              />
              {newPassword.length > 0 && newPassword.length < 6 && (
                <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Password must be at least 6 characters</Text>
              )}
            </View>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => { setShowResetPasswordModal(false); setUserToResetPassword(null); }}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#F59E0B' }, (!newPassword || newPassword.length < 6) && { opacity: 0.5 }]}
                onPress={handleConfirmPasswordReset}
                disabled={resetting || !newPassword || newPassword.length < 6}
              >
                {resetting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteModalConfirmText}>Reset Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
