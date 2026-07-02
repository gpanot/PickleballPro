import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

export default function PersonalProgramScreen({ onComplete, onGoBack }) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserName, updateOnboardingData } = useUser();
  const ot = useOnboardingTheme(ONBOARDING_STEPS.NAME);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }
    setIsLoading(true);
    try {
      updateUserName(name.trim());
      await updateOnboardingData({ name: name.trim() });
      setTimeout(() => {
        setIsLoading(false);
        onComplete({ name: name.trim() });
      }, 300);
    } catch (error) {
      console.error('Error saving name:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingShell
        step={ONBOARDING_STEPS.NAME}
        title="What's your name?"
        subtitle="Tell us a bit about yourself so we can design training that fits your goals."
        onBack={onGoBack}
        contentStyle={styles.content}
      >
        <TextInput
          style={[
            styles.nameInput,
            {
              backgroundColor: ot.surface,
              borderColor: ot.borderColor,
              color: ot.textPrimary,
              fontFamily: ot.t.fontBody,
            },
          ]}
          placeholder="Enter your first name"
          placeholderTextColor={ot.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: ot.accent, shadowColor: ot.accent },
            (!name.trim() || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!name.trim() || isLoading}
        >
          <Text
            style={[
              styles.continueButtonText,
              { color: ot.primaryButtonTextColor, fontFamily: ot.t.fontBodyBold },
              !name.trim() && { color: ot.textMuted },
            ]}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  nameInput: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    borderWidth: 2,
  },
  continueButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
