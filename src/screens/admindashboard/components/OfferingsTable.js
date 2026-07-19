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

export default function OfferingsTable({
  sessionRole,
  onSelectOffering,
  onCreateOffering,
  styles: s = {},
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
      <View style={[rowStyle.toolbar]}>
        <View style={rowStyle.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
          <TextInput
            style={rowStyle.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search offerings…"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity
          style={rowStyle.createBtn}
          onPress={onCreateOffering}
        >
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={rowStyle.createBtnText}>New Offering</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRefreshKey(k => k + 1)} style={rowStyle.refreshBtn}>
          <Ionicons name="refresh-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {/* Table header */}
          <View style={rowStyle.headerRow}>
            {['Title', 'Type', 'Runs', 'Next Run', 'Price', 'Status', ''].map(h => (
              <Text key={h} style={[rowStyle.headerCell, h === 'Title' && { flex: 2 }]}>{h}</Text>
            ))}
          </View>

          {filtered.length === 0 && (
            <View style={rowStyle.emptyWrap}>
              <Ionicons name="albums-outline" size={32} color="#D1D5DB" />
              <Text style={rowStyle.emptyText}>No offerings found</Text>
            </View>
          )}

          {filtered.map(o => {
            const nextRun  = getNextOpenRun(o.runs ?? []);
            const price    = getPriceRangeLabel(o.runs ?? []);
            const runCount = (o.runs ?? []).filter(r => r.status !== 'cancelled').length;
            const sc       = STATUS_COLOR[o.status] ?? STATUS_COLOR.draft;

            return (
              <TouchableOpacity
                key={o.id}
                style={rowStyle.dataRow}
                onPress={() => onSelectOffering(o)}
                activeOpacity={0.7}
              >
                <Text style={[rowStyle.cell, rowStyle.titleCell]} numberOfLines={1}>{o.title}</Text>
                <Text style={rowStyle.cell}>{o.type}</Text>
                <Text style={rowStyle.cell}>{runCount}</Text>
                <Text style={rowStyle.cell}>{nextRun ? nextRun.start_date : '—'}</Text>
                <Text style={rowStyle.cell}>{price || '—'}</Text>
                <View style={rowStyle.cell}>
                  <View style={[rowStyle.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[rowStyle.statusText, { color: sc.text }]}>{o.status}</Text>
                  </View>
                </View>
                <View style={[rowStyle.cell, rowStyle.actionsCell]}>
                  <Ionicons name="chevron-forward-outline" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const rowStyle = {
  toolbar:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchWrap:    { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchInput:   { flex: 1, fontSize: 14, color: '#111827', outlineStyle: Platform.OS === 'web' ? 'none' : undefined },
  createBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  refreshBtn:    { padding: 8 },
  headerRow:     { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 10 },
  headerCell:    { flex: 1, fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  dataRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cell:          { flex: 1, fontSize: 14, color: '#111827' },
  titleCell:     { flex: 2, fontWeight: '500' },
  actionsCell:   { flex: 0, width: 32, alignItems: 'center' },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  statusText:    { fontSize: 12, fontWeight: '600' },
  emptyWrap:     { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText:     { fontSize: 14, color: '#9CA3AF' },
};
