import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CoachBenefitsScreen from '../screens/CoachBenefitsScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { onboardingStackScreenOptions } from './onboardingStackOptions';

const Stack = createStackNavigator();

/**
 * Coach onboarding stack: benefits carousel → sign up.
 * Reuses the existing SignUpScreen with mode='coach' params so the
 * payload merges role:'coach' + sportId rather than player-specific data.
 */
const CoachOnboardingNavigatorComponent = ({ onComplete, onGoBackFromStart }) => {
  return (
    <Stack.Navigator
      screenOptions={onboardingStackScreenOptions}
      initialRouteName="CoachBenefits"
      detachInactiveScreens={false}
    >
      <Stack.Screen name="CoachBenefits">
        {(props) => (
          <CoachBenefitsScreen
            {...props}
            onGoBack={onGoBackFromStart}
            onComplete={() => {
              props.navigation.navigate('CoachCreateAccount');
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="CoachCreateAccount">
        {(props) => (
          <CreateAccountScreen
            {...props}
            // Strip navigate so the internal 'SignUp' fallback never fires;
            // onContinueWithEmail callback routes to the correct 'CoachSignUp' screen.
            navigation={{ goBack: () => props.navigation.goBack() }}
            onContinueWithEmail={() => {
              props.navigation.navigate('CoachSignUp');
            }}
            onSignIn={() => {
              props.navigation.getParent()?.navigate('Auth');
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="CoachSignUp">
        {(props) => (
          <SignUpScreen
            {...props}
            route={{
              ...props.route,
              params: {
                ...props.route.params,
                mode: 'coach',
              },
            }}
            onSignUp={() => {
              // App.js detects authenticated + !hasCompletedCoachProfile → shows CreateCoachProfileScreen.
            }}
            onSignIn={() => {
              props.navigation.getParent()?.navigate('Auth');
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const CoachOnboardingNavigator = React.memo(CoachOnboardingNavigatorComponent);

export default CoachOnboardingNavigator;
