/**
 * OfferingPublicDetailScreen
 * Students see offering info, available runs, skill level, and book from here.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MapPin, Calendar, Users, DollarSign, Star, ChevronRight, Zap, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOfferingWithRuns, formatPrice, spotsRemaining, effectiveCapacity } from '../lib/offeringsApi';

const STATUS_COLOR = {
  open: '#10B981',
  full: '#F59E0B',
  closed: '#9CA3AF',
  completed: '#9CA3AF',
};

export default function OfferingPublicDetailScreen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { offeringId } = route.params;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getOfferingWithRuns(offeringId).then(({ data: d }) => {
        setData(d);
        setLoading(false);
      });
    }, [offeringId])
  );

  if (loading) {
    return <View style={[styles.center, { backgroundColor: t.bg }]}><ActivityIndicator color={t.accentPurple} /></View>;
  }

  if (!data) return null;

  const { offering, runs } = data;
  const openRuns = (runs ?? []).filter(r => r.run.status === 'open' || r.run.status === 'full');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Back button (safe-area aware) */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 4 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={20} color={t.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero */}
      {offering.thumbnail_url
        ? <Image source={{ uri: offering.thumbnail_url }} style={styles.hero} />
        : <View style={[styles.heroPlaceholder, { backgroundColor: `${t.accentPurple}20` }]} />
      }

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.titleRow}>
          <View style={[styles.typeBadge, { backgroundColor: `${t.accentPurple}15` }]}>
            <Text style={[styles.typeBadgeText, { color: t.accentPurple }]}>{offering.type}</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontHeading }]}>{offering.title}</Text>

        {/* Coach */}
        {offering.coach && (
          <Text style={[styles.coach, { color: t.textMuted, fontFamily: t.fontBody }]}>
            with {offering.coach.name}
          </Text>
        )}

        {/* Meta */}
        <View style={styles.metaGrid}>
          {offering.location && (
            <View style={styles.metaItem}>
              <MapPin size={14} color={t.accentPurple} strokeWidth={2} />
              <Text style={[styles.metaText, { color: t.textPrimary, fontFamily: t.fontBody }]}>{offering.location}</Text>
            </View>
          )}
          {offering.facility_name && (
            <View style={styles.metaItem}>
              <Star size={14} color={t.accentPurple} strokeWidth={2} />
              <Text style={[styles.metaText, { color: t.textPrimary, fontFamily: t.fontBody }]}>{offering.facility_name}</Text>
            </View>
          )}
          {offering.skill_level_min != null && (
            <View style={styles.metaItem}>
              <Zap size={14} color={t.accentPurple} strokeWidth={2} />
              <Text style={[styles.metaText, { color: t.textPrimary, fontFamily: t.fontBody }]}>
                Skill {offering.skill_level_min} – {offering.skill_level_max} DUPR
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Users size={14} color={t.accentPurple} strokeWidth={2} />
            <Text style={[styles.metaText, { color: t.textPrimary, fontFamily: t.fontBody }]}>
              Up to {offering.capacity_per_run} per run
            </Text>
          </View>
        </View>

        {/* Description */}
        {offering.description && (
          <Text style={[styles.description, { color: t.textSecondary, fontFamily: t.fontBody }]}>
            {offering.description}
          </Text>
        )}

        {/* Runs */}
        <Text style={[styles.sectionTitle, { color: t.textPrimary, fontFamily: t.fontHeading }]}>
          Available runs
        </Text>

        {openRuns.length === 0 && (
          <Text style={[styles.noRuns, { color: t.textMuted, fontFamily: t.fontBody }]}>
            No open runs at this time.
          </Text>
        )}

        {openRuns.map(({ run, confirmed_count }) => {
          const cap     = effectiveCapacity(run, offering.capacity_per_run);
          const spots   = Math.max(0, cap - run.spots_filled);
          const isFull  = run.status === 'full';
          const price   = formatPrice(run.price_amount, run.price_currency);

          return (
            <TouchableOpacity
              key={run.id}
              style={[styles.runCard, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}
              onPress={() => navigation.navigate('BookingConfirm', { run, offering })}
              activeOpacity={0.75}
            >
              <View style={styles.runTop}>
                <View>
                  <Text style={[styles.runDates, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                    {run.start_date} → {run.end_date}
                  </Text>
                  <Text style={[styles.runSchedule, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    {run.session_schedule}
                  </Text>
                </View>
                <Text style={[styles.runPrice, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
                  {price}
                </Text>
              </View>

              <View style={styles.runFooter}>
                <View style={[styles.spotsChip, { backgroundColor: isFull ? `${t.accentOrange}15` : `${t.accentGreen}15` }]}>
                  <Text style={[styles.spotsChipText, { color: isFull ? t.accentOrange : t.accentGreen, fontFamily: t.fontBody }]}>
                    {isFull ? 'Full — join waitlist' : `${spots} spot${spots !== 1 ? 's' : ''} left`}
                  </Text>
                </View>
                <View style={styles.bookArrow}>
                  <Text style={[styles.bookText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
                    {isFull ? 'Join waitlist' : 'Book'}
                  </Text>
                  <ChevronRight size={16} color={t.accentPurple} strokeWidth={2.5} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero:             { width: '100%', height: 200, resizeMode: 'cover' },
  heroPlaceholder:  { width: '100%', height: 120 },
  content:          { padding: 16 },
  titleRow:         { flexDirection: 'row', marginBottom: 6 },
  typeBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText:    { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  title:            { fontSize: 22, lineHeight: 28, marginBottom: 4 },
  coach:            { fontSize: 14, marginBottom: 14 },
  metaGrid:         { gap: 8, marginBottom: 16 },
  metaItem:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText:         { fontSize: 14 },
  description:      { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  sectionTitle:     { fontSize: 17, marginBottom: 12 },
  noRuns:           { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  runCard:          { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  runTop:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  runDates:         { fontSize: 14 },
  runSchedule:      { fontSize: 13, marginTop: 2 },
  runPrice:         { fontSize: 15 },
  runFooter:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spotsChip:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  spotsChipText:    { fontSize: 13 },
  bookArrow:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bookText:         { fontSize: 14 },
});
