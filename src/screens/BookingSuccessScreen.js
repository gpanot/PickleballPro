/**
 * BookingSuccessScreen
 * Shown immediately after booking. Shows confirmation or waitlist status.
 * If payment_link_url is set and enrollment is confirmed, shows a "Pay now" button.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { CheckCircle, Clock, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function BookingSuccessScreen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const {
    offeringTitle,
    runStartDate,
    runEndDate,
    sessionSchedule,
    paymentStatus,
    paymentLinkUrl,
    enrollmentStatus,
    waitlistPosition,
    priceAmount,
    priceCurrency,
  } = route.params;

  const isWaitlisted = enrollmentStatus === 'waitlisted';
  const needsPayment = !isWaitlisted && priceAmount > 0 && ['pending', 'payment_link_sent'].includes(paymentStatus);

  const handlePayNow = async () => {
    if (!paymentLinkUrl) return;
    const supported = await Linking.canOpenURL(paymentLinkUrl);
    if (supported) {
      await Linking.openURL(paymentLinkUrl);
    } else {
      Alert.alert('Cannot open link', 'Please ask your coach for the payment link.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: isWaitlisted ? `${t.accentOrange}15` : `${t.accentGreen}15` }]}>
        {isWaitlisted
          ? <Clock size={48} color={t.accentOrange} strokeWidth={1.5} />
          : <CheckCircle size={48} color={t.accentGreen} strokeWidth={1.5} />
        }
      </View>

      <Text style={[styles.headline, { color: t.textPrimary, fontFamily: t.fontHeading }]}>
        {isWaitlisted ? "You're on the waitlist!" : 'Booking confirmed!'}
      </Text>

      <Text style={[styles.sub, { color: t.textMuted, fontFamily: t.fontBody }]}>
        {isWaitlisted
          ? `You're #${waitlistPosition} on the waitlist for "${offeringTitle}". We'll notify you if a spot opens.`
          : `Your spot in "${offeringTitle}" is confirmed.`
        }
      </Text>

      {/* Run details */}
      <View style={[styles.card, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}>
        <Text style={[styles.cardLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Dates</Text>
        <Text style={[styles.cardValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
          {runStartDate} → {runEndDate}
        </Text>
        {sessionSchedule ? (
          <>
            <Text style={[styles.cardLabel, { color: t.textMuted, fontFamily: t.fontBody, marginTop: 8 }]}>Schedule</Text>
            <Text style={[styles.cardValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
              {sessionSchedule}
            </Text>
          </>
        ) : null}
      </View>

      {/* Pay now button */}
      {needsPayment && paymentLinkUrl && (
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: t.accentPurple }]}
          onPress={handlePayNow}
          activeOpacity={0.85}
        >
          <ExternalLink size={16} color="#fff" strokeWidth={2} />
          <Text style={[styles.payBtnText, { fontFamily: t.fontBodySemibold }]}>Pay now</Text>
        </TouchableOpacity>
      )}

      {/* View my bookings */}
      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: isDark ? t.border : '#E5E7EB' }]}
        onPress={() => navigation.navigate('MyBookings')}
        activeOpacity={0.75}
      >
        <Text style={[styles.secondaryBtnText, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
          View my bookings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.popToTop()}
        style={styles.exploreLink}
      >
        <Text style={[styles.exploreLinkText, { color: t.textMuted, fontFamily: t.fontBody }]}>
          Back to Explore
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap:        { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headline:        { fontSize: 24, textAlign: 'center', marginBottom: 10 },
  sub:             { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: 320 },
  card:            { width: '100%', maxWidth: 340, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  cardLabel:       { fontSize: 12 },
  cardValue:       { fontSize: 14 },
  payBtn:          { width: '100%', maxWidth: 340, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, marginBottom: 10 },
  payBtnText:      { color: '#fff', fontSize: 16 },
  secondaryBtn:    { width: '100%', maxWidth: 340, padding: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', marginBottom: 16 },
  secondaryBtnText: { fontSize: 15 },
  exploreLink:     { padding: 12 },
  exploreLinkText: { fontSize: 14 },
});
