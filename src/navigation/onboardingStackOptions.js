import { CardStyleInterpolators } from '@react-navigation/stack';

const instantTransitionSpec = {
  animation: 'timing',
  config: { duration: 0 },
};

/** No slide/fade — instant screen swap with transparent cards over a themed root. */
export const onboardingStackScreenOptions = {
  headerShown: false,
  cardStyle: { flex: 1, backgroundColor: 'transparent' },
  cardOverlayEnabled: false,
  animationEnabled: false,
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
  transitionSpec: {
    open: instantTransitionSpec,
    close: instantTransitionSpec,
  },
};
