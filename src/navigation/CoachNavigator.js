import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import PlayerProfileScreen from '../screens/coach/PlayerProfileScreen';
import AssessmentOverviewScreen from '../screens/coach/AssessmentOverviewScreen';
import SkillDetailScreen from '../screens/coach/SkillDetailScreen';
import EvaluationSummaryScreen from '../screens/coach/EvaluationSummaryScreen';

const Stack = createStackNavigator();

export default function CoachNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
      <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
      <Stack.Screen name="AssessmentOverview" component={AssessmentOverviewScreen} />
      <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
      <Stack.Screen name="EvaluationSummary" component={EvaluationSummaryScreen} />
    </Stack.Navigator>
  );
}

