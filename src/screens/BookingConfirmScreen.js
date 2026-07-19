/**
 * BookingConfirmScreen
 * Shows run details and a confirmation button. Calls book_offering_run RPC.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar, MapPin, DollarSign, Users, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { bookOfferingRun, formatPrice, effectiveCapacity } from '../lib/offeringsApi';

export default function BookingConfirmScreen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const { run, offering } = route.params;
  const [loading, setLoading] = useState(false);

  const cap    = effectiveCapacity(run, offering.capacity_per_run);
  const spots  = Math.max(0, cap - run.spots_filled);
  const isFull = run.status === 'full';
  const price  = formatPrice(run.price_amount, run.price_currency);

  const handleConfirm = async () => {
    setLoading(true);
    const { data, error } = await bookOfferingRun(run.id);
    setLoading(false);

    if (error) {
      Alert.alert('Booking failed', error.message || 'Something went wrong. Please try again.');
      return;
    }

    navigation.replace('BookingSuccess', {
      offeringTitle:     offering.title,
      runStartDate:      run.start_date,
      runEndDate:        run.end_date,
      sessionSchedule:   run.session_schedule,
      paymentStatus:     data.status === 'waitlisted' ? 'not_required' : data.payment_status,
      paymentLinkUrl:    run.payment_link_url,
      enrollmentStatus:  data.status,
      waitlistPosition:  data.waitlist_position,
      priceAmount:       run.price_amount,
      priceCurrency:     run.price_currency,
    });
  };

  const row = (Icon, label, value) => (
    <View style={styles.row} key={label}>
      <Icon size={16} color={t.accentPurple} strokeWidth={2} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontHeading }]}>
        Confirm your booking
      </Text>
      <Text style={[styles.offeringTitle, { color: t.textMuted, fontFamily: t.fontBody }]}>
        {offering.title}
      </Text>

      <View style={[styles.card, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}>
        {row(Calendar, 'Dates',       `${run.start_date} → ${run.end_date}`)}
        {row(Calendar, 'Schedule',    run.session_schedule)}
        {row(MapPin,   'Location',    offering.location || 'TBD')}
        {row(DollarSign, 'Price',     price)}
        {row(Users,    'Spots left',  isFull ? 'Full — you will be waitlisted' : `${spots} remaining`)}
      </View>

      {isFull && (
        <View style={[styles.notice, { backgroundColor: `${t.accentOrange}10`, borderColor: `${t.accentOrange}30` }]}>
          <AlertCircle size={16} color={t.accentOrange} strokeWidth={2} />
          <Text style={[styles.noticeText, { color: t.accentOrange, fontFamily: t.fontBody }]}>
            This run is full. You will be added to the waitlist and notified if a spot opens.
          </Text>
        </View>
      )}

      {run.price_amount > 0 && !isFull && (
        <View style={[styles.notice, { backgroundColor: `${t.accentPurple}10`, borderColor: `${t.accentPurple}20` }]}>
          <AlertCircle size={16} color={t.accentPurple} strokeWidth={2} />
          <Text style={[styles.noticeText, { color: t.accentPurple, fontFamily: t.fontBody }]}>
            Payment is required to confirm your spot. Your coach will send payment instructions.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: t.accentPurple, opacity: loading ? 0.7 : 1 }]}
        onPress={handleConfirm}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={[styles.confirmBtnText, { fontFamily: t.fontBodySemibold }]}>
              {isFull ? 'Join Waitlist' : 'Confirm Booking'}
            </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
        <Text style={[styles.cancelLinkText, { color: t.textMuted, fontFamily: t.fontBody }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:       { padding: 20, paddingBottom: 48 },
  title:         { fontSize: 22, marginBottom: 4 },
  offeringTitle: { fontSize: 14, marginBottom: 24 },
  card:          { borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16 },
  row:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  rowLabel:      { fontSize: 12, marginBottom: 2 },
  rowValue:      { fontSize: 14 },
  notice:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  noticeText:    { flex: 1, fontSize: 13, lineHeight: 18 },
  confirmBtn:    { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  confirmBtnText: { color: '#fff', fontSize: 16 },
  cancelLink:    { alignItems: 'center', padding: 12 },
  cancelLinkText: { fontSize: 14 },
});
