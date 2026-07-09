import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hand, Target, TrendingUp, ChevronRight } from 'lucide-react-native';

const WELCOME_STEPS = [
  {
    Icon: Hand,
    title: 'Welcome to AcademyPro',
    body: 'Your personal training app for athletes of every level.',
  },
  {
    Icon: Target,
    title: 'Your training lives in My Training',
    body: 'Pick a goal — a rating milestone or a skill focus — and follow a structured program at your own pace.',
  },
  {
    Icon: TrendingUp,
    title: 'Choose a program to begin',
    body: "Log each exercise as you go. Progress is saved automatically — pick up exactly where you left off.",
  },
];

export default function ProgramLoadingScreen({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const fadeValue = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const isLastStep = stepIndex === WELCOME_STEPS.length - 1;

  // Keep spinning animation for visual consistency
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const goNext = () => {
    if (isLastStep) {
      // Land on My Training tab with welcome card shown
      onComplete({ initialView: 'myTraining' });
      return;
    }

    // Fade out → advance step → fade in
    Animated.timing(fadeValue, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStepIndex(i => i + 1);
      Animated.timing(fadeValue, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const step = WELCOME_STEPS[stepIndex];
  const StepIcon = step.Icon;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>

        {/* Spinning wheel */}
        <View style={styles.wheelWrap}>
          <Animated.View style={[styles.progressWheel, { transform: [{ rotate: spin }] }]}>
            <View style={styles.progressWheelInner} />
          </Animated.View>
          <View style={styles.centerDot} />
        </View>

        {/* Step content */}
        <Animated.View style={[styles.contentBlock, { opacity: fadeValue }]}>
          <View style={styles.iconWrap}>
            <StepIcon size={52} color="#6366F1" strokeWidth={1.75} />
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
        </Animated.View>

        {/* Step dots */}
        <View style={styles.dots}>
          {WELCOME_STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={goNext}
          activeOpacity={0.88}
          accessibilityLabel={isLastStep ? "Get started" : "Next"}
          accessibilityRole="button"
        >
          {isLastStep ? (
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Let's go</Text>
              <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
            </View>
          ) : (
            <Text style={styles.ctaText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  wheelWrap: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWheel: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#6366F1',
    borderRightColor: 'rgba(99,102,241,0.5)',
    borderBottomColor: 'rgba(99,102,241,0.2)',
    borderLeftColor: 'rgba(99,102,241,0.08)',
  },
  progressWheelInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EEF2FF',
    position: 'absolute',
    top: 13,
    left: 13,
  },
  centerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    position: 'absolute',
  },
  contentBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconWrap: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#6366F1',
    width: 20,
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 48,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
