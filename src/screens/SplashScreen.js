import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Animated,
  Dimensions,
  View,
  StatusBar,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreenExpo from 'expo-splash-screen';
import { warmFriendly } from '../theme/logbookThemes';

const { height } = Dimensions.get('window');
const CIRCLE_SIZE = 120;

export default function SplashScreen({ onComplete }) {
  const bounceValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const textFadeValue = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    SplashScreenExpo.hideAsync().catch(() => {});

    startAnimations();

    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const startAnimations = () => {
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();

    Animated.timing(textFadeValue, {
      toValue: 1,
      duration: 480,
      delay: 600,
      useNativeDriver: true,
    }).start();

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -44,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 360,
          useNativeDriver: true,
        }),
      ]),
    );

    setTimeout(() => {
      bounceAnimation.start();
      glowAnimation.start();
    }, 300);
  };

  return (
    <LinearGradient
      colors={warmFriendly.gradientSummary}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={warmFriendly.bg} />

      <Animated.View
        style={[
          styles.circleCluster,
          {
            transform: [
              { translateY: bounceValue },
              { scale: scaleValue },
            ],
            opacity: fadeValue,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: glowPulse,
              transform: [{ scale: scaleValue }],
            },
          ]}
        />

        <LinearGradient
          colors={warmFriendly.gradientPrimary}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.85, y: 0.95 }}
          style={styles.circle}
        >
          <View style={styles.circleShine} />
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.titleContainer, { opacity: textFadeValue }]}>
        <Text style={styles.title}>AcademyPro</Text>
        <Text style={styles.subtitle}>Train Like a Pro</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCluster: {
    justifyContent: 'center',
    alignItems: 'center',
    width: CIRCLE_SIZE + 80,
    height: CIRCLE_SIZE + 80,
    marginBottom: 60,
  },
  halo: {
    position: 'absolute',
    width: CIRCLE_SIZE + 56,
    height: CIRCLE_SIZE + 56,
    borderRadius: (CIRCLE_SIZE + 56) / 2,
    backgroundColor: warmFriendly.accentPurpleMuted,
    shadowColor: warmFriendly.accentRose,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 8,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    ...warmFriendly.cardShadow,
  },
  circleShine: {
    position: 'absolute',
    top: 18,
    left: 22,
    width: 36,
    height: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  titleContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: warmFriendly.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: warmFriendly.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
