/**
 * Ordered onboarding steps.
 * ROLE and SPORT are pre-steps (no progress bar shown).
 * Coach path does not use numbered steps — benefits + profile form run without a bar.
 */
export const ONBOARDING_STEPS = {
  ROLE: -1,  // pre-step: role selection (player vs coach)
  SPORT: 0,  // pre-step: sport selection (both paths)
  GENDER: 1,
  RATING: 2,
  NAME: 3,
  GOAL: 4,
  TIME: 5,
  INTENSITY: 6,
  CREATE_ACCOUNT: 7,
  SIGNUP: 8,
};

export const TOTAL_ONBOARDING_STEPS = 8;

export function getOnboardingProgressPercent(step) {
  const clamped = Math.max(1, Math.min(step, TOTAL_ONBOARDING_STEPS));
  return `${(clamped / TOTAL_ONBOARDING_STEPS) * 100}%`;
}
