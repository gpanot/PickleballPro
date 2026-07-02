import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { getOnboardingLogbookTheme, getOnboardingDarkTier } from '../../lib/onboardingThemeRamp';

/**
 * Shared onboarding tokens derived from gender + step.
 * @param {number} [step] — ONBOARDING_STEPS value; omit for full gender theme (e.g. Auth).
 */
export function useOnboardingTheme(step) {
  const { user } = useUser();
  const { isDark } = useTheme();

  // During gender tap preview, themeMode flips before user.gender is persisted.
  const gender =
    user.gender ??
    (isDark && step != null ? 'male' : null);

  const t = getOnboardingLogbookTheme(step, gender);
  const isDarkTheme = gender === 'male';
  const darkTier = isDarkTheme && step != null ? getOnboardingDarkTier(step) : null;

  return {
    t,
    isDark: isDarkTheme,
    darkTier,
    gender,
    accent: t.accentPurple,
    accentMuted: t.accentPurpleMuted,
    bg: t.bg,
    surface: t.surface,
    textPrimary: t.textPrimary,
    textSecondary: t.textSecondary,
    textMuted: t.textMuted,
    borderColor: isDarkTheme ? t.borderSubtle : '#E5E7EB',
    iconMuted: t.textMuted,
    progressTrack: isDarkTheme ? t.borderSubtle : '#E5E7EB',
    progressFill: t.accentPurple,
    statusBarStyle: isDarkTheme ? 'light-content' : 'dark-content',
    titleStyle: {
      fontSize: t.screenTitleSize,
      lineHeight: t.screenTitleLineHeight,
      fontFamily: t.fontDisplay,
      color: t.textPrimary,
      textAlign: 'center',
      letterSpacing: isDarkTheme ? 0.5 : -0.5,
      marginBottom: 10,
    },
    subtitleStyle: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: t.fontBody,
      color: t.textSecondary,
      textAlign: 'center',
    },
    primaryButtonStyle: {
      backgroundColor: t.accentPurple,
      shadowColor: t.accentPurple,
    },
    primaryButtonTextColor: isDarkTheme ? t.fabTextColor : '#FFFFFF',
  };
}
