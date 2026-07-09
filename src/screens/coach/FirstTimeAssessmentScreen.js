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
import { CheckCircle, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, checkCoachAccess, getStudentCoach } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';
import {
  getAssessmentTemplate,
  DEFAULT_EXPERIENCE_TEMPLATE,
  evaluateCondition,
} from '../../lib/assessmentTemplatesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FirstTimeAssessmentScreen({ route, navigation }) {
  const { studentId, student } = route.params;
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { logbookTheme: t, isDark } = useTheme();

  // Template-driven questions (array, replaces hardcoded QUESTIONS object)
  const [questions, setQuestions] = useState(DEFAULT_EXPERIENCE_TEMPLATE.questions);
  const [templateId, setTemplateId] = useState(null);

  const [currentQuestionKey, setCurrentQuestionKey] = useState(
    DEFAULT_EXPERIENCE_TEMPLATE.questions[0]?.id || 'playedPickleball'
  );
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [questionFlow, setQuestionFlow] = useState([
    DEFAULT_EXPERIENCE_TEMPLATE.questions[0]?.id || 'playedPickleball',
  ]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const assessmentKey = `newbie_assessment_${studentId}`;

  // Load the template from Supabase on mount, then restore any saved progress
  useEffect(() => {
    let cancelled = false;
    getAssessmentTemplate('experience', null, student?.sportId || 'pickleball').then((tmpl) => {
      if (cancelled) return;
      if (tmpl?.questions?.length) {
        setQuestions(tmpl.questions);
        setTemplateId(tmpl.id || null);
        const firstId = tmpl.questions[0].id;
        setCurrentQuestionKey(firstId);
        setQuestionFlow([firstId]);
      }
      loadSavedProgress(tmpl?.questions || DEFAULT_EXPERIENCE_TEMPLATE.questions);
    });
    return () => { cancelled = true; };
  }, []);

  // Helper: build a lookup map from question array
  const getQuestionById = (qArr, id) => qArr.find(q => q.id === id) || null;

  // Determine the next question based on current answers
  const getNextQuestion = (currentKey, currentAnswers, qArr) => {
    const currentIndex = qArr.findIndex(q => q.id === currentKey);
    for (let i = currentIndex + 1; i < qArr.length; i++) {
      const q = qArr[i];
      if (evaluateCondition(q.condition, currentAnswers)) {
        return q.id;
      }
    }
    return null;
  };

  const loadSavedProgress = async (qArr) => {
    try {
      const saved = await AsyncStorage.getItem(assessmentKey);
      if (saved) {
        const data = JSON.parse(saved);
        setAnswers(data.answers || {});
        const firstId = qArr[0]?.id || 'playedPickleball';
        setQuestionFlow(data.questionFlow || [firstId]);

        const flow = data.questionFlow || [firstId];
        let lastAnsweredKey = null;
        for (const key of flow) {
          if (data.answers?.[key]) lastAnsweredKey = key;
        }

        if (lastAnsweredKey) {
          const nextKey = getNextQuestion(lastAnsweredKey, data.answers, qArr);
          if (nextKey) {
            setCurrentQuestionKey(nextKey);
            setQuestionFlow([...flow, nextKey]);
          } else {
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

    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const nextKey = getNextQuestion(questionKey, newAnswers, questions);

      if (nextKey) {
        const newFlow = [...questionFlow, nextKey];
        setQuestionFlow(newFlow);
        setCurrentQuestionKey(nextKey);
        saveProgress(newAnswers, newFlow);

        slideAnim.setValue(SCREEN_WIDTH);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
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
        total_score: 0,
        max_score: 0,
        skills_data: {
          branching_assessment: {
            type: 'branching_experience_assessment',
            answers: answers,
            questionFlow: questionFlow,
            template_id: templateId || null,
            questions: questions.map(q => ({
              id: q.id,
              question: q.question,
              type: q.type,
              options: q.options,
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

    return (
      <Animated.View
        key={question.id}
        style={[styles.questionContainer, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={[styles.questionCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <View style={styles.questionHeader}>
            <Text style={[styles.questionProgress, { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>
              Question {questionIndex}
            </Text>
          </View>
          <Text style={[styles.questionText, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{question.question}</Text>
          <View style={styles.buttonGroup}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6', borderColor: 'transparent' },
                  currentAnswer === option.value && { backgroundColor: `${t.accentPurple}15`, borderColor: t.accentPurple },
                ]}
                onPress={() => handleAnswer(question.id, option.value)}
              >
                <Text style={[
                  styles.optionButtonText,
                  { color: t.textSecondary, fontFamily: t.fontBodySemibold },
                  currentAnswer === option.value && { color: t.accentPurple },
                ]}>
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
    const answeredQuestions = questionFlow
      .filter(key => key !== 'summary')
      .map(key => getQuestionById(questions, key))
      .filter(Boolean);

    return (
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

        <View style={styles.summaryButtonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: t.accentPurple }]}
            onPress={handleSaveAssessment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={isDark ? t.fabTextColor : '#fff'} />
            ) : (
              <>
                <Text style={[styles.primaryButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>Save Assessment</Text>
                <CheckCircle size={20} color={isDark ? t.fabTextColor : '#fff'} strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => {
            const firstId = questions[0]?.id || 'playedPickleball';
            setCurrentQuestionKey(firstId);
            setQuestionFlow([firstId]);
          }}>
            <Text style={[styles.secondaryButtonText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>Edit Answers</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalPossibleQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = currentQuestionKey === 'summary'
    ? 100
    : (answeredCount / totalPossibleQuestions) * 100;

  const currentQuestion = currentQuestionKey !== 'summary'
    ? getQuestionById(questions, currentQuestionKey)
    : null;
  const isSummary = currentQuestionKey === 'summary';

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="surface"
        bordered
        title="Experience Assessment"
        subtitle={student?.name || 'Player'}
        onBack={() => navigation.goBack()}
        topAccessory={
          <View style={[styles.progressContainer, { backgroundColor: isDark ? t.surfaceRaised : '#E5E7EB' }]}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: t.accentPurple }]} />
          </View>
        }
      />

      {!isSummary ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderQuestion(currentQuestion)}
        </ScrollView>
      ) : (
        renderSummary()
      )}

      {!isSummary && currentQuestion && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: t.surface, borderTopColor: isDark ? t.border : '#E5E7EB' }]}>
          {questionFlow.indexOf(currentQuestionKey) > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={18} color={t.textMuted} strokeWidth={2} />
              <Text style={[styles.backButtonText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { height: 4 },
  progressBar: { height: '100%' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  questionContainer: { width: '100%' },
  questionCard: { borderRadius: 20, padding: 22 },
  questionHeader: { marginBottom: 14 },
  questionProgress: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  questionText: { fontSize: 19, marginBottom: 22, lineHeight: 27 },
  buttonGroup: { gap: 12 },
  optionButton: { borderRadius: 14, padding: 17, alignItems: 'center', borderWidth: 2 },
  optionButtonText: { fontSize: 15 },
  summaryContainer: { flex: 1, padding: 16, paddingBottom: 20 },
  summaryScrollView: { flex: 1 },
  qaItem: { borderRadius: 12, padding: 12, marginBottom: 10 },
  qaQuestionContainer: { flexDirection: 'row', marginBottom: 6 },
  qaQuestionNumber: { fontSize: 14, marginRight: 6, minWidth: 20 },
  qaQuestion: { flex: 1, fontSize: 14, lineHeight: 20 },
  qaAnswerContainer: { marginLeft: 26, marginTop: 2, padding: 8, borderRadius: 8 },
  qaAnswer: { fontSize: 13, lineHeight: 18 },
  summaryButtonContainer: { marginTop: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  backButtonText: { fontSize: 14 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, width: '100%', marginBottom: 12, gap: 8 },
  primaryButtonText: { fontSize: 15 },
  secondaryButton: { alignItems: 'center', paddingVertical: 12 },
  secondaryButtonText: { fontSize: 14 },
});

