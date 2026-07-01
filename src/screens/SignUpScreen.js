import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { isExistingUserSignUpError } from '../lib/supabase';

const DUPLICATE_EMAIL_MESSAGE = 'This email is already registered. Please sign in.';

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3); // 0 weak / 1 fair / 2 good / 3 strong
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#10B981'];

export default function SignUpScreen({ onSignUp, navigation, onGoBack, onSignIn, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Inline validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { user, getOnboardingData } = useUser();
  const scrollViewRef = useRef(null);
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

  const validateForm = () => {
    let valid = true;

    if (!name.trim()) {
      setNameError('Please enter your name');
      valid = false;
    } else {
      setNameError('');
    }

    if (!email.trim()) {
      setEmailError('Please enter your email');
      valid = false;
    } else if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Please enter a password');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const onboardingData = getOnboardingData();
      const userData = { name: name.trim(), ...onboardingData };
      const { data, error } = await signUp(email, password, userData);

      if (error) {
        setIsLoading(false);
        setHasError(true);
        if (isExistingUserSignUpError(error)) {
          setEmailError(DUPLICATE_EMAIL_MESSAGE);
        } else {
          setEmailError(error.message || 'Sign up failed. Please try again.');
        }
        return;
      }

      if (data?.user && data?.session) {
        setIsLoading(false);
        if (onSignUp) onSignUp({ email, password, name });
      } else if (data?.user && !data?.session) {
        // Email confirmation required — stay on screen with guidance
        setIsLoading(false);
        setEmailError('Check your email to confirm your account, then sign in.');
      } else {
        setIsLoading(false);
        setEmailError('Sign up failed. Please try again.');
      }
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
      setEmailError(
        isExistingUserSignUpError(error)
          ? DUPLICATE_EMAIL_MESSAGE
          : 'An unexpected error occurred.'
      );
    }
  };

  const handleBack = () => {
    if (hasError) return;
    if (onGoBack) onGoBack();
    else if (navigation?.goBack) navigation.goBack();
  };

  const handleEmailChange = (text) => {
    if (hasError) setHasError(false);
    if (emailError) setEmailError('');
    setEmail(text);
  };

  const pwStrength = getPasswordStrength(password);

  const isFormValid = name.trim() && email.trim() && password;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {!hasError && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
                  <Ionicons
                    name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                    size={24}
                    color="#6366F1"
                  />
                </TouchableOpacity>
              )}

              <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join PickleHero and start your training journey</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={[styles.input, nameError ? styles.inputError : null]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                  {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    ref={emailRef}
                    style={[styles.input, emailError ? styles.inputError : null]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                  {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.passwordWrapper, passwordError ? styles.inputError : null]}>
                    <TextInput
                      ref={passwordRef}
                      style={styles.passwordInput}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      textContentType="newPassword"
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(v => !v)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3].map(i => (
                          <View
                            key={i}
                            style={[
                              styles.strengthBar,
                              { backgroundColor: pwStrength >= i ? STRENGTH_COLORS[pwStrength] : '#E5E7EB' },
                            ]}
                          />
                        ))}
                      </View>
                      {pwStrength > 0 && (
                        <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwStrength] }]}>
                          {STRENGTH_LABELS[pwStrength]}
                        </Text>
                      )}
                    </View>
                  )}
                  {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.signUpButton, (!isFormValid || isLoading) && styles.signUpButtonDisabled]}
                  onPress={handleSignUp}
                  disabled={!isFormValid || isLoading}
                >
                  <Text style={[styles.signUpButtonText, (!isFormValid || isLoading) && styles.signUpButtonTextDisabled]}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={onSignIn}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
  },
  keyboardContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 20 },
  content: { flex: 1, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 0,
    padding: 8,
    marginLeft: -4,
    zIndex: 1,
  },
  header: { alignItems: 'center', marginBottom: 36 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  formContainer: { gap: 20, marginBottom: 28 },
  inputContainer: { gap: 6 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: '#000000' },
  input: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: { fontSize: 12, color: '#EF4444', fontWeight: '500', marginTop: 2 },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    paddingHorizontal: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600' },
  signUpButton: {
    backgroundColor: '#6366F1',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 8,
  },
  signUpButtonDisabled: { backgroundColor: '#E5E5E5', shadowOpacity: 0, elevation: 0 },
  signUpButtonText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.3 },
  signUpButtonTextDisabled: { color: '#666666' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 15, color: '#6B7280' },
  footerLink: { fontSize: 15, fontWeight: '700', color: '#6366F1' },
});
