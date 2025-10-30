import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import { checkCoachAccess, getCoachStudents, addStudentByCode, supabase } from '../../lib/supabase';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';
const ACCENT_COLOR = '#F39C12';

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
  
  // Removed stats state (Active programs / Avg skill / Upcoming assessments)

  useEffect(() => {
    checkCoachAndLoadData();
  }, [authUser]);

  // Reload when the tab/screen gains focus
  useEffect(() => {
    if (!isFocused) return;
    if (coachId) {
      loadStudents();
    } else {
      checkCoachAndLoadData();
    }
  }, [isFocused]);

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
      await loadStudents();
    } catch (error) {
      console.error('Error checking coach access:', error);
      Alert.alert('Error', 'Failed to load coach dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!coachId) return;
    
    try {
      const { data, error } = await getCoachStudents(coachId);
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
      }));
      
      // Fetch latest assessment per student in one query
      const studentIds = transformedStudents.map(s => s.id);
      if (studentIds.length > 0) {
        const { data: assessmentsData, error: assessErr } = await supabase
          .from('coach_assessments')
          .select('id, student_id, total_score, max_score, created_at')
          .in('student_id', studentIds)
          .eq('coach_id', coachId)
          .order('created_at', { ascending: false });
        if (!assessErr && assessmentsData) {
          const latestByStudent = new Map();
          for (const row of assessmentsData) {
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

  const handleAddStudent = async () => {
    if (!studentCodeInput.trim() || studentCodeInput.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a valid 4-digit student code.');
      return;
    }

    setAddingStudent(true);
    try {
      const { data, error } = await addStudentByCode(coachId, studentCodeInput);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to add student.');
        return;
      }
      
      Alert.alert('Success', `Added ${data.student.name} as your student.`);
      setStudentCodeInput('');
      setShowAddStudentModal(false);
      await loadStudents();
      await loadStats();
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

  // Removed Start Assessment handler (no inline start button on dashboard)

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentCode?.toString().includes(searchQuery)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
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
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search player by name or ID"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Summary removed per requirements */}

      {/* Students List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_COLOR} />
        }
      >
        <Text style={styles.sectionTitle}>
          Players ({filteredStudents.length})
        </Text>
        
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No players match your search' : 'No players added yet'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddStudentModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add Your First Player</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredStudents.map((student) => (
            <View key={student.id} style={styles.playerCard}>
              <TouchableOpacity
                style={styles.playerHeader}
                onPress={() => handleStudentPress(student)}
              >
                <View style={styles.playerAvatar}>
                  {student.avatarUrl ? (
                    <Image source={{ uri: student.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {student.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
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
                    <Text style={styles.lastAssessmentText}>
                      Last: {new Date(student.lastAssessmentDate).toLocaleDateString()} · {student.lastAssessmentPercent}%
                    </Text>
                  ) : (
                    <Text style={styles.lastAssessmentText}>No assessment</Text>
                  )}
                </View>
              </TouchableOpacity>
              {/* Start New Assessment button removed */}
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { bottom: insets.bottom + 16 }]}
        onPress={() => setShowAddStudentModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>Add New Player</Text>
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
                  <Text style={styles.modalAddText}>Add Player</Text>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
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

