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

export default function AuthScreen({ onAuthenticate, navigation, onGoBack, onSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    console.log('Sign in button clicked!');
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        Alert.alert('Sign In Failed', error.message || 'Please check your credentials and try again.');
        setIsLoading(false);
        return;
      }

      if (data?.user) {
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
                color="#007AFF" 
              />
            </TouchableOpacity>
            
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your training</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
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
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

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
  signInButton: {
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
    color: '#007AFF',
    fontWeight: '600',
  },
});
