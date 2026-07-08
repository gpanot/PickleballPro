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

  // Training / Program screens (library, coach, sessions, exercises)
  training: {
    sectionTitle: '#1F2937',
    sectionSubtitle: '#6B7280',
    sectionLabel: '#6B7280',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    cardTitle: '#1F2937',
    cardSubtitle: '#6B7280',
    cardMeta: '#9CA3AF',
    progressBg: '#F8FAFF',
    progressBorder: '#EEF2FF',
    progressLabel: '#1F2937',
    progressCount: '#6B7280',
    progressTrack: '#E5E7EB',
    progressFill: '#6366F1',
    accent: '#6366F1',
    accentMuted: '#EEF2FF',
    accentBorder: '#C7D2FE',
    previewBannerBg: '#FFFBEB',
    previewBannerBorder: '#FDE68A',
    previewBannerText: '#92400E',
    previewBannerSubtext: '#78350F',
    previewBannerBtn: '#D97706',
    goalCardBg: '#EEF2FF',
    goalCardBorder: '#6366F1',
    goalCardTitle: '#1E1B4B',
    goalCardMeta: '#6366F1',
    goalCardSecondaryBg: '#FFFFFF',
    goalCardSecondaryBorder: '#E5E7EB',
    goalCardSecondaryText: '#374151',
    coachCardBg: '#FFFFFF',
    coachCardBorder: '#E5E7EB',
    coachCardTitle: '#1F2937',
    coachCardBody: '#6B7280',
    stepCardBg: '#FFFFFF',
    stepLabel: '#6B7280',
    stepTitle: '#1F2937',
    stepIconBlue: '#DBEAFE',
    stepIconAmber: '#FEF3C7',
    stepIconGreen: '#D1FAE5',
    studentCodeCardBg: '#FFFFFF',
    studentCodeLabel: '#6B7280',
    studentCodeValue: '#1F2937',
    placeholderBg: '#F9FAFB',
    inputBg: '#F3F4F6',
    primaryGoal: {
      cardBg: '#EEF2FF',
      cardBorder: '#C7D2FE',
      badgeBg: '#C7D2FE',
      badgeText: '#4338CA',
      thumbPlaceholderBg: '#C7D2FE',
      thumbPlaceholderIcon: '#4338CA',
      programName: '#1E1B4B',
      statusLine: '#6366F1',
      progressTrack: '#C7D2FE',
      progressLabel: '#4338CA',
      nextLine: '#374151',
      primaryBtn: '#6366F1',
      secondaryLink: '#6366F1',
      secondaryMuted: '#6B7280',
      dot: '#9CA3AF',
    },
    skillFocus: {
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      thumbPlaceholderBg: '#EEF2FF',
      thumbPlaceholderIcon: '#4338CA',
      name: '#111827',
      meta: '#6B7280',
      progressTrack: '#E5E7EB',
      accent: '#6366F1',
    },
    exercise: {
      goalCardBg: '#EFF6FF',
      goalCardBorder: '#DBEAFE',
      goalTitle: '#1E3A8A',
      goalBody: '#1E40AF',
      targetCardBg: '#ECFDF5',
      targetCardBorder: '#A7F3D0',
      targetTitle: '#047857',
      targetBody: '#065F46',
      videoBg: '#1F2937',
      videoMuted: '#9CA3AF',
      tipNumberBg: '#DCFCE7',
      tipNumberText: '#16A34A',
      instructionsBg: '#F9FAFB',
      instructionsText: '#374151',
    },
  },
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
  textSecondary: '#B8B8B8',
  textMuted:     '#9A9A9A',
  textCaption:   '#888888',
  textDisabled:  '#666666',
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
  sectionLabelColor:    '#9A9A9A',
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

  // Training / Program screens (library, coach, sessions, exercises)
  training: {
    sectionTitle: '#F1F5F9',
    sectionSubtitle: '#94A3B8',
    sectionLabel: '#9A9A9A',
    cardBg: '#181818',
    cardBorder: '#2A2A2A',
    cardTitle: '#FFFFFF',
    cardSubtitle: '#B8B8B8',
    cardMeta: '#888888',
    progressBg: '#111111',
    progressBorder: '#2A2A2A',
    progressLabel: '#FFFFFF',
    progressCount: '#9A9A9A',
    progressTrack: '#2A2A2A',
    progressFill: '#C5F22A',
    accent: '#C5F22A',
    accentMuted: '#C5F22A18',
    accentBorder: '#C5F22A40',
    previewBannerBg: '#2A1F0A',
    previewBannerBorder: '#78350F',
    previewBannerText: '#FCD34D',
    previewBannerSubtext: '#FDE68A',
    previewBannerBtn: '#D97706',
    goalCardBg: '#1A1A2E',
    goalCardBorder: '#C5F22A',
    goalCardTitle: '#FFFFFF',
    goalCardMeta: '#C5F22A',
    goalCardSecondaryBg: '#181818',
    goalCardSecondaryBorder: '#2A2A2A',
    goalCardSecondaryText: '#E2E8F0',
    coachCardBg: '#181818',
    coachCardBorder: '#2A2A2A',
    coachCardTitle: '#FFFFFF',
    coachCardBody: '#9A9A9A',
    stepCardBg: '#181818',
    stepLabel: '#888888',
    stepTitle: '#F1F5F9',
    stepIconBlue: '#1E3A5F',
    stepIconAmber: '#422006',
    stepIconGreen: '#064E3B',
    studentCodeCardBg: '#181818',
    studentCodeLabel: '#888888',
    studentCodeValue: '#FFFFFF',
    placeholderBg: '#1A1A1A',
    inputBg: '#222222',
    primaryGoal: {
      cardBg: '#1A1A2E',
      cardBorder: '#C5F22A40',
      badgeBg: '#C5F22A18',
      badgeText: '#C5F22A',
      thumbPlaceholderBg: '#C5F22A18',
      thumbPlaceholderIcon: '#C5F22A',
      programName: '#FFFFFF',
      statusLine: '#C5F22A',
      progressTrack: '#2A2A2A',
      progressLabel: '#C5F22A',
      nextLine: '#CBD5E1',
      primaryBtn: '#C5F22A',
      secondaryLink: '#C5F22A',
      secondaryMuted: '#94A3B8',
      dot: '#64748B',
    },
    skillFocus: {
      cardBg: '#181818',
      cardBorder: '#2A2A2A',
      thumbPlaceholderBg: '#C5F22A18',
      thumbPlaceholderIcon: '#C5F22A',
      name: '#FFFFFF',
      meta: '#9A9A9A',
      progressTrack: '#2A2A2A',
      accent: '#C5F22A',
    },
    exercise: {
      goalCardBg: '#0F2040',
      goalCardBorder: '#2563EB40',
      goalTitle: '#93C5FD',
      goalBody: '#BFDBFE',
      targetCardBg: '#0A2E22',
      targetCardBorder: '#05966940',
      targetTitle: '#6EE7B7',
      targetBody: '#A7F3D0',
      videoBg: '#0A0A0A',
      videoMuted: '#9A9A9A',
      tipNumberBg: '#064E3B',
      tipNumberText: '#34D399',
      instructionsBg: '#111111',
      instructionsText: '#CBD5E1',
    },
  },
};
