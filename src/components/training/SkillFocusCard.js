import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Target } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Compact card for a skill focus track.
 */
export default function SkillFocusCard({ track, completedIds = [], onContinue, onArchive, style }) {
  const { logbookTheme: t } = useTheme();
  const c = t.training.skillFocus;

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
    <View style={[
      styles.card,
      {
        backgroundColor: c.cardBg,
        borderColor: c.cardBorder,
      },
      style,
    ]}>
      <View style={styles.row}>
        {program.thumbnail_url ? (
          <Image source={{ uri: program.thumbnail_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: c.thumbPlaceholderBg }]}>
            <Target size={20} color={c.thumbPlaceholderIcon} strokeWidth={2} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: c.name }]} numberOfLines={1}>{program.name}</Text>
          <Text style={[styles.meta, { color: c.meta }]}>Session {nextIndex} of {totalSessions}</Text>
          <View style={[styles.progressTrack, { backgroundColor: c.progressTrack }]}>
            <View style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%`, backgroundColor: c.accent }]} />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, { borderColor: c.accent }]}
          onPress={onContinue}
          accessibilityLabel={`Continue ${program.name}`}
          accessibilityRole="button"
        >
          <Text style={[styles.continueBtnText, { color: c.accent }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2, marginBottom: 6 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  continueBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  continueBtnText: { fontSize: 13, fontWeight: '700' },
});
