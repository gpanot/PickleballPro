import './src/lib/devConsole';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreenExpo from 'expo-splash-screen';
import {
  useFonts,
  PlayfairDisplay_600SemiBold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import {
  DMSans_400Regular,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';

// Prevent the native splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync().catch(() => {
  // Ignore if already prevented
});

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

import OnboardingFinishScreen from './src/screens/OnboardingFinishScreen';
import IntroScreen from './src/screens/IntroScreen';
import SportSelectionScreen from './src/screens/SportSelectionScreen';
import GenderSelectionScreen from './src/screens/GenderSelectionScreen';
import AuthScreen from './src/screens/AuthScreen';
import RatingSelectionScreen from './src/screens/RatingSelectionScreen';
import PersonalProgramScreen from './src/screens/PersonalProgramScreen';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { onboardingStackScreenOptions } from './src/navigation/onboardingStackOptions';
import { getOnboardingRootBackground } from './src/lib/onboardingThemeRamp';
import { warmFriendly } from './src/theme/logbookThemes';
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
import PlayerProfileScreen from './src/screens/coach/PlayerProfileScreen';
import EvaluationSummaryScreen from './src/screens/coach/EvaluationSummaryScreen';
import FirstTimeAssessmentScreen from './src/screens/coach/FirstTimeAssessmentScreen';
import FirstTimeAssessmentSummaryScreen from './src/screens/coach/FirstTimeAssessmentSummaryScreen';
import StudentLogbookScreen from './src/screens/coach/StudentLogbookScreen';
import GamePlayedListScreen from './src/screens/fungame/GamePlayedListScreen';
import DoublesSetupScreen from './src/screens/fungame/DoublesSetupScreen';
import SixPointSummaryScreen from './src/screens/fungame/6PointSummaryScreen';
import UITestGameScreen from './src/screens/fungame/UITestGameScreen';
import CoachScreen from './src/screens/CoachScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import { UserProvider, useUser } from './src/context/UserContext';
import { LogbookProvider } from './src/context/LogbookContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PreloadProvider } from './src/context/PreloadContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { getThemeModeForGender } from './src/lib/applyGenderTheme';
import { initializeDeepLinkHandling } from './src/lib/deepLinkHandler';
import { initializeAuthDeepLinkHandling } from './src/lib/authDeepLink';
import { getActiveTrainingTracks } from './src/lib/trainingTracksApi';
import {
  loadOnboardingFinishState,
  MAX_ONBOARDING_FINISH_VIEWS,
} from './src/lib/onboardingFinishState';

const Stack = createStackNavigator();

