import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useUser } from '../context/UserContext';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import { getSport } from '../lib/sportConfig';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import OnboardingOptionCard from '../components/onboarding/OnboardingOptionCard';

export default function TrainingGoalScreen({ navigation, onComplete, onGoBack }) {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const { updateOnboardingData, user } = useUser();
  const sport = getSport(user?.sportId);
  const goals = sport.onboardingGoals;

  const handleBack = () => {
    if (onGoBack) onGoBack();
    else if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const handleGoalSelect = async (goalId) => {
    setSelectedGoal(goalId);
    await updateOnboardingData({ goal: goalId });
    onComplete({ goal: goalId });
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.GOAL}
      title={sport.onboardingTitle}
      subtitle="Let's personalize your training experience"
      onBack={handleBack}
      contentStyle={styles.content}
    >
      <View style={styles.list}>
        {goals.map((goal) => (
          <OnboardingOptionCard
            step={ONBOARDING_STEPS.GOAL}
            key={goal.id}
            title={goal.title}
            description={goal.description}
            iconName={goal.icon}
            selected={selectedGoal === goal.id}
            onPress={() => handleGoalSelect(goal.id)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    gap: 0,
  },
});
