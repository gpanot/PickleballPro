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

const QUESTIONS = {
  // First question - always shown
  playedPickleball: {
    id: 'playedPickleball',
    question: 'Have you ever played Pickleball (PB)?',
    type: 'button',
    options: [
      { label: '✅ Yes', value: 'yes' },
      { label: '❌ No', value: 'no' },
    ],
  },
  
  // If YES to pickleball - ask duration
  pbDuration: {
    id: 'pbDuration',
    question: 'For how long have you been playing?',
    type: 'button',
    condition: (answers) => answers.playedPickleball === 'yes',
    options: [
      { label: '📅 Less than 6 months', value: 'less6months' },
      { label: '📆 More than 6 months', value: 'more6months' },
    ],
  },
  
  // If NO to pickleball - ask about other racket sports
  racketSport: {
    id: 'racketSport',
    question: 'Have you ever played any racket sport?',
    type: 'button',
    condition: (answers) => answers.playedPickleball === 'no',
    options: [
      { label: '🎾 Tennis', value: 'tennis' },
      { label: '🏸 Badminton', value: 'badminton' },
      { label: '🏓 Ping Pong', value: 'pingpong' },
      { label: '🎾 Squash', value: 'squash' },
      { label: '❌ None', value: 'none' },
    ],
  },
  
  // If they played a racket sport - ask skill level
  racketSkillLevel: {
    id: 'racketSkillLevel',
    question: 'How good are you at that sport?',
    type: 'button',
    condition: (answers) => answers.racketSport && answers.racketSport !== 'none',
    options: [
      { label: '🌱 Beginner', value: 'beginner' },
      { label: '👍 Normal', value: 'normal' },
      { label: '⭐ Semi Pro', value: 'semipro' },
      { label: '🏆 Pro Player', value: 'pro' },
    ],
  },
};

export default function FirstTimeAssessmentSummaryScreen({ route, navigation }) {
  const { assessmentId, student } = route.params || {};
  const { logbookTheme: t, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [questionFlow, setQuestionFlow] = useState([]);
  const [assessmentDate, setAssessmentDate] = useState(null);

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
      } else {
        // Fallback to old newbie assessment format
        const newbieAssessment = data?.skills_data?.newbie_assessment;
        if (newbieAssessment && newbieAssessment.answers) {
          setAnswers(newbieAssessment.answers);
          // For old format, show all questions that have answers
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
      const option = question.options.find(opt => opt.value === answer);
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
    .filter(key => key !== 'summary' && QUESTIONS[key])
    .map(key => QUESTIONS[key]);

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

