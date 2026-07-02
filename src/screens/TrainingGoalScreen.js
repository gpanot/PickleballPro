import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Trophy, Target, TrendingUp, Dumbbell } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import OnboardingOptionCard from '../components/onboarding/OnboardingOptionCard';

const GOALS = [
  { id: 'dupr', title: 'Improve my DUPR rating', description: 'Level up and climb the rankings', Icon: Trophy },
  { id: 'basics', title: 'Learn the basics', description: 'Master fundamentals from zero to 3.0', Icon: Target },
  { id: 'consistency', title: 'Get more consistent in matches', description: 'Reduce errors and play smarter', Icon: TrendingUp },
  { id: 'tournament', title: 'Compete in tournaments', description: 'Prepare for competitive play', Icon: Dumbbell },
];

export default function TrainingGoalScreen({ navigation, onComplete, onGoBack }) {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const { updateOnboardingData } = useUser();

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
      title="What's your pickleball goal?"
      subtitle="Let's personalize your training experience"
      onBack={handleBack}
      contentStyle={styles.content}
    >
      <View style={styles.list}>
        {GOALS.map((goal) => (
          <OnboardingOptionCard
            step={ONBOARDING_STEPS.GOAL}
            key={goal.id}
            title={goal.title}
            description={goal.description}
            Icon={goal.Icon}
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
