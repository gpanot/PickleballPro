import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Zap, Scale, Flame } from 'lucide-react-native';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

const INTENSITY_OPTIONS = [
  { id: 'short', title: 'Light & simple', duration: '~20 min', description: '2 drills/session', Icon: Zap, badge: 'QUICK' },
  { id: 'balanced', title: 'Balanced', duration: '~30–40 min', description: '3 drills/session', Icon: Scale, badge: 'RECOMMENDED' },
  { id: 'full', title: 'Challenging', duration: '~45–60 min', description: '4+ drills/session', Icon: Flame, badge: null },
];

const BENEFITS = {
  short: ['Perfect for busy schedules', 'Easy to stay consistent'],
  balanced: ['Good variety & progress', 'Manageable time commitment'],
  full: ['Maximum skill development', 'Comprehensive training'],
};

export default function IntensitySelectionScreen({ navigation, onComplete }) {
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const { updateOnboardingData } = useUser();
  const ot = useOnboardingTheme(ONBOARDING_STEPS.INTENSITY);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const handleIntensitySelect = async (intensityId) => {
    setSelectedIntensity(intensityId);
    await updateOnboardingData({ intensity: intensityId });
    onComplete({ intensity: intensityId });
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.INTENSITY}
      title="How intense should your sessions be?"
      subtitle="Choose the training intensity that fits your lifestyle"
      onBack={handleBack}
      scrollable
      contentStyle={styles.content}
    >
      {INTENSITY_OPTIONS.map((option) => {
        const isSelected = selectedIntensity === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.card,
              {
                backgroundColor: ot.surface,
                borderColor: isSelected ? ot.accent : ot.borderColor,
                shadowColor: isSelected ? ot.accent : '#000',
              },
              isSelected && styles.cardSelected,
            ]}
            onPress={() => handleIntensitySelect(option.id)}
            activeOpacity={0.85}
          >
            {option.badge && (
              <View style={[styles.badge, { backgroundColor: option.badge === 'RECOMMENDED' ? ot.accent : '#F59E0B' }]}>
                <Text style={[styles.badgeText, { color: option.badge === 'RECOMMENDED' ? ot.primaryButtonTextColor : '#fff' }]}>
                  {option.badge}
                </Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? ot.accentMuted : ot.isDark ? ot.t.surfaceRaised : '#F8F9FA' }]}>
                <option.Icon size={20} color={isSelected ? ot.accent : ot.iconMuted} strokeWidth={2} />
              </View>
              <Text style={[styles.duration, { color: isSelected ? ot.accent : ot.textMuted, fontFamily: ot.t.fontBodySemibold }]}>
                {option.duration}
              </Text>
              {isSelected && (
                <View style={[styles.check, { backgroundColor: ot.accent }]}>
                  <ModernIcon name="checkmark" size={14} color={ot.primaryButtonTextColor} />
                </View>
              )}
            </View>

            <Text style={[styles.cardTitle, { color: isSelected ? ot.accent : ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
              {option.title}
            </Text>
            <Text style={[styles.cardDesc, { color: isSelected ? ot.accent : ot.textSecondary, fontFamily: ot.t.fontBody }]}>
              {option.description}
            </Text>

            <View style={styles.benefits}>
              {(BENEFITS[option.id] || []).map((line) => (
                <View key={line} style={styles.benefitRow}>
                  <ModernIcon name="checkmark-circle" size={14} color={ot.accent} />
                  <Text style={[styles.benefitText, { color: ot.textMuted, fontFamily: ot.t.fontBody }]}>{line}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  cardSelected: {
    shadowOpacity: 0.22,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    flex: 1,
    fontSize: 13,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    marginBottom: 8,
  },
  benefits: {
    gap: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 11,
  },
});
