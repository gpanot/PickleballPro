import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainingGoalScreen from '../screens/TrainingGoalScreen';
import TimeCommitmentScreen from '../screens/TimeCommitmentScreen';
import CommitmentVisualizationScreen from '../screens/CommitmentVisualizationScreen';
import FocusAreasScreen from '../screens/FocusAreasScreen';
import IntensitySelectionScreen from '../screens/IntensitySelectionScreen';
import CoachingPreferenceScreen from '../screens/CoachingPreferenceScreen';
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
              // Navigate to program loading screen
              props.navigation.navigate('ProgramLoading', { 
                previousData: { 
                  ...props.route.params?.previousData, 
                  ...data 
                } 
              });
            }} 
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="ProgramLoading">
        {(props) => (
          <ProgramLoadingScreen 
            {...props} 
            onComplete={() => {
              // Complete onboarding with all collected data
              const allData = props.route.params?.previousData || {};
              onComplete(allData);
            }} 
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
