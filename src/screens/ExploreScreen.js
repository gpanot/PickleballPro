/**
 * ExploreScreen — 5th bottom tab (student-facing)
 * Shows all public offerings. Filters by type and skill level.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, X, MapPin, Calendar, BookOpen, Zap, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import { getPublicOfferings, getNextOpenRun, getPriceRangeLabel, spotsRemaining, effectiveCapacity } from '../lib/offeringsApi';

const TYPE_FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'cohort', label: 'Cohorts' },
  { id: 'event',  label: 'Events' },
];

export default function ExploreScreen({ navigation }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [offerings,    setOfferings]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [searchQ,      setSearchQ]      = useState('');
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [loadError,    setLoadError]    = useState(null);

  const searchInputRef = useRef(null);
  const searchWidth = useRef(new Animated.Value(0)).current;

  const openSearch = () => {
    setSearchOpen(true);
    Animated.spring(searchWidth, {
      toValue: 1,
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start(() => searchInputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearchQ('');
    Animated.spring(searchWidth, {
      toValue: 0,
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start(() => setSearchOpen(false));
    searchInputRef.current?.blur();
  };

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
    const nextRun   = getNextOpenRun(item.runs ?? []);
    const price     = getPriceRangeLabel(item.runs ?? []);
    const spots     = nextRun ? spotsRemaining(nextRun, item.capacity_per_run) : null;
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

          <Text style={[styles.cardTitle, { color: t.textPrimary, fontFamily: t.fontHeading }]} numberOfLines={2}>
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

  // Right-side search control rendered inside the header bar
  const searchControl = (
    <View style={styles.headerRight}>
      {/* Animated expanding search field */}
      <Animated.View
        style={[
          styles.searchExpandable,
          {
            width: searchWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 180],
            }),
            opacity: searchWidth,
            backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6',
            borderColor: searchOpen ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
          },
        ]}
        pointerEvents={searchOpen ? 'auto' : 'none'}
      >
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: t.textPrimary, fontFamily: t.fontBody }]}
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search…"
          placeholderTextColor={t.textMuted}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQ.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQ('')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <X size={14} color={t.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Search icon / close icon */}
      <TouchableOpacity
        onPress={searchOpen ? closeSearch : openSearch}
        style={[styles.searchIconBtn, searchOpen && { backgroundColor: isDark ? t.border : '#EDE9F5' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {searchOpen
          ? <X size={20} color={t.accentPurple} strokeWidth={2} />
          : <Search size={20} color={t.textPrimary} strokeWidth={2} />
        }
      </TouchableOpacity>
    </View>
  );

  // Filter chips rendered as header children (below title row)
  const filterChips = (
    <View style={styles.filterRow}>
      {TYPE_FILTERS.map(f => (
        <TouchableOpacity
          key={f.id}
          style={[
            styles.filterChip,
            {
              borderColor: typeFilter === f.id ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
              backgroundColor: typeFilter === f.id ? `${t.accentPurple}15` : 'transparent',
            },
          ]}
          onPress={() => setTypeFilter(f.id)}
        >
          <Text style={[styles.filterChipText, { color: typeFilter === f.id ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold }]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        title="Explore"
        bordered
        rightAction={searchControl}
      >
        {filterChips}
      </ScreenHeaderShell>

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
              <Text style={{ color: t.accentPurple, fontFamily: t.fontBodySemibold, fontSize: 15 }}>Retry</Text>
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
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                <BookOpen size={40} color={t.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {searchQ.trim() ? 'No results for your search.' : 'No offerings available right now.'}
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
  // Header right-side search
  headerRight:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchExpandable:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, height: 34, overflow: 'hidden' },
  searchInput:        { flex: 1, fontSize: 14, paddingVertical: 0, minWidth: 0 },
  searchIconBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  // Filters
  filterRow:          { flexDirection: 'row', gap: 8, paddingTop: 2 },
  filterChip:         { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  filterChipText:     { fontSize: 13 },
  // List
  list:               { padding: 12, paddingBottom: 100 },
  card:               { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  thumbnail:          { width: '100%', height: 140, resizeMode: 'cover' },
  thumbnailPlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  cardBody:           { padding: 14 },
  cardTop:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  typeBadge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText:      { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  priceText:          { fontSize: 14 },
  cardTitle:          { fontSize: 16, marginBottom: 2 },
  coachName:          { fontSize: 13, marginBottom: 8 },
  metaRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:           { fontSize: 12, maxWidth: 160 },
  spotsBar:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start' },
  spotsText:          { fontSize: 12 },
  empty:              { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:          { fontSize: 15, textAlign: 'center' },
});
