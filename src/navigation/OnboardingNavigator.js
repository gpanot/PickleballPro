import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainingGoalScreen from '../screens/TrainingGoalScreen';
import TimeCommitmentScreen from '../screens/TimeCommitmentScreen';
import IntensitySelectionScreen from '../screens/IntensitySelectionScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OnboardingFinishScreen from '../screens/OnboardingFinishScreen';

const Stack = createStackNavigator();

const OnboardingNavigatorComponent = ({ onComplete }) => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="TrainingGoal"
      detachInactiveScreens={false}
    >
      <Stack.Screen name="TrainingGoal">
        {(props) => (
          <TrainingGoalScreen
            {...props}
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
            onSignUp={(data) => {
              props.navigation.navigate('OnboardingFinish', {
                previousData: {
                  ...props.route.params?.previousData,
                  ...data,
                },
              });
            }}
            onSignIn={() => {
              props.navigation.getParent()?.navigate('Auth');
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="OnboardingFinish">
        {(props) => (
          <OnboardingFinishScreen
            {...props}
            onComplete={(result) => {
              const allData = props.route.params?.previousData || {};
              onComplete({
                ...allData,
                navigateTo: 'Training2',
                initialView: result?.initialView || 'myTraining',
                enrolledProgramId: result?.enrolledProgramId,
              });
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const OnboardingNavigator = React.memo(OnboardingNavigatorComponent);

export default OnboardingNavigator;
