import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DonutChart from './DonutChart';
import { getSessionTypeLabel } from '../../lib/logbookHelpers';

const TYPE_ORDER = ['social', 'class', 'training', 'single', 'double'];

export default function LogbookSummaryCard({ tokens, summary, onPress }) {
  const isLight = tokens.bg !== '#0C0C0C';
  const px = isLight ? 24 : 20;

  const {
    displayHours = 0,
    displayCalories = 0,
    displaySessionTypeHours = {},
    displaySessions = 0,
    displayPeriod = 'this month',
  } = summary;

  // Sort session type entries for legend display
  const typeEntries = Object.entries(displaySessionTypeHours)
    .sort(([a], [b]) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));

  const donutColors = tokens.donutColors;

  const CardWrapper = ({ children }) => isLight ? (
    <LinearGradient
      colors={tokens.gradientSummary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: tokens.radiusCard, marginHorizontal: px }]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[
      styles.card,
      {
        borderRadius: tokens.radiusCard,
        backgroundColor: tokens.surface,
        borderWidth: 1,
        borderColor: tokens.border,
        marginHorizontal: px,
      },
    ]}>
      {children}
    </View>
  );

  const content = (
    <>
      <View style={styles.row}>
        <DonutChart
          tokens={tokens}
          monthSessionTypeHours={displaySessionTypeHours}
          totalMonthHours={displayHours}
        />

        <View style={styles.statsBlock}>
          {/* Hours + "this month" */}
          <View style={styles.hoursRow}>
            <Text style={[styles.hoursNumber, {
              color: tokens.textPrimary,
              fontFamily: tokens.fontDisplay,
            }]}>
              {displayHours}h
            </Text>
            <Text style={[styles.hoursLabel, { color: tokens.textMuted, fontFamily: tokens.fontBody }]}>
              {'  '}{displayPeriod}
            </Text>
          </View>

          {/* Calories */}
          <Text style={[styles.calories, { color: tokens.textMuted, fontFamily: tokens.fontBody }]}>
            ≈ {displayCalories.toLocaleString()} cal burned
          </Text>

          {/* Session-type legend */}
          <View style={styles.legend}>
            {typeEntries.map(([type, hours], i) => (
              <View key={type} style={styles.legendRow}>
                <View style={[styles.legendDot, {
                  backgroundColor: donutColors[i % donutColors.length] || donutColors[0],
                }]} />
                <Text style={[styles.legendLabel, { color: tokens.textSecondary, fontFamily: tokens.fontBody }]}>
                  {getSessionTypeLabel(type)}
                </Text>
                <Text style={[styles.legendHours, {
                  color: tokens.textPrimary,
                  fontFamily: tokens.fontBodyBold,
                }]}>
                  {hours}h
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Divider + session count */}
      <View style={[styles.divider, { borderTopColor: isLight ? 'rgba(255,255,255,0.4)' : tokens.borderSubtle }]} />
      <Text style={[styles.sessionCount, { color: tokens.textMuted, fontFamily: tokens.fontBody }]}>
        {displaySessions} session{displaySessions !== 1 ? 's' : ''} logged
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <CardWrapper>{content}</CardWrapper>
      </TouchableOpacity>
    );
  }

  return <CardWrapper>{content}</CardWrapper>;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statsBlock: {
    flex: 1,
    minWidth: 0,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  hoursNumber: {
    fontSize: 30,
    lineHeight: 36,
  },
  hoursLabel: {
    fontSize: 12,
  },
  calories: {
    fontSize: 12,
    marginBottom: 10,
  },
  legend: {
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    flex: 1,
  },
  legendHours: {
    fontSize: 12,
  },
  divider: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  sessionCount: {
    fontSize: 12,
  },
});
