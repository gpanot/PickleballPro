import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainingGoalScreen from '../screens/TrainingGoalScreen';
import TimeCommitmentScreen from '../screens/TimeCommitmentScreen';
import IntensitySelectionScreen from '../screens/IntensitySelectionScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { onboardingStackScreenOptions } from './onboardingStackOptions';

const Stack = createStackNavigator();

const OnboardingNavigatorComponent = ({ onComplete, onGoBackFromStart }) => {
  return (
    <Stack.Navigator
      screenOptions={onboardingStackScreenOptions}
      initialRouteName="TrainingGoal"
      detachInactiveScreens={false}
    >
      <Stack.Screen name="TrainingGoal">
        {(props) => (
          <TrainingGoalScreen
            {...props}
            onGoBack={onGoBackFromStart}
            onComplete={(data) => {
              props.navigation.navigate('TimeCommitment', { previousData: data });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="TimeCommitment">
        {(props) => (
          <TimeCommitmentScreen
            {...props}
            onComplete={(data) => {
              props.navigation.navigate('IntensitySelection', {
                previousData: {
                  ...props.route.params?.previousData,
                  ...data,
                },
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="IntensitySelection">
        {(props) => (
          <IntensitySelectionScreen
            {...props}
            onComplete={(data) => {
              props.navigation.navigate('CreateAccount', {
                previousData: {
                  ...props.route.params?.previousData,
                  ...data,
                },
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="CreateAccount">
        {(props) => (
          <CreateAccountScreen
            {...props}
            onContinueWithEmail={(data) => {
              props.navigation.navigate('SignUp', { previousData: data });
            }}
            onSignIn={() => {
              props.navigation.getParent()?.navigate('Auth');
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SignUp">
        {(props) => (
          <SignUpScreen
            {...props}
            onSignUp={() => {
              // App.js routes authenticated new users to root OnboardingFinish.
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

const OnboardingNavigator = React.memo(OnboardingNavigatorComponent);

export default OnboardingNavigator;
