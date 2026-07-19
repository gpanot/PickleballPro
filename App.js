import './src/lib/devConsole';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator, NativeModules } from 'react-native';
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
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import SportSelectionScreen from './src/screens/SportSelectionScreen';
import GenderSelectionScreen from './src/screens/GenderSelectionScreen';
import AuthScreen from './src/screens/AuthScreen';
import RatingSelectionScreen from './src/screens/RatingSelectionScreen';
import PersonalProgramScreen from './src/screens/PersonalProgramScreen';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import CoachOnboardingNavigator from './src/navigation/CoachOnboardingNavigator';
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
import AcceptInviteScreen from './src/screens/AcceptInviteScreen';
import { UserProvider, useUser } from './src/context/UserContext';
import { LogbookProvider } from './src/context/LogbookContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PreloadProvider } from './src/context/PreloadContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { getThemeModeForGender } from './src/lib/applyGenderTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDeepLinkHandling, PENDING_INVITE_TOKEN_KEY } from './src/lib/deepLinkHandler';
import { initializeAuthDeepLinkHandling } from './src/lib/authDeepLink';
import { getActiveTrainingTracks } from './src/lib/trainingTracksApi';
import {
  loadOnboardingFinishState,
  MAX_ONBOARDING_FINISH_VIEWS,
} from './src/lib/onboardingFinishState';
import { checkCoachAccess, supabase } from './src/lib/supabase';

const Stack = createStackNavigator();

// Crashlytics — guard same as FCM (requires native build, not Expo Go)
let crashlytics = null;
if (NativeModules.RNFBAppModule) {
  try {
    // eslint-disable-next-line global-require
    crashlytics = require('@react-native-firebase/crashlytics').default;
  } catch (e) {
    console.warn('[Crashlytics] Failed to load module:', e?.message || e);
  }
}

// C-3: FCM — only available in a custom native build (release APK / dev client).
// Expo Go and web do not ship RNFBAppModule; guard so those runtimes don't RedBox.
let messaging = null;
if (NativeModules.RNFBAppModule) {
  try {
    // eslint-disable-next-line global-require
    messaging = require('@react-native-firebase/messaging').default;
  } catch (e) {
    console.warn('[FCM] Failed to load messaging module:', e?.message || e);
  }
} else if (Platform.OS !== 'web') {
  console.warn('[FCM] RNFBAppModule missing — use a release/dev-client build, not Expo Go');
}

if (messaging) {
  // Background handler must be registered at module level, before any component mounts.
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const ts = new Date().toISOString().substring(11, 23);
    const log = `[${ts}] BACKGROUND: title="${remoteMessage.notification?.title}" data=${JSON.stringify(remoteMessage.data)}`;
    try {
      const existing = await AsyncStorage.getItem('@academypro_pns_debug_logs');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push(log);
      await AsyncStorage.setItem('@academypro_pns_debug_logs', JSON.stringify(logs.slice(-100)));
    } catch { /* ignore storage errors in background */ }
  });
}

