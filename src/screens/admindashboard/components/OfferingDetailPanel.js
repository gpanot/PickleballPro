import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
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
  isMobile = false,
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
    if (error) Alert.alert('Error', error.message);
    else setData(d);
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
  const sc = STATUS_COLOR[offering.status] ?? STATUS_COLOR.draft;

  return (
    <View style={p.container}>
      {/* ── Header ── */}
      <View style={p.header}>
        <View style={p.headerTop}>
          {/* Back / close */}
          <TouchableOpacity onPress={onClose} style={p.closeBtn} hitSlop={8}>
            <Ionicons
              name={isMobile ? 'arrow-back-outline' : 'close-outline'}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>

          {/* Status badge */}
          <View style={[p.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[p.statusText, { color: sc.text }]}>{offering.status}</Text>
          </View>

          {/* Spacer + actions */}
          <View style={{ flex: 1 }} />
          <View style={p.headerActions}>
            <TouchableOpacity onPress={onEdit} style={[p.actionBtn, p.editBtn]}>
              <Ionicons name="pencil-outline" size={16} color="#7C3AED" />
              {!isMobile && <Text style={p.editBtnText}>Edit</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTogglePublish}
              style={[p.actionBtn, { backgroundColor: offering.is_public ? '#D1FAE5' : '#EDE9FE' }]}
            >
              <Ionicons
                name={offering.is_public ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color={offering.is_public ? '#065F46' : '#7C3AED'}
              />
              {!isMobile && (
                <Text style={[p.editBtnText, { color: offering.is_public ? '#065F46' : '#7C3AED' }]}>
                  {offering.is_public ? 'Public' : 'Draft'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[p.actionBtn, p.deleteBtn]}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={p.title} numberOfLines={3}>{offering.title}</Text>
      </View>

      {/* ── Body ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={p.body}>
        {/* Metadata grid — 2 cols on mobile, 3 cols on desktop */}
        <View style={[p.metaGrid, isMobile && p.metaGridMobile]}>
          {[
            { label: 'Type',         value: offering.type },
            { label: 'Location',     value: offering.location || '—' },
            { label: 'Facility',     value: offering.facility_name || '—' },
            { label: 'Spots / run',  value: String(offering.capacity_per_run) },
            {
              label: 'Skill range',
              value: offering.skill_level_min != null
                ? `${offering.skill_level_min} – ${offering.skill_level_max}`
                : '—',
            },
          ].map(({ label, value }) => (
            <View key={label} style={[p.metaItem, isMobile && p.metaItemMobile]}>
              <Text style={p.metaLabel}>{label}</Text>
              <Text style={p.metaValue}>{value}</Text>
            </View>
          ))}
        </View>

        {offering.description ? (
          <View style={p.descBox}>
            <Text style={p.description}>{offering.description}</Text>
          </View>
        ) : null}

        {/* Runs */}
        <View style={p.sectionHeader}>
          <Text style={p.sectionTitle}>Runs</Text>
          <View style={p.runCountBadge}>
            <Text style={p.runCountText}>{runs.length}</Text>
          </View>
        </View>

        {runs.length === 0 && (
          <Text style={p.emptyText}>No runs yet.</Text>
        )}

        {runs.map(({ run, confirmed_count, waitlist_count }) => {
          const cap = effectiveCapacity(run, offering.capacity_per_run);
          const rsc = STATUS_COLOR[run.status] ?? STATUS_COLOR.draft;
          const spotsLeft = cap - run.spots_filled;

          return (
            <View key={run.id} style={p.runCard}>
              {/* Run header */}
              <View style={p.runTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={p.runDates} numberOfLines={1}>
                    {run.start_date} → {run.end_date}
                  </Text>
                  <Text style={p.runSchedule} numberOfLines={2}>{run.session_schedule}</Text>
                </View>
                <View style={[p.statusBadge, { backgroundColor: rsc.bg, marginLeft: 8 }]}>
                  <Text style={[p.statusText, { color: rsc.text }]}>{run.status}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={p.runStats}>
                <StatChip icon="checkmark-circle-outline" color="#10B981" value={confirmed_count} label="confirmed" />
                <StatChip icon="time-outline" color="#F59E0B" value={waitlist_count} label="waitlisted" />
                <StatChip icon="person-add-outline" color="#3B82F6" value={spotsLeft} label="spots left" />
                <View style={{ flex: 1 }} />
                <Text style={p.priceText}>{formatPrice(run.price_amount, run.price_currency)}</Text>
              </View>

              {/* Actions */}
              <View style={p.runActions}>
                <TouchableOpacity
                  style={[p.runBtn, { backgroundColor: '#EDE9FE' }]}
                  onPress={() => onViewRoster(run.id, run.start_date)}
                >
                  <Ionicons name="people-outline" size={14} color="#7C3AED" />
                  <Text style={[p.runBtnText, { color: '#7C3AED' }]}>Roster</Text>
                </TouchableOpacity>
                {(run.status === 'open' || run.status === 'full') && (
                  <TouchableOpacity
                    style={[p.runBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleCloseRun(run.id)}
                  >
                    <Ionicons name="lock-closed-outline" size={14} color="#EF4444" />
                    <Text style={[p.runBtnText, { color: '#EF4444' }]}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StatChip({ icon, color, value, label }) {
  return (
    <View style={p.statChip}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={p.statChipText}>
        <Text style={{ fontWeight: '700', color: '#111827' }}>{value}</Text>
        {' '}{label}
      </Text>
    </View>
  );
}

const p = {
  container:    { flex: 1, backgroundColor: '#fff' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body:         { padding: 16, paddingBottom: 40 },

  // Header
  header:       {
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  headerTop:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  closeBtn:     { padding: 2 },
  title:        { fontSize: 16, fontWeight: '700', color: '#111827', lineHeight: 22 },

  headerActions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn:    {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editBtn:      { backgroundColor: '#EDE9FE' },
  editBtnText:  { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  deleteBtn:    { backgroundColor: '#FEE2E2' },

  // Status badge
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  statusText:   { fontSize: 11, fontWeight: '600' },

  // Meta grid
  metaGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  metaGridMobile: {},
  metaItem:     { width: '33.33%', paddingBottom: 12, paddingRight: 8 },
  metaItemMobile: { width: '50%' },
  metaLabel:    { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  metaValue:    { fontSize: 14, color: '#111827', fontWeight: '500' },

  // Description
  descBox:      { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  description:  { fontSize: 14, color: '#4B5563', lineHeight: 20 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  sectionTitle:  { fontSize: 14, fontWeight: '700', color: '#374151' },
  runCountBadge: { backgroundColor: '#EDE9FE', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  runCountText:  { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  emptyText:    { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },

  // Run card
  runCard:      { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  runTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  runDates:     { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  runSchedule:  { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  // Run stats
  runStats:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'center' },
  statChip:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statChipText: { fontSize: 12, color: '#6B7280' },
  priceText:    { fontSize: 13, fontWeight: '700', color: '#111827' },

  // Run actions
  runActions:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  runBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7 },
  runBtnText:   { fontSize: 13, fontWeight: '600' },
};
