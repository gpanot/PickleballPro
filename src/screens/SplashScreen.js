import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onComplete }) {
  // Animation values
  const bounceValue = useRef(new Animated.Value(0)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const textFadeValue = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start all animations
    startAnimations();

    // Complete splash after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const startAnimations = () => {
    // Fade in animation
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Scale up animation
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Text fade in with delay
    Animated.timing(textFadeValue, {
      toValue: 1,
      duration: 800,
      delay: 1000,
      useNativeDriver: true,
    }).start();

    // Glow pulse animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Bouncing animation - continuous
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -50,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation - continuous slow spin
    const rotationAnimation = Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    // Start continuous animations with slight delay
    setTimeout(() => {
      bounceAnimation.start();
      rotationAnimation.start();
      glowAnimation.start();
    }, 500);
  };

  // Interpolate rotation
  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Animated pickleball ball */}
      <Animated.View
        style={[
          styles.ballContainer,
          {
            transform: [
              { translateY: bounceValue },
              { scale: scaleValue },
              { rotate: rotation },
            ],
            opacity: fadeValue,
          },
        ]}
      >
        <Image
          source={require('../../assets/images/splash_ball.png')}
          style={styles.ball}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Optional glow effect behind the ball */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            opacity: glowPulse,
            transform: [{ scale: scaleValue }],
          },
        ]}
      />

      {/* App title */}
      <Animated.View style={[styles.titleContainer, { opacity: textFadeValue }]}>
        <Text style={styles.title}>PicklePro</Text>
        <Text style={styles.subtitle}>Train Like a Pro</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  ball: {
    width: 150,
    height: 150,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#9EF01A',
    shadowColor: '#9EF01A',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  titleContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9EF01A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#9EF01A',
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 1,
  },
});
