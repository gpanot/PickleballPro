import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Filter out Grammarly console errors during development
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('grm ERROR') || args[0]?.includes?.('Grammarly')) {
      return; // Suppress Grammarly errors
    }
    originalError(...args);
  };
}

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
import EditTrainingSessionScreen from './src/screens/EditTrainingSessionScreen';
import LogConfirmationScreen from './src/screens/LogConfirmationScreen';
import AddExerciseScreen from './src/screens/AddExerciseScreen';
import ProgramDetailScreen from './src/screens/ProgramDetailScreen';
import RoutineDetailScreen from './src/screens/RoutineDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateCoachProfileScreen from './src/screens/CreateCoachProfileScreen';
import CropAvatar from './src/components/CropAvatar';
import SplashScreen from './src/screens/SplashScreen';
import AdminRoute from './src/components/AdminRoute';
import AppSettingsScreen from './src/screens/AppSettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import { UserProvider, useUser } from './src/context/UserContext';
import { LogbookProvider } from './src/context/LogbookContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PreloadProvider } from './src/context/PreloadContext';
import { initializeDeepLinkHandling } from './src/lib/deepLinkHandler';

const Stack = createStackNavigator();

function AppContent() {
  const [initialTabRoute, setInitialTabRoute] = useState('Explore');
  const [showSplash, setShowSplash] = useState(true);
  const [authTimeout, setAuthTimeout] = useState(false);
  const { hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, updateOnboardingData, completeIntro, goBackToIntro, completeGenderSelection, resetGenderSelection, completeNameSelection, completeOnboarding, updateUserRating } = useUser();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Add a timeout fallback for auth loading
  useEffect(() => {
    if (!showSplash && authLoading) {
      console.log('⏰ Starting auth timeout fallback (6 seconds)');
      const timer = setTimeout(() => {
        console.log('⏰ Auth loading timeout reached - proceeding without auth');
        setAuthTimeout(true);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [showSplash, authLoading]);

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

  const handleGenderGoBack = () => {
    console.log('Going back to intro from gender selection');
    goBackToIntro();
  };

  const handleRatingComplete = () => {
    console.log('Rating selection completed!');
  };

  const handleRatingGoBack = () => {
    console.log('Going back from rating selection to gender selection');
    // Reset gender selection to go back to that step
    resetGenderSelection();
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

  const handleSplashComplete = () => {
    console.log('Splash screen completed!');
    setShowSplash(false);
  };

  console.log('App render - hasCompletedIntro:', hasCompletedIntro, 'hasSelectedGender:', hasSelectedGender, 'hasSetRating:', hasSetRating, 'hasSetName:', hasSetName, 'hasCompletedOnboarding:', hasCompletedOnboarding);
  
  // Debug navigation logic
  console.log('🔐 Authentication status - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
  
  // Show splash screen first
  if (showSplash) {
    console.log('🎬 Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Don't render anything while auth is loading, but add a timeout fallback
  // IMPORTANT: Only block on initial auth load, not on sign-in loading
  if (authLoading && !showSplash && !authTimeout && !isAuthenticated) {
    console.log('⏳ Initial auth loading after splash - showing loading state');
    return null; // Or return a loading component
  }
  
  // Simple decision logic: Authenticated users ALWAYS go to Main, no exceptions
  if (isAuthenticated) {
    console.log('🚀 Decision: Show Main (authenticated user - bypassing ALL onboarding checks)');
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

  return (
    <NavigationContainer
      ref={(navigationRef) => {
        // Initialize deep link handling when navigation is ready
        if (navigationRef) {
          const cleanup = initializeDeepLinkHandling(navigationRef);
          // Store cleanup function for later use if needed
          navigationRef.deepLinkCleanup = cleanup;
        }
      }}
    >
      <StatusBar style="auto" backgroundColor="transparent" translucent />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // AUTHENTICATED USER FLOW - Always show Main app
          <>
            <Stack.Screen name="Main">
              {(props) => {
                console.log('🎯 Rendering Main screen for authenticated user, initialRouteName:', initialTabRoute);
                return <MainTabNavigator {...props} onLogout={handleLogout} initialRouteName={initialTabRoute} />;
              }}
            </Stack.Screen>
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
            <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
            <Stack.Screen name="AddTrainingSession" component={AddTrainingSessionScreen} />
            <Stack.Screen name="EditTrainingSession" component={EditTrainingSessionScreen} />
            <Stack.Screen name="LogConfirmation" component={LogConfirmationScreen} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Admin" 
              component={AdminRoute}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreateCoachProfile" 
              component={CreateCoachProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CropAvatar" 
              component={CropAvatar}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AppSettings" 
              component={AppSettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="HelpSupport" 
              component={HelpSupportScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // ONBOARDING FLOW - Only for non-authenticated users
          <>
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
                  {(props) => <GenderSelectionScreen {...props} onComplete={handleGenderComplete} onGoBack={handleGenderGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
              </>
            ) : !hasSetRating ? (
              <>
                <Stack.Screen name="RatingSelection">
                  {(props) => <RatingSelectionScreen {...props} onComplete={handleRatingComplete} onGoBack={handleRatingGoBack} />}
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
              // COMPLETED ONBOARDING, NOT AUTHENTICATED - Show Main app
              <>
                <Stack.Screen name="Main">
                  {(props) => {
                    console.log('🎯 Rendering Main screen for completed onboarding (non-auth), initialRouteName:', initialTabRoute);
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
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Admin" 
                  component={AdminRoute}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="AppSettings" 
                  component={AppSettingsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="HelpSupport" 
                  component={HelpSupportScreen}
                  options={{ headerShown: false }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <PreloadProvider>
              <LogbookProvider>
                <AppContent />
              </LogbookProvider>
            </PreloadProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
