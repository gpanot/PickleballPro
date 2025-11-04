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
import { supabase, transformProgramData, getLogbookEntriesByUserId } from '../../lib/supabase';
import { Modal } from 'react-native';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';

export default function PlayerProfileScreen({ route, navigation }) {
  const { studentId, student, isStudentView } = route.params || {};
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  const [player, setPlayer] = useState(student || null);
  const [loading, setLoading] = useState(!student);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [activeTab, setActiveTab] = useState('Assessment');
  const [assessments, setAssessments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [progress, setProgress] = useState(null); // kept but not used
  const [progressSeries, setProgressSeries] = useState(null);
  const [progressDeltas, setProgressDeltas] = useState(null);
  const [latestSummary, setLatestSummary] = useState(null);
  const [expandedSkill, setExpandedSkill] = useState(null); // for large modal view
  const [avgSkillScores, setAvgSkillScores] = useState(null);
  const [skillOverviewExpanded, setSkillOverviewExpanded] = useState(true);
  const [hasFirstTimeAssessment, setHasFirstTimeAssessment] = useState(false);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [loadingLogbook, setLoadingLogbook] = useState(false);

  // Include all assessed skills
  const PROGRESS_SKILLS = [
    { id: 'serves', name: 'Serves', color: '#3B82F6' },
    { id: 'dinks', name: 'Dinks', color: '#10B981' },
    { id: 'volleys', name: 'Volleys / Resets', color: '#F59E0B' },
    { id: 'third_shot', name: '3rd Shot', color: '#8B5CF6' },
    { id: 'footwork', name: 'Footwork', color: '#EC4899' },
    { id: 'game_play', name: 'Game Play / Scenarios', color: '#F43F5E' },
  ];

  const CHART_WIDTH = 300;
  const CHART_HEIGHT = 140;

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
    loadPrograms();
  }, [isFocused]);

  // Refresh programs when Programs tab is selected
  useEffect(() => {
    if (activeTab === 'Programs') {
      console.log('📚 Programs tab selected, refreshing programs...');
      loadPrograms();
    } else if (activeTab === 'Logbook') {
      console.log('📖 Logbook tab selected, loading logbook...');
      loadLogbookEntries();
    }
  }, [activeTab]);

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
      setLoadingAssessments(true);
      const { data, error } = await supabase
        .from('coach_assessments')
        .select('id, created_at, total_score, max_score, skills_data, notes')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = data || [];
      setAssessments(list);
      
      // Check if First Time Assessment exists
      const firstTimeExists = list.some(
        assessment => assessment.skills_data?.newbie_assessment?.type === 'first_time_assessment'
      );
      setHasFirstTimeAssessment(firstTimeExists);
      
      computeProgress(list);
      computeSkillAverages(list);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoadingAssessments(false);
    }
  };

  // Helper function to check if an assessment is a First Time Assessment
  const isFirstTimeAssessment = (assessment) => {
    return assessment?.skills_data?.newbie_assessment?.type === 'first_time_assessment';
  };

  const computeProgress = (list) => {
    // Filter out First Time Assessments
    const filteredList = (list || []).filter(a => !isFirstTimeAssessment(a));
    
    if (!filteredList || filteredList.length === 0) {
      setProgressSeries(null);
      setProgressDeltas(null);
      setLatestSummary(null);
      return;
    }
    // Take last 5 assessments in chronological order
    const lastFive = [...filteredList].slice(0, 5).reverse();
    const labels = lastFive.map((a, idx) => `A${lastFive.length - idx}`); // A1..A5
    const dates = lastFive.map((a) => a.created_at); // Store actual dates

    const series = PROGRESS_SKILLS.map((skill) => {
      const values = lastFive.map((a) => {
        const s = a.skills_data?.[skill.id];
        return s?.total ?? 0; // 0-50
      });
      return { id: skill.id, name: skill.name, color: skill.color, values, dates };
    });

    // Deltas between last two assessments (if available)
    let deltas = null;
    if (filteredList.length >= 2) {
      const latest = filteredList[0];
      const prev = filteredList[1];
      deltas = PROGRESS_SKILLS.map((skill) => {
        const lastVal = latest.skills_data?.[skill.id]?.total ?? 0;
        const prevVal = prev.skills_data?.[skill.id]?.total ?? 0;
        return { id: skill.id, name: skill.name, color: skill.color, delta: lastVal - prevVal };
      });
    }

    setProgressSeries({ labels, series });
    setProgressDeltas(deltas);

    // Latest evaluation summary (most recent assessment)
    const latest = filteredList[0];
    if (latest && latest.skills_data) {
      const summary = PROGRESS_SKILLS.map((skill) => {
        const sd = latest.skills_data?.[skill.id];
        const score = sd?.total ?? 0;
        const maxScore = sd?.maxScore ?? 50;
        const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
        const level = pct >= 75 ? 'Advanced' : pct >= 50 ? 'Intermediate' : 'Beginner';
        return { id: skill.id, name: skill.name, score, maxScore, level, color: skill.color };
      });
      setLatestSummary(summary);
    } else {
      setLatestSummary(null);
    }
  };

  const computeSkillAverages = (list) => {
    // Filter out First Time Assessments
    const filteredList = (list || []).filter(a => !isFirstTimeAssessment(a));
    
    if (!filteredList || filteredList.length === 0) {
      setAvgSkillScores(null);
      return;
    }
    const sums = {};
    const counts = {};
    PROGRESS_SKILLS.forEach((s) => {
      sums[s.id] = 0;
      counts[s.id] = 0;
    });
    filteredList.forEach((a) => {
      PROGRESS_SKILLS.forEach((skill) => {
        const v = a.skills_data?.[skill.id]?.total;
        if (v !== undefined && v !== null) {
          sums[skill.id] += v;
          counts[skill.id]++;
        }
      });
    });
    const avgs = PROGRESS_SKILLS.map((s) => {
      const avg = counts[s.id] ? Math.round(sums[s.id] / counts[s.id]) : 0;
      const pct = (avg / 50) * 100;
      let color = '#EF4444';
      if (pct >= 75) color = '#27AE60';
      else if (pct >= 50) color = '#F59E0B';
      return { id: s.id, name: s.name, avg, color };
    });
    setAvgSkillScores(avgs);
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
      console.log('📚 Loading programs for student:', studentId);
      
      const { data, error } = await supabase
        .from('user_programs')
        .select(`
          *,
          programs(
            *,
            routines(
              id,
              name,
              description,
              order_index,
              time_estimate_minutes,
              routine_exercises(
                order_index,
                custom_target_value,
                is_optional,
                exercises(*)
              )
            )
          )
        `)
        .eq('user_id', studentId)
        .eq('is_completed', false);

      if (error) {
        console.error('❌ Error loading programs:', error);
        throw error;
      }
      
      console.log('✅ Loaded programs:', data?.length || 0, 'programs');
      console.log('📦 Programs data:', JSON.stringify(data, null, 2));
      
      // Filter out any programs where the related program data is missing
      const validPrograms = (data || []).filter(p => p && p.programs);
      if (validPrograms.length !== (data || []).length) {
        console.warn('⚠️ Some programs had missing data and were filtered out');
      }
      
      setPrograms(validPrograms);
    } catch (error) {
      console.error('💥 Error loading programs:', error);
      setPrograms([]); // Set empty array on error to prevent undefined errors
    }
  };
  
  const handleAssignProgramPress = () => {
    // Get list of already assigned program IDs
    const assignedProgramIds = programs.map(p => p.program_id);
    
    navigation.navigate('AssignProgramList', {
      studentId,
      studentName: player?.name,
      assignedProgramIds
    });
  };
  
  const handleRemoveProgram = (program) => {
    Alert.alert(
      'Remove Program?',
      `Are you sure you want to remove "${program.programs?.name || 'this program'}" from the student?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_programs')
                .delete()
                .eq('id', program.id);

      if (error) throw error;
              
              Alert.alert('Success', 'Program removed successfully.');
              await loadPrograms();
    } catch (error) {
              console.error('Error removing program:', error);
              Alert.alert('Error', 'Failed to remove program.');
    }
          },
        },
      ]
    );
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

  const loadLogbookEntries = async () => {
    try {
      setLoadingLogbook(true);
      const { data, error } = await getLogbookEntriesByUserId(studentId);
      
      if (error) {
        console.error('Error loading student logbook:', error);
        setLogbookEntries([]);
        return;
      }

      // Transform Supabase data to match local format
      const transformedEntries = (data || []).map(entry => {
        let trainingFocus = entry.training_focus;
        if (typeof trainingFocus === 'string') {
          try {
            trainingFocus = JSON.parse(trainingFocus);
          } catch (e) {
            trainingFocus = [trainingFocus];
          }
        }
        
        let difficulty = entry.difficulty;
        if (typeof difficulty === 'string') {
          try {
            difficulty = JSON.parse(difficulty);
          } catch (e) {
            difficulty = difficulty ? [difficulty] : [];
          }
        }
        
        return {
          id: entry.id,
          date: entry.date,
          hours: entry.hours,
          sessionType: entry.session_type,
          trainingFocus: trainingFocus,
          difficulty: difficulty,
          feeling: entry.feeling,
          notes: entry.notes,
          location: entry.location,
          createdAt: entry.created_at,
          exerciseDetails: entry.exercise_details || null,
        };
      });

      setLogbookEntries(transformedEntries);
    } catch (error) {
      console.error('Error loading student logbook:', error);
      setLogbookEntries([]);
    } finally {
      setLoadingLogbook(false);
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

  const handleFirstTimeAssessment = () => {
    navigation.navigate('FirstTimeAssessment', { 
      studentId, 
      student: player,
    });
  };

  const handleViewAssessment = (assessment) => {
    // Check if this is a First Time Assessment
    const isFirstTime = isFirstTimeAssessment(assessment);
    
    if (isFirstTime) {
      navigation.navigate('FirstTimeAssessmentSummary', { 
        assessmentId: assessment.id, 
        student: player,
      });
    } else {
      navigation.navigate('EvaluationSummary', { 
        assessmentId: assessment.id, 
        student: player,
        isStudentView: isStudentView // Pass student view flag
      });
    }
  };

// Helpers for chart
function vToNorm(v) {
  const max = 50;
  const n = Math.max(0, Math.min(max, v));
  return n / max; // 0..1
}
function formatDelta(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${Math.round(n)}`;
}
function levelColor(level) {
  if (level === 'Advanced') return '#27AE60';
  if (level === 'Intermediate') return '#F39C12';
  return '#EF4444';
}

// Reusable tiny line component using measured width/height
function SparkLine({ values, color, height = 64, style }) {
  const [size, setSize] = useState({ width: 0, height });
  const onLayout = (e) => {
    const { width } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const points = values || [];
  return (
    <View style={[{ height }, style]} onLayout={onLayout}>
      {size.width > 0 && (
        <View style={{ position: 'absolute', left: 0, top: 0, width: size.width, height: size.height }}>
          {points.map((v, i) => {
            const x = (i / Math.max(points.length - 1, 1)) * size.width;
            const y = (1 - vToNorm(v)) * size.height;
            if (i > 0) {
              const prevX = ((i - 1) / Math.max(points.length - 1, 1)) * size.width;
              const prevY = (1 - vToNorm(points[i - 1])) * size.height;
              const dx = x - prevX;
              const dy = y - prevY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 57.2958;
              // Position the segment centered between the two points so rotation pivots at center
              const midX = (prevX + x) / 2;
              const midY = (prevY + y) / 2;
              const stroke = 2;
              return (
                <View key={`seg-${i}`}>
                  <View style={{ position: 'absolute', left: midX - length / 2, top: midY - stroke / 2, width: length, height: stroke, backgroundColor: color, transform: [{ rotateZ: `${angle}deg` }], borderRadius: 1 }} />
                  <View style={{ position: 'absolute', left: x - 3, top: y - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                </View>
              );
            }
            return (
              <View key={`dot-${i}`} style={{ position: 'absolute', left: x - 3, top: y - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
            );
          })}
        </View>
      )}
    </View>
  );
}

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
        {isStudentView ? (
          <View style={styles.headerCenter}>
            {player?.tier && (
              <View style={styles.headerChip}>
                <Text style={styles.headerChipLabel}>Tier</Text>
                <Text style={styles.headerChipValue}>{player.tier}</Text>
              </View>
            )}
            {(() => {
              // Find the latest non-First Time Assessment
              const latestRealAssessment = assessments.find(a => !isFirstTimeAssessment(a));
              return latestRealAssessment && (
                <View style={styles.headerScore}>
                  <Text style={styles.headerScoreLabel}>Score</Text>
                  <Text style={styles.headerScoreValue}>
                    {String(Number(latestRealAssessment.total_score) || 0)}
                  </Text>
                </View>
              );
            })()}
          </View>
        ) : (
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Player Profile</Text>
          </View>
        )}
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Merged Player Header with Skill Overview */}
        <View style={styles.mergedPlayerSection}>
          {/* Player Info Row - Hidden in student view */}
          {!isStudentView && (
            <View style={styles.playerInfoRow}>
              {player?.avatar_url ? (
                <Image source={{ uri: player.avatar_url }} style={styles.compactAvatar} />
              ) : (
                <View style={styles.compactAvatarFallback}>
                  <Text style={styles.compactAvatarText}>
                    {player?.name?.charAt(0).toUpperCase() || 'P'}
                  </Text>
                </View>
              )}
              <View style={styles.compactInfo}>
                <Text style={styles.compactName} numberOfLines={1}>
                  {player?.name || 'Player'}
                </Text>
                <View style={styles.compactChips}>
                  {player?.dupr_rating && (
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>DUPR</Text>
                      <Text style={styles.chipValue}>{player.dupr_rating}</Text>
                    </View>
                  )}
                  {player?.tier && (
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>Tier</Text>
                      <Text style={styles.chipValue}>{player.tier}</Text>
                    </View>
                  )}
                  {player?.preferred_side && (
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>Side</Text>
                      <Text style={styles.chipValue}>{player.preferred_side}</Text>
                    </View>
                  )}
                </View>
              </View>
              {(() => {
                // Find the latest non-First Time Assessment
                const latestRealAssessment = assessments.find(a => !isFirstTimeAssessment(a));
                return latestRealAssessment && (
                  <View style={styles.latestScoreContainer}>
                    <Text style={styles.latestScoreValue} numberOfLines={1}>
                      {String(Number(latestRealAssessment.total_score) || 0)}
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}

          {/* Skill Overview Header (Collapsible) */}
          <TouchableOpacity 
            style={styles.skillOverviewToggle}
            onPress={() => setSkillOverviewExpanded(!skillOverviewExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.skillOverviewToggleLeft}>
              <View style={styles.skillAveragesDot} />
              <Text style={styles.skillAveragesTitle}>Skill Overview</Text>
              <Text style={styles.skillAveragesSubtitle}>· Average of all assessments</Text>
            </View>
            <Ionicons 
              name={skillOverviewExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {/* Collapsible Skill Badges */}
          {skillOverviewExpanded && (
            <View style={styles.profileAvgSkillsRow}>
              {avgSkillScores
                ? avgSkillScores.map((s) => (
                    <View key={s.id} style={[styles.profileAvgBadge, { backgroundColor: s.color + '15', borderLeftColor: s.color }]}>
                      <Text style={[styles.profileAvgName, { color: s.color }]} numberOfLines={1}>
                        {s.name.replace(/\s*\/.*$/, '')}
                      </Text>
                      <Text style={[styles.profileAvgScore, { color: s.color }]}>{s.avg}</Text>
                    </View>
                  ))
                : PROGRESS_SKILLS.map((s) => (
                    <View key={s.id} style={[styles.profileAvgBadge, { backgroundColor: '#F3F4F6', borderLeftColor: '#D1D5DB' }]}>
                      <Text style={[styles.profileAvgName, { color: '#9CA3AF' }]} numberOfLines={1}>
                        {s.name.replace(/\s*\/.*$/, '')}
                      </Text>
                      <Text style={[styles.profileAvgScore, { color: '#9CA3AF' }]}>–</Text>
                    </View>
                  ))}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['Assessment', 'Programs', 'Progress', 'Logbook'].map((tab) => (
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
          {activeTab === 'Assessment' && (
            <View>
              {loadingAssessments ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  <Text style={styles.emptyText}>Loading assessments...</Text>
                </View>
              ) : assessments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No assessments yet</Text>
                  <View style={styles.emptyButtonsContainer}>
                    {!hasFirstTimeAssessment && (
                      <TouchableOpacity style={styles.emptyButton} onPress={handleFirstTimeAssessment}>
                        <Ionicons name="sparkles" size={20} color="white" />
                        <Text style={styles.emptyButtonText}>First Time Assessment</Text>
                      </TouchableOpacity>
                    )}
                    {!isStudentView && (
                      <TouchableOpacity style={styles.emptyButtonSecondary} onPress={handleStartAssessment}>
                        <Ionicons name="clipboard-outline" size={20} color={PRIMARY_COLOR} />
                        <Text style={styles.emptyButtonTextSecondary}>Full Assessment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <>
                  {assessments.map((assessment) => {
                    const isFirstTime = isFirstTimeAssessment(assessment);
                    
                    // Get the dynamic message for First Time Assessment based on Question 1 answer
                    let firstTimeMessage = null;
                    if (isFirstTime) {
                      const question1Answer = assessment.skills_data?.newbie_assessment?.answers?.[1];
                      if (question1Answer === 'none') {
                        firstTimeMessage = "Your Level 'BEGINNER'";
                      } else if (question1Answer !== undefined && question1Answer !== null) {
                        firstTimeMessage = "Do the SKILL ASSESSMENT with your Coach";
                      }
                    }
                    
                    return (
                      <TouchableOpacity
                        key={assessment.id}
                        style={styles.assessmentCard}
                        onPress={() => handleViewAssessment(assessment)}
                        onLongPress={!isStudentView ? () => confirmDeleteAssessment(assessment) : undefined}
                        delayLongPress={400}
                      >
                        <View style={styles.assessmentHeader}>
                          <View style={styles.assessmentHeaderLeft}>
                            <Text style={styles.assessmentDate}>
                              {new Date(assessment.created_at).toLocaleDateString()}
                            </Text>
                            {isFirstTime && (
                              <View style={styles.firstTimeBadge}>
                                <Ionicons name="sparkles" size={12} color={PRIMARY_COLOR} />
                                <Text style={styles.firstTimeBadgeText}>First Time</Text>
                              </View>
                            )}
                          </View>
                          {!isFirstTime ? (
                            <View style={styles.assessmentScore}>
                              <Text style={styles.scoreValue}>
                                {String(Number(assessment.total_score) || 0)}/{String(Number(assessment.max_score) || 0)}
                              </Text>
                              <Text style={styles.scorePercent}>
                                ({Math.round(((Number(assessment.total_score) || 0) / (Number(assessment.max_score) || 1)) * 100)}%)
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.assessmentTypeLabel}>Q&A Session</Text>
                          )}
                        </View>
                        {isFirstTime && firstTimeMessage ? (
                          <Text style={styles.assessmentNotes} numberOfLines={2}>
                            {firstTimeMessage}
                          </Text>
                        ) : assessment.notes && !isFirstTime ? (
                          <Text style={styles.assessmentNotes} numberOfLines={2}>
                            {assessment.notes}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ paddingHorizontal: 16, marginTop: 12, gap: 12 }}>
                    {!hasFirstTimeAssessment && (
                      <TouchableOpacity style={styles.primaryButton} onPress={handleFirstTimeAssessment}>
                        <Ionicons name="sparkles" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>First Time Assessment</Text>
                      </TouchableOpacity>
                    )}
                    {!isStudentView && (
                      <TouchableOpacity style={styles.secondaryButton} onPress={handleStartAssessment}>
                        <Ionicons name="clipboard-outline" size={20} color={PRIMARY_COLOR} />
                        <Text style={styles.secondaryButtonText}>Full Assessment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'Programs' && (
            <View>
              {/* Assign Program Button - Coach View Only */}
              {!isStudentView && (
                <TouchableOpacity
                  style={styles.assignProgramButton}
                  onPress={handleAssignProgramPress}
                >
                  <Ionicons name="add-circle-outline" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.assignProgramButtonText}>Assign Program</Text>
                </TouchableOpacity>
              )}
              
              {programs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="list-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No active programs</Text>
                </View>
              ) : (
                programs
                  .filter(program => program && program.programs) // Filter out invalid programs
                  .map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.programCard}
                      onPress={() => {
                        // Navigate to program detail to view sessions/exercises
                        navigation.navigate('ProgramDetail', {
                          program: program.programs,
                          source: 'coach',
                          isStudentView: isStudentView, // Pass student view flag
                          studentId: studentId // Pass student ID so logs are saved to student
                        });
                      }}
                      onLongPress={!isStudentView ? () => handleRemoveProgram(program) : undefined}
                      delayLongPress={500}
                    >
                      <View style={styles.programCardContent}>
                        {program.programs?.thumbnail_url && (
                          <Image 
                            source={{ uri: program.programs.thumbnail_url }} 
                            style={styles.programThumbnail}
                          />
                        )}
                        <View style={styles.programCardInfo}>
                    <Text style={styles.programName}>{program.programs?.name || 'Program'}</Text>
                          {program.programs?.description && (
                            <Text style={styles.programDescription} numberOfLines={2}>
                              {program.programs.description}
                            </Text>
                          )}
                          <View style={styles.programMeta}>
                            {program.programs?.category && (
                              <Text style={styles.programCategory}>{program.programs.category}</Text>
                            )}
                            {program.programs?.tier && (
                              <Text style={styles.programTier}>• {program.programs.tier}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.programCardRight}>
                    <Text style={styles.programStatus}>Active</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                    </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'Progress' && (
            <View>
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Skill Progression</Text>
                {progressSeries ? (
                  <View style={styles.sparkGrid}>
                    {progressSeries.series.map((s) => {
                      const latest = s.values[s.values.length - 1] || 0;
                      return (
                        <TouchableOpacity key={`spark-${s.id}`} style={styles.sparkCard} onPress={() => setExpandedSkill(s)} activeOpacity={0.8}>
                          <View style={styles.sparkHeader}>
                            <Text style={styles.sparkName} numberOfLines={1}>{s.name}</Text>
                            <Text style={[styles.sparkValue, { color: s.color }]}>{latest}</Text>
                          </View>
                          <SparkLine values={s.values} color={s.color} height={64} style={styles.sparkCanvas} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="trending-up-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No progress data yet</Text>
                  </View>
                )}
              </View>

              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Recent Improvements</Text>
                {progressDeltas ? (
                  PROGRESS_SKILLS.map((s) => {
                    const d = (progressDeltas.find(x=>x.id===s.id)?.delta || 0);
                    const positive = d >= 0;
                    return (
                      <View key={`imp-${s.id}`} style={styles.improvementRow}>
                        <Text style={styles.improvementName}>{s.name}</Text>
                        <View style={[styles.deltaBarTrack]}>
                          <View style={[styles.deltaBarFill, { width: `${Math.min(Math.abs(d)/50*100, 100)}%`, backgroundColor: positive ? '#10B981' : '#EF4444' }]} />
                        </View>
                        <View style={styles.improvementDelta}>
                          <Ionicons name={ positive ? 'trending-up' : 'trending-down'} size={16} color={positive ? '#10B981' : '#EF4444'} />
                          <Text style={[styles.improvementText, { color: positive ? '#10B981' : '#EF4444' }]}>
                            {formatDelta(d)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Need at least two assessments to compute changes</Text>
                )}
              </View>

              {/* Latest Evaluation Summary */}
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Latest Evaluation Summary</Text>
                {latestSummary ? (
                  <View style={styles.summaryTable}>
                    <View style={styles.summaryHeaderRow}>
                      <Text style={[styles.summaryHeaderText, { flex: 2 }]}>Skill</Text>
                      <Text style={[styles.summaryHeaderText, { flex: 1, textAlign: 'right' }]}>Score</Text>
                      <Text style={[styles.summaryHeaderText, { flex: 1, textAlign: 'center' }]}>Level</Text>
                    </View>
                    {latestSummary.map((row) => (
                      <View key={`sum-${row.id}`} style={styles.summaryRow}>
                        <Text style={[styles.summarySkill, { flex: 2 }]}>{row.name}</Text>
                        <Text style={[styles.summaryScore, { flex: 1 }]}>{row.score}/{row.maxScore}</Text>
                        <View style={[styles.summaryLevelBadge, { flex: 1, backgroundColor: levelColor(row.level)+'20' }]}>
                          <Text style={[styles.summaryLevelText, { color: levelColor(row.level) }]}>{row.level}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No evaluation summary yet</Text>
                )}
              </View>

              {/* Skill Breakdown (bars) */}
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Skill Breakdown</Text>
                {latestSummary ? (
                  latestSummary.map((row) => {
                    const pct = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0;
                    const color = pct >= 75 ? '#27AE60' : pct >= 50 ? '#F39C12' : '#EF4444';
                    return (
                      <View key={`bd-${row.id}`} style={styles.barItem}>
                        <Text style={styles.barLabel}>{row.name}</Text>
                        <View style={styles.barBackground}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                          <Text style={styles.barText}>{pct}%</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No breakdown available</Text>
                )}
              </View>
            </View>
          )}

          {activeTab === 'Logbook' && (
            <View>
              {loadingLogbook ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  <Text style={styles.emptyText}>Loading logbook...</Text>
                </View>
              ) : (() => {
                // Filter only entries with exercise details
                const exerciseEntries = logbookEntries.filter(entry => 
                  entry.exerciseDetails && entry.exerciseDetails.exerciseName
                );

                if (exerciseEntries.length === 0) {
                  return (
                    <View style={styles.emptyState}>
                      <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyText}>No exercise logs yet</Text>
                    </View>
                  );
                }

                // Get summary data
                const firstLogDate = exerciseEntries[exerciseEntries.length - 1]?.date;
                const uniqueDates = new Set(exerciseEntries.map(entry => entry.date));
                const totalSessions = uniqueDates.size;
                const lastExercises = exerciseEntries.slice(0, 4).map(entry => ({
                  date: entry.date,
                  programName: entry.exerciseDetails.programName,
                  routineName: entry.exerciseDetails.routineName,
                  exerciseName: entry.exerciseDetails.exerciseName,
                  target: entry.exerciseDetails.target,
                  result: entry.exerciseDetails.result,
                }));

                // Calculate success rate
                const exercisesWithNumericResults = exerciseEntries.filter(entry => {
                  const target = parseInt(entry.exerciseDetails.target);
                  const result = parseInt(entry.exerciseDetails.result);
                  return !isNaN(target) && !isNaN(result) && target > 0;
                });

                let successRate = 0;
                if (exercisesWithNumericResults.length > 0) {
                  let totalMetOrExceeded = 0;
                  exercisesWithNumericResults.forEach(entry => {
                    const target = parseInt(entry.exerciseDetails.target);
                    const result = parseInt(entry.exerciseDetails.result);
                    if (result >= target) totalMetOrExceeded++;
                  });
                  successRate = Math.round((totalMetOrExceeded / exercisesWithNumericResults.length) * 100);
                }

                return (
                  <>
                    {/* Summary Stats */}
                    <View style={styles.logbookSummaryCard}>
                      <View style={styles.logbookStatItem}>
                        <Text style={styles.logbookStatValue}>{exerciseEntries.length}</Text>
                        <Text style={styles.logbookStatLabel}>Exercises</Text>
                      </View>
                      <View style={styles.logbookStatDivider} />
                      <View style={styles.logbookStatItem}>
                        <Text style={styles.logbookStatValue}>{totalSessions}</Text>
                        <Text style={styles.logbookStatLabel}>Sessions</Text>
                      </View>
                      {firstLogDate && (
                        <>
                          <View style={styles.logbookStatDivider} />
                          <View style={styles.logbookStatItem}>
                            <Text style={styles.logbookStatDateLabel}>Since</Text>
                            <Text style={styles.logbookStatDate}>
                              {new Date(firstLogDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Last Session Activity */}
                    {lastExercises.length > 0 && (() => {
                      let lastDate = null;
                      let lastProgram = null;
                      let lastRoutine = null;
                      
                      return (
                        <View style={styles.logbookLastExercisesCard}>
                          <View style={styles.logbookLastExercisesHeader}>
                            <Text style={styles.logbookLastExercisesTitle}>Last Session Activity</Text>
                            <Text style={styles.logbookLastExercisesDate}>
                              {new Date(lastExercises[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          <View style={styles.logbookLastExercisesList}>
                            {lastExercises.map((exercise, index) => {
                              const showDate = exercise.date !== lastDate && index > 0;
                              const showProgram = exercise.programName !== lastProgram || showDate;
                              const showRoutine = exercise.routineName !== lastRoutine || showDate;
                              
                              lastDate = exercise.date;
                              lastProgram = exercise.programName;
                              lastRoutine = exercise.routineName;
                              
                              return (
                                <View key={index}>
                                  {showDate && (
                                    <Text style={styles.logbookExerciseDateDivider}>
                                      {new Date(exercise.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                  )}
                                  <View style={styles.logbookLastExerciseItem}>
                                    {(showProgram || showRoutine) && (
                                      <Text style={styles.logbookLastExerciseMeta}>
                                        {showProgram && exercise.programName}
                                        {showProgram && showRoutine && ' / '}
                                        {showRoutine && exercise.routineName}
                                      </Text>
                                    )}
                                    <View style={styles.logbookLastExerciseRow}>
                                      <Text style={styles.logbookLastExerciseName} numberOfLines={1}>{exercise.exerciseName}</Text>
                                      <Text style={styles.logbookLastExerciseResult}>
                                        {String(exercise.result).replace(/\s*attempts?/i, '')}/{String(exercise.target).replace(/\s*attempts?/i, '')}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Target Accomplishment */}
                    {exercisesWithNumericResults.length > 0 && (
                      <View style={styles.logbookAccomplishmentCard}>
                        <Text style={styles.logbookAccomplishmentTitle}>TARGET ACCOMPLISHMENT</Text>
                        <View style={styles.logbookAccomplishmentStats}>
                          <View style={styles.logbookAccomplishmentStatItem}>
                            <Text style={styles.logbookAccomplishmentStatValue}>{successRate}%</Text>
                            <Text style={styles.logbookAccomplishmentStatLabel}>Success Rate</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Expanded Skill Modal */}
      <Modal visible={!!expandedSkill} transparent animationType="fade" onRequestClose={() => setExpandedSkill(null)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalChartCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{expandedSkill?.name}</Text>
              <TouchableOpacity onPress={() => setExpandedSkill(null)} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {expandedSkill && (
              <>
                <SparkLine values={expandedSkill.values} color={expandedSkill.color} height={180} />
                
                {/* Assessment Data Table */}
                <View style={styles.modalDataSection}>
                  <Text style={styles.modalDataTitle}>Assessment History</Text>
                  <View style={styles.modalDataTable}>
                    <View style={styles.modalTableHeader}>
                      <Text style={[styles.modalTableHeaderText, { flex: 2 }]}>Date</Text>
                      <Text style={[styles.modalTableHeaderText, { flex: 1, textAlign: 'right' }]}>Score</Text>
                    </View>
                    {expandedSkill.values.map((value, idx) => {
                      const date = expandedSkill.dates?.[idx];
                      const dateStr = date 
                        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : `Assessment ${idx + 1}`;
                      return (
                        <View key={`data-${idx}`} style={styles.modalTableRow}>
                          <Text style={[styles.modalTableCell, { flex: 2 }]}>{dateStr}</Text>
                          <Text style={[styles.modalTableCellScore, { flex: 1, color: expandedSkill.color }]}>
                            {value}/50
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
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
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  headerChipLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerChipValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerScoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  mergedPlayerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  compactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  compactAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  compactChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  chipLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  latestScoreContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
    width: 120,
    flexShrink: 0,
  },
  latestScoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    lineHeight: 36,
    textAlign: 'right',
  },
  latestScoreMax: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
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
  assessmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assessmentDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  firstTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  firstTimeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  assessmentTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  programCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  programCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  programCardInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 4,
  },
  programTier: {
    fontSize: 11,
    color: '#6B7280',
  },
  programStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
  },
  assignProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  assignProgramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  chartArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
  },
  sparkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  sparkCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sparkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkName: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  sparkValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sparkCanvas: {
    height: 64,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  yLabel: {
    width: 28,
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
    marginRight: 4,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    flex: 1,
  },
  chartInner: {
    width: 300,
    height: 140,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
  xLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingLeft: 32,
    paddingRight: 8,
  },
  xLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  deltaBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  deltaBarFill: {
    height: 6,
    borderRadius: 3,
  },
  improvementName: {
    fontSize: 16,
    color: '#111827',
  },
  improvementDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  improvementText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  summaryTable: {
    backgroundColor: 'white',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  summaryHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summarySkill: {
    fontSize: 14,
    color: '#1F2937',
  },
  summaryScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  summaryLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLevelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barItem: {
    marginBottom: 12,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  barBackground: {
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
  },
  barText: {
    position: 'absolute',
    right: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
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
  emptyButtonsContainer: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 16,
  },
  emptyButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalChartCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  skillOverviewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 12,
  },
  skillOverviewToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillAveragesDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY_COLOR,
    marginRight: 8,
  },
  skillAveragesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillAveragesSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  profileAvgSkillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  profileAvgBadge: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderLeftWidth: 3,
    width: '31.5%',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  profileAvgName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileAvgScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalDataSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalDataTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalDataTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
  },
  modalTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  modalTableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalTableCell: {
    fontSize: 14,
    color: '#1F2937',
  },
  modalTableCellScore: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  // Logbook styles
  logbookSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  logbookStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  logbookStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logbookStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  logbookStatDateLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  logbookStatDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 2,
  },
  logbookStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  logbookLastExercisesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logbookLastExercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logbookLastExercisesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  logbookLastExercisesDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  logbookExerciseDateDivider: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  logbookLastExercisesList: {
    gap: 4,
  },
  logbookLastExerciseItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 8,
  },
  logbookLastExerciseMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  logbookLastExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  logbookLastExerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  logbookLastExerciseResult: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  logbookAccomplishmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 88,
    justifyContent: 'center',
  },
  logbookAccomplishmentTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  logbookAccomplishmentStats: {
    alignItems: 'center',
  },
  logbookAccomplishmentStatItem: {
    alignItems: 'center',
  },
  logbookAccomplishmentStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  logbookAccomplishmentStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
});

