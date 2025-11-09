import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, checkCoachAccess, getStudentCoach } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';

const QUESTIONS = {
  // First question - always shown
  playedPickleball: {
    id: 'playedPickleball',
    question: 'Have you ever played Pickleball ?',
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

export default function FirstTimeAssessmentScreen({ route, navigation }) {
  const { studentId, student } = route.params;
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  
  const [currentQuestionKey, setCurrentQuestionKey] = useState('playedPickleball');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [questionFlow, setQuestionFlow] = useState(['playedPickleball']); // Track the flow
  const slideAnim = useRef(new Animated.Value(0)).current;

  const assessmentKey = `newbie_assessment_${studentId}`;

  useEffect(() => {
    loadSavedProgress();
  }, []);

  // Determine the next question based on current answers
  const getNextQuestion = (currentKey, currentAnswers) => {
    const questionKeys = Object.keys(QUESTIONS);
    const currentIndex = questionKeys.indexOf(currentKey);
    
    // Check remaining questions for one that meets conditions
    for (let i = currentIndex + 1; i < questionKeys.length; i++) {
      const key = questionKeys[i];
      const question = QUESTIONS[key];
      
      // If no condition, or condition is met, this is the next question
      if (!question.condition || question.condition(currentAnswers)) {
        return key;
      }
    }
    
    return null; // No more questions
  };

  const loadSavedProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(assessmentKey);
      if (saved) {
        const data = JSON.parse(saved);
        setAnswers(data.answers || {});
        setQuestionFlow(data.questionFlow || ['playedPickleball']);
        
        // Find the last answered question in the flow
        const flow = data.questionFlow || ['playedPickleball'];
        let lastAnsweredKey = null;
        
        for (const key of flow) {
          if (data.answers?.[key]) {
            lastAnsweredKey = key;
          }
        }
        
        if (lastAnsweredKey) {
          // Check if there's a next question
          const nextKey = getNextQuestion(lastAnsweredKey, data.answers);
          if (nextKey) {
            setCurrentQuestionKey(nextKey);
            setQuestionFlow([...flow, nextKey]);
          } else {
            // All questions answered, show summary
            setCurrentQuestionKey('summary');
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  const saveProgress = async (newAnswers, newFlow) => {
    try {
      await AsyncStorage.setItem(assessmentKey, JSON.stringify({ 
        answers: newAnswers,
        questionFlow: newFlow 
      }));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswer = async (questionKey, answer) => {
    const newAnswers = { ...answers, [questionKey]: answer };
    setAnswers(newAnswers);

    // Animate slide out
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Determine next question based on the answer
      const nextKey = getNextQuestion(questionKey, newAnswers);
      
      if (nextKey) {
        const newFlow = [...questionFlow, nextKey];
        setQuestionFlow(newFlow);
        setCurrentQuestionKey(nextKey);
        saveProgress(newAnswers, newFlow);
        
        // Reset animation for next slide in
        slideAnim.setValue(SCREEN_WIDTH);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // All questions answered, show summary
        setCurrentQuestionKey('summary');
        saveProgress(newAnswers, questionFlow);
        slideAnim.setValue(0);
      }
    });
  };

  const handleBack = () => {
    const currentIndex = questionFlow.indexOf(currentQuestionKey);
    if (currentIndex <= 0) return; // Can't go back from first question
    
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const previousKey = questionFlow[currentIndex - 1];
      setCurrentQuestionKey(previousKey);
      slideAnim.setValue(-SCREEN_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSaveAssessment = async () => {
    setLoading(true);
    try {
      let coachId = null;
      
      // Check if user is a coach
      const { isCoach, coachId: userCoachId } = await checkCoachAccess(authUser?.id);
      
      if (isCoach && userCoachId) {
        // User is a coach, use their coach_id
        coachId = userCoachId;
      } else {
        // User is a student, get their coach_id
        const { coachId: studentCoachId, error: coachError } = await getStudentCoach(studentId);
        if (coachError || !studentCoachId) {
          Alert.alert('Error', 'No coach assigned. Please contact your coach.');
          setLoading(false);
          return;
        }
        coachId = studentCoachId;
      }

      // Save as Q&A session - no scoring
      const payload = {
        coach_id: coachId,
        student_id: studentId,
        total_score: 0, // No scoring for Q&A session
        max_score: 0, // No scoring for Q&A session
        skills_data: {
          branching_assessment: {
            type: 'branching_experience_assessment',
            answers: answers,
            questionFlow: questionFlow,
            questions: Object.keys(QUESTIONS).map(key => ({
              id: QUESTIONS[key].id,
              question: QUESTIONS[key].question,
              type: QUESTIONS[key].type,
            })),
          },
        },
        notes: 'Experience Assessment - Branching Flow',
        assessment_date: new Date().toISOString().slice(0, 10),
      };

      const { data, error } = await supabase
        .from('coach_assessments')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Clear AsyncStorage after successful save
      await AsyncStorage.removeItem(assessmentKey);

      navigation.navigate('PlayerProfile', { 
        studentId, 
        student, 
        justSavedAssessmentId: data?.id,
        isStudentView: !isCoach // Pass isStudentView flag based on user type
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
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

  const renderQuestion = (question) => {
    if (!question) return null;

    const currentAnswer = answers[question.id];
    const questionIndex = questionFlow.indexOf(question.id) + 1;
    const totalQuestions = Object.keys(QUESTIONS).length;

    return (
      <Animated.View
        key={question.id}
        style={[
          styles.questionContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionProgress}>
              Question {questionIndex}
            </Text>
          </View>

          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.buttonGroup}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  currentAnswer === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswer(question.id, option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    currentAnswer === option.value && styles.optionButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSummary = () => {
    // Only show questions that were part of the flow
    const answeredQuestions = questionFlow
      .filter(key => key !== 'summary')
      .map(key => QUESTIONS[key]);

    return (
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

        <View style={styles.summaryButtonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveAssessment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Save Assessment</Text>
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => {
            setCurrentQuestionKey('playedPickleball');
            setQuestionFlow(['playedPickleball']);
          }}>
            <Text style={styles.secondaryButtonText}>Edit Answers</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Calculate progress based on answered questions
  const totalPossibleQuestions = Object.keys(QUESTIONS).length;
  const answeredCount = Object.keys(answers).length;
  const progress = currentQuestionKey === 'summary' 
    ? 100 
    : (answeredCount / totalPossibleQuestions) * 100;

  const currentQuestion = currentQuestionKey !== 'summary' ? QUESTIONS[currentQuestionKey] : null;
  const isSummary = currentQuestionKey === 'summary';

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Experience Assessment</Text>
          <Text style={styles.headerSubtitle}>{student?.name || 'Player'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {!isSummary ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderQuestion(currentQuestion)}
        </ScrollView>
      ) : (
        renderSummary()
      )}

      {!isSummary && currentQuestion && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {questionFlow.indexOf(currentQuestionKey) > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
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
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    backgroundColor: PRIMARY_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  questionContainer: {
    width: '100%',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    lineHeight: 28,
  },
  buttonGroup: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: PRIMARY_COLOR + '15',
    borderColor: PRIMARY_COLOR,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionButtonTextSelected: {
    color: PRIMARY_COLOR,
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: SECONDARY_COLOR,
    padding: 16,
    paddingBottom: 20,
  },
  summaryScrollView: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
    paddingTop: 8,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
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
  summaryButtonContainer: {
    marginTop: 8,
  },
  badge: {
    backgroundColor: PRIMARY_COLOR + '15',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  summaryDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
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
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
});

