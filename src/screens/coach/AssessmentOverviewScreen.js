import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, PlayCircle, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';

const SKILLS = [
  { id: 'serves', name: 'Serves', maxScore: 50 },
  { id: 'dinks', name: 'Dinks', maxScore: 40 },
  { id: 'volleys', name: 'Volleys / Resets', maxScore: 50 },
  { id: 'third_shot', name: '3rd Shot', maxScore: 40 },
  { id: 'footwork', name: 'Footwork', maxScore: 30 },
  { id: 'game_play', name: 'Game Play / Scenarios', maxScore: 40 },
];

export default function AssessmentOverviewScreen({ route, navigation }) {
  const { studentId, student, assessmentId } = route.params;
  const insets = useSafeAreaInsets();
  const { logbookTheme: t, isDark } = useTheme();

  const [skillScores, setSkillScores] = useState({});
  const [loading, setLoading] = useState(true);

  const assessmentKey = `assessment_${studentId}_${assessmentId || 'draft'}`;

  useEffect(() => { loadSavedAssessment(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { loadSavedAssessment(); });
    return unsubscribe;
  }, [navigation]);

  const loadSavedAssessment = async () => {
    try {
      const saved = await AsyncStorage.getItem(assessmentKey);
      if (saved) {
        const data = JSON.parse(saved);
        setSkillScores(data.skillScores || {});
      } else {
        setSkillScores({});
      }
    } catch {
      setSkillScores({});
    } finally {
      setLoading(false);
    }
  };

  const handleSkillPress = (skill) => {
    navigation.navigate('SkillDetail', { studentId, student, skillId: skill.id, skillName: skill.name, maxScore: skill.maxScore, assessmentKey });
  };

  const handleClearAssessment = async () => {
    try { await AsyncStorage.removeItem(assessmentKey); setSkillScores({}); } catch {}
  };

  const totalScore = React.useMemo(() => {
    try { return Object.values(skillScores).reduce((sum, sd) => sum + (typeof sd === 'object' ? (sd?.total || 0) : 0), 0); }
    catch { return 0; }
  }, [skillScores]);

  const maxTotal = SKILLS.reduce((sum, skill) => sum + skill.maxScore, 0);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accentPurple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="Player Assessment"
        subtitle={student?.name || 'Player'}
        onBack={() => navigation.goBack()}
        rightAction={totalScore > 0 ? (
          <TouchableOpacity onPress={handleClearAssessment} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: '#EF4444', fontFamily: t.fontBodySemibold }}>Clear All</Text>
          </TouchableOpacity>
        ) : null}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {SKILLS.map((skill) => {
          const scored = !!skillScores[skill.id]?.total;
          return (
            <TouchableOpacity
              key={skill.id}
              style={[styles.skillCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}
              onPress={() => handleSkillPress(skill)}
              activeOpacity={0.7}
            >
              {scored
                ? <CheckCircle size={26} color={t.accentPurple} strokeWidth={2} />
                : <PlayCircle size={26} color={t.textMuted} strokeWidth={2} />}
              <View style={styles.skillInfo}>
                <Text style={[styles.skillName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{skill.name}</Text>
                <Text style={[styles.skillScore, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {skillScores[skill.id]?.total || 0} / {skill.maxScore}
                </Text>
              </View>
              <ChevronRight size={18} color={t.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}

        <View style={[styles.summaryCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <Text style={[styles.summaryLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Total Score</Text>
          <Text style={[styles.summaryValue, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>
            {totalScore} / {maxTotal} ({maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0}%)
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 16, backgroundColor: t.surface, borderTopColor: isDark ? t.border : '#E5E7EB' }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: totalScore === 0 ? t.textCaption : t.accentPurple }, totalScore === 0 && { opacity: 0.5 }]}
          onPress={() => navigation.navigate('EvaluationSummary', { studentId, student, assessmentKey })}
          disabled={totalScore === 0}
        >
          <Text style={[styles.continueButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>
            Save & View Evaluation Summary
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  skillCard: { borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 15, marginBottom: 3 },
  skillScore: { fontSize: 13 },
  summaryCard: { borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 6 },
  summaryLabel: { fontSize: 13, marginBottom: 8 },
  summaryValue: { fontSize: 26 },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  continueButton: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  continueButtonText: { fontSize: 15 },
});
