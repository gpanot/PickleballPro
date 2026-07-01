// Logbook design token system.
// Two themes based on UI-Themes.md — only tokens differ, never layout or content.
// Import via ThemeContext: const { logbookTheme } = useTheme()

// Shared semantic mood colors — never re-skinned between themes
export const MOOD_COLORS = {
  struggling: '#EF4444',
  difficult:  '#F97316',
  neutral:    '#94A3B8',
  good:       '#22C55E',
  excellent:  '#8B5CF6',
};

// ─── Theme 2: Warm & Friendly (light) ─────────────────────────────────────────
export const warmFriendly = {
  // Surfaces
  bg:            '#FAF7F4',
  surface:       '#FFFFFF',
  surfaceRaised: '#FAF7F4',
  border:        'transparent',
  borderSubtle:  '#EDE6F6',

  // Gradient backgrounds
  gradientPrimary: ['#B48ACA', '#CF8FAD'],   // CTA buttons, FAB
  gradientSummary: ['#EDE6F6', '#F6E6EE'],   // Summary/hero card

  // Accents
  accentPurple:     '#B48ACA',
  accentRose:       '#CF8FAD',
  accentPurpleMuted: '#EDE6F6',
  accentRoseMuted:  '#F6E6EE',

  // Coach Insight border
  coachAccentBorder: '#B48ACA',

  // Text
  textPrimary:   '#2C2233',
  textSecondary: '#5A4E6E',
  textMuted:     '#9B8FA6',
  textCaption:   '#D0C6DA',
  textDisabled:  '#BFB3CC',
  textStrongSkill: '#A87CB8',
  textChallengeSkill: '#CF8FAD',

  // Typography families
  fontDisplay: 'PlayfairDisplay_600SemiBold_Italic',
  fontBody:    'Nunito_400Regular',
  fontBodySemibold: 'Nunito_600SemiBold',
  fontBodyBold: 'Nunito_700Bold',

  // Shape
  radiusCard:  24,
  radiusChip:  9999,
  radiusInner: 16,
  radiusButton: 9999,

  // Card shadow
  cardShadow: {
    shadowColor:   '#A87CB8',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  12,
    elevation:     3,
  },

  // Skill badge backgrounds
  strongBadgeBg:    '#EDE6F6',
  strongBadgeText:  '#A87CB8',
  challengeBadgeBg: '#F6E6EE',
  challengeBadgeText: '#CF8FAD',

  // Chip unselected
  chipBg:     '#FFFFFF',
  chipBorder: '#EDE6F6',
  chipText:   '#BFB3CC',

  // Donut segment colors [primary, secondary]
  donutColors: ['#B48ACA', '#CF8FAD'],
  donutSecondaryFill: '#F6E6EE',

  // Section label style
  sectionLabelColor:    '#BFB3CC',
  sectionLabelSize:     10,
  sectionLabelTracking: 1.5,

  // Screen header
  screenTitleSize:      28,
  screenTitleLineHeight: 34,
  screenSubtitleSize:   13,
  headerPaddingH:       24,
  headerPaddingTop:     16,
  headerPaddingBottom:  12,

  // FAB
  fabColors: ['#B48ACA', '#CF8FAD'],
  fabTextColor: '#FFFFFF',
};

// ─── Theme 1: Sport Dark ──────────────────────────────────────────────────────
export const sportDark = {
  // Surfaces
  bg:            '#0C0C0C',
  surface:       '#111111',
  surfaceRaised: '#181818',
  border:        '#1E1E1E',
  borderSubtle:  '#2A2A2A',

  // Gradient backgrounds (Sport Dark uses flat colors, not gradients)
  gradientPrimary: ['#C5F22A', '#C5F22A'],
  gradientSummary: ['#111111', '#111111'],

  // Accents
  accentPurple:      '#C5F22A',
  accentRose:        '#C5F22A',
  accentPurpleMuted: '#C5F22A18',
  accentRoseMuted:   '#C5F22A18',

  // Coach Insight border
  coachAccentBorder: '#C5F22A',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted:     '#888888',
  textCaption:   '#555555',
  textDisabled:  '#555555',
  textStrongSkill: '#C5F22A',
  textChallengeSkill: '#F97316',

  // Typography families
  fontDisplay: 'BarlowCondensed_800ExtraBold',
  fontBody:    'DMSans_400Regular',
  fontBodySemibold: 'DMSans_600SemiBold',
  fontBodyBold: 'DMSans_600SemiBold',

  // Shape
  radiusCard:  16,
  radiusChip:  9999,
  radiusInner: 12,
  radiusButton: 12,

  // Card shadow (none in Sport Dark)
  cardShadow: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },

  // Skill badge backgrounds
  strongBadgeBg:      '#C5F22A18',
  strongBadgeText:    '#C5F22A',
  challengeBadgeBg:   '#F9731618',
  challengeBadgeText: '#F97316',

  // Chip unselected
  chipBg:     'transparent',
  chipBorder: '#2A2A2A',
  chipText:   '#888888',

  // Donut segment colors
  donutColors: ['#C5F22A', '#2A2A2A'],
  donutSecondaryFill: '#2A2A2A',

  // Section label style
  sectionLabelColor:    '#888888',
  sectionLabelSize:     10,
  sectionLabelTracking: 1.8,

  // Screen header
  screenTitleSize:      28,
  screenTitleLineHeight: 34,
  screenSubtitleSize:   13,
  headerPaddingH:       20,
  headerPaddingTop:     16,
  headerPaddingBottom:  12,

  // FAB
  fabColors: ['#C5F22A', '#C5F22A'],
  fabTextColor: '#0C0C0C',
};
