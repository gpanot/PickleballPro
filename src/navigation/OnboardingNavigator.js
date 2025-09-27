import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainingGoalScreen from '../screens/TrainingGoalScreen';
import TimeCommitmentScreen from '../screens/TimeCommitmentScreen';
import CommitmentVisualizationScreen from '../screens/CommitmentVisualizationScreen';
import FocusAreasScreen from '../screens/FocusAreasScreen';
import IntensitySelectionScreen from '../screens/IntensitySelectionScreen';
import CoachingPreferenceScreen from '../screens/CoachingPreferenceScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProgramLoadingScreen from '../screens/ProgramLoadingScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator({ onComplete }) {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="TrainingGoal"
    >
      <Stack.Screen name="TrainingGoal">
        {(props) => (
          <TrainingGoalScreen 
            {...props} 
            onComplete={(data) => {
              // Navigate to next screen
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
              // Navigate to commitment visualization screen
              props.navigation.navigate('CommitmentVisualization', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
              });
            }} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="CommitmentVisualization">
        {(props) => (
          <CommitmentVisualizationScreen 
            {...props} 
            onComplete={(data) => {
              // Navigate to focus areas screen
              props.navigation.navigate('FocusAreas', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
              });
            }} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="FocusAreas">
        {(props) => (
          <FocusAreasScreen 
            {...props} 
            onComplete={(data) => {
              // Navigate to intensity selection screen
              props.navigation.navigate('IntensitySelection', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
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
              // Navigate to coaching preference screen
              props.navigation.navigate('CoachingPreference', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
              });
            }} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="CoachingPreference">
        {(props) => (
          <CoachingPreferenceScreen 
            {...props} 
            onComplete={(data) => {
              // Navigate to create account screen
              props.navigation.navigate('CreateAccount', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
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
              // Navigate to sign up screen
              props.navigation.navigate('SignUp', { 
                previousData: data
              });
            }} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="SignUp">
        {(props) => (
          <SignUpScreen 
            {...props} 
            onSignUp={(data) => {
              // Navigate to program loading screen after successful sign up
              props.navigation.navigate('ProgramLoading', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
              });
            }}
            onSignIn={() => {
              // Navigate back to create account or implement sign in flow
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="ProgramLoading">
        {(props) => (
          <ProgramLoadingScreen 
            {...props} 
            onComplete={() => {
              // Complete onboarding with all collected data and navigate to Library
              const allData = props.route.params?.previousData || {};
              // Set navigateTo to Library for this specific flow
              onComplete({
                ...allData,
                navigateTo: 'Library'
              });
            }} 
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
