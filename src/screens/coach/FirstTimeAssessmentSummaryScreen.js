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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';

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
  const insets = useSafeAreaInsets();
  
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  // Only show questions that were part of the flow
  const answeredQuestions = questionFlow
    .filter(key => key !== 'summary' && QUESTIONS[key])
    .map(key => QUESTIONS[key]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Experience Assessment</Text>
          <Text style={styles.headerSubtitle}>{student?.name || 'Player'}</Text>
          {assessmentDate && (
            <Text style={styles.headerDate}>{assessmentDate}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.summaryContainer}>
        <ScrollView style={styles.summaryScrollView} showsVerticalScrollIndicator={true}>
          {answeredQuestions.map((question, index) => {
            const answer = answers[question.id];
            return (
              <View key={question.id} style={styles.qaItem}>
                <View style={styles.qaQuestionContainer}>
                  <Text style={styles.qaQuestionNumber}>{index + 1}.</Text>
                  <Text style={styles.qaQuestion}>{question.question}</Text>
                </View>
                <View style={styles.qaAnswerContainer}>
                  <Text style={styles.qaAnswer}>{formatAnswer(question, answer)}</Text>
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: SECONDARY_COLOR,
    padding: 16,
  },
  summaryScrollView: {
    flex: 1,
  },
  qaItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  qaQuestionContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  qaQuestionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginRight: 6,
    minWidth: 20,
  },
  qaQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  qaAnswerContainer: {
    marginLeft: 26,
    marginTop: 2,
    padding: 8,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 8,
  },
  qaAnswer: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});

