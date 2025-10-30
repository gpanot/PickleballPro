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
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';

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
  
  const [skillScores, setSkillScores] = useState({});
  const [loading, setLoading] = useState(true);

  // Generate a unique key for this assessment
  const assessmentKey = `assessment_${studentId}_${assessmentId || 'draft'}`;

  useEffect(() => {
    loadSavedAssessment();
  }, []);

  useEffect(() => {
    // Listen for navigation focus to reload scores when returning from skill detail
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedAssessment();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSavedAssessment = async () => {
    try {
      console.log('Loading assessment with key:', assessmentKey);
      const saved = await AsyncStorage.getItem(assessmentKey);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('Loaded assessment data:', data);
        setSkillScores(data.skillScores || {});
      } else {
        console.log('No saved assessment found');
        setSkillScores({});
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      setSkillScores({});
    } finally {
      setLoading(false);
    }
  };

  const handleSkillPress = (skill) => {
    navigation.navigate('SkillDetail', {
      studentId,
      student,
      skillId: skill.id,
      skillName: skill.name,
      maxScore: skill.maxScore,
      assessmentKey, // Pass the assessment key for persistence
    });
  };

  const handleClearAssessment = async () => {
    try {
      await AsyncStorage.removeItem(assessmentKey);
      setSkillScores({});
    } catch (error) {
      console.error('Error clearing assessment:', error);
    }
  };

  const totalScore = React.useMemo(() => {
    try {
      return Object.values(skillScores).reduce((sum, skillData) => {
        const total = typeof skillData === 'object' ? (skillData?.total || 0) : 0;
        return sum + total;
      }, 0);
    } catch (error) {
      console.error('Error calculating total score:', error);
      return 0;
    }
  }, [skillScores]);
  
  const maxTotal = SKILLS.reduce((sum, skill) => sum + skill.maxScore, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Player Assessment</Text>
          <Text style={styles.headerSubtitle}>{student?.name || 'Player'}</Text>
          <Text style={styles.headerDate}>{new Date().toLocaleDateString()}</Text>
        </View>
        {totalScore > 0 ? (
          <TouchableOpacity onPress={handleClearAssessment} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill.id}
            style={styles.skillCard}
            onPress={() => handleSkillPress(skill)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={skillScores[skill.id]?.total ? 'checkmark-circle' : 'play-circle-outline'}
              size={28}
              color={skillScores[skill.id]?.total ? PRIMARY_COLOR : '#6B7280'}
            />
            
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillScore}>
                {skillScores[skill.id]?.total || 0} / {skill.maxScore}
              </Text>
            </View>
            
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Score</Text>
          <Text style={styles.summaryValue}>
            {totalScore} / {maxTotal} ({maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0}%)
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueButton, totalScore === 0 && styles.continueButtonDisabled]}
          onPress={() => navigation.navigate('EvaluationSummary', { studentId, student, assessmentKey })}
          disabled={totalScore === 0}
        >
          <Text style={styles.continueButtonText}>Save & View Evaluation Summary</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
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
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  placeholder: {
    width: 70,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  skillCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  skillScore: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
  },
  continueButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

