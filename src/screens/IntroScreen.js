import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function IntroScreen({ onComplete, onSkip, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* Hero Image */}
      <View style={[styles.imageContainer, { paddingTop: insets.top }]}>
        <Image 
          source={require('../../assets/images/intro.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Skip button — absolute top-right over the image */}
        {onSkip && (
          <TouchableOpacity
            style={[styles.skipButton, { top: insets.top + 12 }]}
            onPress={onSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.textContainer}>
          {/* App wordmark */}
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>Pickle</Text>
            <Text style={[styles.wordmark, styles.wordmarkAccent]}>Hero</Text>
          </View>

          <Text style={styles.mainText}>Play Smarter.</Text>
          <Text style={styles.mainText}>Win More.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={onComplete}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    height: height * 0.57,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    paddingTop: 24,
    justifyContent: 'space-between',
  },
  textContainer: {
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  wordmark: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  wordmarkAccent: {
    color: '#6366F1',
  },
  mainText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -1,
  },
  buttonContainer: {
    gap: 12,
  },
  getStartedButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signInButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  signInText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