function AppContent() {
  const [initialTabRoute, setInitialTabRoute] = useState('Explore');
  const [onboardingInitialView, setOnboardingInitialView] = useState(null);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [onboardingFinishGateReady, setOnboardingFinishGateReady] = useState(false);
  // Signals that Profile should be pushed on top of Main once it mounts
  // (used after coach onboarding save and after returning-coach sign-in)
  const pendingNavigateToProfile = React.useRef(false);
  const {
    hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName,
    hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile,
    isOnboardingHydrated, user, updateOnboardingData,
    completeSportSelection, completeIntro, goBackToIntro, resetSportSelection,
    completeGenderSelection, resetGenderSelection, resetRatingSelection, resetNameSelection,
    completeNameSelection, completeOnboarding, updateUserRating,
    completeRoleSelection, resetRoleSelection, completeCoachBenefits, resetCoachBenefits, completeCoachProfile,
  } = useUser();
  const { isAuthenticated, loading: authLoading, pendingPasswordRecovery, user: authUser } = useAuth();
  const { setThemeMode, logbookTheme, isDark } = useTheme();
  const navigationRef = React.useRef(null);
  const onboardingFinishGateChecked = React.useRef(false);

  // Hide the native splash screen immediately on mount
  useEffect(() => {
    SplashScreenExpo.hideAsync().catch(() => {});
  }, []);

  // Tag Crashlytics with the authenticated user so crash reports are attributable
  useEffect(() => {
    if (!crashlytics) return;
    const instance = crashlytics();
    if (authUser?.id) {
      instance.setUserId(authUser.id).catch(() => {});
      if (authUser.email) {
        instance.setAttribute('email', authUser.email).catch(() => {});
      }
    } else {
      instance.setUserId('').catch(() => {});
    }
  }, [authUser?.id, authUser?.email]);

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
    if (authLoading) {
      console.log('⏰ Starting auth timeout fallback (6 seconds)');
      const timer = setTimeout(() => {
        console.log('⏰ Auth loading timeout reached - proceeding without auth');
        setAuthTimeout(true);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Navigate to the password-reset form when a recovery deep-link is opened
  useEffect(() => {
    if (pendingPasswordRecovery && navigationRef.current) {
      navigationRef.current.navigate('ResetPassword');
    }
  }, [pendingPasswordRecovery]);

  const handleRoleSelected = (role) => {
    console.log('Role selected:', role);
    completeRoleSelection(role);
  };

  const handleRoleGoBack = () => {
    // No back from role screen (first screen in funnel)
  };

  const handleIntroComplete = () => {
    console.log('Intro completed!');
    completeIntro();
  };

  const handleIntroGoBack = () => {
    console.log('Going back to sport selection from intro');
    resetSportSelection();
  };

  const handleSportSelected = (sportId) => {
    console.log('Sport selected:', sportId);
    completeSportSelection(sportId);
  };

  const handleSportGoBack = () => {
    console.log('Going back to role selection from sport');
    resetRoleSelection();
  };

  const handleCoachBenefitsComplete = () => {
    console.log('Coach benefits completed!');
    completeCoachBenefits();
  };

  const handleCoachBenefitsGoBack = () => {
    console.log('Going back to sport selection from coach benefits');
    // Reset sport selection so gate shows SportSelectionScreen again (back label is "Sport")
    resetCoachBenefits();
    resetSportSelection();
  };

  const handleCoachProfileComplete = (source = 'unknown') => {
    console.log('[App] handleCoachProfileComplete', { source });
    // Flag to push Profile screen once Main mounts
    pendingNavigateToProfile.current = true;
    completeCoachProfile();
  };

  // AO-5: After authentication, check for a pending academy invite token and navigate.
  // This handles the case where the user tapped an invite link before signing in.
  useEffect(() => {
    if (!isAuthenticated || !navigationRef.current) return;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(PENDING_INVITE_TOKEN_KEY);
        if (!token) return;
        await AsyncStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
        console.log('[App] Resuming pending invite token after auth:', token);
        // Wait for the Main navigator to mount before pushing AcceptInvite on top
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('AcceptInvite', { token });
          }
        }, 300);
      } catch (e) {
        console.warn('[App] Failed to read pending invite token:', e);
      }
    })();
  }, [isAuthenticated]);

  // C-3: Register FCM device token after the user authenticates (native builds only)
  useEffect(() => {
    if (!messaging || !isAuthenticated || !authUser?.id) return;
    (async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!granted) return;
        const token = await messaging().getToken();
        if (!token) return;
        await supabase
          .from('device_push_tokens')
          .upsert(
            { user_id: authUser.id, token, platform: Platform.OS, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,platform' }
          );
      } catch (e) {
        console.warn('[FCM] Token registration failed:', e);
      }
    })();
  }, [isAuthenticated, authUser?.id]);

  // C-3: Handle FCM foreground messages — display via in-app banner or schedule local notification
  useEffect(() => {
    if (!messaging || !isAuthenticated) return;
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const ts = new Date().toISOString().substring(11, 23);
      const log = `[${ts}] FOREGROUND: title="${remoteMessage.notification?.title}"`;
      try {
        const existing = await AsyncStorage.getItem('@academypro_pns_debug_logs');
        const logs = existing ? JSON.parse(existing) : [];
        logs.push(log);
        await AsyncStorage.setItem('@academypro_pns_debug_logs', JSON.stringify(logs.slice(-100)));
      } catch { /* ignore */ }
      // Foreground display: for now we log only — upgrade to scheduleNotificationAsync
      // when expo-notifications is added (Phase 2 of C-3).
      console.log('[FCM] Foreground message:', remoteMessage.notification?.title, remoteMessage.data);
    });
    return unsubscribe;
  }, [isAuthenticated]);

  // Navigate to Profile after coach onboarding gate clears (save OK or back).
  useEffect(() => {
    if (!hasCompletedCoachProfile || !pendingNavigateToProfile.current) return;

    pendingNavigateToProfile.current = false;
    const timer = setTimeout(() => {
      const nav = navigationRef.current;
      if (!nav) {
        console.warn('[App] handleCoachProfileComplete: navigationRef not ready');
        pendingNavigateToProfile.current = true;
        return;
      }
      console.log('[App] Navigating to Profile after coach profile complete');
      nav.reset({
        index: 1,
        routes: [{ name: 'Main' }, { name: 'Profile' }],
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [hasCompletedCoachProfile]);

  const handleAuthenticate = async () => {
    console.log('Authentication triggered!');
    // Mark all pre-auth onboarding steps complete so the gate never briefly
    // shows an onboarding screen for a returning sign-in user.
    // Do NOT overwrite sportId or role if they are already persisted.
    if (!hasSelectedRole)  completeRoleSelection(user?.role || 'player');
    if (!hasSelectedSport) completeSportSelection(user?.sportId || 'pickleball');
    completeIntro();
    completeGenderSelection();
    updateUserRating(2.5, 'self');
    completeNameSelection();
    completeCoachBenefits();
    completeOnboarding();

    // C9a: check if the signed-in user has a coaches row.
    // authUser is available from AuthContext at this point (auth event already fired).
    // If a coaches row exists, mark coach profile done and route to Profile.
    try {
      const uid = authUser?.id || user?.id;
      if (uid) {
        const coachAccess = await checkCoachAccess(uid);
        if (coachAccess?.isCoach) {
          completeCoachProfile();
          pendingNavigateToProfile.current = true;
        }
      }
    } catch (e) {
      console.warn('handleAuthenticate: could not check coach access', e);
    }

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

  console.log('App render - role:', user?.role, 'hasSelectedRole:', hasSelectedRole, 'hasSelectedSport:', hasSelectedSport, 'hasCompletedIntro:', hasCompletedIntro, 'hasCompletedCoachBenefits:', hasCompletedCoachBenefits, 'hasSelectedGender:', hasSelectedGender, 'hasSetRating:', hasSetRating, 'hasSetName:', hasSetName, 'hasCompletedOnboarding:', hasCompletedOnboarding, 'hasCompletedCoachProfile:', hasCompletedCoachProfile);
  
  // Debug navigation logic
  console.log('🔐 Authentication status - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);

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
    console.log('⏳ Initial auth loading - showing loading state');
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

  // ── 4-way routing ──────────────────────────────────────────────────────────
  // Branch 1: Authenticated + onboarding done + not new coach → Main
  // Branch 2: Authenticated + new coach (!hasCompletedCoachProfile) → CreateCoachProfileScreen
  // Branch 3: Authenticated + player onboarding NOT done → OnboardingFinish (new player)
  // Branch 4: Not authenticated → pre-auth onboarding flow (role-aware)
  const isNewCoach = isAuthenticated && hasCompletedOnboarding && !hasCompletedCoachProfile && user?.role === 'coach';

  if (isNewCoach) {
    console.log('🏫 Decision: CreateCoachProfile (new coach, post-signup)');
  } else if (isAuthenticated && hasCompletedOnboarding) {
    console.log('🚀 Decision: Main (authenticated, onboarding complete)');
  } else if (isAuthenticated && !hasCompletedOnboarding) {
    console.log('🎉 Decision: OnboardingFinish (authenticated, new player)');
  } else if (!hasSelectedRole) {
    console.log('🎭 Decision: RoleSelection screen');
  } else if (!hasSelectedSport) {
    console.log('🏅 Decision: SportSelection screen');
  } else if (user?.role === 'coach' && !hasCompletedCoachBenefits) {
    console.log('🎓 Decision: CoachOnboarding (benefits → signup)');
  } else if (user?.role !== 'coach' && !hasCompletedIntro) {
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
        {isAuthenticated && hasCompletedOnboarding && isNewCoach ? (
          // BRANCH 2b: New coach — show CreateCoachProfileScreen before landing on Profile
          <>
            <Stack.Screen name="CreateCoachProfile" options={{ headerShown: false }}>
              {(props) => (
                <CreateCoachProfileScreen
                  {...props}
                  fromOnboarding
                  onSaved={handleCoachProfileComplete}
                />
              )}
            </Stack.Screen>
          </>
        ) : isAuthenticated && !hasCompletedOnboarding ? (
          // BRANCH 3: New player — show OnboardingFinish before Main
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
            <Stack.Screen
              name="AcceptInvite"
              component={AcceptInviteScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // BRANCH 4: Pre-auth onboarding flow — role-aware
          <>
            {/* Shared auth screens always accessible from anywhere in pre-auth flow */}
            {!hasSelectedRole ? (
              // Step 0: Role selection (new in v2)
              <>
                <Stack.Screen name="RoleSelection">
                  {(props) => <RoleSelectionScreen {...props} onComplete={handleRoleSelected} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            ) : !hasSelectedSport ? (
              // Step 1: Sport selection (both player and coach)
              <>
                <Stack.Screen name="SportSelection">
                  {(props) => <SportSelectionScreen {...props} onComplete={handleSportSelected} onGoBack={handleSportGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="Auth">
                  {(props) => <AuthScreen {...props} onAuthenticate={handleAuthenticate} onGoBack={handleAuthGoBack} />}
                </Stack.Screen>
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword">
                  {(props) => <ResetPasswordScreen {...props} onAuthenticate={handleAuthenticate} />}
                </Stack.Screen>
              </>
            ) : user?.role === 'coach' && !hasCompletedCoachBenefits ? (
              // COACH PATH: Benefits carousel → SignUp
              <>
                <Stack.Screen name="CoachOnboarding">
                  {(props) => (
                    <CoachOnboardingNavigator
                      {...props}
                      onComplete={handleCoachBenefitsComplete}
                      onGoBackFromStart={handleCoachBenefitsGoBack}
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
            ) : user?.role !== 'coach' && !hasCompletedIntro ? (
              // PLAYER PATH: Intro carousel
              <>
                <Stack.Screen name="Intro">
                  {(props) => <IntroScreen {...props} onComplete={handleIntroComplete} onGoBack={handleIntroGoBack} />}
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
              // PLAYER PATH: Gender selection
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
              // PLAYER PATH: Rating
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
              // PLAYER PATH: Name / personal program
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
              // PLAYER PATH: Training goals + account creation
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

  // Fonts don't block the native splash — we render as soon as possible to avoid a blank flash.

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
