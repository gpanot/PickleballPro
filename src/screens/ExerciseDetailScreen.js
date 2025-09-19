import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';
import LogResultComponent from '../components/LogResultComponent';
import { Ionicons } from '@expo/vector-icons';

const ExerciseDetailScreen = ({ route, navigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLogResult, setShowLogResult] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Get exercise data from navigation params or use mock data
  const exercise = route?.params?.exercise || {
    code: "7.1",
    title: "Drop Consistency",
    level: "Level 7: Third Shot Drop",
    goal: "Master the third shot drop by consistently placing the ball in the NVZ",
    instructions: `Setup:
• Stand at the baseline
• Partner feeds balls from the NVZ
• Focus on soft touch and arc

Execution:
1. Take a comfortable ready position
2. Use a pendulum swing motion
3. Aim for the NVZ with proper arc
4. Reset after each attempt

Success Criteria:
Land 6 out of 10 drops in the NVZ to pass this drill.`,
    targetType: "count",
    targetValue: "6/10",
    difficulty: 3,
    validationMode: "manual",
    estimatedTime: "10-15 min",
    equipment: ["Balls", "Partner/Coach"],
    tips: [
      "Keep your paddle face open",
      "Use your legs for power, not your arm", 
      "Aim for the kitchen line, not the net"
    ],
    previousAttempts: [
      { date: "2 days ago", result: "4/10", passed: false },
      { date: "1 week ago", result: "3/10", passed: false }
    ]
  };

  const handleResultSubmitted = (resultData) => {
    // Handle the result submission - could save to local storage, API, etc.
    console.log('Result submitted:', resultData);
    // You can add logic here to update the exercise progress
  };

  const handleLogResultClose = () => {
    setShowLogResult(false);
  };

  const getDifficultyStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <View
        key={i}
        style={[
          styles.difficultyDot,
          { backgroundColor: i < exercise.difficulty ? '#F59E0B' : '#E5E7EB' }
        ]}
      />
    ));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.levelText}>{exercise.level}</Text>
          <Text style={styles.titleText}>{exercise.code} {exercise.title}</Text>
        </View>
        <View style={styles.difficultyContainer}>
          {getDifficultyStars()}
        </View>
      </View>
    </View>
  );

  const renderGoalCard = () => (
    <View style={styles.goalCard}>
      <View style={styles.goalContent}>
        <ModernIcon name="target" size={20} color="#2563EB" style={styles.goalIcon} />
        <View style={styles.goalTextContainer}>
          <Text style={styles.goalTitle}>Goal</Text>
          <Text style={styles.goalDescription}>{exercise.goal}</Text>
        </View>
      </View>
    </View>
  );

  const renderVideoSection = () => (
    <View style={styles.videoSection}>
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <ModernIcon 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.videoInfo}>
        <View style={styles.videoDetails}>
          <ModernIcon name="time" size={16} color="#6B7280" />
          <Text style={styles.videoDetailText}>{exercise.estimatedTime}</Text>
        </View>
        <Text style={styles.equipmentText}>Equipment: {exercise.equipment.join(", ")}</Text>
      </View>
    </View>
  );

  const renderInstructions = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Instructions</Text>
      
      <View style={styles.instructionSection}>
        <Text style={styles.instructionSectionTitle}>Setup:</Text>
        <Text style={styles.instructionItem}>- Stand at the baseline</Text>
        <Text style={styles.instructionItem}>- Partner feeds balls from the NVZ</Text>
        <Text style={styles.instructionItem}>- Focus on soft touch and arc</Text>
      </View>

      <View style={styles.instructionSection}>
        <Text style={styles.instructionSectionTitle}>Execution:</Text>
        <Text style={styles.instructionItem}>1. Take a comfortable ready position</Text>
        <Text style={styles.instructionItem}>2. Use a pendulum swing motion</Text>
        <Text style={styles.instructionItem}>3. Aim for the NVZ with proper arc</Text>
        <Text style={styles.instructionItem}>4. Reset after each attempt</Text>
      </View>

      <View style={styles.instructionSection}>
        <Text style={styles.instructionSectionTitle}>Success Criteria:</Text>
        <Text style={styles.instructionItem}>Land 6 out of 10 drops in the NVZ to pass this drill.</Text>
      </View>
    </View>
  );

  const renderTips = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pro Tips</Text>
      <View style={styles.tipsContainer}>
        {exercise.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPreviousAttempts = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Previous Attempts</Text>
      {exercise.previousAttempts.length > 0 ? (
        <View style={styles.attemptsContainer}>
          {exercise.previousAttempts.map((attempt, index) => (
            <View key={index} style={styles.attemptItem}>
              <Text style={styles.attemptDate}>{attempt.date}</Text>
              <View style={styles.attemptResult}>
                <Text style={styles.attemptScore}>{attempt.result}</Text>
                <ModernIcon 
                  name={attempt.passed ? "checkmark" : "close"} 
                  size={16} 
                  color={attempt.passed ? "#10B981" : "#EF4444"} 
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noAttemptsText}>No previous attempts</Text>
      )}
    </View>
  );

  const renderFixedLogButton = () => (
    <View style={[styles.fixedButtonContainer, { paddingBottom: insets.bottom || 16 }]}>
      <TouchableOpacity
        style={styles.logButton}
        onPress={() => setShowLogResult(true)}
      >
        <ModernIcon name="clipboard" size={20} color="white" />
        <Text style={styles.logButtonText}>Log your result</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {renderHeader()}
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderGoalCard()}
          {renderVideoSection()}
          {renderInstructions()}
          {renderTips()}
          {renderPreviousAttempts()}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      {renderFixedLogButton()}
      <LogResultComponent
        exercise={exercise}
        visible={showLogResult}
        onResultSubmitted={handleResultSubmitted}
        onClose={handleLogResultClose}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  safeArea: {
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -4, // Align with iOS guidelines
  },
  headerText: {
    flex: 1,
  },
  levelText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  goalCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  videoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  videoContainer: {
    aspectRatio: 16/9,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 16,
  },
  videoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  equipmentText: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionSection: {
    marginBottom: 16,
  },
  instructionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  attemptsContainer: {
    gap: 8,
  },
  attemptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  attemptDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  attemptResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attemptScore: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  noAttemptsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  fixedButtonContainer: {
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
    shadowRadius: 4,
    elevation: 8,
  },
  logButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 120, // Extra space for fixed button
  },
});

export default ExerciseDetailScreen;
