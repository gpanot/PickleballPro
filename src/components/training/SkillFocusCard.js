import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Target } from 'lucide-react-native';

/**
 * Compact card for a skill focus track.
 *
 * Props:
 *   track        {object}   – active track from useActiveTraining
 *   completedIds {string[]} – completed routine IDs for this program
 *   onContinue   {function}
 *   onArchive    {function} – "Remove" via long-press or menu
 */
export default function SkillFocusCard({ track, completedIds = [], onContinue, onArchive, style }) {
  if (!track) return null;

  const { program } = track;
  const routines = program.routines || [];
  const totalSessions = routines.length;
  const completedCount = completedIds.length;
  const progressFraction = totalSessions > 0 ? completedCount / totalSessions : 0;

  const nextRoutine = routines
    .slice()
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .find(r => !completedIds.includes(r.id));

  const nextIndex = nextRoutine ? routines.indexOf(nextRoutine) + 1 : totalSessions;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        {program.thumbnail_url ? (
          <Image source={{ uri: program.thumbnail_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Target size={20} color="#4338CA" strokeWidth={2} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{program.name}</Text>
          <Text style={styles.meta}>Session {nextIndex} of {totalSessions}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%` }]} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onContinue}
          accessibilityLabel={`Continue ${program.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  thumbPlaceholder: {
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 6 },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  continueBtn: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  continueBtnText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
});
