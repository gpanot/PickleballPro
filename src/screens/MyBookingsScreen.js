/**
 * MyBookingsScreen
 * Shows the current user's enrollments. Accessible from ProfileScreen.
 * Shows payment status badge, waitlist position badge, and "Pay now" link.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, MapPin, ExternalLink, Clock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import { getMyEnrollments, formatPrice } from '../lib/offeringsApi';

const PAYMENT_STATUS_LABEL = {
  not_required:      { label: 'Free',     color: '#9CA3AF' },
  pending:           { label: 'Unpaid',   color: '#F59E0B' },
  payment_link_sent: { label: 'Pay now',  color: '#3B82F6' },
  paid:              { label: 'Paid',     color: '#10B981' },
  cash_collected:    { label: 'Paid',     color: '#10B981' },
  refunded:          { label: 'Refunded', color: '#6366F1' },
  waived:            { label: 'Waived',   color: '#9CA3AF' },
};

export default function MyBookingsScreen({ navigation }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await getMyEnrollments();
    if (error) Alert.alert('Error', error.message);
    else setEnrollments(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const renderItem = ({ item }) => {
    const run      = item.run;
    const offering = run?.offering;
    const ps       = PAYMENT_STATUS_LABEL[item.payment_status] ?? { label: item.payment_status, color: '#9CA3AF' };
    const isWaiting = item.status === 'waitlisted';
    const needsPay  = ['pending', 'payment_link_sent'].includes(item.payment_status) && run?.price_amount > 0;

    return (
      <View style={[styles.card, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}>
        <View style={styles.cardTop}>
          <Text style={[styles.offeringTitle, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]} numberOfLines={2}>
            {offering?.title ?? 'Offering'}
          </Text>
          <View style={styles.badges}>
            {isWaiting ? (
              <View style={[styles.badge, { backgroundColor: '#FEF3C720' }]}>
                <Clock size={11} color="#F59E0B" strokeWidth={2} />
                <Text style={[styles.badgeText, { color: '#F59E0B' }]}>Waitlist #{item.waitlist_position}</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: '#D1FAE520' }]}>
                <Text style={[styles.badgeText, { color: '#10B981' }]}>Confirmed</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: ps.color + '20' }]}>
              <Text style={[styles.badgeText, { color: ps.color }]}>{ps.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={t.textMuted} strokeWidth={2} />
            <Text style={[styles.metaText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              {run?.start_date} → {run?.end_date}
            </Text>
          </View>
          {offering?.location ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={t.textMuted} strokeWidth={2} />
              <Text style={[styles.metaText, { color: t.textMuted, fontFamily: t.fontBody }]} numberOfLines={1}>
                {offering.location}
              </Text>
            </View>
          ) : null}
        </View>

        {run?.session_schedule ? (
          <Text style={[styles.schedule, { color: t.textMuted, fontFamily: t.fontBody }]}>
            {run.session_schedule}
          </Text>
        ) : null}

        {/* Price + Pay now */}
        {run?.price_amount > 0 && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
              {formatPrice(run.price_amount, run.price_currency)}
            </Text>
            {needsPay && run?.payment_link_url && !isWaiting && (
              <TouchableOpacity
                style={[styles.payLink, { backgroundColor: `${t.accentPurple}15` }]}
                onPress={async () => {
                  const ok = await Linking.canOpenURL(run.payment_link_url);
                  if (ok) Linking.openURL(run.payment_link_url);
                  else Alert.alert('Cannot open link', 'Ask your coach for the payment link.');
                }}
              >
                <ExternalLink size={13} color={t.accentPurple} strokeWidth={2} />
                <Text style={[styles.payLinkText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>Pay now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: t.bg }]}><ActivityIndicator color={t.accentPurple} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="My Bookings"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={enrollments}
        keyExtractor={e => e.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Calendar size={40} color={t.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              No bookings yet.{'\n'}Explore offerings to get started.
            </Text>
            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: t.accentPurple }]}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={[styles.exploreBtnText, { fontFamily: t.fontBodySemibold }]}>Explore Offerings</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:         { padding: 16, paddingBottom: 80 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardTop:      { marginBottom: 10 },
  offeringTitle: { fontSize: 15, marginBottom: 6 },
  badges:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  metaRow:      { gap: 6, marginBottom: 6 },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:     { fontSize: 13, flex: 1 },
  schedule:     { fontSize: 12, marginBottom: 8 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  priceText:    { fontSize: 14 },
  payLink:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  payLinkText:  { fontSize: 13 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText:    { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  exploreBtn:   { marginTop: 4, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: '#fff', fontSize: 15 },
});
