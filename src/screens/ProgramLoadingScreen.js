import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProgramLoadingScreen({ onComplete }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const insets = useSafeAreaInsets();
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  const loadingMessages = [
    "Analyzing your DUPR rating…",
    "Locking in your goals…",
    "Balancing your focus areas…",
    "Designing your first 3 sessions…"
  ];

  // Spinning animation for the progress wheel
  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();
    
    return () => spinAnimation.stop();
  }, []);

  // Cycling through messages with fade effect
  useEffect(() => {
    const messageInterval = setInterval(() => {
      // Fade out current message
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Change message
        setCurrentMessageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % loadingMessages.length;
          return nextIndex;
        });
        
        // Fade in new message
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 700); // Change message every 700ms

    return () => clearInterval(messageInterval);
  }, []);

  // Pulse animation for the logo
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, []);

  // Complete loading after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      {/* Phone Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.logoContainer,
              { transform: [{ scale: scaleValue }] }
            ]}
          >
            <Text style={styles.logoEmoji}>🎾</Text>
          </Animated.View>
          <Text style={styles.title}>Building your personal program…</Text>
        </View>

          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            {/* Progress Wheel */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressWheel,
                  { transform: [{ rotate: spin }] }
                ]}
              >
                <View style={styles.progressWheelInner} />
              </Animated.View>
              
              {/* Center dot */}
              <View style={styles.centerDot} />
            </View>

            {/* Cycling Messages */}
            <Animated.View
              style={[
                styles.messageContainer,
                { opacity: fadeValue }
              ]}
            >
              <Text style={styles.loadingMessage}>
                {loadingMessages[currentMessageIndex]}
              </Text>
            </Animated.View>

            {/* Progress Dots */}
            <View style={styles.progressDots}>
              {loadingMessages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= currentMessageIndex && styles.progressDotActive
                  ]}
                />
              ))}
            </View>
          </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This will only take a moment...
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
  },
  progressContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  progressWheel: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: 'rgba(0, 122, 255, 0.6)',
    borderBottomColor: 'rgba(0, 122, 255, 0.3)',
    borderLeftColor: 'rgba(0, 122, 255, 0.1)',
  },
  progressWheelInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    position: 'absolute',
    top: 16,
    left: 16,
  },
  centerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    position: 'absolute',
  },
  messageContainer: {
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loadingMessage: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
  },
});
