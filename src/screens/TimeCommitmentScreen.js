import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, TrendingUp, Zap } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import skillsData from '../data/Commun_skills_tags.json';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import OnboardingOptionCard from '../components/onboarding/OnboardingOptionCard';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

const TIME_OPTIONS = [
  { id: 'low', title: '1–2 hours per week', description: 'Perfect for busy schedules', Icon: Clock, hours: '1-2h' },
  { id: 'medium', title: '3–4 hours per week', description: 'Steady improvement pace', Icon: TrendingUp, hours: '3-4h' },
  { id: 'high', title: '5+ hours per week', description: 'Accelerated training mode', Icon: Zap, hours: '5+h' },
];

function getAllSkillIds() {
  const allSkills = [];
  Object.values(skillsData.skillCategories).forEach((category) => {
    allSkills.push(...category.skills.map((skill) => skill.id));
  });
  return allSkills;
}

export default function TimeCommitmentScreen({ navigation, onComplete }) {
  const [selectedTime, setSelectedTime] = useState(null);
  const { updateOnboardingData } = useUser();
  const ot = useOnboardingTheme(ONBOARDING_STEPS.TIME);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const handleTimeSelect = async (timeId) => {
    setSelectedTime(timeId);
    const allSkillIds = getAllSkillIds();
    await updateOnboardingData({ timeCommitment: timeId, focus_areas: allSkillIds });
    onComplete({ time_commitment: timeId });
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.TIME}
      title="How often can you train?"
      subtitle="We'll create a plan that fits your schedule"
      onBack={handleBack}
      contentStyle={styles.content}
    >
      <View style={styles.list}>
        {TIME_OPTIONS.map((option) => {
          const isSelected = selectedTime === option.id;
          return (
            <OnboardingOptionCard
              step={ONBOARDING_STEPS.TIME}
              key={option.id}
              title={option.title}
              description={option.description}
              Icon={option.Icon}
              selected={isSelected}
              onPress={() => handleTimeSelect(option.id)}
              trailing={
                <View style={[styles.hoursBadge, { backgroundColor: isSelected ? ot.accentMuted : ot.isDark ? ot.t.surfaceRaised : '#F3F4F6' }]}>
                  <Text style={[styles.hoursText, { color: isSelected ? ot.accent : ot.textMuted, fontFamily: ot.t.fontBodySemibold }]}>
                    {option.hours}
                  </Text>
                </View>
              }
            />
          );
        })}
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
  hoursBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 4,
  },
  hoursText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
