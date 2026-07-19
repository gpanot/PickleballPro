/**
 * ExploreScreen — 5th bottom tab (student-facing)
 * Shows all public offerings. Filters by type and skill level.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, MapPin, Calendar, BookOpen, Zap, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getPublicOfferings, getNextOpenRun, getPriceRangeLabel, spotsRemaining, effectiveCapacity } from '../lib/offeringsApi';

const TYPE_FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'cohort', label: 'Cohorts' },
  { id: 'event',  label: 'Events' },
];

export default function ExploreScreen({ navigation }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [offerings,  setOfferings]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQ,    setSearchQ]    = useState('');

  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await getPublicOfferings({
      type: typeFilter === 'all' ? null : typeFilter,
    });
    if (error) {
      setLoadError(error.message || 'Failed to load offerings.');
    } else {
      setOfferings(data ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [typeFilter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const filtered = offerings.filter(o =>
    !searchQ.trim() ||
    o.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
    o.location?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const nextRun  = getNextOpenRun(item.runs ?? []);
    const price    = getPriceRangeLabel(item.runs ?? []);
    const cap      = nextRun ? effectiveCapacity(nextRun, item.capacity_per_run) : null;
    const spots    = nextRun ? spotsRemaining(nextRun, item.capacity_per_run) : null;
    const coachName = item.coach?.name ?? '';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}
        onPress={() => navigation.navigate('OfferingPublicDetail', { offeringId: item.id })}
        activeOpacity={0.75}
      >
        {item.thumbnail_url
          ? <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
          : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? t.border : '#F3F4F6' }]}>
              <BookOpen size={28} color={t.textMuted} strokeWidth={1.5} />
            </View>
          )
        }
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'cohort' ? `${t.accentPurple}15` : `${t.accentGreen}15` }]}>
              <Text style={[styles.typeBadgeText, { color: item.type === 'cohort' ? t.accentPurple : t.accentGreen }]}>
                {item.type}
              </Text>
            </View>
            {price ? (
              <Text style={[styles.priceText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>{price}</Text>
            ) : null}
          </View>

          <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontHeading }]} numberOfLines={2}>
            {item.title}
          </Text>

          {coachName ? (
            <Text style={[styles.coachName, { color: t.textMuted, fontFamily: t.fontBody }]}>
              with {coachName}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {item.location ? (
              <View style={styles.metaItem}>
                <MapPin size={12} color={t.textMuted} strokeWidth={2} />
                <Text style={[styles.metaText, { color: t.textMuted, fontFamily: t.fontBody }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
            {nextRun ? (
              <View style={styles.metaItem}>
                <Calendar size={12} color={t.textMuted} strokeWidth={2} />
                <Text style={[styles.metaText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  Starts {nextRun.start_date}
                </Text>
              </View>
            ) : null}
          </View>

          {spots !== null && (
            <View style={[styles.spotsBar, { backgroundColor: spots > 0 ? `${t.accentGreen}15` : `${t.textMuted}15` }]}>
              <Zap size={11} color={spots > 0 ? t.accentGreen : t.textMuted} strokeWidth={2} />
              <Text style={[styles.spotsText, { color: spots > 0 ? t.accentGreen : t.textMuted, fontFamily: t.fontBody }]}>
                {spots > 0 ? `${spots} spot${spots !== 1 ? 's' : ''} left` : 'Full — join waitlist'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB', borderColor: isDark ? t.border : '#E5E7EB' }]}>
        <Search size={16} color={t.textMuted} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary, fontFamily: t.fontBody }]}
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search offerings…"
          placeholderTextColor={t.textMuted}
        />
      </View>

      {/* Type filters */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterChip,
              { borderColor: typeFilter === f.id ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                backgroundColor: typeFilter === f.id ? `${t.accentPurple}15` : (isDark ? t.surfaceRaised : '#F9FAFB') },
            ]}
            onPress={() => setTypeFilter(f.id)}
          >
            <Text style={[styles.filterChipText, { color: typeFilter === f.id ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.accentPurple} />
          </View>
        )
        : loadError
        ? (
          <View style={styles.center}>
            <AlertCircle size={40} color={t.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>{loadError}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={{ marginTop: 12 }}>
              <Text style={[{ color: t.accentPurple, fontFamily: t.fontBodySemibold, fontSize: 15 }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )
        : (
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onRefresh={() => { setRefreshing(true); load(); }}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.empty}>
                <BookOpen size={40} color={t.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  No offerings available right now.
                </Text>
              </View>
            }
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar:          { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:        { flex: 1, fontSize: 15 },
  filterRow:          { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 4 },
  filterChip:         { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  filterChipText:     { fontSize: 13 },
  list:               { padding: 12, paddingBottom: 88 },
  card:               { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  thumbnail:          { width: '100%', height: 140, resizeMode: 'cover' },
  thumbnailPlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  cardBody:           { padding: 14 },
  cardTop:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  typeBadge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText:      { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  priceText:          { fontSize: 14 },
  title:              { fontSize: 16, marginBottom: 2 },
  coachName:          { fontSize: 13, marginBottom: 8 },
  metaRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:           { fontSize: 12, maxWidth: 160 },
  spotsBar:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start' },
  spotsText:          { fontSize: 12 },
  empty:              { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:          { fontSize: 15, textAlign: 'center' },
});
