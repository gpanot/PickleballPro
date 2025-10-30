import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';

export default function PlayerProfileScreen({ route, navigation }) {
  const { studentId, student } = route.params;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  const [player, setPlayer] = useState(student || null);
  const [loading, setLoading] = useState(!student);
  const [activeTab, setActiveTab] = useState('Assessments');
  const [assessments, setAssessments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!student) {
      loadPlayerData();
    }
    loadAssessments();
    loadPrograms();
    loadProgress();
  }, [studentId]);

  // Refresh assessments when returning to this screen (e.g., after saving)
  useEffect(() => {
    if (!isFocused) return;
    loadAssessments();
  }, [isFocused]);

  const loadPlayerData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (error) {
      console.error('Error loading player:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_assessments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const confirmDeleteAssessment = (assessment) => {
    Alert.alert(
      'Delete assessment?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('coach_assessments')
                .delete()
                .eq('id', assessment.id);
              if (error) throw error;
              await loadAssessments();
            } catch (err) {
              console.error('Error deleting assessment:', err);
              Alert.alert('Error', 'Failed to delete assessment.');
            }
          },
        },
      ]
    );
  };

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('user_programs')
        .select('*, programs(*)')
        .eq('user_id', studentId)
        .eq('is_active', true);

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setProgress(progressData || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleStartAssessment = async () => {
    // Check if there's an existing draft assessment
    const draftKey = `assessment_${studentId}_draft`;
    try {
      const existingDraft = await AsyncStorage.getItem(draftKey);
      const assessmentId = existingDraft ? 'draft' : `new_${Date.now()}`;
      
      navigation.navigate('AssessmentOverview', { 
        studentId, 
        student: player,
        assessmentId 
      });
    } catch (error) {
      console.error('Error checking for draft assessment:', error);
      // Fallback to draft if there's an error
      navigation.navigate('AssessmentOverview', { 
        studentId, 
        student: player,
        assessmentId: 'draft'
      });
    }
  };

  const handleViewAssessment = (assessment) => {
    navigation.navigate('EvaluationSummary', { assessmentId: assessment.id, student: player });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Player Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Player Info Card */}
        <View style={styles.playerCard}>
          <View style={styles.playerAvatarContainer}>
            {player?.avatar_url ? (
              <Image source={{ uri: player.avatar_url }} style={styles.playerAvatar} />
            ) : (
              <View style={styles.playerAvatarFallback}>
                <Text style={styles.playerAvatarText}>
                  {player?.name?.charAt(0).toUpperCase() || 'P'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.playerName}>{player?.name || 'Player'}</Text>
          <View style={styles.playerMeta}>
            {player?.dupr_rating && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>DUPR</Text>
                <Text style={styles.metaValue}>{player.dupr_rating}</Text>
              </View>
            )}
            {player?.tier && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Tier</Text>
                <Text style={styles.metaValue}>{player.tier}</Text>
              </View>
            )}
            {player?.preferred_side && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Side</Text>
                <Text style={styles.metaValue}>{player.preferred_side}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons (moved Start New Assessment into Assessments tab) */}
        <View style={styles.actionButtons}>
          {programs.length > 0 && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="play-circle-outline" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.secondaryButtonText}>View Active Program</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['Assessments', 'Programs', 'Progress'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'Assessments' && (
            <View>
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleStartAssessment}>
                  <Ionicons name="clipboard-outline" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Start New Assessment</Text>
                </TouchableOpacity>
              </View>
              {assessments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No assessments yet</Text>
                  <TouchableOpacity style={styles.emptyButton} onPress={handleStartAssessment}>
                    <Text style={styles.emptyButtonText}>Start First Assessment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                assessments.map((assessment) => (
                  <TouchableOpacity
                    key={assessment.id}
                    style={styles.assessmentCard}
                    onPress={() => handleViewAssessment(assessment)}
                    onLongPress={() => confirmDeleteAssessment(assessment)}
                    delayLongPress={400}
                  >
                    <View style={styles.assessmentHeader}>
                      <Text style={styles.assessmentDate}>
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </Text>
                      <View style={styles.assessmentScore}>
                        <Text style={styles.scoreValue}>
                          {assessment.total_score || 0}/{assessment.max_score || 0}
                        </Text>
                        <Text style={styles.scorePercent}>
                          ({Math.round(((assessment.total_score || 0) / (assessment.max_score || 1)) * 100)}%)
                        </Text>
                      </View>
                    </View>
                    {assessment.notes && (
                      <Text style={styles.assessmentNotes} numberOfLines={2}>
                        {assessment.notes}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'Programs' && (
            <View>
              {programs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="list-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No active programs</Text>
                </View>
              ) : (
                programs.map((program) => (
                  <View key={program.id} style={styles.programCard}>
                    <Text style={styles.programName}>{program.programs?.name || 'Program'}</Text>
                    <Text style={styles.programStatus}>Active</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'Progress' && (
            <View>
              {(!progress || progress.length === 0) ? (
                <View style={styles.emptyState}>
                  <Ionicons name="trending-up-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No progress data yet</Text>
                </View>
              ) : (
                progress.map((item, index) => (
                  <View key={index} style={styles.progressCard}>
                    <Text style={styles.progressDate}>
                      {new Date(item.completed_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.progressResult}>
                      Result: {item.result_value}/{item.target_value}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  playerAvatarContainer: {
    marginBottom: 16,
  },
  playerAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  playerAvatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: 'white',
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  playerMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: 'white',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  assessmentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  assessmentScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scorePercent: {
    fontSize: 14,
    color: '#6B7280',
  },
  assessmentNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  programCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  programStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  progressDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressResult: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
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
});

