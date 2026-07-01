import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} '${String(year).slice(-2)}`;
}

function MonthBarChart({ tokens, months, isDark }) {
  const maxHours = Math.max(...months.map(m => m.hours), 1);
  const chartHeight = 120;
  const barWidth = months.length <= 4 ? 40 : months.length <= 8 ? 32 : 24;

  return (
    <View style={styles.chart}>
      <View style={[styles.barsRow, { height: chartHeight }]}>
        {months.map((item) => {
          const barHeight = Math.max((item.hours / maxHours) * chartHeight, item.hours > 0 ? 6 : 0);
          return (
            <View key={item.month} style={styles.barColumn}>
              <Text style={[styles.barValue, {
                color: tokens.textMuted,
                fontFamily: tokens.fontBody,
              }]}>
                {item.hours > 0 ? `${item.hours}h` : ''}
              </Text>
              <View style={[styles.barTrack, {
                height: chartHeight,
                width: barWidth,
                backgroundColor: isDark ? '#1A1A1A' : tokens.accentPurpleMuted,
              }]}>
                <View style={[styles.barFill, {
                  height: barHeight,
                  backgroundColor: tokens.accentPurple,
                  borderRadius: tokens.radiusInner / 2,
                }]} />
              </View>
              <Text style={[styles.barLabel, {
                color: tokens.textMuted,
                fontFamily: tokens.fontBody,
              }]}>
                {formatMonthLabel(item.month)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function LogbookHistoryModal({ visible, onClose, tokens, monthlyData = [] }) {
  const insets = useSafeAreaInsets();
  const isDark = tokens.bg === '#0C0C0C';

  const { chartMonths, totalHours, totalCalories, totalSessions } = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted.slice(-12);

    const hours = sorted.reduce((sum, m) => sum + m.hours, 0);
    const calories = sorted.reduce((sum, m) => sum + (m.calories || 0), 0);
    const sessions = sorted.reduce((sum, m) => sum + m.sessions, 0);

    return {
      chartMonths: recent,
      totalHours: Math.round(hours * 10) / 10,
      totalCalories: calories,
      totalSessions: sessions,
    };
  }, [monthlyData]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: tokens.surface,
              borderTopLeftRadius: tokens.radiusCard,
              borderTopRightRadius: tokens.radiusCard,
              paddingBottom: Math.max(insets.bottom, 28),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: isDark ? '#333' : tokens.borderSubtle }]} />

          <View style={styles.header}>
            <Text style={[styles.title, {
              color: tokens.textPrimary,
              fontFamily: tokens.fontDisplay,
            }]}>
              {isDark ? 'TRAINING HISTORY' : 'Training History'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={22} color={tokens.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* All-time totals */}
            <View style={[styles.totalsRow, {
              backgroundColor: isDark ? tokens.surfaceRaised : tokens.accentPurpleMuted,
              borderRadius: tokens.radiusInner,
            }]}>
              <View style={styles.totalItem}>
                <Text style={[styles.totalValue, {
                  color: tokens.textPrimary,
                  fontFamily: tokens.fontDisplay,
                }]}>
                  {totalHours}h
                </Text>
                <Text style={[styles.totalLabel, {
                  color: tokens.textMuted,
                  fontFamily: tokens.fontBody,
                }]}>
                  Total hours
                </Text>
              </View>
              <View style={[styles.totalDivider, { backgroundColor: isDark ? tokens.border : tokens.borderSubtle }]} />
              <View style={styles.totalItem}>
                <Text style={[styles.totalValue, {
                  color: tokens.textPrimary,
                  fontFamily: tokens.fontDisplay,
                }]}>
                  {totalCalories.toLocaleString()}
                </Text>
                <Text style={[styles.totalLabel, {
                  color: tokens.textMuted,
                  fontFamily: tokens.fontBody,
                }]}>
                  Calories burned
                </Text>
              </View>
            </View>

            <Text style={[styles.sessionsNote, {
              color: tokens.textMuted,
              fontFamily: tokens.fontBody,
            }]}>
              {totalSessions} session{totalSessions !== 1 ? 's' : ''} logged all time
            </Text>

            {/* Month-by-month chart */}
            <Text style={[styles.sectionLabel, {
              color: tokens.sectionLabelColor,
              fontFamily: tokens.fontBodySemibold,
              letterSpacing: tokens.sectionLabelTracking,
              fontSize: tokens.sectionLabelSize,
            }]}>
              {isDark ? 'HOURS BY MONTH' : 'Hours by month'}
            </Text>

            {chartMonths.length === 0 ? (
              <Text style={[styles.emptyText, {
                color: tokens.textMuted,
                fontFamily: tokens.fontBody,
              }]}>
                No sessions logged yet.
              </Text>
            ) : (
              <MonthBarChart tokens={tokens} months={chartMonths} isDark={isDark} />
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    letterSpacing: 0.5,
  },
  totalsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  sessionsNote: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  chart: {
    marginBottom: 16,
    paddingTop: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
  },
  barColumn: {
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10,
    marginBottom: 8,
    minHeight: 14,
  },
  barTrack: {
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
  barLabel: {
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
});
