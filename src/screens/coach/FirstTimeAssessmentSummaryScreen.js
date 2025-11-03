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

const QUESTIONS = [
  {
    id: 1,
    question: 'Have you played any racket or paddle sports before?',
    type: 'button',
    options: [
      { label: '🎾 Tennis', value: 'tennis' },
      { label: '🏸 Badminton', value: 'badminton' },
      { label: '🏓 Ping Pong', value: 'pingpong' },
      { label: '❌ None', value: 'none' },
    ],
  },
  {
    id: 2,
    question: 'How comfortable are you hitting or catching a moving ball?',
    type: 'slider',
    labels: { left: '😬', right: '😎' },
  },
  {
    id: 3,
    question: 'How well do you move side-to-side or forward quickly?',
    type: 'slider',
    labels: { left: 'Slow', right: 'Very agile' },
  },
  {
    id: 4,
    question: 'How well do you know the Pickleball rules?',
    type: 'button',
    options: [
      { label: '🤷 Nothing', value: 'nothing' },
      { label: '🤔 A bit', value: 'abit' },
      { label: '👍 Well', value: 'well' },
      { label: '🎯 Very Well', value: 'verywell' },
    ],
  },
  {
    id: 5,
    question: 'What motivates you most to play pickleball?',
    type: 'button',
    options: [
      { label: '🧘 Fitness', value: 'fitness' },
      { label: '🎉 Fun', value: 'fun' },
      { label: '🧠 Learning', value: 'learning' },
      { label: '🏆 Competing', value: 'competing' },
    ],
  },
  {
    id: 6,
    question: 'How balanced do you feel while moving?',
    type: 'slider',
  },
  {
    id: 7,
    question: 'Can you stay focused for short drills (2–5 minutes)?',
    type: 'slider',
    labels: { left: '🧘 Calm', right: '🔥 Focused' },
  },
  {
    id: 8,
    question: 'How would you describe your current fitness level?',
    type: 'slider',
    labels: { left: 'Low', right: 'High' },
  },
  {
    id: 9,
    question: 'Which hand do you use most for hitting?',
    type: 'button',
    options: [
      { label: '✋ Right', value: 'right' },
      { label: '🤚 Left', value: 'left' },
    ],
  },
  {
    id: 10,
    question: 'What\'s your main goal for your first month of play?',
    type: 'text',
  },
];

export default function FirstTimeAssessmentSummaryScreen({ route, navigation }) {
  const { assessmentId, student } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
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

      const newbieAssessment = data?.skills_data?.newbie_assessment;
      if (newbieAssessment && newbieAssessment.answers) {
        setAnswers(newbieAssessment.answers);
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
    if (!answer && question.optional) return 'Not provided';
    if (!answer) return 'No answer';
    
    if (question.type === 'button') {
      const option = question.options.find(opt => opt.value === answer);
      return option ? option.label : answer;
    } else if (question.type === 'slider') {
      return `${answer} / 10`;
    } else if (question.type === 'text') {
      return answer || 'Not provided';
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>First Time Assessment</Text>
          <Text style={styles.headerSubtitle}>{student?.name || 'Player'}</Text>
          {assessmentDate && (
            <Text style={styles.headerDate}>{assessmentDate}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.summaryContainer}>
        <ScrollView style={styles.summaryScrollView} showsVerticalScrollIndicator={true}>
          {QUESTIONS.map((question) => {
            const answer = answers[question.id];
            return (
              <View key={question.id} style={styles.qaItem}>
                <View style={styles.qaQuestionContainer}>
                  <Text style={styles.qaQuestionNumber}>{question.id}.</Text>
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

