import React, { useState, useRef } from 'react';
import { hapticSuccess, hapticError } from '../lib/haptics';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';

export default function AuthScreen({ onAuthenticate, navigation, onGoBack, onSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const { signIn } = useAuth();
  const ot = useOnboardingTheme();
  const passwordRef = useRef(null);

  const validateForm = () => {
    let valid = true;
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
      setPasswordError('Please enter your password');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    console.log('Sign in button clicked!');
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        hapticError();
        setAuthError(error.message || 'Please check your credentials and try again.');
        setIsLoading(false);
        return;
      }
      setAuthError('');

      if (data?.user) {
        hapticSuccess();
        console.log('Sign in successful! Waiting for auth state to update...');
        
        // Call onAuthenticate to trigger app state updates (complete onboarding)
        if (onAuthenticate) {
          console.log('Calling onAuthenticate to complete onboarding...');
          onAuthenticate();
          console.log('onAuthenticate callback completed');
        } else {
          console.log('❌ No onAuthenticate callback provided!');
        }
        
        // Keep loading state active - the auth state change will trigger navigation
        // Don't set isLoading to false here - let the component unmount naturally
        // when the app navigates to the Main screen
        console.log('✅ Sign in complete - auth state will trigger navigation');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (navigation?.navigate) {
      navigation.navigate('ForgotPassword', { email });
    }
  };

  const handleBack = () => {
    console.log('Back button pressed!');
    
    // Use React Navigation to go back directly
    if (navigation?.goBack && navigation?.canGoBack?.()) {
      console.log('Using navigation.goBack...');
      navigation.goBack();
    } else if (navigation?.navigate) {
      console.log('Navigating directly to Intro screen...');
      navigation.navigate('Intro');
    } else {
      console.log('No navigation available, trying onGoBack prop...');
      if (onGoBack) {
        onGoBack();
      }
    }
  };

  const handleSignUp = () => {
    console.log('Sign Up button pressed!');
    if (onSignUp) {
      console.log('Calling onSignUp prop...');
      onSignUp();
    } else if (navigation?.navigate) {
      console.log('Using navigation to go to SignUp...');
      navigation.navigate('SignUp');
    } else {
      console.log('No navigation available, showing alert...');
      Alert.alert('Sign Up', 'Sign up functionality will be available soon!');
    }
  };

  const handleSocialSuccess = () => {
    // onAuthenticate marks all onboarding flags complete for returning users
    if (onAuthenticate) {
      onAuthenticate();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingShell
        title="Welcome Back"
        subtitle="Sign in to continue your training"
        onBack={handleBack}
        showProgress={false}
        contentStyle={styles.content}
      >
        {!!authError && (
          <View style={[styles.authErrorBox, { backgroundColor: ot.isDark ? '#450A0A' : '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
            <Text style={styles.authErrorText}>{authError}</Text>
          </View>
        )}

        {/* Social sign-in */}
        <SocialAuthButtons onSuccess={handleSocialSuccess} />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: ot.borderColor }]} />
          <Text style={[styles.dividerText, { color: ot.textMuted, fontFamily: ot.t.fontBody }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: ot.borderColor }]} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: ot.surface, borderColor: emailError ? '#EF4444' : ot.borderColor, color: ot.textPrimary },
              emailError && styles.inputError,
            ]}
            placeholder="Enter your email"
            placeholderTextColor={ot.textMuted}
            value={email}
            onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(''); if (authError) setAuthError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>Password</Text>
          <View style={[styles.passwordWrapper, { backgroundColor: ot.surface, borderColor: passwordError ? '#EF4444' : ot.borderColor }]}>
            <TextInput
              ref={passwordRef}
              style={[styles.passwordInput, { color: ot.textPrimary }]}
              placeholder="Enter your password"
              placeholderTextColor={ot.textMuted}
              value={password}
              onChangeText={(text) => { setPassword(text); if (passwordError) setPasswordError(''); if (authError) setAuthError(''); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={ot.textMuted} />
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: ot.accent, shadowColor: ot.accent }, isLoading && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text style={[styles.signInButtonText, { color: ot.primaryButtonTextColor, fontFamily: ot.t.fontBodyBold }]}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: ot.accent }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={[styles.signUpPrompt, { color: ot.textSecondary, fontFamily: ot.t.fontBody }]}>New here? </Text>
          <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
            <Text style={[styles.signUpLink, { color: ot.accent, fontFamily: ot.t.fontBodyBold }]}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
  },
  field: {
    gap: 8,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginLeft: -4, // Align with iOS guidelines
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  formContainer: {
    gap: 24,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1.5,
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
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  signInButtonDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signUpPrompt: {
    fontSize: 15,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '700',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 2,
  },
  authErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  authErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
  },
});
