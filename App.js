import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import IntroScreen from './src/screens/IntroScreen';
import GenderSelectionScreen from './src/screens/GenderSelectionScreen';
import AuthScreen from './src/screens/AuthScreen';
import RatingSelectionScreen from './src/screens/RatingSelectionScreen';
import PersonalProgramScreen from './src/screens/PersonalProgramScreen';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import ExercisePickerScreen from './src/screens/ExercisePickerScreen';
import AddTrainingSessionScreen from './src/screens/AddTrainingSessionScreen';
import ProgramDetailScreen from './src/screens/ProgramDetailScreen';
import RoutineDetailScreen from './src/screens/RoutineDetailScreen';
import { UserProvider, useUser } from './src/context/UserContext';
import { LogbookProvider } from './src/context/LogbookContext';

const Stack = createStackNavigator();

function AppContent() {
  const [initialTabRoute, setInitialTabRoute] = useState('Explore');
  const { hasCompletedIntro, hasSelectedGender, hasSetRating, hasCompletedPersonalProgram, hasCompletedOnboarding, updateOnboardingData, completeIntro, goBackToIntro, completeGenderSelection, completePersonalProgram, completeOnboarding } = useUser();

  const handleIntroComplete = () => {
    console.log('Intro completed!');
    completeIntro();
  };

  const handleAuthenticate = () => {
    console.log('Authentication triggered!');
    // Authentication will now complete the intro and proceed to rating selection
    completeIntro();
  };

  const handleAuthGoBack = () => {
    console.log('Going back to intro from auth');
    goBackToIntro();
  };

  const handleLogout = () => {
    console.log('Logout triggered!');
    // Reset to intro screen on logout
    goBackToIntro();
  };

  const handleGenderComplete = (data) => {
    console.log('Gender selection completed with data:', data);
    updateOnboardingData(data);
    completeGenderSelection();
  };

  const handleRatingComplete = () => {
    console.log('Rating selection completed!');
  };

  const handlePersonalProgramComplete = (data) => {
    console.log('Personal program setup completed with data:', data);
    completePersonalProgram();
  };

  const handleOnboardingComplete = (data) => {
    console.log('Onboarding completed with data:', data);
    updateOnboardingData(data);
    completeOnboarding();
    
    // Set initial tab based on coaching preference
    if (data.navigateTo) {
      setInitialTabRoute(data.navigateTo);
    }
  };

  console.log('App render - hasCompletedIntro:', hasCompletedIntro, 'hasSelectedGender:', hasSelectedGender, 'hasSetRating:', hasSetRating, 'hasCompletedPersonalProgram:', hasCompletedPersonalProgram, 'hasCompletedOnboarding:', hasCompletedOnboarding);

  return (
    <NavigationContainer>
      <StatusBar style="auto" backgroundColor="transparent" translucent />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedIntro ? (
          <>
            <Stack.Screen name="Intro">
              {(props) => <IntroScreen {...props} onComplete={handleIntroComplete} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
          </>
        ) : !hasSelectedGender ? (
          <>
            <Stack.Screen name="GenderSelection">
              {(props) => <GenderSelectionScreen {...props} onComplete={handleGenderComplete} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
          </>
        ) : !hasSetRating ? (
          <>
            <Stack.Screen name="RatingSelection">
              {(props) => <RatingSelectionScreen {...props} onComplete={handleRatingComplete} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
          </>
        ) : !hasCompletedPersonalProgram ? (
          <>
            <Stack.Screen name="PersonalProgram">
              {(props) => <PersonalProgramScreen {...props} onComplete={handlePersonalProgramComplete} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
          </>
        ) : !hasCompletedOnboarding ? (
          <>
            <Stack.Screen name="Onboarding">
              {(props) => <OnboardingNavigator {...props} onComplete={handleOnboardingComplete} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {(props) => <MainTabNavigator {...props} onLogout={handleLogout} initialRouteName={initialTabRoute} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
            <Stack.Screen name="AddTrainingSession" component={AddTrainingSessionScreen} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <LogbookProvider>
          <AppContent />
        </LogbookProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

