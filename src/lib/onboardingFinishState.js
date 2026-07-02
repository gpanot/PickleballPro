import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_FINISH_KEY = '@picklepro_onboarding_finish_state';
export const MAX_ONBOARDING_FINISH_VIEWS = 2;

const DEFAULT_STATE = { completed: false, viewCount: 0 };

export async function loadOnboardingFinishState() {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_FINISH_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      completed: parsed.completed === true,
      viewCount: Number(parsed.viewCount) || 0,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function persistOnboardingFinishState(state) {
  await AsyncStorage.setItem(ONBOARDING_FINISH_KEY, JSON.stringify(state));
}

export async function markOnboardingFinishComplete() {
  const current = await loadOnboardingFinishState();
  const next = { ...current, completed: true };
  await persistOnboardingFinishState(next);
  return next;
}

export async function recordOnboardingFinishView() {
  const current = await loadOnboardingFinishState();
  const next = {
    ...current,
    viewCount: (current.viewCount || 0) + 1,
  };
  await persistOnboardingFinishState(next);
  return next.viewCount;
}

export async function resetOnboardingFinishState() {
  await AsyncStorage.removeItem(ONBOARDING_FINISH_KEY);
}
