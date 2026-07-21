import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCoachOfferings, getNextOpenRun, getPriceRangeLabel } from '../../../lib/offeringsApi';

const STATUS_COLOR = {
  draft:     { bg: '#F3F4F6', text: '#6B7280' },
  open:      { bg: '#D1FAE5', text: '#065F46' },
  completed: { bg: '#EDE9FE', text: '#5B21B6' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

const TYPE_ICON = { cohort: 'people-outline', event: 'calendar-outline' };

export default function OfferingsTable({
  sessionRole,
  isMobile = false,
  onSelectOffering,
  onCreateOffering,
}) {
  const [offerings,  setOfferings]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    getCoachOfferings().then(({ data, error }) => {
      if (!error) setOfferings(data ?? []);
      setLoading(false);
    });
  }, [refreshKey]);

  const filtered = offerings.filter(o =>
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      <View style={s.toolbar}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search offerings…"
            placeholderTextColor="#9CA3AF"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.createBtn} onPress={onCreateOffering}>
          <Ionicons name="add-outline" size={18} color="#fff" />
          {!isMobile && <Text style={s.createBtnText}>New Offering</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRefreshKey(k => k + 1)} style={s.iconBtn}>
          <Ionicons name="refresh-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="albums-outline" size={36} color="#D1D5DB" />
          <Text style={s.emptyTitle}>No offerings found</Text>
          <Text style={s.emptyHint}>
            {search ? 'Try a different search term.' : 'Create your first offering above.'}
          </Text>
        </View>
      ) : isMobile ? (
        /* ── Mobile: card list ── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 10 }}>
          {filtered.map(o => <OfferingCard key={o.id} offering={o} onPress={() => onSelectOffering(o)} />)}
        </ScrollView>
      ) : (
        /* ── Desktop: table ── */
        <ScrollView style={{ flex: 1 }}>
          <View style={s.headerRow}>
            {['Title', 'Type', 'Runs', 'Next run', 'Price', 'Status', ''].map((h, i) => (
              <Text key={h + i} style={[s.headerCell, h === 'Title' && { flex: 2 }]}>{h}</Text>
            ))}
          </View>
          {filtered.map(o => <OfferingRow key={o.id} offering={o} onPress={() => onSelectOffering(o)} />)}
        </ScrollView>
      )}
    </View>
  );
}

/* ── Card (mobile) ── */
function OfferingCard({ offering: o, onPress }) {
  const nextRun  = getNextOpenRun(o.runs ?? []);
  const price    = getPriceRangeLabel(o.runs ?? []);
  const runCount = (o.runs ?? []).filter(r => r.status !== 'cancelled').length;
  const sc       = STATUS_COLOR[o.status] ?? STATUS_COLOR.draft;
  const icon     = TYPE_ICON[o.type] ?? 'albums-outline';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.cardTop}>
        <View style={s.cardIconWrap}>
          <Ionicons name={icon} size={18} color="#7C3AED" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.cardTitle} numberOfLines={2}>{o.title}</Text>
          <Text style={s.cardType}>{o.type}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusText, { color: sc.text }]}>{o.status}</Text>
        </View>
      </View>
      <View style={s.cardMeta}>
        <View style={s.cardMetaItem}>
          <Ionicons name="repeat-outline" size={13} color="#9CA3AF" />
          <Text style={s.cardMetaText}>{runCount} run{runCount !== 1 ? 's' : ''}</Text>
        </View>
        {nextRun && (
          <View style={s.cardMetaItem}>
            <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
            <Text style={s.cardMetaText}>{nextRun.start_date}</Text>
          </View>
        )}
        {price ? (
          <View style={s.cardMetaItem}>
            <Ionicons name="pricetag-outline" size={13} color="#9CA3AF" />
            <Text style={s.cardMetaText}>{price}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward-outline" size={16} color="#D1D5DB" style={{ position: 'absolute', right: 12, top: '50%' }} />
    </TouchableOpacity>
  );
}

/* ── Row (desktop) ── */
function OfferingRow({ offering: o, onPress }) {
  const nextRun  = getNextOpenRun(o.runs ?? []);
  const price    = getPriceRangeLabel(o.runs ?? []);
  const runCount = (o.runs ?? []).filter(r => r.status !== 'cancelled').length;
  const sc       = STATUS_COLOR[o.status] ?? STATUS_COLOR.draft;

  return (
    <TouchableOpacity style={s.dataRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.cell, s.titleCell]} numberOfLines={1}>{o.title}</Text>
      <Text style={s.cell}>{o.type}</Text>
      <Text style={s.cell}>{runCount}</Text>
      <Text style={s.cell}>{nextRun ? nextRun.start_date : '—'}</Text>
      <Text style={s.cell}>{price || '—'}</Text>
      <View style={s.cell}>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusText, { color: sc.text }]}>{o.status}</Text>
        </View>
      </View>
      <View style={[s.cell, s.actionsCell]}>
        <Ionicons name="chevron-forward-outline" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const s = {
  toolbar:       {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexWrap: 'nowrap',
  },
  searchWrap:    {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 0,
  },
  searchInput:   {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  createBtn:     {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexShrink: 0,
  },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  iconBtn:       { padding: 8, flexShrink: 0 },

  // Table (desktop)
  headerRow:     {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerCell:    { flex: 1, fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  dataRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cell:          { flex: 1, fontSize: 14, color: '#111827' },
  titleCell:     { flex: 2, fontWeight: '500' },
  actionsCell:   { flex: 0, width: 32, alignItems: 'center' },

  // Card (mobile)
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    paddingRight: 32,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
      : { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }),
  },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  cardIconWrap:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle:     { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 20 },
  cardType:      { fontSize: 12, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
  cardMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardMetaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText:  { fontSize: 12, color: '#6B7280' },

  // Shared
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  statusText:    { fontSize: 11, fontWeight: '600' },

  // States
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:    { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptyHint:     { fontSize: 13, color: '#9CA3AF' },
};
