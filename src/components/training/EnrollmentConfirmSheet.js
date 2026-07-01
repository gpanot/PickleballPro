import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, AlertTriangle } from 'lucide-react-native';

/**
 * Bottom-sheet style modal for confirming enrollment in a training track.
 *
 * Props:
 *   visible         {boolean}
 *   program         {object}  – the program being enrolled
 *   initialRole     {'primary'|'skill_1'|'skill_2'|null} – pre-selected role
 *   existingPrimary {object|null} – current primary track (for replace warning)
 *   skillSlotsFull  {boolean}
 *   onConfirm       {function(role)} – called with the chosen role
 *   onCancel        {function}
 *   loading         {boolean}
 *
 * If `initialRole` is provided the role picker is hidden (entry point already chose it).
 * If `initialRole` is null, the role picker (Primary / Skill focus) is shown.
 */
export default function EnrollmentConfirmSheet({
  visible,
  program,
  initialRole = 'primary',
  existingPrimary = null,
  skillSlotsFull = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(initialRole || 'primary');

  // Sync when sheet is re-opened with a different initialRole
  React.useEffect(() => {
    setSelectedRole(initialRole || 'primary');
  }, [initialRole, visible]);

  if (!program) return null;

  const isPrimary = selectedRole === 'primary';
  const willReplacePrimary = isPrimary && existingPrimary && existingPrimary.program.id !== program.id;

  const totalSessions = (program.routines || []).length;
  const totalExercises = (program.routines || []).reduce(
    (acc, r) => acc + (r.exercises || []).length,
    0
  );
  const totalMinutes = (program.routines || []).reduce(
    (acc, r) => acc + (r.time_estimate_minutes || 0),
    0
  );

  const ctaLabel = isPrimary
    ? `Set as primary focus`
    : `Add as skill focus`;

  const showRolePicker = initialRole === null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Program preview */}
          <View style={styles.previewRow}>
            {program.thumbnail_url ? (
              <Image source={{ uri: program.thumbnail_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Target size={28} color="#4338CA" strokeWidth={2} />
              </View>
            )}
            <View style={styles.previewText}>
              <Text style={styles.programName} numberOfLines={2}>{program.name}</Text>
              {program.description ? (
                <Text style={styles.programDesc} numberOfLines={2}>
                  {program.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          {totalSessions > 0 && (
            <View style={styles.statsRow}>
              <StatPill label={`${totalSessions} sessions`} />
              {totalExercises > 0 && <StatPill label={`${totalExercises} exercises`} />}
              {totalMinutes > 0 && <StatPill label={`~${totalMinutes} min`} />}
            </View>
          )}

          {/* Role picker (Library entry only) */}
          {showRolePicker && (
            <View style={styles.rolePicker}>
              <Text style={styles.roleLabel}>Add as</Text>
              <TouchableOpacity
                style={[styles.roleOption, selectedRole === 'primary' && styles.roleOptionSelected]}
                onPress={() => setSelectedRole('primary')}
              >
                <View style={[styles.radio, selectedRole === 'primary' && styles.radioSelected]} />
                <View>
                  <Text style={styles.roleOptionTitle}>Primary focus</Text>
                  <Text style={styles.roleOptionSub}>Your main training program</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole !== 'primary' && styles.roleOptionSelected,
                  skillSlotsFull && styles.roleOptionDisabled,
                ]}
                onPress={() => !skillSlotsFull && setSelectedRole('skill_1')}
              >
                <View style={[styles.radio, selectedRole !== 'primary' && !skillSlotsFull && styles.radioSelected]} />
                <View>
                  <Text style={[styles.roleOptionTitle, skillSlotsFull && styles.textMuted]}>
                    Skill focus
                  </Text>
                  <Text style={styles.roleOptionSub}>
                    {skillSlotsFull ? 'Both skill slots are in use' : 'A targeted skill track (up to 2)'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Replace warning */}
          {willReplacePrimary && (
            <View style={styles.warning}>
              <View style={styles.warningRow}>
                <AlertTriangle size={16} color="#78350F" strokeWidth={2.5} />
                <Text style={styles.warningText}>
                  This replaces{' '}
                  <Text style={styles.warningBold}>{existingPrimary.program.name}</Text>
                  {' '}as your primary focus. Your progress is saved; the old track moves to archive.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={() => onConfirm(selectedRole)}
          disabled={loading}
          activeOpacity={0.85}
          accessibilityLabel={ctaLabel}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Start training</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function StatPill({ label }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 14,
  },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  thumbPlaceholder: {
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { flex: 1 },
  programName: { fontSize: 17, fontWeight: '700', color: '#111827', lineHeight: 24 },
  programDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  rolePicker: { marginBottom: 16 },
  roleLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  roleOptionSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  roleOptionDisabled: { opacity: 0.5 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: { borderColor: '#6366F1', backgroundColor: '#6366F1' },
  roleOptionTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  roleOptionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  textMuted: { color: '#9CA3AF' },
  warning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: { fontSize: 13, color: '#78350F', lineHeight: 19, flex: 1 },
  warningBold: { fontWeight: '700' },
  ctaBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: '#6B7280', fontSize: 15, fontWeight: '500' },
});
