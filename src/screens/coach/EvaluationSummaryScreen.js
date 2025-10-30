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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, checkCoachAccess } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';
const ACCENT_COLOR = '#F39C12';

const { width } = Dimensions.get('window');

const SKILLS = [
  { id: 'serves', name: 'Serves', maxScore: 50 },
  { id: 'dinks', name: 'Dinks', maxScore: 40 },
  { id: 'volleys', name: 'Volleys / Resets', maxScore: 50 },
  { id: 'third_shot', name: '3rd Shot', maxScore: 40 },
  { id: 'footwork', name: 'Footwork', maxScore: 30 },
  { id: 'game_play', name: 'Game Play / Scenarios', maxScore: 40 },
];

export default function EvaluationSummaryScreen({ route, navigation }) {
  const { studentId, student, assessmentKey, assessmentId } = route.params;
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  
  const [skillsData, setSkillsData] = useState([]);
  const [rawSkillScores, setRawSkillScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssessmentData();
  }, [assessmentKey, assessmentId]);

  const loadAssessmentData = async () => {
    try {
      // Case 1: Coming from draft flow with AsyncStorage key
      if (assessmentKey) {
        const saved = await AsyncStorage.getItem(assessmentKey);
        if (saved) {
          const data = JSON.parse(saved);
          setRawSkillScores(data.skillScores || {});
          const skills = SKILLS.map(skill => {
            const skillData = data.skillScores?.[skill.id];
            const score = skillData?.total || 0;
            const percentage = (score / skill.maxScore) * 100;
            let level = 'Beginner';
            if (percentage >= 75) level = 'Advanced';
            else if (percentage >= 50) level = 'Intermediate';
            return {
              name: skill.name,
              score: score,
              maxScore: skill.maxScore,
              level: level,
              notes: skillData?.notes || '',
            };
          });
          setSkillsData(skills);
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
        const skills = SKILLS.map(skill => {
          const skillData = skillsDataJson?.[skill.id];
          const score = skillData?.total || 0;
          const percentage = (score / skill.maxScore) * 100;
          let level = 'Beginner';
          if (percentage >= 75) level = 'Advanced';
          else if (percentage >= 50) level = 'Intermediate';
          return {
            name: skill.name,
            score: score,
            maxScore: skill.maxScore,
            level: level,
            notes: skillData?.notes || '',
          };
        });
        setSkillsData(skills);
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
    if (level === 'Advanced') return PRIMARY_COLOR;
    if (level === 'Intermediate') return ACCENT_COLOR;
    return '#EF4444';
  };

  const aiFeedback = `Strong control and serve depth. The player demonstrates excellent consistency in serves with good placement accuracy. Needs improvement on spin variation and footwork positioning. Overall solid foundation with room for strategic game play development.`;

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

      const { data, error } = await supabase
        .from('coach_assessments')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Clear draft after successful save
      await AsyncStorage.removeItem(assessmentKey);

      // Navigate back to PlayerProfile and trigger refresh
      navigation.navigate('PlayerProfile', { studentId, student, justSavedAssessmentId: data.id });
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading assessment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evaluation Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Assessment</Text>
          <Text style={styles.summaryScore}>
            {totalScore} / {maxTotal}
          </Text>
          <Text style={styles.summaryPercent}>{percentage}%</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: percentage >= 75 ? PRIMARY_COLOR : percentage >= 50 ? ACCENT_COLOR : '#EF4444',
                },
              ]}
            />
          </View>
        </View>

        {/* Skills Table */}
        <View style={styles.skillsTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Skill</Text>
            <Text style={styles.tableHeaderText}>Score</Text>
            <Text style={styles.tableHeaderText}>Level</Text>
          </View>
          {skillsData.map((skill, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableSkillName}>{skill.name}</Text>
              <Text style={styles.tableScore}>
                {skill.score}/{skill.maxScore}
              </Text>
              <View
                style={[
                  styles.tableLevelBadge,
                  { backgroundColor: getLevelColor(skill.level) + '20' },
                ]}
              >
                <Text
                  style={[styles.tableLevelText, { color: getLevelColor(skill.level) }]}
                >
                  {skill.level}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bar Chart Visualization */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Skill Breakdown</Text>
          {skillsData.map((skill, index) => {
            const skillPercentage = (skill.score / skill.maxScore) * 100;
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barLabel}>{skill.name}</Text>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${skillPercentage}%`,
                        backgroundColor:
                          skillPercentage >= 75
                            ? PRIMARY_COLOR
                            : skillPercentage >= 50
                            ? ACCENT_COLOR
                            : '#EF4444',
                      },
                    ]}
                  />
                  <Text style={styles.barText}>{Math.round(skillPercentage)}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Feedback Card */}
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="sparkles" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.feedbackTitle}>AI Feedback</Text>
          </View>
          <Text style={styles.feedbackText}>{aiFeedback}</Text>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      {!assessmentId && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveOnly} disabled={saving}>
            <Text style={styles.secondaryButtonText}>{saving ? 'Saving...' : 'Save Assessment Only'}</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryScore: {
    fontSize: 48,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  summaryPercent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
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
  skillsTable: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  tableLevelText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
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
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_COLOR,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  feedbackText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
});

