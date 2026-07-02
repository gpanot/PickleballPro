import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getOnboardingProgressPercent } from '../../lib/onboardingSteps';
import { ONBOARDING_BG_RAMP } from '../../lib/onboardingThemeRamp';
import { warmFriendly } from '../../theme/logbookThemes';
import { useOnboardingTheme } from './useOnboardingTheme';

function lerpHexColor(progress, fromHex, toHex) {
  const f = parseInt(fromHex.slice(1), 16);
  const t = parseInt(toHex.slice(1), 16);
  const fr = (f >> 16) & 255;
  const fg = (f >> 8) & 255;
  const fb = f & 255;
  const tr = (t >> 16) & 255;
  const tg = (t >> 8) & 255;
  const tb = t & 255;
  const r = Math.round(fr + (tr - fr) * progress);
  const g = Math.round(fg + (tg - fg) * progress);
  const b = Math.round(fb + (tb - fb) * progress);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Shared onboarding layout: themed bg, back button, progress bar, title block.
 * themeBlend — full warm→male crossfade on Gender screen (2s).
 */
export default function OnboardingShell({
  step,
  title,
  subtitle,
  onBack,
  children,
  scrollable = false,
  contentStyle,
  showProgress = true,
  themeBlend,
}) {
  const insets = useSafeAreaInsets();
  const ot = useOnboardingTheme(step);
  const tierAnim = useRef(new Animated.Value(ot.darkTier ?? 0)).current;
  const [blendChrome, setBlendChrome] = useState({
    statusBar: 'dark-content',
    accent: warmFriendly.accentPurple,
  });

  const blendActive = !!themeBlend?.progress;
  const blendTargetBg = themeBlend?.toBg ?? ONBOARDING_BG_RAMP[0];
  const blendFromBg = themeBlend?.fromBg ?? warmFriendly.bg;
  const blendToAccent = themeBlend?.toAccent ?? '#C5F22A';

  useEffect(() => {
    if (!blendActive) return undefined;
    const id = themeBlend.progress.addListener(({ value }) => {
      setBlendChrome({
        statusBar: value > 0.35 ? 'light-content' : 'dark-content',
        accent: lerpHexColor(value, warmFriendly.accentPurple, blendToAccent),
      });
    });
    return () => themeBlend.progress.removeListener(id);
  }, [blendActive, themeBlend?.progress, blendToAccent]);

  useEffect(() => {
    if (blendActive || ot.darkTier == null) return;
    Animated.timing(tierAnim, {
      toValue: ot.darkTier,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [ot.darkTier, tierAnim, blendActive]);

  const backgroundColor = blendActive
    ? themeBlend.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [blendFromBg, blendTargetBg],
      })
    : ot.darkTier != null
      ? tierAnim.interpolate({
          inputRange: ONBOARDING_BG_RAMP.map((_, i) => i),
          outputRange: ONBOARDING_BG_RAMP,
        })
      : ot.bg;

  const titleColor = blendActive
    ? themeBlend.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [warmFriendly.textPrimary, themeBlend.toTextPrimary ?? '#F0F0F0'],
      })
    : ot.titleStyle.color;

  const subtitleColor = blendActive
    ? themeBlend.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [warmFriendly.textSecondary, themeBlend.toTextSecondary ?? '#CCCCCC'],
      })
    : ot.subtitleStyle.color;

  const borderColor = blendActive
    ? themeBlend.progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E5E7EB', themeBlend.toBorderColor ?? '#525252'],
      })
    : ot.borderColor;

  const accentColor = blendActive
    ? themeBlend.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [warmFriendly.accentPurple, blendToAccent],
      })
    : ot.accent;

  const progressTrackColor = blendActive
    ? themeBlend.progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E5E7EB', themeBlend.toProgressTrack ?? '#525252'],
      })
    : ot.progressTrack;

  const header = (
    <View style={styles.header}>
      <Animated.Text style={[ot.titleStyle, blendActive && { color: titleColor }]}>
        {title}
      </Animated.Text>
      {subtitle ? (
        <Animated.Text style={[ot.subtitleStyle, blendActive && { color: subtitleColor }]}>
          {subtitle}
        </Animated.Text>
      ) : null}
    </View>
  );

  const body = scrollable ? (
    <ScrollView
      style={[styles.scroll, { backgroundColor: 'transparent' }]}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, contentStyle]}>
      {header}
      {children}
    </View>
  );

  const statusBarStyle = blendActive ? blendChrome.statusBar : ot.statusBarStyle;
  const backIconColor = blendActive ? blendChrome.accent : ot.accent;

  return (
    <Animated.View style={[styles.root, { backgroundColor, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={blendActive ? blendFromBg : ot.bg} />

      {showProgress && step != null && (
        <Animated.View style={[styles.statusBar, { borderBottomColor: borderColor }]}>
          <View style={styles.progressRow}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
                disabled={themeBlend?.lockBack}
              >
                <Ionicons
                  name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                  size={24}
                  color={backIconColor}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <Animated.View style={[styles.progressBar, { backgroundColor: progressTrackColor }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: getOnboardingProgressPercent(step),
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {body}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  backPlaceholder: {
    width: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
});
