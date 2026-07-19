import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getOfferingWithRuns,
  updateOffering,
  closeOfferingRun,
  deleteOffering,
  formatPrice,
  effectiveCapacity,
} from '../../../lib/offeringsApi';

const STATUS_COLOR = {
  draft:     { bg: '#F3F4F6', text: '#6B7280' },
  open:      { bg: '#D1FAE5', text: '#065F46' },
  full:      { bg: '#FEF3C7', text: '#92400E' },
  closed:    { bg: '#F3F4F6', text: '#6B7280' },
  completed: { bg: '#EDE9FE', text: '#5B21B6' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function OfferingDetailPanel({
  offeringId,
  onEdit,
  onViewRoster,
  onDeleted,
  onClose,
}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: d, error } = await getOfferingWithRuns(offeringId);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setData(d);
    }
    setLoading(false);
  };

  useEffect(() => { if (offeringId) load(); }, [offeringId]);

  const handleTogglePublish = async () => {
    const next = !data.offering.is_public;
    const { error } = await updateOffering({
      offeringId,
      isPublic: next,
      status: next ? 'open' : 'draft',
    });
    if (error) Alert.alert('Error', error.message);
    else load();
  };

  const handleCloseRun = (runId) => {
    Alert.alert(
      'Close run',
      'This will mark the run as closed. Existing enrollments are unaffected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close run',
          style: 'destructive',
          onPress: async () => {
            const { error } = await closeOfferingRun(runId);
            if (error) Alert.alert('Error', error.message);
            else load();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete offering',
      'This will cancel all open runs and hide this offering. Existing enrollments are preserved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteOffering(offeringId);
            if (error) Alert.alert('Error', error.message);
            else onDeleted?.();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={p.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  if (!data) return null;

  const { offering, runs } = data;

  return (
    <View style={p.container}>
      {/* Header */}
      <View style={p.header}>
        <TouchableOpacity onPress={onClose} style={p.closeBtn}>
          <Ionicons name="close-outline" size={22} color="#6B7280" />
        </TouchableOpacity>
        <Text style={p.title} numberOfLines={2}>{offering.title}</Text>
        <View style={p.headerActions}>
          <TouchableOpacity onPress={onEdit} style={[p.actionBtn, p.editBtn]}>
            <Ionicons name="pencil-outline" size={16} color="#7C3AED" />
            <Text style={p.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTogglePublish} style={[p.actionBtn, { backgroundColor: offering.is_public ? '#D1FAE5' : '#EDE9FE' }]}>
            <Ionicons name={offering.is_public ? 'eye-outline' : 'eye-off-outline'} size={16} color={offering.is_public ? '#065F46' : '#7C3AED'} />
            <Text style={[p.editBtnText, { color: offering.is_public ? '#065F46' : '#7C3AED' }]}>
              {offering.is_public ? 'Public' : 'Draft'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[p.actionBtn, p.deleteBtn]}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Metadata */}
        <View style={p.metaGrid}>
          {[
            { label: 'Type',     value: offering.type },
            { label: 'Status',   value: offering.status },
            { label: 'Location', value: offering.location || '—' },
            { label: 'Facility', value: offering.facility_name || '—' },
            { label: 'Capacity/run', value: String(offering.capacity_per_run) },
            { label: 'Skill range', value: offering.skill_level_min != null ? `${offering.skill_level_min} – ${offering.skill_level_max}` : '—' },
          ].map(({ label, value }) => (
            <View key={label} style={p.metaItem}>
              <Text style={p.metaLabel}>{label}</Text>
              <Text style={p.metaValue}>{value}</Text>
            </View>
          ))}
        </View>

        {offering.description ? (
          <Text style={p.description}>{offering.description}</Text>
        ) : null}

        {/* Runs */}
        <Text style={p.sectionTitle}>Runs ({runs.length})</Text>
        {runs.length === 0 && <Text style={p.emptyText}>No runs yet.</Text>}
        {runs.map(({ run, confirmed_count, waitlist_count }) => {
          const cap = effectiveCapacity(run, offering.capacity_per_run);
          const sc = STATUS_COLOR[run.status] ?? STATUS_COLOR.draft;

          return (
            <View key={run.id} style={p.runCard}>
              <View style={p.runTop}>
                <Text style={p.runDates}>{run.start_date} → {run.end_date}</Text>
                <View style={[p.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[p.statusText, { color: sc.text }]}>{run.status}</Text>
                </View>
              </View>
              <Text style={p.runSchedule}>{run.session_schedule}</Text>
              <View style={p.runStats}>
                <Text style={p.runStat}>
                  <Text style={p.runStatBold}>{confirmed_count}</Text> confirmed
                </Text>
                <Text style={p.runStat}>
                  <Text style={p.runStatBold}>{waitlist_count}</Text> waitlisted
                </Text>
                <Text style={p.runStat}>
                  <Text style={p.runStatBold}>{cap - run.spots_filled}</Text> spots left
                </Text>
                <Text style={[p.runStat, { marginLeft: 'auto' }]}>
                  {formatPrice(run.price_amount, run.price_currency)}
                </Text>
              </View>
              <View style={p.runActions}>
                <TouchableOpacity
                  style={[p.runBtn, { backgroundColor: '#EDE9FE' }]}
                  onPress={() => onViewRoster(run.id, run.start_date)}
                >
                  <Ionicons name="people-outline" size={14} color="#7C3AED" />
                  <Text style={[p.runBtnText, { color: '#7C3AED' }]}>Roster</Text>
                </TouchableOpacity>
                {run.status === 'open' || run.status === 'full' ? (
                  <TouchableOpacity
                    style={[p.runBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleCloseRun(run.id)}
                  >
                    <Ionicons name="lock-closed-outline" size={14} color="#EF4444" />
                    <Text style={[p.runBtnText, { color: '#EF4444' }]}>Close</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const p = {
  container:   { flex: 1, backgroundColor: '#fff' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FAFAFA' },
  closeBtn:    { alignSelf: 'flex-end', padding: 4, marginBottom: 4 },
  title:       { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtn:     { backgroundColor: '#EDE9FE' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  deleteBtn:   { backgroundColor: '#FEE2E2' },
  metaGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginBottom: 14 },
  metaItem:    { width: '50%', paddingBottom: 10, paddingRight: 8 },
  metaLabel:   { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  metaValue:   { fontSize: 14, color: '#111827' },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  emptyText:   { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  runCard:     { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  runTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  runDates:    { fontSize: 14, fontWeight: '600', color: '#111827' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  runSchedule: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  runStats:    { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  runStat:     { fontSize: 13, color: '#6B7280' },
  runStatBold: { fontWeight: '700', color: '#111827' },
  runActions:  { flexDirection: 'row', gap: 8 },
  runBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  runBtnText:  { fontSize: 13, fontWeight: '600' },
};
