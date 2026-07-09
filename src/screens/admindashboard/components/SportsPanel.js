import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

// ─── helpers ────────────────────────────────────────────────────────────────

const RATING_TYPES = [
  { value: 'dupr',        label: 'DUPR (2.0 – 8.0)' },
  { value: 'padel_level', label: 'Padel Level (1.0 – 10.0)' },
  { value: 'self',        label: 'Self-assessed (1 – 5)' },
  { value: 'none',        label: 'No rating system' },
];

const DEFAULT_RATING_SYSTEMS = {
  dupr:        { type: 'dupr',        label: 'DUPR',   min: 2.0,  max: 8.0,  tiers: [{ label: 'Beginner', min: 2.0, max: 3.0 }, { label: 'Intermediate', min: 3.0, max: 4.0 }, { label: 'Advanced', min: 4.0, max: 5.0 }, { label: 'Pro', min: 5.0, max: 8.0 }] },
  padel_level: { type: 'padel_level', label: 'Level',  min: 1.0,  max: 10.0, tiers: [{ label: 'Beginner', min: 1.0, max: 3.5 }, { label: 'Intermediate', min: 3.5, max: 5.5 }, { label: 'Advanced', min: 5.5, max: 7.5 }, { label: 'Pro', min: 7.5, max: 10.0 }] },
  self:        { type: 'self',        label: 'Level',  min: 1.0,  max: 5.0,  tiers: [{ label: 'Beginner', min: 1.0, max: 2.0 }, { label: 'Intermediate', min: 2.0, max: 3.5 }, { label: 'Advanced', min: 3.5, max: 5.0 }] },
  none:        { type: 'none',        label: '',       min: 0,    max: 0,    tiers: [] },
};

const EMPTY_FORM = {
  slug: '',
  name: '',
  ratingType: 'self',
  is_active: true,
};

// ─── component ──────────────────────────────────────────────────────────────

