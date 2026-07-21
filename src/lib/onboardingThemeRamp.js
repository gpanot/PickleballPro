import { warmFriendly, sportDark } from '../theme/logbookThemes';
import { TOTAL_ONBOARDING_STEPS } from './onboardingSteps';

/** Male onboarding: 85% → 95% dark, one level per screen (8 steps). */
const RAMP_START_RGB = 38; // ~85% dark (#262626)
const RAMP_END_RGB = 12; // sportDark.bg (#0C0C0C)

function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`;
}

function shiftHex(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  const r = clampByte(((n >> 16) & 255) + delta);
  const g = clampByte(((n >> 8) & 255) + delta);
  const b = clampByte((n & 255) + delta);
  return rgbToHex(r, g, b);
}

function bgForScreenStep(step) {
  const idx = Math.max(0, Math.min(TOTAL_ONBOARDING_STEPS - 1, step - 1));
  const t = idx / (TOTAL_ONBOARDING_STEPS - 1);
  const v = clampByte(RAMP_START_RGB + (RAMP_END_RGB - RAMP_START_RGB) * t);
  return rgbToHex(v, v, v);
}

function buildMaleScreenTheme(bg) {
  const surface = shiftHex(bg, 13);
  const surfaceRaised = shiftHex(bg, 22);
  const border = shiftHex(bg, 28);
  const borderSubtle = shiftHex(bg, 35);
  const bgValue = parseInt(bg.slice(1), 16) & 255;

  return {
    ...sportDark,
    bg,
    surface,
    surfaceRaised,
    border,
    borderSubtle,
    gradientSummary: [surface, surface],
    textPrimary: bgValue > 55 ? '#F0F0F0' : '#F5F5F5',
    textSecondary: '#CCCCCC',
    textMuted: bgValue > 55 ? '#999999' : '#888888',
    textCaption: bgValue > 55 ? '#777777' : '#555555',
    chipBorder: borderSubtle,
    donutSecondaryFill: borderSubtle,
  };
}

/** One background per onboarding screen (steps 1–8). */
export const ONBOARDING_BG_RAMP = Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) =>
  bgForScreenStep(i + 1),
);

const MALE_SCREEN_THEMES = ONBOARDING_BG_RAMP.map(buildMaleScreenTheme);

/** 0-based ramp index for a screen step (0 = Gender … 7 = Sign Up). */
export function getOnboardingDarkTier(step) {
  if (step == null) return TOTAL_ONBOARDING_STEPS - 1;
  return Math.max(0, Math.min(TOTAL_ONBOARDING_STEPS - 1, step - 1));
}

/**
 * Logbook theme tokens for an onboarding screen + gender.
 * Female → warmFriendly. Male → per-screen ramp (8 levels).
 */
export function getOnboardingLogbookTheme(step, gender) {
  if (gender !== 'male') return warmFriendly;
  if (step == null) return sportDark;
  return MALE_SCREEN_THEMES[getOnboardingDarkTier(step)];
}

/** Root navigator background — best match for current onboarding phase. */
export function getOnboardingRootBackground(
  user,
  { hasSelectedGender, hasSetRating, hasSetName } = {},
) {
  // Pre-gender screens (role, sport, intro) and post-logout always use light.
  // Stale user.gender after logout must not force the male dark ramp.
  if (!hasSelectedGender || user?.gender !== 'male') return warmFriendly.bg;
  if (!hasSetRating) return ONBOARDING_BG_RAMP[1];
  if (!hasSetName) return ONBOARDING_BG_RAMP[2];
  return ONBOARDING_BG_RAMP[3];
}

/** Approximate darkness % (0 = white, 100 = black) for a screen step. */
export function getOnboardingDarkPercent(step) {
  const rgb = parseInt(ONBOARDING_BG_RAMP[getOnboardingDarkTier(step)].slice(1), 16) & 255;
  return Math.round(((255 - rgb) / 255) * 100);
}
