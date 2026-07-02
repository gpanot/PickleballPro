/** Ordered onboarding steps after Intro (8 steps total). */
export const ONBOARDING_STEPS = {
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