export default function SportsPanel({ sessionRole, academyId }) {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Add / edit form
  const [showForm, setShowForm] = useState(false);
  const [editingSport, setEditingSport] = useState(null); // null = new
  const [form, setForm] = useState(EMPTY_FORM);

  // Superadmin guard
  const isSuperAdmin = !academyId && sessionRole !== 'coach' && sessionRole !== 'manager';

  if (!isSuperAdmin) {
    return (
      <View style={styles.panelContainer}>
        <View style={styles.emptyWrap}>
          <Ionicons name="lock-closed-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Superadmin only</Text>
          <Text style={styles.emptySubText}>Sport management is only available to platform superadmins.</Text>
        </View>
      </View>
    );
  }

  // ── data ────────────────────────────────────────────────────────────────

  const loadSports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('sports')
        .select('*')
        .order('created_at', { ascending: true });
      if (err) throw err;
      setSports(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSports(); }, [loadSports]);

  // ── form helpers ─────────────────────────────────────────────────────────

  const openNewForm = () => {
    setEditingSport(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (sport) => {
    setEditingSport(sport);
    setForm({
      slug: sport.slug,
      name: sport.name,
      ratingType: sport.rating_system?.type || 'self',
      is_active: sport.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSport(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '_');
    const name = form.name.trim();
    if (!slug) { Alert.alert('Validation', 'Slug is required (e.g. "tennis").'); return; }
    if (!name) { Alert.alert('Validation', 'Display name is required.'); return; }
    if (!/^[a-z0-9_]+$/.test(slug)) {
      Alert.alert('Validation', 'Slug must be lowercase letters, numbers, and underscores only.');
      return;
    }

    const ratingSystem = DEFAULT_RATING_SYSTEMS[form.ratingType] || DEFAULT_RATING_SYSTEMS.self;

    setSaving(true);
    try {
      if (editingSport) {
        // Update existing
        const { error: err } = await supabase
          .from('sports')
          .update({ name, rating_system: ratingSystem, is_active: form.is_active })
          .eq('id', editingSport.id);
        if (err) throw err;
      } else {
        // Insert new
        const { error: err } = await supabase
          .from('sports')
          .insert({ slug, name, rating_system: ratingSystem, is_active: form.is_active });
        if (err) {
          if (err.message?.includes('unique') || err.code === '23505') {
            Alert.alert('Duplicate', `A sport with slug "${slug}" already exists.`);
            return;
          }
          throw err;
        }
      }
      await loadSports();
      closeForm();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (sport) => {
    try {
      const { error: err } = await supabase
        .from('sports')
        .update({ is_active: !sport.is_active })
        .eq('id', sport.id);
      if (err) throw err;
      setSports(prev => prev.map(s => s.id === sport.id ? { ...s, is_active: !s.is_active } : s));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.panelContainer}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Sport Management</Text>
          <Text style={styles.panelSubtitle}>Add and configure sports available on the platform</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openNewForm} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Sport</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sports.length}</Text>
          <Text style={styles.statLabel}>Total Sports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sports.filter(s => s.is_active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sports.filter(s => !s.is_active).length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color="#18181b" />
          </View>
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            <Text style={[styles.emptyText, { color: '#EF4444' }]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadSports}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : sports.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="tennisball-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No sports yet</Text>
            <Text style={styles.emptySubText}>Click "Add Sport" to create the first one.</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 1.2 }]}>Name</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>Slug</Text>
              <Text style={[styles.thCell, { flex: 1.5 }]}>Rating System</Text>
              <Text style={[styles.thCell, { flex: 0.7 }]}>Status</Text>
              <Text style={[styles.thCell, { flex: 0.8, textAlign: 'right' }]}>Actions</Text>
            </View>

            {/* Rows */}
            {sports.map((sport, idx) => (
              <View
                key={sport.id}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
              >
                <View style={[styles.tdCell, { flex: 1.2 }]}>
                  <Text style={styles.sportName}>{sport.name}</Text>
                </View>
                <View style={[styles.tdCell, { flex: 1 }]}>
                  <View style={styles.slugBadge}>
                    <Text style={styles.slugText}>{sport.slug}</Text>
                  </View>
                </View>
                <View style={[styles.tdCell, { flex: 1.5 }]}>
                  <Text style={styles.ratingLabel}>
                    {sport.rating_system?.label || sport.rating_system?.type || '—'}
                    {sport.rating_system?.min != null
                      ? `  (${sport.rating_system.min} – ${sport.rating_system.max})`
                      : ''}
                  </Text>
                  <Text style={styles.tierCount}>
                    {sport.rating_system?.tiers?.length
                      ? `${sport.rating_system.tiers.length} tiers`
                      : 'No tiers'}
                  </Text>
                </View>
                <View style={[styles.tdCell, { flex: 0.7 }]}>
                  <Switch
                    value={sport.is_active}
                    onValueChange={() => handleToggleActive(sport)}
                    trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
                    thumbColor={sport.is_active ? '#059669' : '#9CA3AF'}
                  />
                  <Text style={[styles.statusText, sport.is_active ? styles.statusActive : styles.statusInactive]}>
                    {sport.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={[styles.tdCell, { flex: 0.8, alignItems: 'flex-end' }]}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditForm(sport)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={15} color="#4B5563" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
          <Text style={styles.infoNoteText}>
            After adding a sport here, add its config entry in{' '}
            <Text style={styles.infoNoteCode}>src/lib/sportConfig.js</Text>{' '}
            and a skill taxonomy in{' '}
            <Text style={styles.infoNoteCode}>src/data/sports/[slug]/skills.json</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* ── Add / Edit form modal ─────────────────────────────────────────── */}
      {showForm && (
        <View style={styles.formOverlay}>
          <View style={styles.formCard}>
            {/* Form header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingSport ? `Edit: ${editingSport.name}` : 'New Sport'}</Text>
              <TouchableOpacity onPress={closeForm} style={styles.formClose}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formBody}>
              {/* Slug — only editable on create */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Slug <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.fieldInput, !!editingSport && styles.fieldInputDisabled]}
                  value={form.slug}
                  onChangeText={v => setForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. tennis"
                  placeholderTextColor="#9CA3AF"
                  editable={!editingSport}
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHint}>
                  {editingSport
                    ? 'Slug cannot be changed after creation.'
                    : 'Lowercase, letters/numbers/underscores only. Cannot be changed later.'}
                </Text>
              </View>

              {/* Display name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  placeholder="e.g. Tennis"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Rating system */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Rating System</Text>
                <View style={styles.ratingPicker}>
                  {RATING_TYPES.map(rt => (
                    <TouchableOpacity
                      key={rt.value}
                      style={[styles.ratingOption, form.ratingType === rt.value && styles.ratingOptionActive]}
                      onPress={() => setForm(f => ({ ...f, ratingType: rt.value }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.ratingOptionText, form.ratingType === rt.value && styles.ratingOptionTextActive]}>
                        {rt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {form.ratingType !== 'none' && (
                  <View style={styles.ratingPreview}>
                    <Ionicons name="information-circle-outline" size={13} color="#6B7280" />
                    <Text style={styles.ratingPreviewText}>
                      Range: {DEFAULT_RATING_SYSTEMS[form.ratingType]?.min} – {DEFAULT_RATING_SYSTEMS[form.ratingType]?.max}
                      {'  '}|{'  '}
                      {DEFAULT_RATING_SYSTEMS[form.ratingType]?.tiers?.length} tiers
                    </Text>
                  </View>
                )}
              </View>

              {/* Active toggle */}
              <View style={styles.fieldGroupRow}>
                <Text style={styles.fieldLabel}>Active on platform</Text>
                <Switch
                  value={form.is_active}
                  onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
                  trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
                  thumbColor={form.is_active ? '#059669' : '#9CA3AF'}
                />
              </View>
            </ScrollView>

            {/* Form actions */}
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeForm} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveBtnText}>{editingSport ? 'Save Changes' : 'Create Sport'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panelContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    zIndex: 10,
    ...(Platform.OS === 'web' && { position: 'relative' }),
  },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  panelSubtitle: { fontSize: 13, color: '#71717a', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 24,
  },
  statCard: { alignItems: 'center', minWidth: 60 },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#18181b' },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 2 },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 24, gap: 16 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#6B7280', textAlign: 'center', maxWidth: 320 },
  retryBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f4f4f5', borderRadius: 6 },
  retryBtnText: { fontSize: 13, fontWeight: '600', color: '#18181b' },

  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  thCell: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f4f4f5' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tdCell: { justifyContent: 'center', paddingRight: 8 },

  sportName: { fontSize: 14, fontWeight: '600', color: '#18181b' },
  slugBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  slugText: { fontSize: 12, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', color: '#475569' },
  ratingLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  tierCount: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  statusActive: { color: '#059669' },
  statusInactive: { color: '#9CA3AF' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#e4e4e7', backgroundColor: '#fff', ...(Platform.OS === 'web' && { cursor: 'pointer' }) },
  editBtnText: { fontSize: 12, fontWeight: '500', color: '#374151' },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
  },
  infoNoteText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  infoNoteCode: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', fontWeight: '700' },

  // ── Form overlay ──────────────────────────────────────────────────────────
  formOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: Platform.OS === 'web' ? 480 : '90%',
    maxWidth: 480,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: '#18181b' },
  formClose: { padding: 4 },
  formBody: { paddingHorizontal: 20, paddingTop: 16 },
  fieldGroup: { marginBottom: 18 },
  fieldGroupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  fieldInputDisabled: { backgroundColor: '#f9fafb', color: '#9CA3AF' },
  fieldHint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  ratingPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#f9fafb' },
  ratingOptionActive: { borderColor: '#18181b', backgroundColor: '#18181b' },
  ratingOptionText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  ratingOptionTextActive: { color: '#fff' },
  ratingPreview: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 6 },
  ratingPreviewText: { fontSize: 12, color: '#166534' },

  formActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBtn: { flex: 1.5, paddingVertical: 10, borderRadius: 8, backgroundColor: '#18181b', alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#9CA3AF' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
