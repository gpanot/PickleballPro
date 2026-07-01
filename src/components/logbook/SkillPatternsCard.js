import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { getSkillLabel } from '../../lib/logbookHelpers';

export default function SkillPatternsCard({ tokens, topStrongSkills, topWeakSkills }) {
  const isLight = tokens.bg !== '#0C0C0C';
  const px = isLight ? 24 : 20;

  const cardStyle = isLight ? {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radiusCard,
    ...tokens.cardShadow,
  } : {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radiusCard,
    borderWidth: 1,
    borderColor: tokens.border,
  };

  return (
    <View style={[styles.card, cardStyle, { marginHorizontal: px }]}>
      <Text style={[styles.sectionLabel, {
        color: tokens.sectionLabelColor,
        fontFamily: tokens.fontBodySemibold,
        letterSpacing: tokens.sectionLabelTracking,
        fontSize: tokens.sectionLabelSize,
      }]}>
        YOUR SKILL PATTERNS
      </Text>

      <View style={styles.columns}>
        {/* Strong skills */}
        <View style={styles.column}>
          <Text style={[styles.columnTitle, {
            color: tokens.textStrongSkill,
            fontFamily: tokens.fontBodyBold,
            fontSize: 11,
          }]}>
            You&apos;re shining at
          </Text>
          {topStrongSkills.map((item, i) => (
            <View key={i} style={styles.skillRow}>
              <Text style={[styles.skillName, {
                color: tokens.textPrimary,
                fontFamily: tokens.fontBodySemibold,
              }]}>
                {getSkillLabel(item.skill)}
              </Text>
              <View style={[styles.badge, { backgroundColor: tokens.strongBadgeBg }]}>
                <Text style={[styles.badgeText, {
                  color: tokens.strongBadgeText,
                  fontFamily: tokens.fontBodyBold,
                }]}>
                  ×{item.count}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Challenging skills */}
        <View style={styles.column}>
          <Text style={[styles.columnTitle, {
            color: tokens.textChallengeSkill,
            fontFamily: tokens.fontBodyBold,
            fontSize: 11,
          }]}>
            Room to grow
          </Text>
          {topWeakSkills.map((item, i) => (
            <View key={i} style={styles.skillRow}>
              <Text style={[styles.skillName, {
                color: tokens.textPrimary,
                fontFamily: tokens.fontBodySemibold,
              }]}>
                {getSkillLabel(item.skill)}
              </Text>
              <View style={[styles.badge, { backgroundColor: tokens.challengeBadgeBg }]}>
                <Text style={[styles.badgeText, {
                  color: tokens.challengeBadgeText,
                  fontFamily: tokens.fontBodyBold,
                }]}>
                  ×{item.count}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  columns: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    marginBottom: 12,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillName: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
  },
});
