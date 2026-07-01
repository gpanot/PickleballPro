import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  feelingToMood,
  formatSessionDate,
  getActivityAndFormat,
  getSessionTypeLabel,
  getSkillLabel,
  parseEntryHours,
} from '../../lib/logbookHelpers';

export default function SessionCard({ tokens, entry }) {
  const isLight = tokens.bg !== '#0C0C0C';
  const mood = feelingToMood(entry.feeling);
  const { activity } = getActivityAndFormat(entry);

  const strongSkills = Array.isArray(entry.trainingFocus)
    ? entry.trainingFocus
    : [entry.trainingFocus].filter(Boolean);

  const challengeSkills = Array.isArray(entry.difficulty)
    ? entry.difficulty
    : entry.difficulty ? [entry.difficulty] : [];

  const cardStyle = isLight ? {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radiusInner,
    ...tokens.cardShadow,
  } : {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radiusInner,
    borderWidth: 1,
    borderColor: tokens.border,
  };

  return (
    <View style={[styles.card, cardStyle]}>
      <View style={styles.row}>
        {/* Mood indicator: dot (light) or vertical bar (dark) */}
        {isLight ? (
          <View style={[styles.moodDot, { backgroundColor: mood.color, marginTop: 4 }]} />
        ) : (
          <View style={[styles.moodBar, { backgroundColor: mood.color }]} />
        )}

        <View style={styles.content}>
          {/* Date + type row */}
          <View style={styles.dateRow}>
            <Text style={[styles.dateText, {
              color: tokens.textPrimary,
              fontFamily: tokens.fontBodySemibold,
            }]}>
              {formatSessionDate(entry.date)}
            </Text>
            {!isLight && (
              <Text style={[styles.typeTag, { color: tokens.textMuted, fontFamily: tokens.fontBody }]}>
                · {getSessionTypeLabel(activity)}
              </Text>
            )}
          </View>

          {/* Skill pills */}
          <View style={styles.pillsRow}>
            {strongSkills.slice(0, 2).map((skill, i) => (
              <View key={i} style={[styles.pill, {
                backgroundColor: tokens.strongBadgeBg,
                borderRadius: tokens.radiusChip,
              }]}>
                <Text style={[styles.pillText, {
                  color: tokens.strongBadgeText,
                  fontFamily: tokens.fontBodyBold,
                }]}>
                  {getSkillLabel(skill)}
                </Text>
              </View>
            ))}
            {challengeSkills.slice(0, 1).map((skill, i) => (
              <View key={i} style={[styles.pill, {
                backgroundColor: tokens.challengeBadgeBg,
                borderRadius: tokens.radiusChip,
              }]}>
                <Text style={[styles.pillText, {
                  color: tokens.challengeBadgeText,
                  fontFamily: tokens.fontBodyBold,
                }]}>
                  {getSkillLabel(skill)} (hard)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hours + type (light) or hours (dark) */}
        <View style={styles.rightBlock}>
          <Text style={[styles.hours, {
            color: tokens.textPrimary,
            fontFamily: tokens.fontDisplay,
          }]}>
            {parseEntryHours(entry.hours) || entry.hours || 1}h
          </Text>
          {isLight && (
            <Text style={[styles.typeLabel, {
              color: tokens.textCaption,
              fontFamily: tokens.fontBody,
            }]}>
              {getSessionTypeLabel(activity)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    flexShrink: 0,
  },
  moodBar: {
    width: 3,
    height: 44,
    borderRadius: 2,
    flexShrink: 0,
    marginTop: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 15,
    lineHeight: 20,
  },
  typeTag: {
    fontSize: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 10,
  },
  rightBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  hours: {
    fontSize: 20,
    lineHeight: 24,
  },
  typeLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
