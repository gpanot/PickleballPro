import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Users, Library, Search, Plus, X, ChevronRight, AlertCircle, BookOpen, Calendar, PlusCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { checkCoachAccess, getCoachStudents, addStudentByCode, supabase, transformProgramData } from '../../lib/supabase';
import SeededAvatar from '../../components/SeededAvatar';
import { useTheme } from '../../context/ThemeContext';
import ScreenAvatarHeader from '../../components/ScreenAvatarHeader';
import { getCoachOfferings, getNextOpenRun, getPriceRangeLabel } from '../../lib/offeringsApi';

export default function CoachDashboardScreen({ navigation }) {
  const { user: authUser } = useAuth();
  const { user: userProfile } = useUser();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { logbookTheme: t, isDark } = useTheme();
  
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

  // Offerings state
  const [offerings,        setOfferings]        = useState([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringsError,   setOfferingsError]   = useState(null);

  // Academy context card state (C-2)
  const [academyContext, setAcademyContext] = useState(null); // { academyId, academyName, slug, managerName, managerEmail }
  const bootstrappedUserIdRef = useRef(null);

  // Removed stats state (Active programs / Avg skill / Upcoming assessments)

  useEffect(() => {
    if (!authUser?.id) return;

    // Bootstrap only once per authenticated user to avoid full-screen reloads
    // when AuthContext emits non-ID user object updates.
    if (bootstrappedUserIdRef.current === authUser.id) return;

    bootstrappedUserIdRef.current = authUser.id;
    checkCoachAndLoadData();
  }, [authUser?.id]);

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

  // Load offerings when switching to Offerings tab
  useEffect(() => {
    if (activeTab === 'offerings') {
      loadOfferings();
    }
  }, [activeTab]);

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
        loadCoachPrograms(),
        loadAcademyContext(),
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

  // C-2: load academy context for the coach context card
  const loadAcademyContext = async () => {
    if (!authUser?.id) return;
    try {
      // Step 1: get academy membership (no join — use separate queries like the rest of the codebase)
      const { data: memberRow } = await supabase
        .from('academy_members')
        .select('academy_id, role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!memberRow?.academy_id) {
        setAcademyContext(null);
        return;
      }

      const academyId = memberRow.academy_id;

      // Step 2: fetch academy info
      const { data: academyRow } = await supabase
        .from('academies')
        .select('name, slug')
        .eq('id', academyId)
        .maybeSingle();

      // Step 3: find the manager row to get their user_id
      const { data: managerMemberRow } = await supabase
        .from('academy_members')
        .select('user_id')
        .eq('academy_id', academyId)
        .eq('role', 'manager')
        .maybeSingle();

      // Step 4: fetch manager's name/email from public.users
      let managerName = null;
      let managerEmail = null;
      if (managerMemberRow?.user_id) {
        const { data: managerUser } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', managerMemberRow.user_id)
          .maybeSingle();
        managerName = managerUser?.name ?? null;
        managerEmail = managerUser?.email ?? null;
      }

      setAcademyContext({
        academyId,
        academyName: academyRow?.name ?? null,
        slug: academyRow?.slug ?? null,
        managerName,
        managerEmail,
      });
    } catch (err) {
      console.error('[C-2] loadAcademyContext error:', err);
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

      // Resolve academy membership (C-1: two-path loader)
      let academyId = null;
      if (authUser?.id) {
        const { data: memberRow } = await supabase
          .from('academy_members')
          .select('academy_id')
          .eq('user_id', authUser.id)
          .eq('role', 'coach')
          .maybeSingle();
        academyId = memberRow?.academy_id ?? null;
      }

      const programFields = `
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
        `;

      let query = supabase.from('programs').select(programFields).eq('is_published', true);
      if (academyId) {
        // Academy coach: show academy's published programs
        query = query.eq('academy_id', academyId);
      } else {
        // Solo coach: show global coach programs only
        query = query.eq('is_coach_program', true);
      }
      query = query.order('category', { ascending: true }).order('order_index', { ascending: true });

      const { data, error } = await query;
      
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

  const loadOfferings = async () => {
    setOfferingsLoading(true);
    setOfferingsError(null);
    try {
      const { data, error } = await getCoachOfferings();
      if (error) throw error;
      setOfferings(data ?? []);
    } catch (err) {
      console.error('Error loading offerings:', err);
      setOfferingsError(err.message || 'Failed to load offerings');
    } finally {
      setOfferingsLoading(false);
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

      // Fire PNS to the student (fire-and-forget — don't block the UI)
      if (authUser?.id && data.student?.id) {
        supabase.functions
          .invoke('notify-on-student-added', {
            body: { coachUserId: authUser.id, studentUserId: data.student.id },
          })
          .catch((e) => console.warn('[CoachDashboard] notify-on-student-added failed:', e));
      }
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
      } else if (activeTab === 'offerings') {
        await loadOfferings();
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

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenAvatarHeader
        tokens={t}
        isDark={isDark}
        background="surface"
        bordered
        title="Academy"
        user={userProfile}
        onAvatarPress={() => navigation.getParent()?.navigate('Profile')}
      >
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {[
            { id: 'students',  label: 'Students',  Icon: Users },
            { id: 'programs',  label: 'Programs',  Icon: Library },
            { id: 'offerings', label: 'Offerings', Icon: BookOpen },
          ].map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.tab, {
                  backgroundColor: active ? `${t.accentPurple}15` : (isDark ? t.surfaceRaised : '#F9FAFB'),
                  borderColor: active ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                }]}
                onPress={() => setActiveTab(id)}
              >
                <Icon size={18} color={active ? t.accentPurple : t.textMuted} strokeWidth={2} />
                <Text style={[styles.tabText, { color: active ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab !== 'offerings' && (
          <View style={[styles.searchContainer, { backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB', borderColor: isDark ? t.border : '#E5E7EB' }]}>
            <Search size={18} color={t.textMuted} strokeWidth={2} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: t.textPrimary, fontFamily: t.fontBody }]}
              placeholder={activeTab === 'students' ? 'Search player by name or ID' : 'Search programs'}
              placeholderTextColor={t.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </ScreenAvatarHeader>

      {/* Stats Summary removed per requirements */}

      {/* Content based on active tab */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accentPurple} />
        }
      >
        {loading ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="large" color={t.accentPurple} />
          </View>
        ) : (
        <>
        {/* C-2: Academy context card — visible on both Students and Programs tabs */}
        {academyContext && (
          <View style={[styles.academyCard, { backgroundColor: isDark ? t.surfaceRaised : `${t.accentPurple}08`, borderColor: isDark ? t.border : `${t.accentPurple}25` }]}>
            <View style={styles.academyCardRow}>
              <View style={[styles.academyBadge, { backgroundColor: `${t.accentPurple}20` }]}>
                <Text style={[styles.academyBadgeText, { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>My Academy</Text>
              </View>
              {academyContext.slug && (
                <Text style={[styles.academySlug, { color: t.textMuted, fontFamily: t.fontBody }]}>@{academyContext.slug}</Text>
              )}
            </View>
            {academyContext.academyName && (
              <Text style={[styles.academyName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{academyContext.academyName}</Text>
            )}
            {academyContext.managerName && (
              <Text style={[styles.academyManager, { color: t.textSecondary, fontFamily: t.fontBody }]}>
                Manager: {academyContext.managerName}
                {academyContext.managerEmail ? ` · ${academyContext.managerEmail}` : ''}
              </Text>
            )}
          </View>
        )}

        {activeTab === 'students' ? (
          <>
            <Text style={[styles.sectionTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
              Students ({filteredStudents.length})
            </Text>
            
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color={t.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {searchQuery ? 'No students match your search' : 'No students added yet'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: t.accentPurple }]}
                    onPress={() => setShowAddStudentModal(true)}
                  >
                    <Text style={[styles.emptyButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>Add Your First Student</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredStudents.map((student) => (
                <View key={student.id} style={[styles.playerCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
                  <View style={styles.playerRow}>
                    <Pressable
                      style={styles.playerHeader}
                      onPress={() => handleStudentPress(student)}
                      onLongPress={() => handleRemoveStudent(student)}
                      android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
                    >
                      <SeededAvatar uri={student.avatarUrl} name={student.name} size={44} />
                      <View style={styles.playerInfo}>
                        <Text style={[styles.playerName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{student.name}</Text>
                        <View style={styles.playerMeta}>
                          {student.duprRating && (
                            <Text style={[styles.duprText, { color: t.textMuted, fontFamily: t.fontBody }]}>Rating: {student.duprRating}</Text>
                          )}
                          {student.tier && (
                            <Text style={[styles.tierText, { color: t.textMuted, fontFamily: t.fontBody }]}>• {student.tier}</Text>
                          )}
                        </View>
                        {student.lastAssessmentDate ? (
                          <Text style={[styles.lastAssessmentText, { color: t.textCaption, fontFamily: t.fontBody }]} numberOfLines={1}>
                            Assessment: {getRelativeTime(student.lastAssessmentDate)}
                          </Text>
                        ) : (
                          <Text style={[styles.lastAssessmentText, { color: t.textCaption, fontFamily: t.fontBody }]} numberOfLines={1}>
                            No assessment yet
                          </Text>
                        )}
                      </View>
                    </Pressable>
                    <TouchableOpacity
                      style={[styles.assignProgramBtn, { backgroundColor: `${t.accentPurple}15` }]}
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
                      <Plus size={13} color={t.accentPurple} strokeWidth={2.5} />
                      <Text style={[styles.assignProgramBtnText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : activeTab === 'programs' ? (
          <>
            <Text style={[styles.sectionTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
              Coach Programs ({coachPrograms.filter(p => 
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length})
            </Text>
            
            {programsLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={t.accentPurple} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>Loading programs...</Text>
              </View>
            ) : programsError ? (
              <View style={styles.emptyContainer}>
                <AlertCircle size={48} color="#EF4444" strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>{programsError}</Text>
              </View>
            ) : coachPrograms.filter(p => 
              p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Library size={48} color={t.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
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
                    style={[styles.programCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}
                    onPress={() => handleProgramPress(program)}
                  >
                    {program.thumbnail_url && (
                      <Image source={{ uri: program.thumbnail_url }} style={[styles.programThumbnail, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]} />
                    )}
                    <View style={styles.programInfo}>
                      <Text style={[styles.programName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{program.name}</Text>
                      {program.description && (
                        <Text style={[styles.programDescription, { color: t.textMuted, fontFamily: t.fontBody }]} numberOfLines={2}>{program.description}</Text>
                      )}
                      <View style={styles.programMeta}>
                        {program.category && <Text style={[styles.programCategory, { color: t.textCaption, fontFamily: t.fontBody }]}>{program.category}</Text>}
                        {program.tier && <Text style={[styles.programTier, { color: t.textCaption, fontFamily: t.fontBody }]}>• {program.tier}</Text>}
                      </View>
                    </View>
                    <ChevronRight size={20} color={t.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                ))
            )}
          </>
        ) : (
          /* ── Offerings tab ─────────────────────────────────────────────── */
          <>
            {/* CTA: Create new offering */}
            <TouchableOpacity
              style={[styles.createOfferingBtn, { backgroundColor: t.accentPurple }]}
              onPress={() => navigation.navigate('CreateOfferingStep1')}
            >
              <PlusCircle size={18} color="#fff" strokeWidth={2} />
              <Text style={[styles.createOfferingBtnText, { fontFamily: t.fontBodySemibold }]}>Create a new offering</Text>
            </TouchableOpacity>

            {offeringsLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={t.accentPurple} />
              </View>
            ) : offeringsError ? (
              <View style={styles.emptyContainer}>
                <AlertCircle size={48} color="#EF4444" strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>{offeringsError}</Text>
              </View>
            ) : offerings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color={t.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  No offerings yet.{'\n'}Tap the button above to create your first one.
                </Text>
              </View>
            ) : (
              offerings.map((offering) => {
                const nextRun = getNextOpenRun(offering.runs ?? []);
                const priceLabel = getPriceRangeLabel(offering.runs ?? []);
                const STATUS_COLOR = {
                  open: '#22C55E', draft: t.textMuted, completed: t.textMuted, cancelled: '#EF4444',
                };
                return (
                  <TouchableOpacity
                    key={offering.id}
                    style={[styles.offeringCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}
                    onPress={() => navigation.navigate('OfferingDetail', { offeringId: offering.id })}
                  >
                    <View style={styles.offeringCardHeader}>
                      <View style={styles.offeringTitleRow}>
                        <Text style={[styles.offeringTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]} numberOfLines={1}>
                          {offering.title}
                        </Text>
                        <View style={[styles.offeringBadge, { backgroundColor: `${STATUS_COLOR[offering.status] ?? t.textMuted}18` }]}>
                          <Text style={[styles.offeringBadgeText, { color: STATUS_COLOR[offering.status] ?? t.textMuted, fontFamily: t.fontBodySemibold }]}>
                            {offering.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.offeringMeta}>
                        {nextRun && (
                          <View style={styles.offeringMetaItem}>
                            <Calendar size={12} color={t.textMuted} strokeWidth={2} />
                            <Text style={[styles.offeringMetaText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                              {new Date(nextRun.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                        )}
                        {priceLabel && (
                          <Text style={[styles.offeringPrice, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>{priceLabel}</Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={18} color={t.textMuted} strokeWidth={2} style={styles.offeringChevron} />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        </>
        )}
      </ScrollView>

      {/* Floating Add Button - only show on Students tab */}
      {activeTab === 'students' && (
        <TouchableOpacity
          style={[styles.addButton, { bottom: insets.bottom + 16, backgroundColor: t.accentPurple }]}
          onPress={() => setShowAddStudentModal(true)}
        >
          <Plus size={28} color={isDark ? t.fabTextColor : '#fff'} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Assign Program Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Assign Program</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <X size={22} color={t.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
              {assignTarget ? `Choose a program to assign to ${assignTarget.name}:` : ''}
            </Text>
            {coachPrograms.map(prog => (
              <TouchableOpacity
                key={prog.id}
                style={[styles.programPickerItem, {
                  borderColor: assigningProgramId === prog.id ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                  backgroundColor: assigningProgramId === prog.id ? `${t.accentPurple}12` : 'transparent',
                }]}
                onPress={() => setAssigningProgramId(prog.id)}
              >
                <View style={[styles.radioCircle, {
                  borderColor: t.accentPurple,
                  backgroundColor: assigningProgramId === prog.id ? t.accentPurple : 'transparent',
                }]} />
                <Text style={[styles.programPickerText, { color: t.textPrimary, fontFamily: t.fontBody }]}>{prog.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelButton, { borderColor: isDark ? t.border : '#E5E7EB' }]} onPress={() => setShowAssignModal(false)}>
                <Text style={[styles.modalCancelText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddButton, { backgroundColor: t.accentPurple }, (assignLoading || !assigningProgramId) && styles.modalAddButtonDisabled]}
                onPress={handleAssignProgram}
                disabled={assignLoading || !assigningProgramId}
              >
                {assignLoading ? <ActivityIndicator size="small" color={isDark ? t.fabTextColor : '#fff'} /> : (
                  <Text style={[styles.modalAddText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal visible={showAddStudentModal} animationType="slide" transparent onRequestClose={() => setShowAddStudentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Add New Student</Text>
              <TouchableOpacity onPress={() => setShowAddStudentModal(false)}>
                <X size={22} color={t.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
              1. Ask your student to download AcademyPro.{'\n'}
              2. Enter the 4-digit student code to add a player to your roster.
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: isDark ? t.border : '#E5E7EB', color: t.textPrimary, backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB' }]}
              placeholder="Enter 4-digit code"
              placeholderTextColor={t.textMuted}
              value={studentCodeInput}
              onChangeText={(text) => setStudentCodeInput(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: isDark ? t.border : '#E5E7EB' }]}
                onPress={() => { setShowAddStudentModal(false); setStudentCodeInput(''); }}
              >
                <Text style={[styles.modalCancelText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddButton, { backgroundColor: t.accentPurple }, addingStudent && styles.modalAddButtonDisabled]}
                onPress={handleAddStudent}
                disabled={addingStudent}
              >
                {addingStudent ? <ActivityIndicator size="small" color={isDark ? t.fabTextColor : '#fff'} /> : (
                  <Text style={[styles.modalAddText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>Add Student</Text>
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
  container: { flex: 1 },
  inlineLoader: { paddingVertical: 60, alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 14 },
  tabContainer: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  tabText: { fontSize: 14 },
  programCard: { borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  programThumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  programInfo: { flex: 1 },
  programName: { fontSize: 16, marginBottom: 4 },
  programDescription: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  programMeta: { flexDirection: 'row', alignItems: 'center' },
  programCategory: { fontSize: 12, marginRight: 4 },
  programTier: { fontSize: 12 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 17, marginBottom: 14 },
  playerCard: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  playerHeader: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  playerInfo: { flex: 1, justifyContent: 'center', flexShrink: 1, marginLeft: 12 },
  playerName: { fontSize: 15, marginBottom: 3 },
  playerMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  duprText: { fontSize: 13, marginRight: 6 },
  tierText: { fontSize: 13 },
  lastAssessmentText: { fontSize: 12 },
  assignProgramBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, marginLeft: 8, borderRadius: 10, alignSelf: 'center', flexShrink: 0 },
  assignProgramBtnText: { fontSize: 11 },
  programPickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, marginRight: 10 },
  programPickerText: { fontSize: 14, flex: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  emptyButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { fontSize: 15 },
  addButton: { position: 'absolute', right: 16, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  // C-2: academy context card styles
  academyCard: { borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1 },
  academyCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  academyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  academyBadgeText: { fontSize: 11 },
  academySlug: { fontSize: 12 },
  academyName: { fontSize: 16, marginBottom: 4 },
  academyManager: { fontSize: 13 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 19 },
  modalDescription: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  modalInput: { borderWidth: 2, borderRadius: 12, padding: 16, fontSize: 18, textAlign: 'center', letterSpacing: 4, marginBottom: 20, fontFamily: 'monospace' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  modalCancelText: { fontSize: 15 },
  modalAddButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddText: { fontSize: 15 },
  // Offerings tab — inline list
  createOfferingBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, marginBottom: 16 },
  createOfferingBtnText: { color: '#fff', fontSize: 15 },
  offeringCard:          { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10 },
  offeringCardHeader:    { flex: 1 },
  offeringTitleRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  offeringTitle:         { flex: 1, fontSize: 15 },
  offeringBadge:         { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  offeringBadgeText:     { fontSize: 11, textTransform: 'capitalize' },
  offeringMeta:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offeringMetaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offeringMetaText:      { fontSize: 12 },
  offeringPrice:         { fontSize: 13 },
  offeringChevron:       { marginLeft: 4 },
});

