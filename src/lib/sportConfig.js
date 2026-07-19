/**
 * Sport Config — Central registry for all sport-specific variations.
 *
 * Each sport entry defines:
 *  - ratingSystem   : label, type, range, tiers used across the app
 *  - onboardingGoals: goal options shown in TrainingGoalScreen
 *  - introSlides    : slide data for IntroScreen
 *  - coachSlides    : slide data for CoachBenefitsScreen
 *  - assessmentConfig: question ID seeds for assessment templates
 *  - funGameEnabled : whether the 6-point doubles game is available
 *
 * Usage:
 *   import { getSport } from '../lib/sportConfig';
 *   const sport = getSport(user.sportId);   // falls back to pickleball
 */

export const SPORTS = {
  pickleball: {
    id: 'pickleball',
    name: 'Pickleball',

    ratingSystem: {
      type: 'dupr',
      label: 'DUPR',
      min: 2.0,
      max: 8.0,
      placeholder: 'e.g., 3.500',
      inputHint: 'Rating should be between 2.0 and 8.0',
      dbColumn: 'dupr_rating',
      tiers: [
        { label: 'Beginner',     min: 2.0, max: 3.0 },
        { label: 'Intermediate', min: 3.0, max: 4.0 },
        { label: 'Advanced',     min: 4.0, max: 5.0 },
        { label: 'Pro',          min: 5.0, max: 8.0 },
      ],
    },

    /** Skills JSON — loaded lazily via require so the bundle is not affected. */
    skillsData: () => require('../data/sports/pickleball/skills.json'),

    onboardingGoals: [
      {
        id: 'dupr',
        title: 'Improve my DUPR rating',
        description: 'Level up and climb the rankings',
        icon: 'challenge',
      },
      {
        id: 'basics',
        title: 'Learn the basics',
        description: 'Master fundamentals from zero to 3.0',
        icon: 'target',
      },
      {
        id: 'consistency',
        title: 'Get more consistent in matches',
        description: 'Reduce errors and play smarter',
        icon: 'progress',
      },
      {
        id: 'tournament',
        title: 'Compete in tournaments',
        description: 'Prepare for competitive play',
        icon: 'training',
      },
    ],

    onboardingTitle: "What's your pickleball goal?",

    ratingOptions: [
      {
        id: 'dupr',
        title: 'Enter your official DUPR rating',
        description: 'I have an official DUPR account',
        icon: 'star',
      },
      {
        id: 'none',
        title: "I don't have a rating",
        description: "I'm new to pickleball",
        icon: 'help',
      },
    ],

    introSlides: [
      {
        key: '1',
        image: require('../../assets/images/onboarding/player_carousel/pickleball/player_s1_pickleball.jpg'),
        title: 'Your beautiful\ntraining journal',
        subtitle: 'Track mood, skills, and every session in one place',
      },
      {
        key: '2',
        image: require('../../assets/images/onboarding/player_carousel/pickleball/player_s2_coach_certified.jpg'),
        title: 'Get trained by\ncertified Pros',
        subtitle: 'Follow programs from top coaches and level up faster',
      },
      {
        key: '3',
        image: require('../../assets/images/onboarding/player_carousel/pickleball/player_s3_free_DUPR_program.jpg'),
        title: 'Free DUPR\nProgram to 4.0+',
        subtitle: 'Structured path matched to your rating — start today',
      },
    ],

    coachSlides: [
      {
        key: '1',
        image: require('../../assets/images/onboarding/coach_carousel/pickleball/coach_s1_pickleball.jpg'),
        title: 'Anyone can coach.\nWinners build systems',
        subtitle: 'Turn your coaching into a real academy, not just a profile. One brand, one standard, every session',
      },
      {
        key: '2',
        image: require('../../assets/images/onboarding/coach_carousel/pickleball/coach_s2_pickleball.jpg'),
        title: 'One curriculum.\nEvery coach. Every student',
        subtitle: "Add coaches without losing what made you good. Every student gets the same progression, no matter who's teaching",
      },
      {
        key: '3',
        image: require('../../assets/images/onboarding/coach_carousel/pickleball/coach_s3_pickleball.jpg'),
        title: 'Your academy.\nYour name. Your price',
        subtitle: 'White-label from day one. You set the rate, you keep the students, you own the brand as you grow',
      },
    ],

    assessmentConfig: {
      firstQuestionId: 'playedPickleball',
      firstQuestionLabel: 'Have you ever played Pickleball?',
      firstQuestion: {
        id: 'playedPickleball',
        question: 'Have you ever played Pickleball?',
        type: 'button',
        condition: null,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
      durationLabel: 'For how long have you been playing?',
    },

    funGameEnabled: true,

    /** Quick-access skill IDs shown as chips in LogSessionForm */
    quickSkillIds: ['serves', 'returns', 'dinks', 'volleys', 'drops', 'third_shot'],
  },

  // ── Future sports (add entries here) ──────────────────────────────────────
  padel: {
    id: 'padel',
    name: 'Padel',

    ratingSystem: {
      // Playtomic rating: 0.0 (beginner) → 7.0 (world-class)
      type: 'playtomic',
      label: 'Playtomic',
      min: 0.0,
      max: 7.0,
      placeholder: 'e.g., 3.500',
      inputHint: 'Rating should be between 0.0 and 7.0',
      dbColumn: 'skill_rating',
      tiers: [
        { label: 'Beginner',     min: 0.0, max: 2.0 },
        { label: 'Intermediate', min: 2.0, max: 4.0 },
        { label: 'Advanced',     min: 4.0, max: 6.0 },
        { label: 'Pro',          min: 6.0, max: 7.0 },
      ],
    },

    skillsData: () => require('../data/sports/padel/skills.json'),

    onboardingGoals: [
      {
        id: 'ranking',
        title: 'Improve my ranking',
        description: 'Climb the padel ladder and compete higher',
        icon: 'challenge',
      },
      {
        id: 'basics',
        title: 'Learn the basics',
        description: 'Master fundamentals from serve to wall play',
        icon: 'target',
      },
      {
        id: 'consistency',
        title: 'Get more consistent',
        description: 'Reduce errors and build reliable shot patterns',
        icon: 'progress',
      },
      {
        id: 'tournament',
        title: 'Compete in tournaments',
        description: 'Prepare for competitive padel circuits',
        icon: 'training',
      },
    ],

    onboardingTitle: "What's your padel goal?",

    ratingOptions: [
      {
        id: 'playtomic',
        title: 'Enter your official Playtomic rating',
        description: 'I have an official Playtomic account',
        icon: 'star',
      },
      {
        id: 'none',
        title: "I don't have a rating",
        description: "I'm new to padel",
        icon: 'help',
      },
    ],

    introSlides: [
      {
        key: '1',
        image: require('../../assets/images/onboarding/player_carousel/padel/player_s1_padel.jpg'),
        title: 'Your beautiful\ntraining journal',
        subtitle: 'Track mood, skills, and every padel session in one place',
      },
      {
        key: '2',
        image: require('../../assets/images/onboarding/player_carousel/padel/player_s2_certified_coach.jpg'),
        title: 'Get trained by\ncertified Pros',
        subtitle: 'Follow programs from top padel coaches and level up faster',
      },
      {
        key: '3',
        image: require('../../assets/images/onboarding/player_carousel/padel/player_s3_playtomic.jpg'),
        title: 'Your personalized\nPadel Program',
        subtitle: 'Structured path matched to your level — start today',
      },
    ],

    coachSlides: [
      {
        key: '1',
        image: require('../../assets/images/onboarding/coach_carousel/padel/coach_s1_padel.jpg'),
        title: 'Anyone can coach.\nWinners build systems',
        subtitle: 'Turn your coaching into a real academy, not just a profile. One brand, one standard, every session',
      },
      {
        key: '2',
        image: require('../../assets/images/onboarding/coach_carousel/padel/coach_s2_padel.jpg'),
        title: 'One curriculum.\nEvery coach. Every student',
        subtitle: "Add coaches without losing what made you good. Every student gets the same progression, no matter who's teaching",
      },
      {
        key: '3',
        image: require('../../assets/images/onboarding/coach_carousel/padel/coach_s3_padel.jpg'),
        title: 'Your academy.\nYour name. Your price',
        subtitle: 'White-label from day one. You set the rate, you keep the students, you own the brand as you grow',
      },
    ],

    assessmentConfig: {
      firstQuestionId: 'playedPadel',
      firstQuestionLabel: 'Have you ever played Padel?',
      firstQuestion: {
        id: 'playedPadel',
        question: 'Have you ever played Padel?',
        type: 'button',
        condition: null,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
      durationLabel: 'For how long have you been playing padel?',
    },

    funGameEnabled: false,

    quickSkillIds: ['serve', 'volley', 'lob', 'bandeja', 'wall_shot', 'vibora'],
  },
};

/**
 * Return the sport config for the given sportId.
 * Falls back to pickleball if the sportId is unknown or null.
 */
export function getSport(sportId) {
  return SPORTS[sportId] ?? SPORTS.pickleball;
}

/**
 * Convenience: resolve the rating tier label from a numeric rating.
 * Uses the sport's ratingSystem.tiers.
 */
export function getRatingTier(rating, sportId) {
  const sport = getSport(sportId);
  const tiers = sport.ratingSystem?.tiers ?? [];
  const match = tiers.find(t => rating >= t.min && rating < t.max);
  return match?.label ?? tiers[tiers.length - 1]?.label ?? 'Beginner';
}
