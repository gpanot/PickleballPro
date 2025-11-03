import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
  PanResponder,
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

// Custom Slider Component
function CustomSlider({ value, onValueChange, min = 0, max = 10, labels = {}, color = PRIMARY_COLOR }) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const draggingRef = useRef(false); // Use ref instead of state for immediate updates
  const [localValue, setLocalValue] = useState(value !== undefined && value !== null ? value : min + Math.floor((max - min) / 2));

  // Sync with prop value when not dragging
  useEffect(() => {
    if (!draggingRef.current && value !== undefined && value !== null) {
      setLocalValue(value);
    }
  }, [value]);

  // Use local value always for display
  const displayValue = localValue;
  const normalizedValue = Math.max(min, Math.min(max, displayValue));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  const handleMove = (x) => {
    if (sliderWidth === 0) return;
    const clampedX = Math.max(0, Math.min(sliderWidth, x));
    const ratio = clampedX / sliderWidth;
    const newValue = Math.round(min + ratio * (max - min));
    
    setLocalValue(newValue);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      draggingRef.current = true; // Set ref immediately
      const { locationX } = evt.nativeEvent;
      handleMove(locationX);
    },
    onPanResponderMove: (evt) => {
      const { locationX } = evt.nativeEvent;
      handleMove(locationX);
    },
    onPanResponderRelease: () => {
      draggingRef.current = false; // Clear ref immediately
      onValueChange(localValue);
    },
  });

  return (
    <View style={styles.sliderWrapper}>
      <View
        style={styles.sliderTrack}
        {...panResponder.panHandlers}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        <View style={[styles.sliderFill, { width: `${percentage}%`, backgroundColor: color }]} />
        <View style={[styles.sliderThumb, { left: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{labels.left || min}</Text>
        <Text style={styles.sliderLabel}>{labels.right || max}</Text>
      </View>
    </View>
  );
}

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
      { label: '🤷 No idea', value: 'nothing' },
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

export default function FirstTimeAssessmentScreen({ route, navigation }) {
  const { studentId, student } = route.params;
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const assessmentKey = `newbie_assessment_${studentId}`;

  useEffect(() => {
    loadSavedProgress();
  }, []);

  const loadSavedProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(assessmentKey);
      if (saved) {
        const data = JSON.parse(saved);
        setAnswers(data.answers || {});
        
        // Find the last answered question
        const questionIds = QUESTIONS.map(q => q.id);
        let lastAnsweredIndex = -1;
        for (let i = 0; i < QUESTIONS.length; i++) {
          if (data.answers?.[QUESTIONS[i].id]) {
            lastAnsweredIndex = i;
          }
        }
        
        // Start from the next unanswered question
        if (lastAnsweredIndex < QUESTIONS.length - 1) {
          setCurrentQuestion(lastAnsweredIndex + 1);
        } else {
          // All questions answered, show summary
          setCurrentQuestion(QUESTIONS.length);
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  const saveProgress = async (newAnswers) => {
    try {
      await AsyncStorage.setItem(assessmentKey, JSON.stringify({ answers: newAnswers }));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    await saveProgress(newAnswers);

    // Animate slide out
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Move to next question
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        // Reset animation for next slide in
        slideAnim.setValue(SCREEN_WIDTH);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // All questions answered, show summary
        setCurrentQuestion(QUESTIONS.length);
        slideAnim.setValue(0);
      }
    });
  };

  const handleBack = () => {
    if (currentQuestion === 0) return;
    
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentQuestion(currentQuestion - 1);
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
          newbie_assessment: {
            type: 'first_time_assessment',
            answers: answers,
            questions: QUESTIONS.map(q => ({
              id: q.id,
              question: q.question,
              type: q.type,
            })),
          },
        },
        notes: 'First Time Assessment - Q&A Session',
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
        justSavedAssessmentId: data?.id 
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
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

  const renderQuestion = (question) => {
    if (!question) return null;

    const currentAnswer = answers[question.id];

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
              {question.id} / {QUESTIONS.length}
            </Text>
          </View>

          <Text style={styles.questionText}>{question.question}</Text>

          {question.type === 'button' && (
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
          )}

          {question.type === 'slider' && (
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{currentAnswer !== undefined && currentAnswer !== null ? currentAnswer : 5}</Text>
              <CustomSlider
                value={currentAnswer !== undefined && currentAnswer !== null ? currentAnswer : 5}
                onValueChange={(value) => {
                  setAnswers((prevAnswers) => ({ ...prevAnswers, [question.id]: value }));
                }}
                labels={question.labels}
              />
            </View>
          )}

          {question.type === 'text' && (
            <TextInput
              style={styles.textInput}
              placeholder={question.optional ? 'Optional - Add any concerns...' : 'Tell us about your goal...'}
              placeholderTextColor="#9CA3AF"
              value={currentAnswer || ''}
              onChangeText={(text) => setAnswers({ ...answers, [question.id]: text })}
              multiline
              numberOfLines={3}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSummary = () => {
    return (
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

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentQuestion(0)}>
            <Text style={styles.secondaryButtonText}>Edit Answers</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const progress = ((currentQuestion + 1) / (QUESTIONS.length + 1)) * 100;

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
          <Text style={styles.headerTitle}>Newbie Assessment</Text>
          <Text style={styles.headerSubtitle}>{student?.name || 'Player'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {currentQuestion < QUESTIONS.length ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderQuestion(QUESTIONS[currentQuestion])}
        </ScrollView>
      ) : (
        renderSummary()
      )}

      {currentQuestion < QUESTIONS.length && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !answers[QUESTIONS[currentQuestion].id] && QUESTIONS[currentQuestion].type !== 'text' && styles.nextButtonDisabled,
            ]}
            onPress={() => answers[QUESTIONS[currentQuestion].id] && handleAnswer(QUESTIONS[currentQuestion].id, answers[QUESTIONS[currentQuestion].id])}
            disabled={!answers[QUESTIONS[currentQuestion].id] && QUESTIONS[currentQuestion].type !== 'text'}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestion === QUESTIONS.length - 1 ? 'See Summary' : 'Next'}
            </Text>
          </TouchableOpacity>

          {currentQuestion > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 24,
  },
  sliderWrapper: {
    width: '100%',
  },
  sliderTrack: {
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    position: 'relative',
    overflow: 'visible',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 14,
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    transform: [{ translateX: -24 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
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
  nextButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
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

