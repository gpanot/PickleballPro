import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PlusCircle, BookOpen, Calendar, Users, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { getCoachOfferings, getNextOpenRun, getPriceRangeLabel } from '../../../lib/offeringsApi';

const STATUS_COLOR = {
  draft:     '#9CA3AF',
  open:      '#10B981',
  completed: '#6366F1',
  cancelled: '#EF4444',
};

export default function OfferingsListScreen({ navigation }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await getCoachOfferings();
    if (error) {
      Alert.alert('Error', error.message || 'Failed to load offerings.');
    } else {
      setOfferings(data ?? []);
    }
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
    const nextRun  = getNextOpenRun(item.runs ?? []);
    const price    = getPriceRangeLabel(item.runs ?? []);
    const runCount = (item.runs ?? []).filter(r => r.status !== 'closed').length;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}
        onPress={() => navigation.navigate('OfferingDetail', { offeringId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <BookOpen size={16} color={t.accentPurple} strokeWidth={2} />
            <Text
              style={[styles.title, { color: t.textPrimary, fontFamily: t.fontHeading }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={t.textMuted} strokeWidth={2} />
            <Text style={[styles.metaText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              {nextRun ? nextRun.start_date : 'No open runs'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={13} color={t.textMuted} strokeWidth={2} />
            <Text style={[styles.metaText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              {runCount} run{runCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {price ? (
            <Text style={[styles.price, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
              {price}
            </Text>
          ) : null}
        </View>

        <ChevronRight size={16} color={t.textMuted} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.accentPurple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <FlatList
        data={offerings}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BookOpen size={40} color={t.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              No offerings yet.{'\n'}Tap + to create your first one.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: t.accentPurple }]}
        onPress={() => navigation.navigate('CreateOfferingStep1')}
        activeOpacity={0.85}
      >
        <PlusCircle size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { padding: 16, paddingBottom: 96 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  title:       { fontSize: 15, flex: 1 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:   { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:    { fontSize: 13 },
  price:       { marginLeft: 'auto', fontSize: 13 },
  chevron:     { position: 'absolute', right: 14, top: 14 },
  empty:       { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:   { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
