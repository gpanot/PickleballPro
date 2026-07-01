import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ChevronUp, ChevronDown, FileText } from 'lucide-react-native';
import { getLogbookEntriesByUserId } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';

export default function StudentLogbookScreen({ route, navigation }) {
  const { studentId, student } = route.params || {};
  const isFocused = useIsFocused();
  const { logbookTheme: t, isDark } = useTheme();

  const [logbookEntries, setLogbookEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  useEffect(() => {
    if (isFocused && studentId) {
      loadLogbookEntries();
    }
  }, [isFocused, studentId]);

  const loadLogbookEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getLogbookEntriesByUserId(studentId);
      if (error) { setLogbookEntries([]); return; }

      const transformedEntries = (data || []).map(entry => {
        let trainingFocus = entry.training_focus;
        if (typeof trainingFocus === 'string') { try { trainingFocus = JSON.parse(trainingFocus); } catch { trainingFocus = [trainingFocus]; } }
        let difficulty = entry.difficulty;
        if (typeof difficulty === 'string') { try { difficulty = JSON.parse(difficulty); } catch { difficulty = difficulty ? [difficulty] : []; } }
        return {
          id: entry.id, date: entry.date, hours: entry.hours,
          sessionType: entry.session_type, trainingFocus, difficulty,
          feeling: entry.feeling, notes: entry.notes, location: entry.location,
          createdAt: entry.created_at, exerciseDetails: entry.exercise_details || null,
        };
      });
      setLogbookEntries(transformedEntries);
    } catch {
      setLogbookEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getLogbookSummary = () => {
    const exerciseEntries = logbookEntries.filter(e => e.exerciseDetails && e.exerciseDetails.exerciseName);
    if (exerciseEntries.length === 0) return { totalExercises: 0, totalSessions: 0, firstLogDate: null, lastExercises: [], targetAccomplishment: null };
    const firstLogDate = exerciseEntries[exerciseEntries.length - 1]?.date;
    const uniqueDates = new Set(exerciseEntries.map(e => e.date));
    const totalSessions = uniqueDates.size;
    const lastExercises = exerciseEntries.slice(0, 4).map(e => ({ date: e.date, programName: e.exerciseDetails.programName, routineName: e.exerciseDetails.routineName, exerciseName: e.exerciseDetails.exerciseName, target: e.exerciseDetails.target, result: e.exerciseDetails.result }));
    const exercisesWithNumericResults = exerciseEntries.filter(e => { const t2 = parseInt(e.exerciseDetails.target); const r = parseInt(e.exerciseDetails.result); return !isNaN(t2) && !isNaN(r) && t2 > 0; });
    let targetAccomplishment = null;
    if (exercisesWithNumericResults.length > 0) {
      let totalMet = 0;
      exercisesWithNumericResults.forEach(e => { if (parseInt(e.exerciseDetails.result) >= parseInt(e.exerciseDetails.target)) totalMet++; });
      targetAccomplishment = { successRate: Math.round((totalMet / exercisesWithNumericResults.length) * 100), totalExercises: exercisesWithNumericResults.length };
    }
    return { totalExercises: exerciseEntries.length, totalSessions, firstLogDate, lastExercises, targetAccomplishment };
  };

  const summary = getLogbookSummary();

  const card = { backgroundColor: t.surface, borderRadius: 14, borderWidth: isDark ? 1 : 0, borderColor: t.border };

  const renderSummary = () => (
    <View style={[styles.summaryContainer, card]}>
      <TouchableOpacity style={styles.summaryHeader} onPress={() => setIsSummaryExpanded(!isSummaryExpanded)} activeOpacity={0.7}>
        <Text style={[styles.summaryTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Exercise Log Summary</Text>
        {isSummaryExpanded ? <ChevronUp size={20} color={t.textMuted} strokeWidth={2} /> : <ChevronDown size={20} color={t.textMuted} strokeWidth={2} />}
      </TouchableOpacity>

      {isSummaryExpanded && (
        <>
          <View style={[styles.totalStatsCard, { borderColor: isDark ? t.border : '#E5E7EB', borderWidth: 1 }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: t.textPrimary, fontFamily: t.fontDisplay }]}>{summary.totalExercises}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Exercises</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? t.border : '#E5E7EB' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: t.textPrimary, fontFamily: t.fontDisplay }]}>{summary.totalSessions}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Sessions</Text>
            </View>
            {summary.firstLogDate && (
              <>
                <View style={[styles.statDivider, { backgroundColor: isDark ? t.border : '#E5E7EB' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statDateLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Since</Text>
                  <Text style={[styles.statDate, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{formatDate(summary.firstLogDate)}</Text>
                </View>
              </>
            )}
          </View>

          {summary.lastExercises && summary.lastExercises.length > 0 && (() => {
            const firstExercise = summary.lastExercises[0];
            let lastDate = null; let lastProgram = null; let lastRoutine = null;
            return (
              <View style={[styles.lastExercisesCard, { borderColor: isDark ? t.border : '#E5E7EB' }]}>
                <View style={[styles.lastExercisesHeader, { borderBottomColor: isDark ? t.border : '#F3F4F6' }]}>
                  <Text style={[styles.lastExercisesTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Last Session Activity</Text>
                  <Text style={[styles.lastExercisesDate, { color: t.textMuted, fontFamily: t.fontBody }]}>{formatDate(firstExercise.date)}</Text>
                </View>
                <View style={styles.lastExercisesList}>
                  {summary.lastExercises.map((exercise, index) => {
                    const showDate = exercise.date !== lastDate && index > 0;
                    const showProgram = exercise.programName !== lastProgram || showDate;
                    const showRoutine = exercise.routineName !== lastRoutine || showDate;
                    lastDate = exercise.date; lastProgram = exercise.programName; lastRoutine = exercise.routineName;
                    return (
                      <View key={index}>
                        {showDate && <Text style={[styles.exerciseDateDivider, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>{formatDate(exercise.date)}</Text>}
                        <View style={[styles.lastExerciseItem, { backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB' }]}>
                          {(showProgram || showRoutine) && (
                            <Text style={[styles.lastExerciseMeta, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>
                              {showProgram && exercise.programName}{showProgram && showRoutine && ' / '}{showRoutine && exercise.routineName}
                            </Text>
                          )}
                          <View style={styles.lastExerciseRow}>
                            <Text style={[styles.lastExerciseName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]} numberOfLines={1}>{exercise.exerciseName}</Text>
                            <Text style={[styles.lastExerciseResultText, { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>
                              {String(exercise.result).replace(/\s*attempts?/i, '')}/{String(exercise.target).replace(/\s*attempts?/i, '')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {summary.targetAccomplishment && (
            <View style={[styles.accomplishmentCard, { borderColor: isDark ? t.border : '#E5E7EB' }]}>
              <Text style={[styles.accomplishmentTitle, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>TARGET ACCOMPLISHMENT</Text>
              <View style={styles.accomplishmentStats}>
                <Text style={[styles.accomplishmentStatValue, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>{summary.targetAccomplishment.successRate}%</Text>
                <Text style={[styles.accomplishmentStatLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Success Rate</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderLogbookEntries = () => (
    <View style={styles.entriesContainer}>
      <Text style={[styles.entriesTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Exercise Log History</Text>

      {isLoading ? (
        <View style={[styles.loadingState, card]}>
          <ActivityIndicator size="large" color={t.accentPurple} />
          <Text style={[styles.loadingText, { color: t.textMuted, fontFamily: t.fontBody }]}>Loading sessions...</Text>
        </View>
      ) : logbookEntries.length === 0 ? (
        <View style={[styles.emptyState, card]}>
          <FileText size={48} color={t.textMuted} strokeWidth={1.5} />
          <Text style={[styles.emptyStateTitle, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>No exercises logged yet</Text>
          <Text style={[styles.emptyStateText, { color: t.textCaption, fontFamily: t.fontBody }]}>Exercise logs will appear here when you complete routines with this student.</Text>
        </View>
      ) : (
        <View style={styles.entriesList}>
          {logbookEntries.slice(0, 30).map((entry) => {
            const hasExerciseDetails = entry.exerciseDetails && entry.exerciseDetails.exerciseName;
            if (!hasExerciseDetails) return null;
            const exerciseDetails = entry.exerciseDetails;
            return (
              <View key={entry.id} style={[styles.entryCard, card]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>{formatDate(entry.date)}</Text>
                </View>
                <View style={styles.exerciseHierarchy}>
                  {exerciseDetails.programName && <Text style={[styles.programNameText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>{exerciseDetails.programName}</Text>}
                  {exerciseDetails.routineName && <Text style={[styles.routineNameText, { color: isDark ? '#A78BFA' : '#8B5CF6', fontFamily: t.fontBodySemibold }]}>{exerciseDetails.programName && ' > '}{exerciseDetails.routineName}</Text>}
                </View>
                <Text style={[styles.exerciseName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{exerciseDetails.exerciseName}</Text>
                <View style={[styles.resultContainer, { backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB' }]}>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Target:</Text>
                    <Text style={[styles.resultValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{exerciseDetails.target ? String(exerciseDetails.target).replace(/\s*attempts?/i, '') : 'N/A'}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Result:</Text>
                    <Text style={[styles.resultValue, { color: t.accentPurple, fontFamily: t.fontBodyBold, fontSize: 16 }]}>{exerciseDetails.result ? String(exerciseDetails.result).replace(/\s*attempts?/i, '') : 'N/A'}</Text>
                  </View>
                </View>
                {entry.notes && !entry.notes.startsWith(exerciseDetails.exerciseName + ':') && (
                  <Text style={[styles.entryNotes, { color: t.textMuted, fontFamily: t.fontBody, borderTopColor: isDark ? t.border : '#F3F4F6' }]}>{entry.notes}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell tokens={t} isDark={isDark} background="bg" bordered title={`${student?.name || 'Student'}'s Logbook`} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderSummary()}
        {renderLogbookEntries()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: { zIndex: 10 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  summaryContainer: { margin: 16, padding: 16 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingVertical: 2 },
  summaryTitle: { fontSize: 17 },
  totalStatsCard: { borderRadius: 10, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 26 },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDateLabel: { fontSize: 10 },
  statDate: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  statDivider: { width: 1, height: 36, marginHorizontal: 6 },
  lastExercisesCard: { borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1 },
  lastExercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1 },
  lastExercisesTitle: { fontSize: 12 },
  lastExercisesDate: { fontSize: 11 },
  exerciseDateDivider: { fontSize: 11, marginTop: 8, marginBottom: 6, paddingLeft: 4 },
  lastExercisesList: { gap: 4 },
  lastExerciseItem: { borderRadius: 6, padding: 8 },
  lastExerciseMeta: { fontSize: 10, marginBottom: 3 },
  lastExerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  lastExerciseName: { fontSize: 13, flex: 1 },
  lastExerciseResultText: { fontSize: 12 },
  accomplishmentCard: { borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, minHeight: 80, justifyContent: 'center' },
  accomplishmentTitle: { fontSize: 10, textAlign: 'center', marginBottom: 4, letterSpacing: 0.5 },
  accomplishmentStats: { alignItems: 'center' },
  accomplishmentStatValue: { fontSize: 26 },
  accomplishmentStatLabel: { fontSize: 12, marginTop: 2 },
  entriesContainer: { margin: 16 },
  entriesTitle: { fontSize: 17, marginBottom: 14 },
  loadingState: { borderRadius: 16, padding: 32, alignItems: 'center' },
  loadingText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
  emptyState: { borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyStateTitle: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  emptyStateText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  entriesList: { gap: 12 },
  entryCard: { borderRadius: 12, padding: 14 },
  entryHeader: { marginBottom: 10 },
  entryDate: { fontSize: 13 },
  exerciseHierarchy: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 },
  programNameText: { fontSize: 11 },
  routineNameText: { fontSize: 11 },
  exerciseName: { fontSize: 15, marginBottom: 10 },
  resultContainer: { borderRadius: 8, padding: 10, gap: 6, marginBottom: 8 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 13 },
  resultValue: { fontSize: 13 },
  entryNotes: { fontSize: 12, lineHeight: 17, fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1 },
  bottomSpacing: { height: 50 },
});
