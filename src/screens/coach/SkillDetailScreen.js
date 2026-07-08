import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  PanResponder,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';
import {
  getAssessmentTemplate,
  DEFAULT_PLAYER_EVALUATION_TEMPLATE,
} from '../../lib/assessmentTemplatesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT_COLOR = '#F39C12';

// Custom Slider Component
function CustomSlider({ value, onValueChange, min = 0, max = 10, color = '#27AE60', trackColor = '#E5E7EB' }) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setDragging(true);
      // Handle tap - update value immediately when user touches the slider
      const { locationX } = evt.nativeEvent;
      handleMove(locationX);
    },
    onPanResponderMove: (evt) => {
      const { locationX } = evt.nativeEvent;
      handleMove(locationX);
    },
    onPanResponderRelease: () => {
      setDragging(false);
    },
  });

  const handleMove = (x) => {
    if (sliderWidth === 0) return;
    const clampedX = Math.max(0, Math.min(sliderWidth, x));
    const ratio = clampedX / sliderWidth;
    const newValue = Math.round(min + ratio * (max - min));
    onValueChange(newValue);
  };

  return (
    <View style={styles.sliderWrapper}>
      <View
        style={[styles.sliderTrack, { backgroundColor: trackColor }]}
        {...panResponder.panHandlers}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        <View style={[styles.sliderFill, { width: `${percentage}%`, backgroundColor: color }]} />
        <View
          style={[
            styles.sliderThumb,
            { left: `${percentage}%`, backgroundColor: color },
            dragging && styles.sliderThumbDragging,
          ]}
        />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={[styles.sliderLabel, { color: '#9CA3AF' }]}>{min}</Text>
        <Text style={[styles.sliderLabel, styles.sliderLabelCenter, { color: '#6B7280' }]}>5</Text>
        <Text style={[styles.sliderLabel, { color: '#9CA3AF' }]}>{max}</Text>
      </View>
    </View>
  );
}

export default function SkillDetailScreen({ route, navigation }) {
  const { studentId, student, skillId, skillName, maxScore, assessmentKey } = route.params;
  const { logbookTheme: t, isDark } = useTheme();

  // Criteria loaded from template, falling back to defaults
  const [criteria, setCriteria] = useState(() => {
    const fallback = DEFAULT_PLAYER_EVALUATION_TEMPLATE.skills.find(s => s.id === skillId);
    return fallback?.criteria || [];
  });
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    getAssessmentTemplate('player_evaluation').then((tmpl) => {
      const skill = tmpl?.skills?.find(s => s.id === skillId);
      if (skill?.criteria?.length) setCriteria(skill.criteria);
    });
    loadSavedScores();

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const loadSavedScores = async () => {
    try {
      const saved = await AsyncStorage.getItem(assessmentKey);
      if (saved) {
        const data = JSON.parse(saved);
        const skillData = data.skillScores?.[skillId];
        if (skillData) {
          setScores(skillData.scores || {});
          setNotes(skillData.notes || '');
        }
      }
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveScores = async (newScores, newNotes) => {
    try {
      const saved = await AsyncStorage.getItem(assessmentKey);
      const existingData = saved ? JSON.parse(saved) : { skillScores: {} };
      const skillTotal = Object.values(newScores).reduce((sum, val) => sum + (val || 0), 0);
      existingData.skillScores = existingData.skillScores || {};
      existingData.skillScores[skillId] = {
        scores: newScores,
        notes: newNotes,
        total: skillTotal,
        maxScore: maxScore,
      };
      await AsyncStorage.setItem(assessmentKey, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  };

  const totalScore = criteria.reduce((sum, criterion) => {
    return sum + (scores[criterion.id] || 0);
  }, 0);

  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage < 50) return '#EF4444';
    if (percentage < 75) return ACCENT_COLOR;
    return t.accentPurple;
  };

  const handleScoreChange = async (criterionId, value) => {
    const newScores = { ...scores, [criterionId]: Math.round(value) };
    setScores(newScores);
    
    // Debounce the save operation to prevent flickering
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveScores(newScores, notes);
    }, 300);
  };

  const handleNotesChange = async (text) => {
    setNotes(text);
    await saveScores(scores, text);
  };

  const handleBackToOverview = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title={`${skillName} Evaluation`}
        subtitle={student?.name || 'Player'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {criteria.map((criterion) => {
          const score = scores[criterion.id] || 0;
          const color = getScoreColor(score, criterion.maxScore);
          return (
            <View key={criterion.id} style={[styles.criterionCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
              <View style={styles.criterionHeader}>
                <Text style={[styles.criterionLabel, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{criterion.label}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.scoreValue, { color, fontFamily: t.fontBodyBold }]}>{score} / {criterion.maxScore}</Text>
                </View>
              </View>
              <CustomSlider
                value={score}
                onValueChange={(value) => handleScoreChange(criterion.id, value)}
                min={0}
                max={criterion.maxScore}
                color={color}
                trackColor={isDark ? t.surfaceRaised : '#E5E7EB'}
              />
            </View>
          );
        })}

        <View style={[styles.notesCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <Text style={[styles.notesLabel, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { borderColor: isDark ? t.border : '#E5E7EB', color: t.textPrimary, backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB' }]}
            placeholder="Add notes about this skill..."
            placeholderTextColor={t.textMuted}
            value={notes}
            onChangeText={handleNotesChange}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={[styles.scoreCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }]}>
          <Text style={[styles.scoreLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Total Score</Text>
          <Text style={[styles.scoreTotal, { color: getScoreColor(totalScore, maxScore), fontFamily: t.fontDisplay }]}>
            {totalScore} / {maxScore} ({maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  criterionCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  criterionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  criterionLabel: { fontSize: 15, flex: 1 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreValue: { fontSize: 15 },
  sliderWrapper: { marginTop: 8 },
  sliderTrack: { height: 24, borderRadius: 12, position: 'relative', overflow: 'visible' },
  sliderFill: { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 12 },
  sliderThumb: { position: 'absolute', top: -8, width: 40, height: 40, borderRadius: 20, transform: [{ translateX: -20 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  sliderThumbDragging: { shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 2 },
  sliderLabel: { fontSize: 12, fontWeight: '500' },
  sliderLabelCenter: { fontSize: 13, fontWeight: '700' },
  notesCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  notesLabel: { fontSize: 15, marginBottom: 10 },
  notesInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
  scoreCard: { borderRadius: 16, padding: 20, alignItems: 'center' },
  scoreLabel: { fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreTotal: {
    fontSize: 32,
    fontWeight: '700',
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
  },
});

