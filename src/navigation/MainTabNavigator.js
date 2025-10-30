import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabIcon from '../components/TabIcon';
import { useAuth } from '../context/AuthContext';
import { checkCoachAccess, supabase } from '../lib/supabase';

import ExploreTrainingScreen from '../screens/ExploreTrainingScreen';
import ProgramScreen from '../screens/ProgramScreen';
import CoachScreen from '../screens/CoachScreen';
import LogbookScreen from '../screens/LogbookScreen';
import CoachNavigator from './CoachNavigator';
// import FeedbackScreen from '../screens/FeedbackScreen'; // Hidden for now

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ route, onLogout, initialRouteName = 'Library' }) {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [isCoach, setIsCoach] = useState(false);
  const [coachPublished, setCoachPublished] = useState(false);
  const [checkingCoach, setCheckingCoach] = useState(true);
  
  // Get props from route params if passed via initialParams
  const finalOnLogout = onLogout || route?.params?.onLogout;
  const finalInitialRouteName = initialRouteName || route?.params?.initialRouteName || 'Library';
  
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
  
  return (
    <Tab.Navigator
      initialRouteName={finalInitialRouteName}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Library') {
            iconName = 'search';
          } else if (route.name === 'Training2') {
            iconName = 'training2';
          } else if (route.name === 'Coach') {
            iconName = 'coach';
          } else if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Logbook') {
            iconName = 'logbook';
          }
          // Feedback screen hidden for now
          // else if (route.name === 'Feedback') {
          //   iconName = 'feedback';
          // }

          return <TabIcon name={iconName} focused={focused} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 12,
          height: 80 + insets.bottom,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Library" 
        component={ExploreTrainingScreen}
      />
      <Tab.Screen 
        name="Training2" 
        component={ProgramScreen}
        options={{ title: 'Program' }}
      />
      <Tab.Screen 
        name="Coach" 
        component={CoachScreen}
      />
      {isCoach && coachPublished && (
        <Tab.Screen 
          name="Dashboard" 
          component={CoachNavigator}
        />
      )}
      <Tab.Screen 
        name="Logbook" 
        component={LogbookScreen}
      />
      {/* Feedback screen hidden for now */}
      {/* <Tab.Screen 
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: 'Feedback♥️' }}
      /> */}
    </Tab.Navigator>
  );
}
