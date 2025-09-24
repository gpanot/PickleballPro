import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

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
import ProfileScreen from './src/screens/ProfileScreen';
import { UserProvider, useUser } from './src/context/UserContext';
import { LogbookProvider } from './src/context/LogbookContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();

function AppContent() {
  const [initialTabRoute, setInitialTabRoute] = useState('Explore');
  const { hasCompletedIntro, hasSelectedGender, hasSetRating, hasCompletedPersonalProgram, hasCompletedOnboarding, updateOnboardingData, completeIntro, goBackToIntro, completeGenderSelection, completePersonalProgram, completeOnboarding, updateUserRating } = useUser();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleIntroComplete = () => {
    console.log('Intro completed!');
    completeIntro();
  };

  const handleAuthenticate = () => {
    console.log('Authentication triggered!');
    console.log('Platform:', Platform.OS);
    
    // For authenticated users, complete all onboarding steps to go directly to main app
    console.log('Completing all onboarding steps for authenticated user...');
    
    // Complete onboarding steps immediately - the auth state change will trigger navigation
    completeIntro();
    completeGenderSelection();
    updateUserRating(2.5, 'self'); // Set a default rating
    completePersonalProgram();
    completeOnboarding();
    console.log('All onboarding steps completed - navigation should be handled by isAuthenticated change');
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
  
  // Debug navigation logic
  console.log('🔐 Authentication status - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'Platform:', Platform.OS);
  console.log('🔄 Onboarding states:', {
    hasCompletedIntro,
    hasSelectedGender,
    hasSetRating,
    hasCompletedPersonalProgram,
    hasCompletedOnboarding
  });
  
  if (isAuthenticated) {
    console.log('🚀 User authenticated - should show Main tab navigator with initialRouteName:', initialTabRoute);
  } else if (hasCompletedOnboarding) {
    console.log('🚀 All onboarding complete - should show Main tab navigator with initialRouteName:', initialTabRoute);
  } else if (!hasCompletedPersonalProgram) {
    console.log('📝 Should show PersonalProgram screen');
  } else if (!hasSetRating) {
    console.log('⭐ Should show RatingSelection screen');
  } else if (!hasSelectedGender) {
    console.log('👤 Should show GenderSelection screen');
  } else if (!hasCompletedIntro) {
    console.log('👋 Should show Intro screen');
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" backgroundColor="transparent" translucent />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main">
              {(props) => {
                console.log('🎯 Rendering Main screen for authenticated user, initialRouteName:', initialTabRoute);
                return <MainTabNavigator {...props} onLogout={handleLogout} initialRouteName={initialTabRoute} />;
              }}
            </Stack.Screen>
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
            <Stack.Screen name="AddTrainingSession" component={AddTrainingSessionScreen} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ 
                headerShown: false
              }}
            />
          </>
        ) : !hasCompletedIntro ? (
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
              {(props) => {
                console.log('🎯 Rendering Main screen with MainTabNavigator, initialRouteName:', initialTabRoute);
                return <MainTabNavigator {...props} onLogout={handleLogout} initialRouteName={initialTabRoute} />;
              }}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
            </Stack.Screen>
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
            <Stack.Screen name="AddTrainingSession" component={AddTrainingSessionScreen} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ 
                headerShown: false
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <LogbookProvider>
            <AppContent />
          </LogbookProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
