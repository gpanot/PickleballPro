import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function MoodTimelineCard({ tokens, last5Moods, moodTrendUp }) {
  const isLight = tokens.bg !== '#0C0C0C';
  const px = isLight ? 24 : 20;
  const connectorColor = isLight ? '#EDE6F6' : '#2A2A2A';
  const arrowColor = isLight ? '#C4A8D0' : '#555555';

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

  if (!last5Moods || last5Moods.length < 2) return null;

  return (
    <View style={[styles.card, cardStyle, { marginHorizontal: px }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, {
          color: tokens.sectionLabelColor,
          fontFamily: tokens.fontBodySemibold,
          letterSpacing: tokens.sectionLabelTracking,
          fontSize: tokens.sectionLabelSize,
        }]}>
          HOW SESSIONS FELT
        </Text>
        <Text style={[styles.lastN, { color: tokens.textCaption, fontFamily: tokens.fontBody }]}>
          last {last5Moods.length}
        </Text>
      </View>

      {/* Dot + label columns with connectors between */}
      <View style={styles.timeline}>
        {last5Moods.map((mood, i) => (
          <React.Fragment key={i}>
            <View style={styles.moodColumn}>
              <View style={[styles.dot, { backgroundColor: mood.color }]} />
              <Text style={[styles.dotLabel, { color: mood.color, fontFamily: tokens.fontBodyBold }]}>
                {mood.label}
              </Text>
            </View>
            {i < last5Moods.length - 1 && (
              <View style={styles.connectorWrap}>
                <View style={[styles.connector, { backgroundColor: connectorColor }]} />
                <View style={styles.arrow}>
                  <ChevronRight size={10} color={arrowColor} strokeWidth={2.5} />
                </View>
              </View>
            )}
          </React.Fragment>
        ))}
      </View>

      {moodTrendUp && (
        <View style={styles.trendRow}>
          <View style={[styles.trendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[styles.trendText, { color: '#22C55E', fontFamily: tokens.fontBodySemibold }]}>
            Trending upward — keep the momentum
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: { textTransform: 'uppercase' },
  lastN: { fontSize: 10 },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  moodColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 20, height: 20, borderRadius: 10 },
  connectorWrap: {
    width: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    flexShrink: 0,
  },
  connector: { flex: 1, height: 2, borderRadius: 1 },
  arrow: { marginLeft: -6, marginRight: -4 },
  dotLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trendDot: { width: 6, height: 6, borderRadius: 3 },
  trendText: { fontSize: 12 },
});
