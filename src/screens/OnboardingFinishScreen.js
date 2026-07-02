import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, ChevronRight } from 'lucide-react-native';

import MoodTimelineCard from '../components/logbook/MoodTimelineCard';
import DonutChart from '../components/logbook/DonutChart';
import SkillPatternsCard from '../components/logbook/SkillPatternsCard';
import { MOOD_COLORS } from '../theme/logbookThemes';
import { getPrograms } from '../lib/supabase';
import { matchProgramsForOnboarding, setActiveTrack } from '../lib/trainingTracksApi';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

// ─── Mock logbook data for the hero preview ───────────────────────────────────

const MOCK_MOODS = [
  { color: MOOD_COLORS.struggling, label: 'Tough' },
  { color: MOOD_COLORS.neutral,    label: 'Okay' },
  { color: MOOD_COLORS.good,       label: 'Good' },
  { color: MOOD_COLORS.good,       label: 'Good' },
  { color: MOOD_COLORS.excellent,  label: 'Great' },
];

const MOCK_MONTH_HOURS = { Training: 4, Social: 2, Class: 1 };
const MOCK_TOTAL_HOURS = 7;

const MOCK_STRONG_SKILLS = [
  { skill: 'dinks',   count: 4 },
  { skill: 'returns', count: 3 },
];
const MOCK_WEAK_SKILLS = [
  { skill: 'serves',   count: 3 },
  { skill: 'drops',    count: 2 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingFinishScreen({ route, onComplete }) {
  const insets = useSafeAreaInsets();
  const { getOnboardingData } = useUser();
  const { logbookTheme: t, isDark } = useTheme();

  const [step, setStep] = useState(1); // 1 = logbook hero, 2 = program picker
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const previousData = route?.params?.previousData || {};
  const onboardingData = getOnboardingData();
  const goal = onboardingData?.goal || previousData.goal || 'basics';
  const duprRating = onboardingData?.dupr_rating ?? previousData.duprRating ?? null;

  // Load programs when moving to step 2
  useEffect(() => {
    if (step !== 2) return;
    setLoadingPrograms(true);
    getPrograms()
      .then(({ data }) => {
        const all = data || [];
        setPrograms(all);
        const { recommended: rec, alternatives: alts } = matchProgramsForOnboarding({
          goal,
          duprRating,
          allPrograms: all,
        });
        setRecommended(rec);
        setAlternatives(alts);
        if (rec) setSelectedProgramId(rec.id);
      })
      .catch(() => {
        // On error, show empty state — don't block the user
      })
      .finally(() => setLoadingPrograms(false));
  }, [step]);

  const handleEnroll = async () => {
    if (!selectedProgramId) {
      onComplete({ initialView: 'myTraining' });
      return;
    }

    setEnrolling(true);
    setEnrollError(null);
    try {
      await setActiveTrack(selectedProgramId, 'primary');
      onComplete({ initialView: 'myTraining', enrolledProgramId: selectedProgramId });
    } catch (err) {
      setEnrolling(false);
      setEnrollError('Could not enroll — tap Retry to try again, or skip to continue.');
    }
  };

  const handleSkip = () => {
    onComplete({ initialView: 'myTraining' });
  };

  // ── Step 1: Logbook hero ───────────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: t.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.heroHeader}>
            <Text style={[styles.heroTitle, { color: t.textPrimary ?? t.text }]}>Your beautiful{'\n'}training journal</Text>
            <Text style={[styles.heroSubtitle, { color: t.textSecondary ?? t.textMuted }]}>
              Log mood after every session. See which skills you're building — automatically.
            </Text>
          </View>

          {/* Mock logbook cards */}
          <View style={styles.cardsContainer}>
            {/* Donut + hours summary */}
            <View style={[styles.summaryCard, { backgroundColor: t.surface, ...t.cardShadow, borderRadius: t.radiusCard }]}>
              <View style={styles.summaryRow}>
                <DonutChart
                  tokens={t}
                  monthSessionTypeHours={MOCK_MONTH_HOURS}
                  totalMonthHours={MOCK_TOTAL_HOURS}
                />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryHours, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>
                    7h
                  </Text>
                  <Text style={[styles.summaryLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>
                    This month
                  </Text>
                  <Text style={[styles.summaryMeta, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    Training · Social · Class
                  </Text>
                </View>
              </View>
            </View>

            <MoodTimelineCard
              tokens={t}
              last5Moods={MOCK_MOODS}
              moodTrendUp
            />

            <SkillPatternsCard
              tokens={t}
              topStrongSkills={MOCK_STRONG_SKILLS}
              topWeakSkills={MOCK_WEAK_SKILLS}
            />
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: t.bg, borderTopColor: t.border ?? '#F3F4F6' }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: t.accentPurple, shadowColor: t.accentPurple }]}
            onPress={() => setStep(2)}
            activeOpacity={0.9}
          >
            <Text style={[styles.primaryButtonText, { color: isDark ? t.fabTextColor : '#fff' }]}>Next</Text>
            <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Step 2: Program picker ─────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, { color: t.textPrimary ?? t.text }]}>Pick your free program</Text>
          <Text style={[styles.pickerSubtitle, { color: t.textSecondary ?? t.textMuted }]}>
            We matched these to your goal. You can change anytime.
          </Text>
        </View>

        {loadingPrograms ? (
          <ActivityIndicator size="large" color={t.accentPurple} style={styles.spinner} />
        ) : programs.length === 0 ? (
          <Text style={styles.emptyText}>No programs available right now.</Text>
        ) : (
          <View style={styles.programList}>
            {/* Recommended */}
            {recommended && (
              <>
                <Text style={[styles.sectionLabel, { color: t.textMuted }]}>Recommended for you</Text>
                <ProgramCard
                  program={recommended}
                  selected={selectedProgramId === recommended.id}
                  onPress={() => setSelectedProgramId(recommended.id)}
                  highlighted
                />
              </>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20, color: t.textMuted }]}>Other options</Text>
                {alternatives.map(p => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    selected={selectedProgramId === p.id}
                    onPress={() => setSelectedProgramId(p.id)}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {enrollError && (
          <Text style={styles.errorText}>{enrollError}</Text>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: t.bg, borderTopColor: t.border ?? '#F3F4F6' }]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: t.accentPurple, shadowColor: t.accentPurple },
            (!selectedProgramId || enrolling) && styles.primaryButtonDisabled,
          ]}
          onPress={handleEnroll}
          disabled={enrolling}
          activeOpacity={0.9}
        >
          {enrolling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.primaryButtonText, { color: isDark ? t.fabTextColor : '#fff' }]}>
              {selectedProgramId ? 'Start my program' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipRow}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Program card sub-component ───────────────────────────────────────────────

