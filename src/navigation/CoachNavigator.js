import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import PlayerProfileScreen from '../screens/coach/PlayerProfileScreen';
import AssignProgramListScreen from '../screens/coach/AssignProgramListScreen';
import AssessmentOverviewScreen from '../screens/coach/AssessmentOverviewScreen';
import SkillDetailScreen from '../screens/coach/SkillDetailScreen';
import EvaluationSummaryScreen from '../screens/coach/EvaluationSummaryScreen';
import FirstTimeAssessmentScreen from '../screens/coach/FirstTimeAssessmentScreen';
import FirstTimeAssessmentSummaryScreen from '../screens/coach/FirstTimeAssessmentSummaryScreen';

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
      <Stack.Screen name="AssignProgramList" component={AssignProgramListScreen} />
      <Stack.Screen name="AssessmentOverview" component={AssessmentOverviewScreen} />
      <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
      <Stack.Screen name="EvaluationSummary" component={EvaluationSummaryScreen} />
      <Stack.Screen name="FirstTimeAssessment" component={FirstTimeAssessmentScreen} />
      <Stack.Screen name="FirstTimeAssessmentSummary" component={FirstTimeAssessmentSummaryScreen} />
    </Stack.Navigator>
  );
}

