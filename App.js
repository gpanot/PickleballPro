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
import ProfileScreen from './src/screens/ProfileScreen';
import AdminRoute from './src/components/AdminRoute';
import { UserProvider, useUser } from './src/context/UserContext';
import { LogbookProvider } from './src/context/LogbookContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();

function AppContent() {
  const [initialTabRoute, setInitialTabRoute] = useState('Explore');
  const { hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, updateOnboardingData, completeIntro, goBackToIntro, completeGenderSelection, completeNameSelection, completeOnboarding, updateUserRating } = useUser();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleIntroComplete = () => {
    console.log('Intro completed!');
    completeIntro();
  };

  const handleAuthenticate = () => {
    console.log('Authentication triggered!');
    // For authenticated users, they should bypass onboarding entirely
    // The isAuthenticated check in navigation logic will handle showing Main screen
    console.log('✅ User authenticated - navigation will show Main screen automatically');
    
    // Optional: Set onboarding flags for consistency, but not required for navigation
    setTimeout(() => {
      completeIntro();
      completeGenderSelection();
      updateUserRating(2.5, 'self'); // Set a default rating
      completeNameSelection();
      completeOnboarding();
      console.log('✅ Onboarding flags set for authenticated user (optional consistency)');
    }, 100);
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

  const handleNameComplete = (data) => {
    console.log('Name selection completed with data:', data);
    completeNameSelection();
  };

  const handlePersonalProgramComplete = (data) => {
    console.log('Personal program setup completed with data:', data);
    // Personal program completion no longer needed in flow
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

  console.log('App render - hasCompletedIntro:', hasCompletedIntro, 'hasSelectedGender:', hasSelectedGender, 'hasSetRating:', hasSetRating, 'hasSetName:', hasSetName, 'hasCompletedOnboarding:', hasCompletedOnboarding);
  
  // Debug navigation logic
  console.log('🔐 Authentication status - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
  
  // Don't render anything while auth is loading
  if (authLoading) {
    console.log('⏳ Auth loading - showing loading state');
    return null; // Or return a loading component
  }
  
  // Add detailed navigation decision logging
  if (isAuthenticated) {
    console.log('🚀 Decision: Show Main (authenticated user - bypassing all onboarding)');
  } else if (!hasCompletedIntro) {
    console.log('👋 Decision: Show Intro screen');
  } else if (!hasSelectedGender) {
    console.log('👤 Decision: Show GenderSelection screen');
  } else if (!hasSetRating) {
    console.log('⭐ Decision: Show RatingSelection screen'); 
  } else if (!hasSetName) {
    console.log('📝 Decision: Show PersonalProgram screen');
  } else if (!hasCompletedOnboarding) {
    console.log('🎯 Decision: Show Onboarding screen');
  } else {
    console.log('✅ Decision: Show Main (onboarding complete, not authenticated)');
  }
  
  if (isAuthenticated) {
    console.log('🚀 User authenticated - should show Main tab navigator with initialRouteName:', initialTabRoute);
  } else if (hasCompletedOnboarding) {
    console.log('🚀 All onboarding complete - should show Main tab navigator with initialRouteName:', initialTabRoute);
  } else if (!hasSetRating) {
    console.log('⭐ Should show RatingSelection screen');
  } else if (!hasSetName) {
    console.log('📝 Should show PersonalProgram screen');
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
            <Stack.Screen 
              name="Admin" 
              component={AdminRoute}
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
        ) : !hasSetName ? (
          <>
            <Stack.Screen name="PersonalProgram">
              {(props) => <PersonalProgramScreen {...props} onComplete={handleNameComplete} />}
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
            <Stack.Screen 
              name="Admin" 
              component={AdminRoute}
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