function ProgramCard({ program, selected, onPress, highlighted }) {
  const { logbookTheme: t, isDark } = useTheme();
  const routineCount = Array.isArray(program.routines) ? program.routines.length : 0;
  const placeholderBg = isDark ? '#334155' : '#E5E7EB';

  return (
    <TouchableOpacity
      style={[
        styles.programCard,
        { backgroundColor: t.surface },
        selected && [styles.programCardSelected, { borderColor: t.accentPurple }],
        highlighted && { backgroundColor: t.accentPurpleMuted },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {program.thumbnail_url ? (
        <Image source={{ uri: program.thumbnail_url }} style={styles.programThumb} />
      ) : (
        <View style={[styles.programThumb, { backgroundColor: placeholderBg }]} />
      )}

      <View style={styles.programInfo}>
        <Text style={[styles.programName, { color: t.textPrimary ?? t.text }]} numberOfLines={2}>{program.name}</Text>
        {program.description ? (
          <Text style={[styles.programDesc, { color: t.textSecondary ?? t.textMuted }]} numberOfLines={2}>{program.description}</Text>
        ) : null}
        {routineCount > 0 && (
          <Text style={[styles.programMeta, { color: t.textMuted }]}>{routineCount} sessions</Text>
        )}
      </View>

      {selected && (
        <CheckCircle size={22} color={t.accentPurple} strokeWidth={2} style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Step 1 — Logbook hero
  heroHeader: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  summaryCard: {
    marginHorizontal: 24,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  summaryText: {
    flex: 1,
  },
  summaryHours: {
    fontSize: 36,
    lineHeight: 42,
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  summaryMeta: {
    fontSize: 12,
    marginTop: 4,
  },

  // Step 2 — Program picker
  pickerHeader: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  pickerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  spinner: { marginTop: 40 },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 40,
  },
  programList: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  programCardSelected: {
    borderColor: '#6366F1',
  },
  programCardHighlighted: {
    backgroundColor: '#F5F3FF',
  },
  programThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  programThumbPlaceholder: {
    backgroundColor: '#E5E7EB',
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  programDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  programMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
    flexShrink: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },

  // Shared footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
