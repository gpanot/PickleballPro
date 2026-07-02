import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, Dumbbell, ChevronRight, ChevronLeft, Plus } from 'lucide-react-native';

/**
 * Post-log inline success strip + navigation footer for ExerciseDetail in training mode.
 *
 * Props:
 *   logResult       {object|null} – the most recent log entry (null = not yet logged)
 *   hasNextExercise {boolean}
 *   onLog           {function}     – open the log modal
 *   onNext          {function}     – navigate to next exercise
 *   onBackToSession {function}     – go back to RoutineDetail
 *   isDark          {boolean}      – dark mode flag
 *   theme           {object}       – theme tokens from ThemeContext
 */
export default function ExerciseTrainingFooter({
  logResult = null,
  hasNextExercise = false,
  onLog,
  onNext,
  onBackToSession,
  isDark = false,
  theme = null,
}) {
  const insets = useSafeAreaInsets();

  // Resolved colors that respect dark mode
  const containerBg = theme?.bgCard ?? (isDark ? '#1E293B' : '#fff');
  const containerBorder = theme?.border ?? (isDark ? '#334155' : '#F3F4F6');
  const backBtnBg = isDark ? '#334155' : '#F3F4F6';
  const backBtnText = theme?.text ?? (isDark ? '#F1F5F9' : '#374151');
  const primaryColor = theme?.primary ?? '#6366F1';
  const relogColor = theme?.textSecondary ?? (isDark ? '#94A3B8' : '#6B7280');

  if (logResult) {
    const targetMet = logResult.target_met !== false;
    const successBg = targetMet
      ? (isDark ? '#064E3B' : '#D1FAE5')
      : (isDark ? '#451A03' : '#FEF3C7');
    const successTextColor = targetMet
      ? (isDark ? '#34D399' : '#065F46')
      : (isDark ? '#FBBF24' : '#92400E');
    const iconColor = targetMet
      ? (isDark ? '#34D399' : '#065F46')
      : (isDark ? '#FBBF24' : '#92400E');

    return (
      <View style={[
        styles.container,
        {
          backgroundColor: containerBg,
          borderTopColor: containerBorder,
          paddingBottom: insets.bottom + 12,
        }
      ]}>
        <View style={[styles.successStrip, { backgroundColor: successBg }]}>
          {targetMet ? (
            <CheckCircle size={18} color={iconColor} strokeWidth={2.5} />
          ) : (
            <Dumbbell size={18} color={iconColor} strokeWidth={2.5} />
          )}
          <Text style={[styles.successText, { color: successTextColor }]}>
            {targetMet ? 'Logged! Target met' : 'Logged — keep practicing'}
          </Text>
        </View>
        <View style={styles.postLogRow}>
          {hasNextExercise ? (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: primaryColor }]}
              onPress={onNext}
              accessibilityLabel="Next exercise"
              accessibilityRole="button"
            >
              <Text style={styles.nextBtnText}>Next exercise</Text>
              <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: backBtnBg }]}
              onPress={onBackToSession}
              accessibilityLabel="Back to session"
              accessibilityRole="button"
            >
              <ChevronLeft size={16} color={backBtnText} strokeWidth={2.5} />
              <Text style={[styles.backBtnText, { color: backBtnText }]}>Back to session</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onLog} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.relogLink, { color: relogColor }]}>Log again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: containerBg,
        borderTopColor: containerBorder,
        paddingBottom: insets.bottom + 12,
      }
    ]}>
      <TouchableOpacity
        style={[styles.logBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
        onPress={onLog}
        activeOpacity={0.85}
        accessibilityLabel="Add log"
        accessibilityRole="button"
      >
        <Plus size={18} color="#fff" strokeWidth={2.5} />
        <Text style={styles.logBtnText}>Add log</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  logBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  successStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  successText: { fontSize: 14, fontWeight: '600', flex: 1 },
  postLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  relogLink: { fontSize: 13, fontWeight: '500' },
});
