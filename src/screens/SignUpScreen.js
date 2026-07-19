import React, { useState, useRef } from 'react';
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
import { useUser } from '../context/UserContext';
import { isExistingUserSignUpError } from '../lib/supabase';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

const DUPLICATE_EMAIL_MESSAGE = 'This email is already registered. Please sign in.';

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

export default function SignUpScreen({ onSignUp, navigation, onSignIn, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const ot = useOnboardingTheme(ONBOARDING_STEPS.SIGNUP);
  const { signUp } = useAuth();
  const { user, getOnboardingData } = useUser();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  React.useEffect(() => {
    const prefilledName =
      route?.params?.previousData?.prefilledName ||
      route?.params?.previousData?.name ||
      route?.params?.prefilledName ||
      user?.name;
    if (prefilledName && prefilledName !== 'Alex Johnson') {
      setName(prefilledName);
    }
  }, [route?.params, user?.name]);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: ot.surface,
      borderColor: ot.borderColor,
      color: ot.textPrimary,
      fontFamily: ot.t.fontBody,
    },
  ];

  const validateForm = () => {
    let valid = true;
    if (!name.trim()) { setNameError('Please enter your name'); valid = false; } else setNameError('');
    if (!email.trim()) { setEmailError('Please enter your email'); valid = false; }
    else if (!email.includes('@') || !email.includes('.')) { setEmailError('Please enter a valid email address'); valid = false; }
    else setEmailError('');
    if (!password) { setPasswordError('Please enter a password'); valid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); valid = false; }
    else setPasswordError('');
    return valid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const isCoachMode = route?.params?.mode === 'coach';
      const onboardingData = isCoachMode
        // Coach path: only persist role + sportId; skip player-specific data
        ? { role: 'coach', sport_id: user?.sportId }
        : getOnboardingData();
      const userData = { name: name.trim(), ...onboardingData };
      const { data, error } = await signUp(email, password, userData);
      if (error) {
        setIsLoading(false);
        setEmailError(isExistingUserSignUpError(error) ? DUPLICATE_EMAIL_MESSAGE : error.message || 'Sign up failed.');
        return;
      }
      if (data?.user && data?.session) {
        setIsLoading(false);
        if (onSignUp) onSignUp({ email, password, name });
      } else if (data?.user && !data?.session) {
        setIsLoading(false);
        setEmailError('Check your email to confirm your account, then sign in.');
      } else {
        setIsLoading(false);
        setEmailError('Sign up failed. Please try again.');
      }
    } catch (error) {
      setIsLoading(false);
      setEmailError(isExistingUserSignUpError(error) ? DUPLICATE_EMAIL_MESSAGE : 'An unexpected error occurred.');
    }
  };

  const handleBack = () => {
    if (isLoading) return;
    if (navigation?.goBack) navigation.goBack();
  };

  const pwStrength = getPasswordStrength(password);
  const isFormValid = name.trim() && email.trim() && password;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <OnboardingShell
        step={ONBOARDING_STEPS.SIGNUP}
        title="Create Account"
        subtitle="Join AcademyPro and start your training journey"
        onBack={handleBack}
        scrollable
        contentStyle={styles.content}
      >
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>Name</Text>
            <TextInput
              style={[...inputStyle, nameError && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor={ot.textMuted}
              value={name}
              onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>Email</Text>
            <TextInput
              ref={emailRef}
              style={[...inputStyle, emailError && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor={ot.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>Password</Text>
            <View style={[styles.passwordWrap, { backgroundColor: ot.surface, borderColor: passwordError ? '#EF4444' : ot.borderColor }]}>
              <TextInput
                ref={passwordRef}
                style={[styles.passwordInput, { color: ot.textPrimary, fontFamily: ot.t.fontBody }]}
                placeholder="Create a password"
                placeholderTextColor={ot.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={ot.textMuted} />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: pwStrength >= i ? STRENGTH_COLORS[pwStrength] : ot.progressTrack }]} />
                  ))}
                </View>
                {pwStrength > 0 && (
                  <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwStrength] }]}>{STRENGTH_LABELS[pwStrength]}</Text>
                )}
              </View>
            )}
            {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
          </View>

          <TouchableOpacity
            style={[
              styles.submit,
              { backgroundColor: ot.accent, shadowColor: ot.accent },
              (!isFormValid || isLoading) && styles.submitDisabled,
            ]}
            onPress={handleSignUp}
            disabled={!isFormValid || isLoading}
          >
            <Text style={[styles.submitText, { color: ot.primaryButtonTextColor, fontFamily: ot.t.fontBodyBold }]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: ot.textSecondary, fontFamily: ot.t.fontBody }]}>Already have an account? </Text>
          <TouchableOpacity onPress={onSignIn}>
            <Text style={[styles.footerLink, { color: ot.accent, fontFamily: ot.t.fontBodyBold }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  form: { gap: 18, marginBottom: 20 },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' },
  input: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1.5,
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
  },
  passwordInput: { flex: 1, paddingVertical: 15, fontSize: 16 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600' },
  submit: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  submitDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  submitText: { fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15, fontWeight: '700' },
});
