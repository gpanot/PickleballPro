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
import StudentLogbookScreen from '../screens/coach/StudentLogbookScreen';
// Offerings screens (Phase 1)
import OfferingsListScreen from '../screens/coach/offerings/OfferingsListScreen';
import CreateOfferingStep1Screen from '../screens/coach/offerings/CreateOfferingStep1Screen';
import CreateOfferingStep2Screen from '../screens/coach/offerings/CreateOfferingStep2Screen';
import RunFormScreen from '../screens/coach/offerings/RunFormScreen';
import OfferingDetailScreen from '../screens/coach/offerings/OfferingDetailScreen';
import EditOfferingScreen from '../screens/coach/offerings/EditOfferingScreen';

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
      <Stack.Screen name="StudentLogbook" component={StudentLogbookScreen} />
      {/* Offerings */}
      <Stack.Screen name="OfferingsList"         component={OfferingsListScreen}         options={{ title: 'Offerings' }} />
      <Stack.Screen name="CreateOfferingStep1"   component={CreateOfferingStep1Screen}   options={{ title: 'New Offering' }} />
      <Stack.Screen name="CreateOfferingStep2"   component={CreateOfferingStep2Screen}   options={{ title: 'Location & Capacity' }} />
      <Stack.Screen name="RunForm"               component={RunFormScreen}               options={{ title: 'Run' }} />
      <Stack.Screen name="OfferingDetail"        component={OfferingDetailScreen}        options={{ title: 'Offering Detail' }} />
      <Stack.Screen name="EditOffering"          component={EditOfferingScreen}          options={{ title: 'Edit Offering' }} />
    </Stack.Navigator>
  );
}

