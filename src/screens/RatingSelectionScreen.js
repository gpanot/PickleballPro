import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import OnboardingOptionCard from '../components/onboarding/OnboardingOptionCard';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

export default function RatingSelectionScreen({ navigation, onComplete, onGoBack }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [ratingInput, setRatingInput] = useState('');
  const { updateUserRating } = useUser();
  const ot = useOnboardingTheme(ONBOARDING_STEPS.RATING);

  const handleBack = () => {
    if (onGoBack) onGoBack();
    else if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === 'none') {
      updateUserRating(2.0, 'none');
      onComplete();
    } else if (option === 'dupr') {
      // DUPR input section appears below — user scrolls naturally
    }
  };

  const handleRatingSubmit = () => {
    if (!ratingInput.trim()) {
      Alert.alert('Invalid Rating', 'Please enter a valid rating.');
      return;
    }
    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 2.0 || rating > 8.0) {
      Alert.alert('Invalid Rating', 'Please enter a rating between 2.0 and 8.0');
      return;
    }
    updateUserRating(rating, 'dupr');
    onComplete();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingShell
        step={ONBOARDING_STEPS.RATING}
        title="What's your rating?"
        subtitle="Help us personalize your training experience"
        onBack={handleBack}
        scrollable
        contentStyle={styles.content}
      >
        <View style={styles.options}>
          <OnboardingOptionCard
            step={ONBOARDING_STEPS.RATING}
            title="Enter your official DUPR rating"
            description="I have an official DUPR account"
            iconName="star"
            selected={selectedOption === 'dupr'}
            onPress={() => handleOptionSelect('dupr')}
          />
          <OnboardingOptionCard
            step={ONBOARDING_STEPS.RATING}
            title="I don't have a rating"
            description="I'm new to pickleball"
            iconName="help"
            selected={selectedOption === 'none'}
            onPress={() => handleOptionSelect('none')}
          />
        </View>

        {selectedOption === 'dupr' && (
          <View style={[styles.inputSection, { backgroundColor: ot.surface, borderColor: ot.borderColor }]}>
            <Text style={[styles.inputLabel, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
              Enter your DUPR rating
            </Text>
            <TextInput
              style={[styles.ratingInput, { color: ot.textPrimary, borderColor: ot.borderColor, backgroundColor: ot.isDark ? ot.t.surfaceRaised : ot.bg }]}
              placeholder="e.g., 3.500"
              placeholderTextColor={ot.textMuted}
              value={ratingInput}
              onChangeText={setRatingInput}
              keyboardType="decimal-pad"
              maxLength={5}
              autoFocus
            />
            <Text style={[styles.inputHint, { color: ot.textMuted, fontFamily: ot.t.fontBody }]}>
              Rating should be between 2.0 and 8.0
            </Text>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: ot.accent, shadowColor: ot.accent }]}
              onPress={handleRatingSubmit}
            >
              <Text style={[styles.submitButtonText, { color: ot.primaryButtonTextColor }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedOption === 'none' && (
          <View style={[styles.infoBox, { backgroundColor: ot.accentMuted, borderColor: ot.borderColor }]}>
            <ModernIcon name="help" size={20} color={ot.accent} />
            <Text style={[styles.infoText, { color: ot.textSecondary, fontFamily: ot.t.fontBody }]}>
              We'll start you at rating 2.0. You can update this anytime in your profile.
            </Text>
          </View>
        )}
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  options: {
    marginBottom: 8,
  },
  inputSection: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'center',
  },
  ratingInput: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    marginBottom: 8,
    borderWidth: 2,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
