import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';

const { width, height } = Dimensions.get('window');

export default function LogConfirmationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [showAIOptions, setShowAIOptions] = useState(true);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAIResponse = (response) => {
    if (response === 'yes') {
      // Navigate back to main app with Logbook tab and show success message
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Main', 
          state: { 
            routes: [{ name: 'Logbook' }], 
            index: 0 
          },
          params: {
            message: 'Your training program has been updated based on your latest session!' 
          }
        }],
      });
    } else {
      // Just go back to logbook without update message
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Main', 
          state: { 
            routes: [{ name: 'Logbook' }], 
            index: 0 
          }
        }],
      });
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'Main', 
        state: { 
          routes: [{ name: 'Logbook' }], 
          index: 0 
        }
      }],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebLinearGradient
        colors={['#10B981', '#059669']}
        style={styles.backgroundGradient}
      />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="white" />
          </View>
          <View style={styles.successRipple1} />
          <View style={styles.successRipple2} />
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Session Saved! 🎉</Text>
        <Text style={styles.successMessage}>
          Great job! Your training session has been logged successfully.
        </Text>

        {/* AI Program Update Section */}
        {showAIOptions && (
          <Animated.View style={styles.aiSection}>
            <View style={styles.aiIconContainer}>
              <WebIcon name="brain" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.aiTitle}>🤖 AI Training Assistant</Text>
            <Text style={styles.aiMessage}>
              For your future training, do you want the AI to update your program based on this new log?
            </Text>
            
            <View style={styles.aiButtonsContainer}>
              <TouchableOpacity 
                style={[styles.aiButton, styles.aiButtonYes]}
                onPress={() => handleAIResponse('yes')}
                activeOpacity={0.8}
              >
                <WebIcon name="sparkles" size={20} color="white" />
                <Text style={styles.aiButtonTextYes}>Yes, update my program</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.aiButton, styles.aiButtonNo]}
                onPress={() => handleAIResponse('no')}
                activeOpacity={0.8}
              >
                <Text style={styles.aiButtonTextNo}>Not this time</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}


        {/* Skip Button */}
        {showAIOptions && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  successRipple1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    left: -20,
    zIndex: 2,
  },
  successRipple2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -40,
    left: -40,
    zIndex: 1,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  aiSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  aiIconContainer: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  aiMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  aiButtonsContainer: {
    gap: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  aiButtonYes: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiButtonNo: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aiButtonTextYes: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiButtonTextNo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
