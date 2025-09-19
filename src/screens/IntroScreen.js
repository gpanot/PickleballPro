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

const { width, height } = Dimensions.get('window');

export default function IntroScreen({ onComplete, navigation }) {
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    onComplete();
  };

  const handleSignIn = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      {/* Hero Image Collage - Takes up top 60% of screen */}
      <View style={[styles.imageContainer, { paddingTop: insets.top }]}>
        <Image 
          source={require('../../assets/images/intro.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* Content Section - Takes up bottom 40% of screen */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>Play Smarter.</Text>
          <Text style={styles.mainText}>Win more!</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>GET STARTED</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={handleSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>I ALREADY HAVE AN ACCOUNT</Text>
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
    height: height * 0.6, // 60% of screen height for image
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1, // Takes remaining 40% of screen
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  textContainer: {
    alignItems: 'center',
  },
  mainText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1,
  },
  buttonContainer: {
    gap: 16,
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  signInText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
