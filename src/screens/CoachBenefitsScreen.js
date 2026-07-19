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
import { ChevronLeft } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { getSport } from '../lib/sportConfig';

const BOTTOM_PANEL_MIN = 300;

export default function CoachBenefitsScreen({ onComplete, onGoBack, navigation }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useUser();
  const SLIDES = getSport(user?.sportId).coachSlides;

  const availableHeight = height - insets.top - insets.bottom;
  const imageHeight = Math.min(availableHeight * 0.55, availableHeight - BOTTOM_PANEL_MIN);
  const isCompact = availableHeight < 700;

  const getItemLayout = (_, index) => ({
    length: width,
    offset: width * index,
    index,
  });

  const goToSlide = (index) => {
    const clamped = Math.max(0, Math.min(index, SLIDES.length - 1));
    setActiveIndex(clamped);
    flatListRef.current?.scrollToOffset({
      offset: clamped * width,
      animated: true,
    });
  };

  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleScrollToIndexFailed = (info) => {
    requestAnimationFrame(() => goToSlide(info.index));
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      onComplete?.();
    }
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

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

      {onGoBack ? (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={onGoBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#1F2937" strokeWidth={2.25} />
        </TouchableOpacity>
      ) : null}

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
          onScrollToIndexFailed={handleScrollToIndexFailed}
          getItemLayout={getItemLayout}
          scrollEventThrottle={16}
          bounces={false}
          style={{ width, height: imageHeight }}
        />
      </View>

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

            {/* Sign In — only visible on last slide; navigates up to root Auth screen */}
            <TouchableOpacity
              style={[styles.signInButton, !isLastSlide && styles.hidden]}
              onPress={() => {
                if (!isLastSlide) return;
                // Try parent navigator first (when inside CoachOnboardingNavigator)
                const parent = navigation?.getParent?.();
                if (parent) {
                  parent.navigate('Auth');
                } else {
                  navigation?.navigate('Auth');
                }
              }}
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
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
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
  hidden: {
    opacity: 0,
  },
});
