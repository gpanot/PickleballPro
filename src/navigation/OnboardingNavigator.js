import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainingGoalScreen from '../screens/TrainingGoalScreen';
import TimeCommitmentScreen from '../screens/TimeCommitmentScreen';
// import CommitmentVisualizationScreen from '../screens/CommitmentVisualizationScreen'; // Skipped in flow
// import FocusAreasScreen from '../screens/FocusAreasScreen'; // Skipped in flow - all skills are set as default automatically
import IntensitySelectionScreen from '../screens/IntensitySelectionScreen';
// import CoachingPreferenceScreen from '../screens/CoachingPreferenceScreen'; // Skipped in flow
import CreateAccountScreen from '../screens/CreateAccountScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProgramLoadingScreen from '../screens/ProgramLoadingScreen';

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
              // Navigate directly to intensity selection screen (skipping FocusAreas)
              // All skills will be set as default automatically
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
      
      {/* SKIPPED: CommitmentVisualization screen
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
      */}
      
      {/* SKIPPED: FocusAreas screen - all skills are now set as default automatically
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
      */}
      
      <Stack.Screen name="IntensitySelection">
        {(props) => (
          <IntensitySelectionScreen 
            {...props} 
            onComplete={(data) => {
              // Navigate directly to create account screen (skipping CoachingPreference)
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
      
      {/* SKIPPED: CoachingPreference screen
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
      */}
      
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
            onComplete={(loadingResult) => {
              // Complete onboarding and land on My Training tab
              const allData = props.route.params?.previousData || {};
              onComplete({
                ...allData,
                navigateTo: 'Training2',
                // Pass initialView so ProgramScreen opens on My Training
                initialView: loadingResult?.initialView || 'myTraining',
              });
            }} 
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// Memoize to prevent remounting when there are errors
const OnboardingNavigator = React.memo(OnboardingNavigatorComponent);

export default OnboardingNavigator;