function AppContent() {
  const [initialTabRoute, setInitialTabRoute] = useState('Explore');
  const [onboardingInitialView, setOnboardingInitialView] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [onboardingFinishGateReady, setOnboardingFinishGateReady] = useState(false);
  const { hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, isOnboardingHydrated, user, updateOnboardingData, completeSportSelection, completeIntro, goBackToIntro, completeGenderSelection, resetGenderSelection, resetRatingSelection, resetNameSelection, completeNameSelection, completeOnboarding, updateUserRating } = useUser();
  const { isAuthenticated, loading: authLoading, pendingPasswordRecovery } = useAuth();
  const { setThemeMode, logbookTheme, isDark } = useTheme();
  const navigationRef = React.useRef(null);
  const onboardingFinishGateChecked = React.useRef(false);

  // Restore gender-based theme when resuming mid-onboarding
  useEffect(() => {
    if (!isOnboardingHydrated || hasCompletedOnboarding) return;
    if (user?.gender) {
      setThemeMode(getThemeModeForGender(user.gender));
    }
  }, [isOnboardingHydrated, user?.gender, hasCompletedOnboarding, setThemeMode]);

  // Skip OnboardingFinish when the user already has training, has seen it twice, or completed it before.
  useEffect(() => {
    if (!isOnboardingHydrated) return;

    if (!isAuthenticated || hasCompletedOnboarding) {
      setOnboardingFinishGateReady(true);
      onboardingFinishGateChecked.current = false;
      return;
    }

    if (authLoading && !authTimeout) return;
    if (onboardingFinishGateChecked.current) return;

    onboardingFinishGateChecked.current = true;
    let cancelled = false;

    (async () => {
      setOnboardingFinishGateReady(false);

      try {
        const finishState = await loadOnboardingFinishState();

        if (finishState.completed || finishState.viewCount >= MAX_ONBOARDING_FINISH_VIEWS) {
          completeOnboarding();
          return;
        }

        const tracks = await getActiveTrainingTracks();
        if (tracks.length > 0) {
          completeOnboarding();
        }
      } catch (error) {
        console.warn('App: OnboardingFinish gate check failed — allowing flow', error);
      } finally {
        if (!cancelled) {
          setOnboardingFinishGateReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isOnboardingHydrated,
    isAuthenticated,
    hasCompletedOnboarding,
    authLoading,
    authTimeout,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';

    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100%';
    }
  }, []);

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

  // Navigate to the password-reset form when a recovery deep-link is opened
  useEffect(() => {
    if (pendingPasswordRecovery && navigationRef.current) {
      navigationRef.current.navigate('ResetPassword');
    }
  }, [pendingPasswordRecovery]);

  const handleIntroComplete = () => {
    console.log('Intro completed!');
    completeIntro();
  };

  const handleSportSelected = (sportId) => {
    console.log('Sport selected:', sportId);
    completeSportSelection(sportId);
  };

  const handleAuthenticate = () => {
    console.log('Authentication triggered!');
    // Mark all onboarding steps complete synchronously so App never briefly
    // shows OnboardingFinish for a returning sign-in user.
    completeSportSelection('pickleball');
    completeIntro();
    completeGenderSelection();
    updateUserRating(2.5, 'self');
    completeNameSelection();
    completeOnboarding();
    console.log('✅ Onboarding flags set for authenticated user');
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
    resetGenderSelection();
    setThemeMode('light');
  };

  const handleNameComplete = (data) => {
    console.log('Name selection completed with data:', data);
    completeNameSelection();
  };

  const handleNameGoBack = () => {
    resetRatingSelection();
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

    // Store initialView so ProgramScreen opens on My Training after onboarding
    if (data.initialView) {
      setOnboardingInitialView(data.initialView);
    }
  };

  const handleSplashComplete = () => {
    console.log('Splash screen completed!');
    setShowSplash(false);
  };

  console.log('App render - hasSelectedSport:', hasSelectedSport, 'hasCompletedIntro:', hasCompletedIntro, 'hasSelectedGender:', hasSelectedGender, 'hasSetRating:', hasSetRating, 'hasSetName:', hasSetName, 'hasCompletedOnboarding:', hasCompletedOnboarding);
  
  // Debug navigation logic
  console.log('🔐 Authentication status - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
  
  // Show splash screen first
  if (showSplash) {
    console.log('🎬 Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Wait for AsyncStorage hydration so we never flash back to Intro mid-flow
  if (!isOnboardingHydrated) {
    return <View style={{ flex: 1, backgroundColor: warmFriendly.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  // Wait for OnboardingFinish eligibility check (existing training / view cap)
  if (isAuthenticated && !hasCompletedOnboarding && !onboardingFinishGateReady) {
    return <View style={{ flex: 1, backgroundColor: warmFriendly.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  // Don't render anything while auth is loading, but add a timeout fallback
  if (authLoading && !authTimeout && !isAuthenticated) {
    console.log('⏳ Initial auth loading after splash - showing loading state');
    return <View style={{ flex: 1, backgroundColor: warmFriendly.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  const inPreAuthOnboarding = !isAuthenticated;
  const appBg = logbookTheme?.bg || warmFriendly.bg;
  const onboardingRootBg = inPreAuthOnboarding
    ? getOnboardingRootBackground(user, { hasSelectedGender, hasSetRating, hasSetName })
    : appBg;
  const navigationTheme = inPreAuthOnboarding
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: onboardingRootBg,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: appBg,
        },
      };
  const rootStackScreenOptions = inPreAuthOnboarding
    ? onboardingStackScreenOptions
    : { headerShown: false, cardStyle: { flex: 1, backgroundColor: appBg } };

  // ── 3-way routing ──────────────────────────────────────────────────────────
  // Branch 1: Authenticated + onboarding done → Main
  // Branch 2: Authenticated + onboarding NOT done → OnboardingFinish (new users)
  // Branch 3: Not authenticated → pre-auth onboarding flow
  if (isAuthenticated && hasCompletedOnboarding) {
    console.log('🚀 Decision: Main (authenticated, onboarding complete)');
  } else if (isAuthenticated && !hasCompletedOnboarding) {
    console.log('🎉 Decision: OnboardingFinish (authenticated, new user)');
  } else if (!hasSelectedSport) {
    console.log('🏅 Decision: SportSelection screen');
  } else if (!hasCompletedIntro) {
    console.log('👋 Decision: Intro screen');
  } else if (!hasSelectedGender) {
    console.log('👤 Decision: GenderSelection screen');
  } else if (!hasSetRating) {
    console.log('⭐ Decision: RatingSelection screen');
  } else if (!hasSetName) {
    console.log('📝 Decision: PersonalProgram screen');
  } else if (!hasCompletedOnboarding) {
    console.log('🎯 Decision: Onboarding screen');
  } else {
    console.log('✅ Decision: Main (onboarding complete, not authenticated)');
  }

  return (
    <View style={{ flex: 1, backgroundColor: inPreAuthOnboarding ? onboardingRootBg : appBg }}>
    <NavigationContainer
      theme={navigationTheme}
      style={{ flex: 1, backgroundColor: inPreAuthOnboarding ? onboardingRootBg : appBg }}
      ref={(ref) => {
        navigationRef.current = ref;
        if (ref) {
          // Program-share deep links
          initializeDeepLinkHandling(ref);
          // Auth deep links (password reset, OAuth callbacks)
          initializeAuthDeepLinkHandling();
        }
      }}
    >
      <StatusBar style="auto" backgroundColor="transparent" translucent />
      <Stack.Navigator screenOptions={rootStackScreenOptions}>
        {isAuthenticated && !hasCompletedOnboarding ? (
          // BRANCH 2: New authenticated user — show OnboardingFinish before Main
          <Stack.Screen name="OnboardingFinish">
            {(props) => (
              <OnboardingFinishScreen
                {...props}
                route={{ params: { previousData: user || {} } }}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : isAuthenticated ? (
          // BRANCH 1: Authenticated + onboarding complete → Main
          <>
            <Stack.Screen name="Main">
              {(props) => {
                console.log('🎯 Rendering Main screen for authenticated user, initialRouteName:', initialTabRoute);
                return <MainTabNavigator {...props} onLogout={handleLogout} initialRouteName={initialTabRoute} trainingInitialView={onboardingInitialView} />;
              }}
            </Stack.Screen>
            <Stack.Screen 
              name="CoachDetail" 
              component={CoachScreen}
              options={{ 
                headerShown: false
              }}
            />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
            <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
            <Stack.Screen name="AddTrainingSession" component={AddTrainingSessionScreen} options={{ cardStyle: { flex: 1 } }} />
            <Stack.Screen name="EditTrainingSession" component={EditTrainingSessionScreen} options={{ cardStyle: { flex: 1 } }} />
            <Stack.Screen name="LogConfirmation" component={LogConfirmationScreen} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
            <Stack.Screen 
              name="PlayerProfile" 
              component={PlayerProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EvaluationSummary" 
              component={EvaluationSummaryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FirstTimeAssessment" 
              component={FirstTimeAssessmentScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FirstTimeAssessmentSummary" 
              component={FirstTimeAssessmentSummaryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="StudentLogbook" 
              component={StudentLogbookScreen}
              options={{ headerShown: false }}
            />
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
            <Stack.Screen 
              name="GamePlayedList" 
              component={GamePlayedListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="DoublesSetup" 
              component={DoublesSetupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SixPointSummary" 
              component={SixPointSummaryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UITestGame" 
              component={UITestGameScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword">
              {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
            </Stack.Screen>
          </>
        ) : (
          // ONBOARDING FLOW - Only for non-authenticated users
          <>
            {!hasSelectedSport ? (
              <>
                <Stack.Screen name="SportSelection">
                  {(props) => <SportSelectionScreen {...props} onComplete={handleSportSelected} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            ) : !hasCompletedIntro ? (
              <>
                <Stack.Screen name="Intro">
                  {(props) => <IntroScreen {...props} onComplete={handleIntroComplete} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
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
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
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
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            ) : !hasSetName ? (
              <>
                <Stack.Screen name="PersonalProgram">
                  {(props) => <PersonalProgramScreen {...props} onComplete={handleNameComplete} onGoBack={handleNameGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            ) : !hasCompletedOnboarding ? (
              <>
                <Stack.Screen name="Onboarding">
                  {(props) => (
                    <OnboardingNavigator
                      {...props}
                      onComplete={handleOnboardingComplete}
                      onGoBackFromStart={resetNameSelection}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            ) : (
              // COMPLETED ONBOARDING, NOT AUTHENTICATED - Show Main app
              <>
                <Stack.Screen name="Main">
                  {(props) => {
                    console.log('🎯 Rendering Main screen for completed onboarding (non-auth), initialRouteName:', initialTabRoute);
                    return <MainTabNavigator {...props} onLogout={handleLogout} initialRouteName={initialTabRoute} trainingInitialView={onboardingInitialView} />;
                  }}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen 
                  name="CoachDetail" 
                  component={CoachScreen}
                  options={{ 
                    headerShown: false
                  }}
                />
                <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
                <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
                <Stack.Screen name="AddTrainingSession" component={AddTrainingSessionScreen} options={{ cardStyle: { flex: 1 } }} />
                <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
                <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
                <Stack.Screen 
                  name="PlayerProfile" 
                  component={PlayerProfileScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="EvaluationSummary" 
                  component={EvaluationSummaryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="FirstTimeAssessment" 
                  component={FirstTimeAssessmentScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="FirstTimeAssessmentSummary" 
                  component={FirstTimeAssessmentSummaryScreen}
                  options={{ headerShown: false }}
                />
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
                <Stack.Screen 
                  name="GamePlayedList" 
                  component={GamePlayedListScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="DoublesSetup" 
                  component={DoublesSetupScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="SixPointSummary" 
                  component={SixPointSummaryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold_Italic,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    DMSans_400Regular,
    DMSans_600SemiBold,
  });

  // Fonts don't block the splash — the splash screen handles initial display.
  // We render as soon as possible to avoid a blank white flash.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <PreloadProvider>
                <LogbookProvider>
                  <AppContent />
                </LogbookProvider>
              </PreloadProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
