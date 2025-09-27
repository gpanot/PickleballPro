import React, { useState } from 'react';
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
import { useUser } from '../context/UserContext';

export default function SignUpScreen({ onSignUp, navigation, onGoBack, onSignIn, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { user, getOnboardingData } = useUser();

  // Pre-populate name from onboarding flow or user context
  React.useEffect(() => {
    const prefilledName = route?.params?.previousData?.prefilledName || 
                         route?.params?.previousData?.name ||
                         route?.params?.prefilledName ||
                         user?.name;
    if (prefilledName && prefilledName !== 'Alex Johnson') { // Don't use default name
      setName(prefilledName);
    }
  }, [route?.params, user?.name]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    console.log('Sign up button clicked!');
    setIsLoading(true);
    
    try {
      // Get all onboarding data collected during the flow
      const onboardingData = getOnboardingData();
      console.log('SignUp: Including onboarding data:', onboardingData);
      
      // Include both account data and onboarding data
      const userData = {
        name: name.trim(),
        ...onboardingData // Include gender, rating, tier, goals, etc.
      };
      
      console.log('SignUp: Complete user data being saved:', userData);
      
      const { data, error } = await signUp(email, password, userData);
      
      if (error) {
        // Check for specific error types
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already registered') ||
            error.message?.includes('already exists')) {
          Alert.alert('Email Already Exists', 'A user with this email already exists. Please try signing in instead or use a different email address.');
        } else {
          Alert.alert('Sign Up Failed', error.message || 'Please try again.');
        }
        return;
      }

      if (data?.user) {
        console.log('Sign up successful with complete onboarding data!');
        // Directly call onSignUp without showing popup
        if (onSignUp) {
          onSignUp({ email, password, name });
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Check for specific error types in catch block as well
      if (error.message?.includes('User already registered') || 
          error.message?.includes('already registered') ||
          error.message?.includes('already exists')) {
        Alert.alert('Email Already Exists', 'A user with this email already exists. Please try signing in instead or use a different email address.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    }
  };

  const isFormValid = name.trim() && email.trim() && password;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
                size={24} 
                color="#007AFF" 
              />
            </TouchableOpacity>
            
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join PicklePro and start your training journey</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.signUpButton,
                  (!isFormValid || isLoading) && styles.signUpButtonDisabled
                ]}
                onPress={handleSignUp}
                disabled={!isFormValid || isLoading}
              >
                <Text style={[
                  styles.signUpButtonText,
                  (!isFormValid || isLoading) && styles.signUpButtonTextDisabled
                ]}>
                  {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={styles.footerLink}>Sign In</Text>
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
    padding: 8,
    marginLeft: -4, // Align with iOS guidelines
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1,
    marginBottom: 16,
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
  signUpButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 8,
  },
  signUpButtonDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  signUpButtonTextDisabled: {
    color: '#666666',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
