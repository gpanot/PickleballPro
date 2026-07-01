import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleDot } from 'lucide-react-native';
import { getSkillLabel } from '../../lib/logbookHelpers';

function getCoachScore(logbookEntries, summary) {
  if (!logbookEntries || logbookEntries.length === 0) return 50;

  let score = 0;
  const moodScore = summary.last5AverageFeeling || 0;
  score += Math.max(0, (3 - moodScore) / 2 * 40);

  const recentEntries = logbookEntries.slice(0, 10);
  const withDifficulty = recentEntries.filter(e => e.difficulty && e.difficulty.length > 0);
  score += (withDifficulty.length / Math.max(recentEntries.length, 1)) * 30;

  score += Math.min((summary.topWeakSkills || []).length / 3, 1) * 20;

  const freq = summary.weekSessions || 0;
  score += freq < 2 ? 10 : Math.max(0, (3 - freq) / 3 * 10);

  return Math.min(Math.max(Math.round(score), 0), 100);
}

function getInsightText(summary) {
  const top = summary.topWeakSkills?.[0];
  if (!top) {
    return 'Keep logging your sessions — patterns will emerge and a coach can help you level up faster.';
  }
  const sessions = top.count;
  const skillName = getSkillLabel(top.skill);
  return `${skillName} ${sessions === 1 ? 'has appeared' : `has been your toughest challenge for ${sessions} session${sessions > 1 ? 's' : ''} in a row`}. A focused lesson could unlock a real breakthrough.`;
}

export default function CoachInsightCard({ tokens, logbookEntries, summary, onNavigateToCoach }) {
  const isLight = tokens.bg !== '#0C0C0C';
  const px = isLight ? 24 : 20;
  const coachScore = getCoachScore(logbookEntries, summary);
  const insightText = getInsightText(summary);
  const indicatorColor = isLight ? tokens.accentPurple : tokens.accentPurple;

  const cardStyle = isLight ? {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radiusCard,
    borderLeftWidth: 3,
    borderLeftColor: tokens.coachAccentBorder,
    ...tokens.cardShadow,
  } : {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radiusCard,
    borderWidth: 1,
    borderColor: tokens.border,
    borderLeftWidth: 2,
    borderLeftColor: tokens.coachAccentBorder,
  };

  return (
    <TouchableOpacity
      style={[styles.card, cardStyle, { marginHorizontal: px }]}
      onPress={onNavigateToCoach}
      activeOpacity={0.85}
    >
      <Text style={[styles.sectionLabel, {
        color: tokens.accentPurple,
        fontFamily: tokens.fontBodyBold,
        letterSpacing: tokens.sectionLabelTracking,
        fontSize: tokens.sectionLabelSize,
      }]}>
        COACH INSIGHT
      </Text>

      <Text style={[styles.insightText, {
        color: tokens.textPrimary,
        fontFamily: tokens.fontBody,
      }]}>
        {insightText}
      </Text>

      <View style={styles.sliderContainer}>
        <Text style={[
          styles.sliderLabel,
          { color: coachScore <= 50 ? tokens.textPrimary : tokens.textMuted, fontFamily: tokens.fontBodyBold },
        ]}>
          NO
        </Text>
        <View style={styles.trackWrapper}>
          <View style={[styles.track, { backgroundColor: isLight ? '#EDE6F6' : tokens.surfaceRaised }]} />
          <View style={[styles.indicatorContainer, { left: `${coachScore}%` }]}>
            <View style={[styles.indicatorBubble, {
              backgroundColor: isLight ? tokens.surface : tokens.surfaceRaised,
              borderColor: indicatorColor,
            }]}>
              <CircleDot size={14} color={indicatorColor} strokeWidth={2.5} />
            </View>
          </View>
        </View>
        <Text style={[
          styles.sliderLabel,
          { color: coachScore > 50 ? tokens.textPrimary : tokens.textMuted, fontFamily: tokens.fontBodyBold },
        ]}>
          YES
        </Text>
      </View>

      <Text style={[styles.subtext, { color: tokens.textMuted, fontFamily: tokens.fontBody }]}>
        Based on your recent mood and training patterns
      </Text>

      {isLight ? (
        <LinearGradient
          colors={tokens.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={[styles.ctaText, { color: '#FFFFFF', fontFamily: tokens.fontBodyBold }]}>
            Explore Coaching  ↗
          </Text>
        </LinearGradient>
      ) : (
        <View style={[styles.ctaOutline, {
          borderColor: `${tokens.accentPurple}60`,
          borderRadius: tokens.radiusButton,
        }]}>
          <Text style={[styles.ctaText, { color: tokens.accentPurple, fontFamily: tokens.fontBodySemibold }]}>
            Find a Coach  ↗
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  sectionLabel: { textTransform: 'uppercase', marginBottom: 8 },
  insightText: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sliderLabel: { fontSize: 12, minWidth: 28, textAlign: 'center' },
  trackWrapper: {
    flex: 1,
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  track: { height: 4, borderRadius: 2, width: '100%' },
  indicatorContainer: {
    position: 'absolute',
    transform: [{ translateX: -12 }],
    top: 0,
  },
  indicatorBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtext: { fontSize: 11, marginBottom: 14 },
  ctaGradient: {
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  ctaOutline: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  ctaText: { fontSize: 14, fontWeight: '700' },
});
