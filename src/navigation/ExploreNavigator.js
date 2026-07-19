/**
 * ExploreNavigator
 * Stack navigator for the student-side offerings browsing + booking flow.
 *
 * Root screen:  ExploreScreen      (list of public offerings)
 * → OfferingPublicDetailScreen     (offering detail + run list)
 * → BookingConfirmScreen           (confirm booking for a run)
 * → BookingSuccessScreen           (booking outcome / waitlist confirmation)
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ExploreScreen            from '../screens/ExploreScreen';
import OfferingPublicDetailScreen from '../screens/OfferingPublicDetailScreen';
import BookingConfirmScreen     from '../screens/BookingConfirmScreen';
import BookingSuccessScreen     from '../screens/BookingSuccessScreen';

const Stack = createStackNavigator();

export default function ExploreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreRoot"        component={ExploreScreen} />
      <Stack.Screen name="OfferingPublicDetail" component={OfferingPublicDetailScreen} />
      <Stack.Screen name="BookingConfirm"     component={BookingConfirmScreen} />
      <Stack.Screen name="BookingSuccess"     component={BookingSuccessScreen} />
    </Stack.Navigator>
  );
}
