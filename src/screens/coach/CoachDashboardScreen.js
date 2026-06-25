import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { checkCoachAccess, getCoachStudents, addStudentByCode, supabase, transformProgramData } from '../../lib/supabase';
import SeededAvatar from '../../components/SeededAvatar';

const PRIMARY_COLOR = '#6366F1';
const SECONDARY_COLOR = '#F5F5F7';
const ACCENT_COLOR = '#8B5CF6';

export default function CoachDashboardScreen({ navigation }) {
  const { user: authUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  const [coachId, setCoachId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // student object
  const [assigningProgramId, setAssigningProgramId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'programs'
  
  // Programs state
  const [coachPrograms, setCoachPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsError, setProgramsError] = useState(null);
  
  // Removed stats state (Active programs / Avg skill / Upcoming assessments)

  useEffect(() => {
    checkCoachAndLoadData();
  }, [authUser]);

  // Reload when the tab/screen gains focus - but only reload students, not programs
  useEffect(() => {
    if (!isFocused || !coachId) return;
    // Only reload students on focus, not programs (to avoid unnecessary reloads when navigating back)
    loadStudents(coachId);
  }, [isFocused, coachId]);

  // Load programs when switching to Programs tab if not already loaded
  useEffect(() => {
    if (activeTab === 'programs' && coachPrograms.length === 0 && !programsLoading && coachId) {
      loadCoachPrograms();
    }
  }, [activeTab, coachId]);

  const checkCoachAndLoadData = async () => {
    if (!authUser?.id) return;
    
    try {
      const { isCoach, coachId: id } = await checkCoachAccess(authUser.id);
      if (!isCoach) {
        Alert.alert('Access Denied', 'You must be a coach to access this dashboard.');
        navigation.goBack();
        return;
      }
      
      setCoachId(id);
      await Promise.all([
        loadStudents(id),
        loadCoachPrograms()
      ]);
    } catch (error) {
      console.error('Error checking coach access:', error);
      Alert.alert('Error', 'Failed to load coach dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (cId = null) => {
    const currentCoachId = cId || coachId;
    if (!currentCoachId) return;
    
    try {
      const { data, error } = await getCoachStudents(currentCoachId);
      if (error) throw error;
      
      // Transform data structure
      const transformedStudents = (data || []).map(item => ({
        id: item.students.id,
        name: item.students.name,
        email: item.students.email,
        avatarUrl: item.students.avatar_url,
        duprRating: item.students.dupr_rating,
        tier: item.students.tier,
        studentCode: item.students.student_code,
        addedAt: item.created_at,
        lastAssessmentDate: null,
        lastAssessmentPercent: null,
        lastAssessmentScore: null,
      }));
      
      // Fetch latest assessment per student in one query
      const studentIds = transformedStudents.map(s => s.id);
      if (studentIds.length > 0) {
        const { data: assessmentsData, error: assessErr } = await supabase
          .from('coach_assessments')
          .select('id, student_id, total_score, max_score, created_at, skills_data')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });
        if (!assessErr && assessmentsData) {
          // Helper function to check if an assessment is a First Time Assessment
          const isFirstTimeAssessment = (assessment) => {
            return assessment?.skills_data?.newbie_assessment?.type === 'first_time_assessment';
          };
          
          // Filter out First Time Assessments and get latest for each student
          const filteredAssessments = assessmentsData.filter(a => !isFirstTimeAssessment(a));
          const latestByStudent = new Map();
          for (const row of filteredAssessments) {
            if (!latestByStudent.has(row.student_id)) {
              latestByStudent.set(row.student_id, row);
            }
          }
          transformedStudents.forEach(s => {
            const latest = latestByStudent.get(s.id);
            if (latest) {
              s.lastAssessmentDate = latest.created_at;
              const pct = (latest.total_score || 0) / Math.max(latest.max_score || 1, 1) * 100;
              s.lastAssessmentPercent = Math.round(pct);
              s.lastAssessmentScore = Number(latest.total_score) || 0;
            }
          });
        }
      }

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students.');
    }
  };

  // Removed loadStats function and related queries

  const loadCoachPrograms = async () => {
    try {
      // Don't set loading if already refreshing (to avoid double spinners)
      if (!refreshing) {
        setProgramsLoading(true);
      }
      setProgramsError(null);
      
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          description,
          category,
          tier,
          thumbnail_url,
          rating,
          added_count,
          order_index,
          created_at,
          routines (
            id,
            name,
            description,
            order_index,
            time_estimate_minutes,
            routine_exercises (
              order_index,
              custom_target_value,
              is_optional,
              exercises (*)
            )
          )
        `)
        .eq('is_published', true)
        .eq('is_coach_program', true) // Only coach-only programs
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      const transformedPrograms = data ? transformProgramData(data) : [];
      setCoachPrograms(transformedPrograms);
      setProgramsError(null);
    } catch (error) {
      console.error('Error loading coach programs:', error);
      setProgramsError(error.message || 'Failed to load programs');
      // Don't clear programs on error during refresh, just show error
      if (!refreshing) {
        setCoachPrograms([]);
      }
    } finally {
      if (!refreshing) {
        setProgramsLoading(false);
      }
    }
  };

  const handleAddStudent = async () => {
    const code = studentCodeInput.trim();

    if (!code || code.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a valid 4-digit student code.');
      return;
    }

    if (!coachId) {
      console.warn('[Academy] handleAddStudent called without coachId');
      Alert.alert('Error', 'Coach profile not loaded yet. Please wait and try again.');
      return;
    }

    setAddingStudent(true);
    try {
      console.log('[Academy] add student attempt', { coachId, code });
      const { data, error } = await addStudentByCode(coachId, code);

      if (error) {
        console.warn('[Academy] add student failed', error);
        const debugSuffix = __DEV__ && error.debug
          ? `\n\nDebug: ${JSON.stringify(error.debug)}`
          : '';
        Alert.alert('Error', `${error.message || 'Failed to add student.'}${debugSuffix}`);
        return;
      }
      
      Alert.alert('Success', `Added ${data.student.name} as your student.`);
      setStudentCodeInput('');
      setShowAddStudentModal(false);
      await loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student.');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleStudentPress = (student) => {
    navigation.navigate('PlayerProfile', { studentId: student.id, student });
  };

  const handleAssignProgram = async () => {
    if (!assignTarget || !assigningProgramId) return;
    setAssignLoading(true);
    try {
      const { error } = await supabase
        .from('user_programs')
        .upsert({
          user_id: assignTarget.id,
          program_id: assigningProgramId,
          assigned_by_coach_id: coachId,
          assigned_at: new Date().toISOString(),
        }, { onConflict: 'user_id,program_id' });
      if (error) throw error;
      Alert.alert('Done!', `Program assigned to ${assignTarget.name}.`);
      setShowAssignModal(false);
      setAssignTarget(null);
      setAssigningProgramId(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to assign program.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveStudent = async (student) => {
    Alert.alert(
      'Remove Student Connection',
      `Remove ${student.name} from your student list?\n\nDon't worry - all assessment history and data will be preserved. You can reconnect with them later if needed.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Soft delete by setting is_active to false
              const { error } = await supabase
                .from('coach_students')
                .update({ is_active: false })
                .eq('coach_id', coachId)
                .eq('student_id', student.id);
              
              if (error) throw error;
              
              // Reload students list
              await loadStudents();
              
              Alert.alert(
                'Student Removed',
                `${student.name} has been removed from your list. All history is preserved.`
              );
            } catch (error) {
              console.error('Error removing student:', error);
              Alert.alert('Error', 'Failed to remove student. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Removed Start Assessment handler (no inline start button on dashboard)

  const filteredStudents = students
    .filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentCode?.toString().includes(searchQuery)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Refresh based on active tab
      if (activeTab === 'students') {
        if (coachId) {
          await loadStudents(coachId);
        }
      } else if (activeTab === 'programs') {
        await loadCoachPrograms();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      // Don't show alert on pull-to-refresh, just log the error
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleProgramPress = (program) => {
    navigation.navigate('ProgramDetail', {
      program,
      source: 'coach'
    });
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Coach Dashboard</Text>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.activeTab]}
            onPress={() => setActiveTab('students')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'students' ? PRIMARY_COLOR : '#9CA3AF'} 
            />
            <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
              Students
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'programs' && styles.activeTab]}
            onPress={() => setActiveTab('programs')}
          >
            <Ionicons 
              name="library" 
              size={20} 
              color={activeTab === 'programs' ? PRIMARY_COLOR : '#9CA3AF'} 
            />
            <Text style={[styles.tabText, activeTab === 'programs' && styles.activeTabText]}>
              Programs
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'students' ? 'Search player by name or ID' : 'Search programs'}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats Summary removed per requirements */}

      {/* Content based on active tab */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_COLOR} />
        }
      >
        {activeTab === 'students' ? (
          <>
            <Text style={styles.sectionTitle}>
              Students ({filteredStudents.length})
            </Text>
            
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No students match your search' : 'No students added yet'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowAddStudentModal(true)}
                  >
                    <Text style={styles.emptyButtonText}>Add Your First Student</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredStudents.map((student) => (
                <View key={student.id} style={styles.playerCard}>
                  <Pressable
                    style={styles.playerHeader}
                    onPress={() => handleStudentPress(student)}
                    onLongPress={() => handleRemoveStudent(student)}
                    android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
                  >
                    <SeededAvatar
                      uri={student.avatarUrl}
                      name={student.name}
                      size={44}
                    />
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{student.name}</Text>
                      <View style={styles.playerMeta}>
                        {student.duprRating && (
                          <Text style={styles.duprText}>DUPR: {student.duprRating}</Text>
                        )}
                        {student.tier && (
                          <Text style={styles.tierText}>• {student.tier}</Text>
                        )}
                      </View>
                      {student.lastAssessmentDate ? (
                        <Text style={styles.lastAssessmentText} numberOfLines={1}>
                          Assessment: {getRelativeTime(student.lastAssessmentDate)}
                        </Text>
                      ) : (
                        <Text style={[styles.lastAssessmentText, { color: '#9CA3AF' }]} numberOfLines={1}>
                          No assessment yet
                        </Text>
                      )}
                    </View>
                    {student.lastAssessmentScore !== null && (
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText} numberOfLines={1}>
                          {String(student.lastAssessmentScore)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <TouchableOpacity
                    style={styles.assignProgramBtn}
                    onPress={() => {
                      if (coachPrograms.length === 0) {
                        Alert.alert('No Programs', 'Create a coach program first before assigning.');
                        return;
                      }
                      setAssignTarget(student);
                      setAssigningProgramId(coachPrograms[0].id);
                      setShowAssignModal(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={PRIMARY_COLOR} style={{ marginRight: 4 }} />
                    <Text style={styles.assignProgramBtnText}>Assign Program</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Coach Programs ({coachPrograms.filter(p => 
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length})
            </Text>
            
            {programsLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.emptyText}>Loading programs...</Text>
              </View>
            ) : programsError ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.emptyText}>{programsError}</Text>
              </View>
            ) : coachPrograms.filter(p => 
              p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="library-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No programs match your search' : 'No coach programs available'}
                </Text>
              </View>
            ) : (
              coachPrograms
                .filter(p => 
                  p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((program) => (
                  <TouchableOpacity
                    key={program.id}
                    style={styles.programCard}
                    onPress={() => handleProgramPress(program)}
                  >
                    {program.thumbnail_url && (
                      <Image 
                        source={{ uri: program.thumbnail_url }} 
                        style={styles.programThumbnail}
                      />
                    )}
                    <View style={styles.programInfo}>
                      <Text style={styles.programName}>{program.name}</Text>
                      {program.description && (
                        <Text style={styles.programDescription} numberOfLines={2}>
                          {program.description}
                        </Text>
                      )}
                      <View style={styles.programMeta}>
                        {program.category && (
                          <Text style={styles.programCategory}>{program.category}</Text>
                        )}
                        {program.tier && (
                          <Text style={styles.programTier}>• {program.tier}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Add Button - only show on Students tab */}
      {activeTab === 'students' && (
        <TouchableOpacity
          style={[styles.addButton, { bottom: insets.bottom + 16 }]}
          onPress={() => setShowAddStudentModal(true)}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Assign Program Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Program</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              {assignTarget ? `Choose a program to assign to ${assignTarget.name}:` : ''}
            </Text>
            {coachPrograms.map(prog => (
              <TouchableOpacity
                key={prog.id}
                style={[styles.programPickerItem, assigningProgramId === prog.id && styles.programPickerItemActive]}
                onPress={() => setAssigningProgramId(prog.id)}
              >
                <Ionicons
                  name={assigningProgramId === prog.id ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={PRIMARY_COLOR}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.programPickerText}>{prog.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowAssignModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddButton, (assignLoading || !assigningProgramId) && styles.modalAddButtonDisabled]}
                onPress={handleAssignProgram}
                disabled={assignLoading || !assigningProgramId}
              >
                {assignLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalAddText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        visible={showAddStudentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Student</Text>
              <TouchableOpacity onPress={() => setShowAddStudentModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the 4-digit student code to add a player to your roster.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter 4-digit code"
              placeholderTextColor="#9CA3AF"
              value={studentCodeInput}
              onChangeText={(text) => setStudentCodeInput(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddStudentModal(false);
                  setStudentCodeInput('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddButton, addingStudent && styles.modalAddButtonDisabled]}
                onPress={handleAddStudent}
                disabled={addingStudent}
              >
                {addingStudent ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalAddText}>Add Student</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY_COLOR,
  },
  assignProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 6,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
  },
  assignProgramBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  programPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  programPickerItemActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#EEF2FF',
  },
  programPickerText: { fontSize: 14, color: '#1F2937', flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  activeTab: {
    backgroundColor: PRIMARY_COLOR + '10',
    borderColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: PRIMARY_COLOR,
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  programThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  programTier: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 11,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    marginBottom: 0,
    alignItems: 'center',
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
    flexShrink: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  duprText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  tierText: {
    fontSize: 14,
    color: '#6B7280',
  },
  lastAssessmentText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 16,
    width: 140,
    flexShrink: 0,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    lineHeight: 42,
    textAlign: 'right',
  },
  assessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  assessmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

