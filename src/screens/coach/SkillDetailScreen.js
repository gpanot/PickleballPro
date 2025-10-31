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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';
const ACCENT_COLOR = '#F39C12';

const SKILL_CRITERIA = {
  serves: [
    { id: 'consistency', label: 'Consistency', maxScore: 10 },
    { id: 'depth_control', label: 'Depth Control', maxScore: 10 },
    { id: 'placement', label: 'Placement Accuracy', maxScore: 10 },
    { id: 'spin', label: 'Spin / Variation', maxScore: 10 },
    { id: 'power_recovery', label: 'Power + Recovery', maxScore: 10 },
  ],
  dinks: [
    { id: 'consistency', label: 'Consistency', maxScore: 10 },
    { id: 'depth', label: 'Depth Control', maxScore: 10 },
    { id: 'direction', label: 'Direction Control', maxScore: 10 },
    { id: 'pace', label: 'Pace Control', maxScore: 10 },
  ],
  volleys: [
    { id: 'consistency', label: 'Consistency', maxScore: 10 },
    { id: 'placement', label: 'Placement', maxScore: 10 },
    { id: 'power', label: 'Power Control', maxScore: 10 },
    { id: 'reset_ability', label: 'Reset Ability', maxScore: 10 },
    { id: 'court_position', label: 'Court Position', maxScore: 10 },
  ],
  third_shot: [
    { id: 'placement', label: 'Placement', maxScore: 10 },
    { id: 'consistency', label: 'Consistency', maxScore: 10 },
    { id: 'depth', label: 'Depth Control', maxScore: 10 },
    { id: 'follow_through', label: 'Follow Through', maxScore: 10 },
  ],
  footwork: [
    { id: 'agility', label: 'Agility', maxScore: 10 },
    { id: 'positioning', label: 'Positioning', maxScore: 10 },
    { id: 'balance', label: 'Balance', maxScore: 10 },
  ],
  game_play: [
    { id: 'strategy', label: 'Strategy', maxScore: 10 },
    { id: 'adaptability', label: 'Adaptability', maxScore: 10 },
    { id: 'decision_making', label: 'Decision Making', maxScore: 10 },
    { id: 'pressure_handling', label: 'Pressure Handling', maxScore: 10 },
  ],
};

const ALL_SKILLS = [
  { id: 'serves', name: 'Serves' },
  { id: 'dinks', name: 'Dinks' },
  { id: 'volleys', name: 'Volleys / Resets' },
  { id: 'third_shot', name: '3rd Shot' },
  { id: 'footwork', name: 'Footwork' },
  { id: 'game_play', name: 'Game Play / Scenarios' },
];

// Custom Slider Component
function CustomSlider({ value, onValueChange, min = 0, max = 10, color = PRIMARY_COLOR }) {
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
        style={styles.sliderTrack}
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
        <Text style={styles.sliderLabel}>{min}</Text>
        <Text style={[styles.sliderLabel, styles.sliderLabelCenter]}>5</Text>
        <Text style={styles.sliderLabel}>{max}</Text>
      </View>
    </View>
  );
}

export default function SkillDetailScreen({ route, navigation }) {
  const { studentId, student, skillId, skillName, maxScore, assessmentKey } = route.params;
  const insets = useSafeAreaInsets();
  
  const criteria = SKILL_CRITERIA[skillId] || [];
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadSavedScores();
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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
      console.log('Saving scores for skill:', skillId);
      // Get existing assessment data
      const saved = await AsyncStorage.getItem(assessmentKey);
      const existingData = saved ? JSON.parse(saved) : { skillScores: {} };
      
      // Calculate total score for this skill
      const skillTotal = Object.values(newScores).reduce((sum, val) => sum + (val || 0), 0);
      console.log('Skill total:', skillTotal);
      
      // Update the skill data
      existingData.skillScores = existingData.skillScores || {};
      existingData.skillScores[skillId] = {
        scores: newScores,
        notes: newNotes,
        total: skillTotal,
        maxScore: maxScore,
      };
      
      console.log('Saving to key:', assessmentKey);
      console.log('Full data:', JSON.stringify(existingData));
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem(assessmentKey, JSON.stringify(existingData));
      console.log('Save successful');
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  };

  const totalScore = criteria.reduce((sum, criterion) => {
    return sum + (scores[criterion.id] || 0);
  }, 0);

  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage < 50) return '#EF4444'; // Red
    if (percentage < 75) return ACCENT_COLOR; // Yellow
    return PRIMARY_COLOR; // Green
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{skillName} Evaluation</Text>
          <Text style={styles.headerSubtitle}>{student?.name || 'Player'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {criteria.map((criterion) => {
          const score = scores[criterion.id] || 0;
          const color = getScoreColor(score, criterion.maxScore);
          
          return (
            <View key={criterion.id} style={styles.criterionCard}>
              <View style={styles.criterionHeader}>
                <Text style={styles.criterionLabel}>{criterion.label}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.scoreValue, { color }]}>
                    {score} / {criterion.maxScore}
                  </Text>
                </View>
              </View>
              <CustomSlider
                value={score}
                onValueChange={(value) => handleScoreChange(criterion.id, value)}
                min={0}
                max={criterion.maxScore}
                color={color}
              />
            </View>
          );
        })}

        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this skill..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={handleNotesChange}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Total Score</Text>
          <Text style={[styles.scoreTotal, { color: getScoreColor(totalScore, maxScore) }]}>
            {totalScore} / {maxScore} ({maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%)
          </Text>
        </View>
      </ScrollView>

      {/* Footer removed: back handled by top bar */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  criterionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  criterionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  criterionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sliderWrapper: {
    marginTop: 8,
  },
  sliderTrack: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    position: 'relative',
    overflow: 'visible',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 12,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    transform: [{ translateX: -20 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderThumbDragging: {
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  sliderLabelCenter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  footerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    backgroundColor: 'white',
    gap: 8,
  },
  footerBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
});

