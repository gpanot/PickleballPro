import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabIcon from '../components/TabIcon';

import ExploreTrainingScreen from '../screens/ExploreTrainingScreen';
import ProgramScreen from '../screens/ProgramScreen';
import CoachScreen from '../screens/CoachScreen';
import LogbookScreen from '../screens/LogbookScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ route, onLogout, initialRouteName = 'Library' }) {
  // Get props from route params if passed via initialParams
  const finalOnLogout = onLogout || route?.params?.onLogout;
  const finalInitialRouteName = initialRouteName || route?.params?.initialRouteName || 'Library';
  
  console.log('MainTabNavigator rendering! initialRouteName:', finalInitialRouteName);
  console.log('onLogout available:', !!finalOnLogout);
  
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
          } else if (route.name === 'Logbook') {
            iconName = 'logbook';
          } else if (route.name === 'Feedback') {
            iconName = 'feedback';
          }

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
          paddingBottom: 12,
          paddingTop: 12,
          height: 80,
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
      <Tab.Screen 
        name="Logbook" 
        component={LogbookScreen}
      />
      <Tab.Screen 
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: 'Feedback♥️' }}
      />
    </Tab.Navigator>
  );
}
