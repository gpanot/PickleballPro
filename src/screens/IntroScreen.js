import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { getSport } from '../lib/sportConfig';

// Minimum space reserved for title, dots, and CTA buttons on compact iPhones
const BOTTOM_PANEL_MIN = 300;

export default function IntroScreen({ onComplete, navigation }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useUser();
  const SLIDES = getSport(user?.sportId).introSlides;

  const availableHeight = height - insets.top - insets.bottom;
  const imageHeight = Math.min(availableHeight * 0.55, availableHeight - BOTTOM_PANEL_MIN);
  const isCompact = availableHeight < 700;

  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  // Only the IMAGE lives inside the FlatList — nothing else
  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width, height: imageHeight }]}>
      <Image
        source={item.image}
        style={styles.heroImage}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* ── Fixed image strip — only this part scrolls horizontally ── */}
      <View style={[styles.imageStrip, { width, height: imageHeight }]}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          bounces={false}
          style={{ width, height: imageHeight }}
        />
      </View>

      {/* ── Fixed bottom panel — CTAs pinned to bottom; text/dots sit just above ── */}
      <View style={styles.bottomPanel}>
        <View style={styles.contentGroup}>
          <View style={styles.textBlock}>
            <Text style={[styles.mainText, isCompact && styles.mainTextCompact]}>
              {SLIDES[activeIndex].title}
            </Text>
            <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
              {SLIDES[activeIndex].subtitle}
            </Text>
          </View>

          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        </View>

        {/* Buttons — fixed at bottom, never moves */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Sign In is always rendered but only visible on last slide */}
          <TouchableOpacity
            style={[styles.signInButton, !isLastSlide && styles.hidden]}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.7}
            pointerEvents={isLastSlide ? 'auto' : 'none'}
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

  // Image strip — fixed height, clip overflow
  imageStrip: {
    overflow: 'hidden',
    flexShrink: 0,
  },
  slide: {
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Bottom panel — content grouped above CTAs; CTAs stay pinned to bottom
  bottomPanel: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    minHeight: BOTTOM_PANEL_MIN,
  },

  contentGroup: {
    alignItems: 'center',
    marginBottom: 20,
  },

  // Text block — fixed min-height so layout is stable across slides
  textBlock: {
    alignItems: 'center',
    minHeight: 80,
    marginBottom: 14,
  },
  mainText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  mainTextCompact: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#6366F1',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },

  // Buttons
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

  // Utility: visually hidden but still takes up space (no layout jump)
  hidden: {
    opacity: 0,
  },
});
