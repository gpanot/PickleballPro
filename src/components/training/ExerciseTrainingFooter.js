import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, Dumbbell, ChevronRight, ChevronLeft } from 'lucide-react-native';

/**
 * Post-log inline success strip + navigation footer for ExerciseDetail in training mode.
 *
 * Props:
 *   logResult       {object|null} – the most recent log entry (null = not yet logged)
 *   hasNextExercise {boolean}
 *   onLog           {function}     – open the log modal
 *   onNext          {function}     – navigate to next exercise
 *   onBackToSession {function}     – go back to RoutineDetail
 */
export default function ExerciseTrainingFooter({
  logResult = null,
  hasNextExercise = false,
  onLog,
  onNext,
  onBackToSession,
}) {
  const insets = useSafeAreaInsets();

  if (logResult) {
    const targetMet = logResult.target_met !== false;
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.successStrip, targetMet ? styles.successGreen : styles.successAmber]}>
          {targetMet ? (
            <CheckCircle size={18} color="#065F46" strokeWidth={2.5} />
          ) : (
            <Dumbbell size={18} color="#92400E" strokeWidth={2.5} />
          )}
          <Text style={styles.successText}>
            {targetMet ? 'Logged! Target met' : 'Logged — keep practicing'}
          </Text>
        </View>
        <View style={styles.postLogRow}>
          {hasNextExercise ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={onNext}
              accessibilityLabel="Next exercise"
              accessibilityRole="button"
            >
              <Text style={styles.nextBtnText}>Next exercise</Text>
              <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBackToSession}
              accessibilityLabel="Back to session"
              accessibilityRole="button"
            >
              <ChevronLeft size={16} color="#374151" strokeWidth={2.5} />
              <Text style={styles.backBtnText}>Back to session</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onLog} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.relogLink}>Log again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <TouchableOpacity
        style={styles.logBtn}
        onPress={onLog}
        activeOpacity={0.85}
        accessibilityLabel="Log result"
        accessibilityRole="button"
      >
        <Text style={styles.logBtnText}>Log result</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  logBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#6366F1',
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
  successGreen: { backgroundColor: '#D1FAE5' },
  successAmber: { backgroundColor: '#FEF3C7' },
  successText: { fontSize: 14, fontWeight: '600', color: '#065F46', flex: 1 },
  postLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  relogLink: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
});
