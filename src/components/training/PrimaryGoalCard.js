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
 * The primary training track card — shown at the top of My Training when
 * the user has an active primary program enrolled.
 */
export default function PrimaryGoalCard({
  track,
  completedIds = [],
  onContinue,
  onViewAll,
  onStartNewGoal,
  style,
}) {
  const { logbookTheme: t } = useTheme();
  const c = t.training.primaryGoal;

  if (!track) return null;

  const { program, lastAccessedAt } = track;
  const routines = program.routines || [];
  const totalSessions = routines.length;
  const completedCount = completedIds.length;

  const nextRoutine = routines
    .slice()
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .find(r => !completedIds.includes(r.id));

  const nextRoutineIndex = nextRoutine
    ? routines.indexOf(nextRoutine) + 1
    : totalSessions + 1;

  const isStarted = completedCount > 0 || !!lastAccessedAt;
  const lastTrainedText = lastAccessedAt
    ? `Last trained · ${relativeTime(lastAccessedAt)}`
    : 'Not started yet';

  const ctaLabel = nextRoutine
    ? isStarted
      ? `Continue Session ${nextRoutineIndex}`
      : `Start Session 1`
    : `View all sessions`;

  const progressFraction = totalSessions > 0 ? completedCount / totalSessions : 0;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: c.cardBg,
        borderColor: c.cardBorder,
        shadowColor: '#000',
      },
      style,
    ]}>
      <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
        <Text style={[styles.badgeText, { color: c.badgeText }]}>PRIMARY FOCUS</Text>
      </View>

      <View style={styles.headerRow}>
        {program.thumbnail_url ? (
          <Image source={{ uri: program.thumbnail_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: c.thumbPlaceholderBg }]}>
            <Target size={24} color={c.thumbPlaceholderIcon} strokeWidth={2} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.programName, { color: c.programName }]} numberOfLines={2}>{program.name}</Text>
          <Text style={[styles.statusLine, { color: c.statusLine }]}>{lastTrainedText}</Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: c.progressTrack }]}>
        <View style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%`, backgroundColor: c.primaryBtn }]} />
      </View>
      <Text style={[styles.progressLabel, { color: c.progressLabel }]}>
        {completedCount} / {totalSessions} sessions complete
      </Text>

      {nextRoutine && (
        <Text style={[styles.nextLine, { color: c.nextLine }]} numberOfLines={1}>
          Next: Session {nextRoutineIndex} — {nextRoutine.name}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: c.primaryBtn, shadowColor: c.primaryBtn }]}
        onPress={onContinue}
        activeOpacity={0.85}
        accessibilityLabel={ctaLabel}
        accessibilityRole="button"
      >
        <Text style={[styles.primaryBtnText, { color: t.fabTextColor }]}>{ctaLabel}</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.secondaryLink, { color: c.secondaryLink }]}>View all sessions</Text>
        </TouchableOpacity>
        <Text style={[styles.dot, { color: c.dot }]}>·</Text>
        <TouchableOpacity onPress={onStartNewGoal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.secondaryLinkMuted, { color: c.secondaryMuted }]}>Start new goal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  programName: { fontSize: 17, fontWeight: '700', lineHeight: 23 },
  statusLine: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: { fontSize: 12, fontWeight: '500', marginBottom: 10 },
  nextLine: { fontSize: 13, marginBottom: 16, fontStyle: 'italic' },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryLink: { fontSize: 13, fontWeight: '600' },
  secondaryLinkMuted: { fontSize: 13, fontWeight: '500' },
  dot: { fontSize: 13 },
});
