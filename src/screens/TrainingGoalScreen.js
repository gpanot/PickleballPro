import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';

export default function TrainingGoalScreen({ onComplete }) {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const insets = useSafeAreaInsets();
  const { updateOnboardingData } = useUser();

  const goals = [
    {
      id: 'dupr',
      title: 'Improve my DUPR rating',
      description: 'Level up and climb the rankings',
      icon: 'trophy',
      emoji: '🏆'
    },
    {
      id: 'basics',
      title: 'Learn the basics',
      description: 'Master fundamentals from zero to 3.0',
      icon: 'target',
      emoji: '🎯'
    },
    {
      id: 'consistency',
      title: 'Get more consistent in matches',
      description: 'Reduce errors and play smarter',
      icon: 'trending-up',
      emoji: '⚡'
    },
    {
      id: 'tournament',
      title: 'Compete in tournaments',
      description: 'Prepare for competitive play',
      icon: 'medal',
      emoji: '💪'
    }
  ];

  const handleGoalSelect = async (goalId) => {
    setSelectedGoal(goalId);
    
    // Save goal data to UserContext
    console.log('TrainingGoalScreen: Saving goal to UserContext:', goalId);
    await updateOnboardingData({ goal: goalId });
    
    // Immediately proceed to next screen
    onComplete({ goal: goalId });
  };

  const renderGoalOption = (goal) => (
    <TouchableOpacity
      key={goal.id}
      style={[
        styles.goalCard,
        selectedGoal === goal.id && styles.goalCardSelected
      ]}
      onPress={() => handleGoalSelect(goal.id)}
    >
      <View style={styles.goalHeader}>
        <View style={[
          styles.goalIcon,
          selectedGoal === goal.id && styles.goalIconSelected
        ]}>
          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
        </View>
        {selectedGoal === goal.id && (
          <View style={styles.selectedIndicator}>
            <ModernIcon name="checkmark" size={16} color="white" />
          </View>
        )}
      </View>
      <View style={styles.goalContent}>
        <Text style={[
          styles.goalTitle,
          selectedGoal === goal.id && styles.goalTitleSelected
        ]}>
          {goal.title}
        </Text>
        <Text style={[
          styles.goalDescription,
          selectedGoal === goal.id && styles.goalDescriptionSelected
        ]}>
          {goal.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>          
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What's your pickleball goal?</Text>
        <Text style={styles.subtitle}>
          Let's personalize your training experience
        </Text>
      </View>

      {/* Goals Grid */}
      <View style={styles.goalsContainer}>
        {goals.map(goal => renderGoalOption(goal))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  goalsContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 16,
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalCardSelected: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconSelected: {
    backgroundColor: '#E8F5FF',
  },
  goalEmoji: {
    fontSize: 20,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalContent: {
    marginTop: 2,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  goalTitleSelected: {
    color: '#007AFF',
  },
  goalDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  goalDescriptionSelected: {
    color: '#007AFF',
  },
  statusBar: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
