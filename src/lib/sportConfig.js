/**
 * Sport Config — Central registry for all sport-specific variations.
 *
 * Each sport entry defines:
 *  - ratingSystem   : label, type, range, tiers used across the app
 *  - onboardingGoals: goal options shown in TrainingGoalScreen
 *  - introSlides    : slide data for IntroScreen
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
        image: require('../../assets/images/onboarding/slide_logbook.jpg'),
        title: 'Your beautiful\ntraining journal',
        subtitle: 'Track mood, skills, and every session in one place',
      },
      {
        key: '2',
        image: require('../../assets/images/intro.png'),
        title: 'Get trained by\ncertified Pros',
        subtitle: 'Follow programs from top coaches and level up faster',
      },
      {
        key: '3',
        image: require('../../assets/images/onboarding/slide_program.png'),
        title: 'Free DUPR\nProgram to 4.0+',
        subtitle: 'Structured path matched to your rating — start today',
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
      type: 'padel_level',
      label: 'Level',
      min: 1.0,
      max: 10.0,
      placeholder: 'e.g., 4.5',
      inputHint: 'Level should be between 1.0 and 10.0',
      dbColumn: 'skill_rating',
      tiers: [
        { label: 'Beginner',     min: 1.0, max: 3.5 },
        { label: 'Intermediate', min: 3.5, max: 5.5 },
        { label: 'Advanced',     min: 5.5, max: 7.5 },
        { label: 'Pro',          min: 7.5, max: 10.0 },
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
        id: 'padel_level',
        title: 'Enter your padel level',
        description: 'I know my current level (1–10)',
        icon: 'star',
      },
      {
        id: 'none',
        title: "I don't have a level",
        description: "I'm new to padel",
        icon: 'help',
      },
    ],

    introSlides: [
      {
        key: '1',
        image: require('../../assets/images/onboarding/slide_logbook.jpg'),
        title: 'Your beautiful\ntraining journal',
        subtitle: 'Track mood, skills, and every padel session in one place',
      },
      {
        key: '2',
        image: require('../../assets/images/intro.png'),
        title: 'Get trained by\ncertified Pros',
        subtitle: 'Follow programs from top padel coaches and level up faster',
      },
      {
        key: '3',
        image: require('../../assets/images/onboarding/slide_program.jpeg'),
        title: 'Your personalized\nPadel Program',
        subtitle: 'Structured path matched to your level — start today',
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
