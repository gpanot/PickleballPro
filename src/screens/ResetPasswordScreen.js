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
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';
import { hapticSuccess, hapticError } from '../lib/haptics';

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#10B981'];

export default function ResetPasswordScreen({ navigation, onAuthenticate }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updatePassword } = useAuth();
  const ot = useOnboardingTheme();

  const strength = getPasswordStrength(password);

  const validate = () => {
    let valid = true;
    if (!password) {
      setPasswordError('Please enter a new password');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }
    if (!confirm) {
      setConfirmError('Please confirm your password');
      valid = false;
    } else if (confirm !== password) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }
    return valid;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setGeneralError('');
    setIsLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        hapticError();
        setGeneralError(error.message || 'Failed to update password. Please try again.');
        return;
      }
      hapticSuccess();
      // Navigate back to Sign In — auth state already has a valid session,
      // but password recovery session is single-use so we sign the user to Main
      // via onAuthenticate if available.
      if (onAuthenticate) {
        onAuthenticate();
      } else if (navigation?.navigate) {
        navigation.navigate('Auth');
      }
    } catch (err) {
      hapticError();
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingShell
        title="Set New Password"
        subtitle="Choose a strong password for your account."
        showProgress={false}
        contentStyle={styles.content}
      >
        {!!generalError && (
          <View style={[styles.errorBox, { backgroundColor: ot.isDark ? '#450A0A' : '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.inputLabel, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
            New Password
          </Text>
          <View style={[
            styles.passwordWrapper,
            { backgroundColor: ot.surface, borderColor: passwordError ? '#EF4444' : ot.borderColor },
          ]}>
            <TextInput
              style={[styles.passwordInput, { color: ot.textPrimary }]}
              placeholder="Enter new password"
              placeholderTextColor={ot.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={ot.textMuted} />
            </TouchableOpacity>
          </View>
          {!!password && (
            <View style={styles.strengthRow}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    { backgroundColor: strength >= i ? STRENGTH_COLORS[strength] : (ot.isDark ? '#333' : '#E5E7EB') },
                  ]}
                />
              ))}
              <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
                {STRENGTH_LABELS[strength]}
              </Text>
            </View>
          )}
          {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
            Confirm Password
          </Text>
          <View style={[
            styles.passwordWrapper,
            { backgroundColor: ot.surface, borderColor: confirmError ? '#EF4444' : ot.borderColor },
          ]}>
            <TextInput
              style={[styles.passwordInput, { color: ot.textPrimary }]}
              placeholder="Confirm new password"
              placeholderTextColor={ot.textMuted}
              value={confirm}
              onChangeText={(t) => { setConfirm(t); if (confirmError) setConfirmError(''); }}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleReset}
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color={ot.textMuted} />
            </TouchableOpacity>
          </View>
          {!!confirmError && <Text style={styles.fieldError}>{confirmError}</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: ot.accent, shadowColor: ot.accent },
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleReset}
          disabled={isLoading}
        >
          <Text style={[styles.submitButtonText, { color: ot.primaryButtonTextColor, fontFamily: ot.t.fontBodyBold }]}>
            {isLoading ? 'Saving…' : 'Update Password'}
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
    gap: 18,
  },
  field: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 2,
  },
  submitButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
  },
});
