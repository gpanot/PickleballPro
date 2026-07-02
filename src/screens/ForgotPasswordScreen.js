import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAuthRedirectUri } from '../lib/authRedirect';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

export default function ForgotPasswordScreen({ navigation, route }) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const ot = useOnboardingTheme();

  const validate = () => {
    if (!email.trim()) {
      setEmailError('Please enter your email');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const redirectTo = getAuthRedirectUri();
      await resetPassword(email.trim().toLowerCase(), redirectTo);
      // Always show the success state — never reveal whether the account exists
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('Auth');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingShell
        title="Reset Password"
        subtitle={
          sent
            ? "If an account exists for that email, you\u2019ll receive a reset link shortly."
            : "Enter your email address and we\u2019ll send you a link to reset your password."
        }
        onBack={handleBack}
        showProgress={false}
        contentStyle={styles.content}
      >
        {sent ? (
          <View style={styles.successBox}>
            <View style={[styles.successIcon, { backgroundColor: ot.accentMuted }]}>
              <Ionicons name="mail-outline" size={32} color={ot.accent} />
            </View>
            <Text style={[styles.successTitle, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
              Check your inbox
            </Text>
            <Text style={[styles.successBody, { color: ot.textSecondary, fontFamily: ot.t.fontBody }]}>
              We've sent a password reset link to{' '}
              <Text style={{ color: ot.accent }}>{email}</Text>. Open the
              link from your email app — it will bring you back here.
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { borderColor: ot.borderColor }]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={[styles.inputLabel, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: ot.surface,
                    borderColor: emailError ? '#EF4444' : ot.borderColor,
                    color: ot.textPrimary,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={ot.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              {!!emailError && (
                <Text style={styles.fieldError}>{emailError}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: ot.accent, shadowColor: ot.accent },
                isLoading && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={isLoading}
            >
              <Text style={[styles.sendButtonText, { color: ot.primaryButtonTextColor, fontFamily: ot.t.fontBodyBold }]}>
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
  },
  field: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1.5,
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 2,
  },
  sendButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  successBox: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 15,
  },
});
