import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, checkCoachAccess } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';
import {
  getAssessmentTemplate,
  DEFAULT_PLAYER_EVALUATION_TEMPLATE,
} from '../../lib/assessmentTemplatesApi';

const ACCENT_COLOR = '#F39C12';

const { width } = Dimensions.get('window');

// Helper to map raw scores against a skills template array
function buildSkillsData(skillsTemplate, rawScores) {
  return skillsTemplate.map(skill => {
    const skillData = rawScores?.[skill.id];
    const score = skillData?.total || 0;
    const percentage = skill.maxScore > 0 ? (score / skill.maxScore) * 100 : 0;
    let level = 'Beginner';
    if (percentage >= 75) level = 'Advanced';
    else if (percentage >= 50) level = 'Intermediate';
    return {
      id: skill.id,
      name: skill.name,
      score,
      maxScore: skill.maxScore,
      level,
      notes: skillData?.notes || '',
      criteria: skill.criteria || [],
    };
  });
}

export default function EvaluationSummaryScreen({ route, navigation }) {
  const { studentId, student, assessmentKey, assessmentId, isStudentView } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { logbookTheme: t, isDark } = useTheme();

  // Template-driven skills list
  const [skillsTemplate, setSkillsTemplate] = useState(DEFAULT_PLAYER_EVALUATION_TEMPLATE.skills);
  const [skillsData, setSkillsData] = useState([]);
  const [rawSkillScores, setRawSkillScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState(null);

  useEffect(() => {
    // Fetch template first, then assessment data
    getAssessmentTemplate('player_evaluation', null, student?.sportId || 'pickleball').then((tmpl) => {
      const tpl = tmpl?.skills?.length ? tmpl.skills : DEFAULT_PLAYER_EVALUATION_TEMPLATE.skills;
      setSkillsTemplate(tpl);
      loadAssessmentData(tpl);
    });
  }, [assessmentKey, assessmentId]);

  const loadAssessmentData = async (tpl) => {
    const skillsTpl = tpl || skillsTemplate;
    try {
      // Case 1: Coming from draft flow with AsyncStorage key
      if (assessmentKey) {
        const saved = await AsyncStorage.getItem(assessmentKey);
        if (saved) {
          const data = JSON.parse(saved);
          setRawSkillScores(data.skillScores || {});
          setSkillsData(buildSkillsData(skillsTpl, data.skillScores || {}));
          return;
        }
      }

      // Case 2: Opened from Player Profile with a persisted assessmentId
      if (assessmentId) {
        const { data, error } = await supabase
          .from('coach_assessments')
          .select('skills_data, total_score, max_score')
          .eq('id', assessmentId)
          .single();
        if (error) throw error;
        const skillsDataJson = data?.skills_data || {};
        setRawSkillScores(skillsDataJson);
        setSkillsData(buildSkillsData(skillsTpl, skillsDataJson));
        return;
      }

      // Fallback: nothing to load
      setSkillsData([]);
    } catch (error) {
      console.error('Error loading assessment:', error);
      setSkillsData([]);
    } finally {
      setLoading(false);
    }
  };

  const totalScore = skillsData.reduce((sum, skill) => sum + skill.score, 0);
  const maxTotal = skillsData.reduce((sum, skill) => sum + skill.maxScore, 0);
  const percentage = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

  const getLevelColor = (level) => {
    if (level === 'Advanced') return t.accentPurple;
    if (level === 'Intermediate') return ACCENT_COLOR;
    return '#EF4444';
  };

  const aiFeedback = `Strong control and serve depth. The player demonstrates excellent consistency in serves with good placement accuracy. Needs improvement on spin variation and footwork positioning. Overall solid foundation with room for strategic game play development.`;

  const insertWithTimeout = async (payload, ms = 10000) => {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms));
    const insert = supabase.from('coach_assessments').insert(payload).select().single();
    return Promise.race([insert, timeout]);
  };

  const handleSaveOnly = async () => {
    try {
      setSaving(true);
      // Get coach id for current user
      const { isCoach, coachId, error: coachErr } = await checkCoachAccess(authUser?.id);
      if (!isCoach || !coachId) {
        Alert.alert('Error', 'Coach profile not found.');
        setSaving(false);
        return;
      }

      // Build payload
      const payload = {
        coach_id: coachId,
        student_id: studentId,
        total_score: totalScore,
        max_score: maxTotal,
        skills_data: rawSkillScores || {},
        notes: null,
        assessment_date: new Date().toISOString().slice(0, 10),
      };

      const { data, error } = await insertWithTimeout(payload);

      if (error) throw error;

      // Clear draft after successful save
      await AsyncStorage.removeItem(assessmentKey);
      // Reset saving first to avoid stuck UI, then navigate
      setSaving(false);
      navigation.navigate('PlayerProfile', { 
        studentId, 
        student, 
        justSavedAssessmentId: data?.id,
        isStudentView: !isCoach // Pass isStudentView flag based on user type
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', error?.message === 'Request timeout' ? 'Saving timed out. Please check your connection and try again.' : 'Failed to save assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accentPurple} />
        <Text style={[styles.loadingText, { color: t.textMuted, fontFamily: t.fontBody }]}>Loading assessment...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell tokens={t} isDark={isDark} background="bg" bordered title="Evaluation Summary" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <Text style={[styles.summaryTitle, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Overall Assessment</Text>
          <Text style={[styles.summaryScore, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>{totalScore} / {maxTotal}</Text>
          <Text style={[styles.summaryPercent, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>{percentage}%</Text>
          <View style={[styles.progressBar, { backgroundColor: isDark ? t.surfaceRaised : '#E5E7EB' }]}>
            <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: percentage >= 75 ? t.accentPurple : percentage >= 50 ? ACCENT_COLOR : '#EF4444' }]} />
          </View>
        </View>

        {/* Skills Table */}
        <View style={[styles.skillsTable, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <View style={[styles.tableHeader, { borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
            <Text style={[styles.tableHeaderText, styles.tableHeaderSkill, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Skill</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderScore, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Score</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderLevel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Level</Text>
          </View>
          {skillsData.map((skill, index) => {
            const isExpanded = expandedSkill === skill.id;
            const criteria = skill.criteria || [];
            const skillDetails = rawSkillScores?.[skill.id];
            const detailScores = skillDetails?.scores || {};
            return (
              <View key={index}>
                <TouchableOpacity
                  style={[styles.tableRow, { borderBottomColor: isDark ? t.border : '#F3F4F6' }]}
                  onPress={() => setExpandedSkill(isExpanded ? null : skill.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tableSkillName, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{skill.name}</Text>
                  <Text style={[styles.tableScore, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{skill.score}/{skill.maxScore}</Text>
                  <View style={[styles.tableLevelBadge, { backgroundColor: getLevelColor(skill.level) + '20' }]}>
                    <Text style={[styles.tableLevelText, { color: getLevelColor(skill.level), fontFamily: t.fontBodyBold }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {skill.level}
                    </Text>
                  </View>
                  <View style={styles.tableChevron}>
                    {isExpanded ? <ChevronUp size={18} color={t.textMuted} strokeWidth={2} /> : <ChevronDown size={18} color={t.textMuted} strokeWidth={2} />}
                  </View>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={[styles.expandedDetails, { backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB', borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
                    <Text style={[styles.detailsHeaderText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Rating Breakdown</Text>
                    {criteria.map((criterion) => {
                      const score = detailScores[criterion.id] || 0;
                      const scorePercent = (score / criterion.maxScore) * 100;
                      const getScoreColor = (pct) => pct >= 75 ? t.accentPurple : pct >= 50 ? ACCENT_COLOR : '#EF4444';
                      return (
                        <View key={criterion.id} style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>{criterion.label}</Text>
                          <View style={styles.detailScoreContainer}>
                            <View style={[styles.detailScoreBar, { backgroundColor: isDark ? t.border : '#E5E7EB' }]}>
                              <View style={[styles.detailScoreFill, { width: `${scorePercent}%`, backgroundColor: getScoreColor(scorePercent) }]} />
                            </View>
                            <Text style={[styles.detailScoreText, { color: getScoreColor(scorePercent), fontFamily: t.fontBodyBold }]}>{score}/{criterion.maxScore}</Text>
                          </View>
                        </View>
                      );
                    })}
                    {skill.notes && (
                      <View style={[styles.detailNotes, { borderTopColor: isDark ? t.border : '#E5E7EB' }]}>
                        <Text style={[styles.detailNotesLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Notes:</Text>
                        <Text style={[styles.detailNotesText, { color: t.textSecondary, fontFamily: t.fontBody }]}>{skill.notes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <Text style={[styles.chartTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Skill Breakdown</Text>
          {skillsData.map((skill, index) => {
            const skillPercentage = (skill.score / skill.maxScore) * 100;
            const barColor = skillPercentage >= 75 ? t.accentPurple : skillPercentage >= 50 ? ACCENT_COLOR : '#EF4444';
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={[styles.barLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>{skill.name}</Text>
                <View style={[styles.barBackground, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]}>
                  <View style={[styles.barFill, { width: `${skillPercentage}%`, backgroundColor: barColor }]} />
                  <Text style={[styles.barText, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{Math.round(skillPercentage)}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Feedback */}
        <View style={[styles.feedbackCard, { backgroundColor: t.surface, borderLeftColor: t.accentPurple, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <View style={styles.feedbackHeader}>
            <Sparkles size={18} color={t.accentPurple} strokeWidth={2} />
            <Text style={[styles.feedbackTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>AI Feedback</Text>
          </View>
          <Text style={[styles.feedbackText, { color: t.textSecondary, fontFamily: t.fontBody }]}>{aiFeedback}</Text>
        </View>
      </ScrollView>

      {!assessmentId && !isStudentView && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: t.surface, borderTopColor: isDark ? t.border : '#E5E7EB' }]}>
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: t.accentPurple }]} onPress={handleSaveOnly} disabled={saving}>
            <Text style={[styles.secondaryButtonText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>{saving ? 'Saving...' : 'Save Assessment Only'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 15, marginTop: 16 },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
  },
  summaryCard: { borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 14 },
  summaryTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  summaryScore: { fontSize: 44, marginBottom: 6 },
  summaryPercent: { fontSize: 17, marginBottom: 14 },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  skillsTable: { borderRadius: 16, padding: 14, marginBottom: 14 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeaderSkill: {
    flex: 2,
    textAlign: 'left',
  },
  tableHeaderScore: {
    flex: 1,
    textAlign: 'right',
  },
  tableHeaderLevel: {
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableSkillName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  tableScore: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  tableLevelBadge: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  tableChevron: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLevelText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  expandedDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsHeader: {
    marginBottom: 12,
  },
  detailsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 4,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  detailScoreContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailScoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailScoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailScoreText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  detailNotes: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailNotesText: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  chartCard: { borderRadius: 16, padding: 14, marginBottom: 14 },
  chartTitle: { fontSize: 15, marginBottom: 14 },
  barContainer: {
    marginBottom: 16,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  barBackground: {
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  barText: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  feedbackCard: { borderRadius: 16, padding: 18, borderLeftWidth: 4 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  feedbackTitle: { fontSize: 15 },
  feedbackText: { fontSize: 13, lineHeight: 21 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  secondaryButton: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2 },
  secondaryButtonText: { fontSize: 15 },
});

