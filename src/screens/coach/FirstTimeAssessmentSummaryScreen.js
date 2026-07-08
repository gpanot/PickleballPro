import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';
import { DEFAULT_EXPERIENCE_TEMPLATE } from '../../lib/assessmentTemplatesApi';

export default function FirstTimeAssessmentSummaryScreen({ route, navigation }) {
  const { assessmentId, student } = route.params || {};
  const { logbookTheme: t, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [questionFlow, setQuestionFlow] = useState([]);
  const [assessmentDate, setAssessmentDate] = useState(null);
  // Questions sourced from the saved assessment record, then fallback to defaults
  const [questions, setQuestions] = useState(DEFAULT_EXPERIENCE_TEMPLATE.questions);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_assessments')
        .select('skills_data, created_at')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;

      // Try new branching assessment format first
      const branchingAssessment = data?.skills_data?.branching_assessment;
      if (branchingAssessment && branchingAssessment.answers) {
        setAnswers(branchingAssessment.answers);
        setQuestionFlow(branchingAssessment.questionFlow || []);
        // Use questions saved alongside the assessment if available
        if (Array.isArray(branchingAssessment.questions) && branchingAssessment.questions.length) {
          setQuestions(branchingAssessment.questions);
        }
      } else {
        // Fallback to old newbie assessment format
        const newbieAssessment = data?.skills_data?.newbie_assessment;
        if (newbieAssessment && newbieAssessment.answers) {
          setAnswers(newbieAssessment.answers);
          const flow = Object.keys(newbieAssessment.answers);
          setQuestionFlow(flow);
        }
      }

      if (data?.created_at) {
        setAssessmentDate(new Date(data.created_at).toLocaleDateString());
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAnswer = (question, answer) => {
    if (!answer) return 'No answer';
    if (question.type === 'button') {
      const option = question.options?.find(opt => opt.value === answer);
      return option ? option.label : answer;
    }
    return answer;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accentPurple} />
      </View>
    );
  }

  const answeredQuestions = questionFlow
    .filter(key => key !== 'summary')
    .map(key => questions.find(q => q.id === key))
    .filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="Experience Assessment"
        subtitle={assessmentDate ? `${student?.name || 'Player'} · ${assessmentDate}` : student?.name || 'Player'}
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.summaryContainer, { backgroundColor: t.bg }]}>
        <ScrollView style={styles.summaryScrollView} showsVerticalScrollIndicator={true}>
          {answeredQuestions.map((question, index) => {
            const answer = answers[question.id];
            return (
              <View key={question.id} style={[styles.qaItem, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
                <View style={styles.qaQuestionContainer}>
                  <Text style={[styles.qaQuestionNumber, { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>{index + 1}.</Text>
                  <Text style={[styles.qaQuestion, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{question.question}</Text>
                </View>
                <View style={[styles.qaAnswerContainer, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]}>
                  <Text style={[styles.qaAnswer, { color: t.textSecondary, fontFamily: t.fontBody }]}>{formatAnswer(question, answer)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryContainer: { flex: 1, padding: 16 },
  summaryScrollView: { flex: 1 },
  qaItem: { borderRadius: 12, padding: 12, marginBottom: 10 },
  qaQuestionContainer: { flexDirection: 'row', marginBottom: 6 },
  qaQuestionNumber: { fontSize: 14, marginRight: 6, minWidth: 20 },
  qaQuestion: { flex: 1, fontSize: 14, lineHeight: 20 },
  qaAnswerContainer: { marginLeft: 26, marginTop: 2, padding: 8, borderRadius: 8 },
  qaAnswer: { fontSize: 13, lineHeight: 18 },
});

