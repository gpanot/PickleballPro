import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getThemeModeForGender } from '../lib/applyGenderTheme';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import {
  ONBOARDING_BG_RAMP,
  getOnboardingLogbookTheme,
} from '../lib/onboardingThemeRamp';
import { warmFriendly } from '../theme/logbookThemes';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;
const MALE_GENDER_FADE_MS = 2000;
const FEMALE_ADVANCE_MS = 450;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function GenderSelectionScreen({ navigation, onComplete, onGoBack }) {
  const [selectedGender, setSelectedGender] = useState(null);
  const [isMaleTransitioning, setIsMaleTransitioning] = useState(false);
  const advancing = useRef(false);
  const maleFadeAnim = useRef(new Animated.Value(0)).current;
  const { setThemeMode } = useTheme();
  const ot = useOnboardingTheme(ONBOARDING_STEPS.GENDER);

  const maleTheme = useMemo(
    () => getOnboardingLogbookTheme(ONBOARDING_STEPS.GENDER, 'male'),
    [],
  );

  const genderOptions = [
    { id: 'female', title: 'Female', image: require('../../assets/images/female.png') },
    { id: 'male', title: 'Male', image: require('../../assets/images/male.png') },
  ];

  const handleBack = () => {
    if (isMaleTransitioning || advancing.current) return;
    if (onGoBack) onGoBack();
    else if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const finishMaleTransition = () => {
    setThemeMode(getThemeModeForGender('male'));
    onComplete({ gender: 'male' });
  };

  const handleGenderSelect = (genderId) => {
    if (advancing.current) return;
    advancing.current = true;
    setSelectedGender(genderId);

    if (genderId === 'female') {
      setThemeMode(getThemeModeForGender('female'));
      setTimeout(() => {
        onComplete({ gender: genderId });
      }, FEMALE_ADVANCE_MS);
      return;
    }

    setIsMaleTransitioning(true);
    maleFadeAnim.setValue(0);
    Animated.timing(maleFadeAnim, {
      toValue: 1,
      duration: MALE_GENDER_FADE_MS,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        finishMaleTransition();
      } else {
        advancing.current = false;
        setIsMaleTransitioning(false);
      }
    });
  };

  // Screen fade for female card + hint (follows warm → male with the shell).
  const fadeCardSurface = isMaleTransitioning
    ? maleFadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [warmFriendly.surface, maleTheme.surface],
      })
    : ot.surface;

  const fadeCardBorder = isMaleTransitioning
    ? maleFadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E5E7EB', maleTheme.borderSubtle],
      })
    : ot.borderColor;

  const fadeHintColor = isMaleTransitioning
    ? maleFadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [warmFriendly.textMuted, maleTheme.textMuted],
      })
    : ot.textMuted;

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.GENDER}
      title="Tell us about yourself"
      subtitle="Pick your style — we'll personalize your training journal"
      onBack={handleBack}
      contentStyle={styles.content}
      themeBlend={
        isMaleTransitioning
          ? {
              progress: maleFadeAnim,
              fromBg: warmFriendly.bg,
              toBg: ONBOARDING_BG_RAMP[0],
              toTextPrimary: maleTheme.textPrimary,
              toTextSecondary: maleTheme.textSecondary,
              toBorderColor: maleTheme.borderSubtle,
              toAccent: maleTheme.accentPurple,
              toProgressTrack: maleTheme.borderSubtle,
              lockBack: true,
            }
          : undefined
      }
    >
      <View style={styles.genderRow}>
        {genderOptions.map((option) => {
          const isSelected = selectedGender === option.id;
          const isMaleCardSelected = option.id === 'male' && isSelected && isMaleTransitioning;

          // Male card: snap to dark grey + lime immediately (no purple/pink crossfade).
          const borderColor = isMaleCardSelected
            ? maleTheme.accentPurple
            : isSelected
              ? isMaleTransitioning
                ? maleFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [warmFriendly.accentPurple, maleTheme.accentPurple],
                  })
                : ot.accent
              : fadeCardBorder;

          const cardSurface = isMaleCardSelected ? maleTheme.surface : fadeCardSurface;
          const shadowColor = isMaleCardSelected
            ? maleTheme.accentPurple
            : isSelected
              ? isMaleTransitioning
                ? maleFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [warmFriendly.accentPurple, maleTheme.accentPurple],
                  })
                : ot.accent
              : '#000';

          const labelBg = isMaleCardSelected
            ? maleTheme.accentPurple
            : isSelected
              ? isMaleTransitioning
                ? maleFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [warmFriendly.accentPurple, maleTheme.accentPurple],
                  })
                : ot.accent
              : 'rgba(0,0,0,0.75)';

          const CardWrapper = isMaleTransitioning && !isMaleCardSelected ? AnimatedTouchable : TouchableOpacity;
          const LabelWrap = isMaleCardSelected ? View : isMaleTransitioning && isSelected ? Animated.View : View;

          return (
            <CardWrapper
              key={option.id}
              style={[
                styles.genderCard,
                {
                  borderColor,
                  backgroundColor: cardSurface,
                  shadowColor,
                },
                isSelected && styles.genderCardSelected,
              ]}
              onPress={() => handleGenderSelect(option.id)}
              activeOpacity={0.85}
              disabled={!!selectedGender}
            >
              <Image source={option.image} style={styles.genderImage} resizeMode="cover" />
              <LabelWrap style={[styles.genderLabel, { backgroundColor: labelBg }]}>
                <Text style={[styles.genderTitle, { fontFamily: ot.t.fontBodyBold }]}>
                  {option.title.toUpperCase()}
                </Text>
              </LabelWrap>
            </CardWrapper>
          );
        })}
      </View>

      {isMaleTransitioning ? (
        <Animated.Text style={[styles.hint, { color: fadeHintColor, fontFamily: ot.t.fontBody }]}>
          Sport dark theme applied
        </Animated.Text>
      ) : (
        <Text style={[styles.hint, { color: ot.textMuted, fontFamily: ot.t.fontBody }]}>
          {selectedGender === 'female' && 'Warm & friendly theme applied'}
          {!selectedGender && 'Female = warm light · Male = sporty dark'}
        </Text>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  genderCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  genderCardSelected: {
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  genderImage: {
    width: '100%',
    height: 200,
  },
  genderLabel: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  genderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
