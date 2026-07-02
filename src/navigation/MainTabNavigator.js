import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabIcon from '../components/TabIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { checkCoachAccess, supabase } from '../lib/supabase';
import { hapticLight } from '../lib/haptics';

import ProgramScreen from '../screens/ProgramScreen';
import LogbookScreen from '../screens/LogbookScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CoachNavigator from './CoachNavigator';
// import FeedbackScreen from '../screens/FeedbackScreen'; // Hidden for now

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ route, onLogout, initialRouteName = 'Training2', trainingInitialView = null }) {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { theme, isDark, logbookTheme } = useTheme();
  const [isCoach, setIsCoach] = useState(false);
  const [coachPublished, setCoachPublished] = useState(false);
  const [checkingCoach, setCheckingCoach] = useState(true);
  const [programBadge, setProgramBadge] = useState(false);

  // Check for unread assigned programs (coach → student)
  useEffect(() => {
    if (!authUser?.id) return;
    const checkBadge = async () => {
      try {
        const lastSeen = await AsyncStorage.getItem('@pickleHero_programTabLastSeen');
        const since = lastSeen ? new Date(lastSeen) : new Date(Date.now() - 7 * 24 * 3600 * 1000);
        // user_programs uses added_at (not created_at) and has no source column
        const { data } = await supabase
          .from('user_programs')
          .select('id, added_at')
          .eq('user_id', authUser.id)
          .gte('added_at', since.toISOString())
          .limit(1);
        setProgramBadge(Array.isArray(data) && data.length > 0);
      } catch { /* ignore */ }
    };
    checkBadge();
  }, [authUser?.id]);
  
  // Get props from route params if passed via initialParams
  const finalOnLogout = onLogout || route?.params?.onLogout;
  const finalInitialRouteName = initialRouteName || route?.params?.initialRouteName || 'Training2';
  
  useEffect(() => {
    checkIfCoach();
  }, [authUser]);

  const checkIfCoach = async () => {
    if (!authUser?.id) {
      setCheckingCoach(false);
      return;
    }
    
    try {
      const { isCoach: coachStatus, coachId } = await checkCoachAccess(authUser.id);
      setIsCoach(coachStatus);
      
      // If they're a coach, check if their profile is published (accepting students)
      if (coachStatus && coachId) {
        const { data, error } = await supabase
          .from('coaches')
          .select('is_accepting_students')
          .eq('id', coachId)
          .single();
        
        if (!error && data) {
          setCoachPublished(data.is_accepting_students);
        }
      }
    } catch (error) {
      console.error('Error checking coach status:', error);
      setIsCoach(false);
      setCoachPublished(false);
    } finally {
      setCheckingCoach(false);
    }
  };
  
  console.log('MainTabNavigator rendering! initialRouteName:', finalInitialRouteName);
  console.log('onLogout available:', !!finalOnLogout);
  
  if (checkingCoach) {
    // You might want to show a loading indicator here
    return null;
  }
  
  const tabBarBg = isDark ? logbookTheme.bg : '#FFFFFF';
  const sceneBg = isDark ? logbookTheme.bg : '#FAF7F4';

  return (
    <View style={{ flex: 1, backgroundColor: tabBarBg }}>
    <Tab.Navigator
      initialRouteName={finalInitialRouteName}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Training2') {
            iconName = 'training2';
          } else if (route.name === 'Academy') {
            iconName = 'dashboard';
          } else if (route.name === 'Leaderboard') {
            iconName = 'leaderboard';
          } else if (route.name === 'Logbook') {
            iconName = 'logbook';
          }
          // Feedback screen hidden for now
          // else if (route.name === 'Feedback') {
          //   iconName = 'feedback';
          // }

          return <TabIcon name={iconName} focused={focused} size={size} color={color} />;
        },
        tabBarActiveTintColor: logbookTheme.accentPurple,
        tabBarInactiveTintColor: isDark ? '#555555' : '#C8C0D4',
        headerShown: false,
        sceneContainerStyle: {
          backgroundColor: sceneBg,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: tabBarBg }} />
        ),
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1A1A1A' : logbookTheme.borderSubtle,
          shadowColor: isDark ? '#000000' : logbookTheme.cardShadow.shadowColor,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 8,
          elevation: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 12,
          height: 64 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: isDark ? 9 : 11,
          fontWeight: isDark ? '700' : '600',
          marginTop: 6,
          marginBottom: 2,
          textTransform: isDark ? 'uppercase' : 'none',
          fontFamily: isDark ? 'BarlowCondensed_700Bold' : 'Nunito_600SemiBold',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Training2" 
        component={ProgramScreen}
        initialParams={trainingInitialView ? { initialView: trainingInitialView } : undefined}
        options={{
          title: 'Program',
          tabBarIcon: ({ focused, color, size }) => (
            <View>
              <TabIcon name="training2" focused={focused} size={size} color={color} />
              {programBadge && (
                <View style={{
                  position: 'absolute', top: -2, right: -4,
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: '#EF4444',
                  borderWidth: 1.5, borderColor: '#fff',
                }} />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => {
            hapticLight();
            if (programBadge) {
              setProgramBadge(false);
              AsyncStorage.setItem('@pickleHero_programTabLastSeen', new Date().toISOString()).catch(() => {});
            }
          },
        }}
      />
      <Tab.Screen 
        name="Logbook" 
        component={LogbookScreen}
        listeners={{ tabPress: hapticLight }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        listeners={{ tabPress: hapticLight }}
      />
      {isCoach && coachPublished && (
        <Tab.Screen 
          name="Academy" 
          component={CoachNavigator}
        />
      )}
      {/* Feedback screen hidden for now */}
      {/* <Tab.Screen 
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: 'Feedback♥️' }}
      /> */}
    </Tab.Navigator>
    </View>
  );
}
