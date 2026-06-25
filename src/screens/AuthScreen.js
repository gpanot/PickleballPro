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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen({ onAuthenticate, navigation, onGoBack, onSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
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
    Alert.alert('Forgot Password', 'Password reset link would be sent to your email');
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

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom 
      }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
                size={24} 
                color="#6366F1" 
              />
            </TouchableOpacity>
            
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your training</Text>
            </View>


            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* General auth error */}
              {!!authError && (
                <View style={styles.authErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                  <Text style={styles.authErrorText}>{authError}</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); if (authError) setAuthError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.passwordWrapper, passwordError ? styles.inputError : null]}>
                  <TextInput
                    ref={passwordRef}
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); if (authError) setAuthError(''); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleSignIn}
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
              </View>

              {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}

              <TouchableOpacity 
                style={[
                  styles.signInButton,
                  isLoading && styles.signInButtonDisabled
                ]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.signInButtonText}>
                  {isLoading ? 'Signing In...' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up CTA */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpPrompt}>New here? </Text>
              <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                <Text style={styles.signUpLink}>Create an account</Text>
              </TouchableOpacity>
            </View>

          </View>
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 18,
    color: '#000000',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 20,
    fontSize: 18,
    color: '#000000',
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButton: {
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
