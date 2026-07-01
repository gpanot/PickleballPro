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
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

export default function PersonalProgramScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUserName, updateOnboardingData } = useUser();
  const insets = useSafeAreaInsets();
  const { logbookTheme: t, isDark } = useTheme();

  // Keep name field empty for fresh user input
  // React.useEffect(() => {
  //   if (user?.name) {
  //     setName(user.name);
  //   }
  // }, [user]);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Update user name in context and save to onboarding data
      updateUserName(name.trim());
      
      // Save name data to UserContext for database persistence
      console.log('PersonalProgramScreen: Saving name to UserContext:', name.trim());
      await updateOnboardingData({ name: name.trim() });
      
      // Small delay for UX feedback
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
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      
      <View style={[styles.wrapper, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <View style={[styles.statusBar, { borderBottomColor: isDark ? t.border : '#F0F0F0' }]}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? t.surfaceRaised : '#E5E5E5' }]}>
              <View style={[styles.progressFill, { width: '37.5%', backgroundColor: t.accentPurple }]} />
            </View>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontDisplay }]}>What's your name?</Text>
            <Text style={[styles.subtitle, { color: t.textMuted, fontFamily: t.fontBody }]}>
              Tell us a bit about yourself so we can design training that fits your goals.
            </Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#E5E5E5', color: t.textPrimary }]}
              placeholder="Enter your first name"
              placeholderTextColor={t.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={!name}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            
            <TouchableOpacity 
              style={[
                styles.continueButton,
                { backgroundColor: t.accentPurple },
                !name.trim() && { backgroundColor: isDark ? t.surfaceRaised : '#E5E5E5', shadowOpacity: 0, elevation: 0 },
              ]}
              onPress={handleContinue}
              disabled={!name.trim() || isLoading}
            >
              <Text style={[
                styles.continueButtonText,
                { color: isDark ? t.fabTextColor : '#fff' },
                !name.trim() && { color: t.textMuted },
              ]}>
                {isLoading ? 'Creating Program...' : 'CONTINUE'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
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
  inputSection: {
    gap: 24,
  },
  nameInput: {
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
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: '#666666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  statusBar: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
