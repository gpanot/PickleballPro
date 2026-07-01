import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  formatSessionDate,
  getActivityAndFormat,
  getSkillLabel,
  parseEntryDate,
  parseEntryFeeling,
  parseEntryHours,
} from '../../lib/logbookHelpers';
import skillsData from '../../data/Commun_skills_tags.json';

const IS_WEB = Platform.OS === 'web';

const QUICK_SKILL_IDS = ['dinks', 'drives', 'returns', 'drops', 'volleys', 'third_shot'];

const SKILL_GROUPS = [
  { label: 'Control', ids: ['dinks', 'drops', 'volleys', 'third_shot', 'slices', 'lobs'] },
  { label: 'Attack', ids: ['drives', 'serves', 'smashes', 'putaways', 'erne'] },
  { label: 'Movement', ids: ['returns', 'footwork', 'positioning', 'transitions'] },
];

const ACTIVITIES = [
  { id: 'training', label: 'Training' },
  { id: 'social', label: 'Social' },
  { id: 'class', label: 'Class' },
];

const FORMATS = [
  { id: 'single', label: 'Singles' },
  { id: 'double', label: 'Doubles' },
];

const MOOD_LIGHT = [
  { value: 1, label: 'Rough', bg: '#F4A5A5', text: '#8B2E2E' },
  { value: 2, label: 'Hard', bg: '#F4C6A5', text: '#8B5A2E' },
  { value: 3, label: 'OK', bg: '#D0CEEA', text: '#4A4880' },
  { value: 4, label: 'Good', bg: '#A5D4B8', text: '#27694A' },
  { value: 5, label: 'Great', bg: '#C4A5D4', text: '#5E3080' },
];

const MOOD_DARK = [
  { value: 1, label: 'Struggling', color: '#EF4444' },
  { value: 2, label: 'Difficult', color: '#F97316' },
  { value: 3, label: 'Neutral', color: '#94A3B8' },
  { value: 4, label: 'Good', color: '#22C55E' },
  { value: 5, label: 'Excellent', color: '#C5F22A' },
];

const MOOD_COPY = {
  1: 'Every session is progress — you showed up',
  2: 'Pushing through the hard days builds real strength',
  3: 'Consistency is your superpower right now',
  4: 'Nice work out there today',
  5: 'You absolutely owned that session!',
};

function Card({ tokens, isLight, children, style }) {
  return (
    <View style={[
      styles.card,
      isLight
        ? { backgroundColor: tokens.surface, borderRadius: tokens.radiusCard, ...tokens.cardShadow }
        : { backgroundColor: tokens.surface, borderRadius: tokens.radiusCard, borderWidth: 1, borderColor: tokens.border },
      style,
    ]}>
      {children}
    </View>
  );
}

function SectionLabel({ tokens, children }) {
  return (
    <Text style={{
      color: tokens.sectionLabelColor,
      fontFamily: tokens.fontBodySemibold,
      fontSize: tokens.sectionLabelSize,
      letterSpacing: tokens.sectionLabelTracking,
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </Text>
  );
}

function SkillChipSection({
  tokens, isLight, title, selected, onToggle, activeBg, activeColor,
}) {
  const [expanded, setExpanded] = useState(false);
  const expandColor = isLight ? activeBg : tokens.accentPurple;

  const renderChip = (id) => {
    const active = selected.includes(id);
    const label = getSkillLabel(id);
    return (
      <TouchableOpacity
        key={id}
        onPress={() => onToggle(id)}
        style={[
          styles.skillChip,
          active
            ? { backgroundColor: activeBg, borderColor: activeBg }
            : { backgroundColor: isLight ? tokens.chipBg : 'transparent', borderColor: tokens.chipBorder },
        ]}
        activeOpacity={0.8}
      >
        <Text style={{
          fontSize: 12,
          fontFamily: tokens.fontBodySemibold,
          color: active ? activeColor : tokens.chipText,
        }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <SectionLabel tokens={tokens}>{title}</SectionLabel>
      <Text style={{ color: tokens.textCaption, fontFamily: tokens.fontBody, fontSize: 12, marginBottom: 12 }}>
        Tap to select
      </Text>
      <View style={styles.chipWrap}>
        {QUICK_SKILL_IDS.map(renderChip)}
      </View>
      {expanded ? (
        <View style={{ marginTop: 8 }}>
          {SKILL_GROUPS.map(group => (
            <View key={group.label} style={{ marginBottom: 12 }}>
              <Text style={{
                fontSize: 10,
                color: tokens.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 8,
                fontFamily: tokens.fontBodySemibold,
              }}>
                {group.label}
              </Text>
              <View style={styles.chipWrap}>
                {group.ids.map(renderChip)}
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={() => setExpanded(false)} style={styles.expandBtn}>
            <Ionicons name="chevron-up" size={14} color={expandColor} />
            <Text style={{ color: expandColor, fontSize: 12, fontFamily: tokens.fontBodySemibold }}>Show less</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setExpanded(true)} style={styles.expandBtn}>
          <Ionicons name="chevron-down" size={14} color={expandColor} />
          <Text style={{ color: expandColor, fontSize: 12, fontFamily: tokens.fontBodySemibold }}>+ 9 more skills</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LogSessionForm({
  navigation,
  mode = 'add',
  initialEntry,
  prefillData,
  isTrainingSession = false,
  initialNotes = '',
  onSubmit,
}) {
  const insets = useSafeAreaInsets();
  const { logbookTheme: tokens, isDark } = useTheme();
  const isLight = !isDark;
  const px = isLight ? 20 : 20;

  const initial = useMemo(() => {
    if (mode === 'edit' && initialEntry) {
      const { activity, format } = getActivityAndFormat(initialEntry);
      return {
        hours: parseEntryHours(initialEntry.hours) || 1,
        date: parseEntryDate(initialEntry.date),
        feeling: parseEntryFeeling(initialEntry.feeling),
        trainingFocus: Array.isArray(initialEntry.trainingFocus)
          ? initialEntry.trainingFocus
          : [initialEntry.trainingFocus || 'dinks'],
        difficulty: Array.isArray(initialEntry.difficulty)
          ? initialEntry.difficulty
          : [initialEntry.difficulty || 'dinks'],
        activity,
        format,
        notes: initialEntry?.notes || initialNotes || '',
      };
    }
    return {
      hours: prefillData?.hours || 1.5,
      date: new Date(),
      feeling: 4,
      trainingFocus: ['dinks'],
      difficulty: ['drops'],
      activity: prefillData?.sessionType === 'training' ? 'training' : 'social',
      format: 'double',
      notes: initialNotes || '',
    };
  }, [mode, initialEntry, prefillData, initialNotes]);

  const [hours, setHours] = useState(initial.hours);
  const [date, setDate] = useState(initial.date);
  const [feeling, setFeeling] = useState(initial.feeling);
  const [trainingFocus, setTrainingFocus] = useState(initial.trainingFocus);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [activity, setActivity] = useState(initial.activity);
  const [format, setFormat] = useState(initial.format);
  const [notes, setNotes] = useState(initial.notes);

  const toggleSkill = (setter, value) => {
    setter(prev =>
      prev.includes(value)
        ? prev.length > 1 ? prev.filter(v => v !== value) : prev
        : [...prev, value]
    );
  };

  const handleSave = () => {
    const entry = {
      id: initialEntry?.id || Date.now().toString(),
      date: date.toISOString().split('T')[0],
      hours,
      feeling,
      trainingFocus,
      difficulty,
      sessionType: activity,
      location: format,
      notes: notes.trim(),
      createdAt: initialEntry?.createdAt || new Date().toISOString(),
      exerciseDetails: initialEntry?.exerciseDetails || prefillData?.exerciseDetails || null,
    };
    onSubmit(entry);
  };

  const Wrapper = IS_WEB ? View : KeyboardAvoidingView;
  const wrapperProps = IS_WEB ? {} : { behavior: Platform.OS === 'ios' ? 'padding' : 'height' };

  const moodLevels = isLight ? MOOD_LIGHT : MOOD_DARK;
  const activeMood = moodLevels.find(m => m.value === feeling);

  return (
    <Wrapper style={[styles.container, { backgroundColor: tokens.bg }]} {...wrapperProps}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: px, backgroundColor: tokens.bg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, isLight
            ? { backgroundColor: tokens.surface, ...tokens.cardShadow }
            : { borderWidth: 1, borderColor: tokens.borderSubtle },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={tokens.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={{
            color: tokens.textPrimary,
            fontFamily: isLight ? tokens.fontBodyBold : tokens.fontDisplay,
            fontSize: isLight ? 18 : 14,
            textTransform: isLight ? 'none' : 'uppercase',
            letterSpacing: isLight ? 0 : 2,
          }}>
            {isTrainingSession ? 'Save Session' : 'Log Session'}
          </Text>
          <Text style={{ color: tokens.textMuted, fontFamily: tokens.fontBody, fontSize: 12, marginTop: 2 }}>
            {formatSessionDate(date.toISOString().split('T')[0])}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: px }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Duration */}
        <Card tokens={tokens} isLight={isLight}>
          <SectionLabel tokens={tokens}>How long did you play?</SectionLabel>
          <View style={styles.durationRow}>
            <TouchableOpacity
              onPress={() => setHours(h => Math.max(0.5, h - 0.5))}
              style={[styles.stepBtn, isLight
                ? { borderWidth: 2, borderColor: tokens.borderSubtle }
                : { borderWidth: 1, borderColor: tokens.borderSubtle },
              ]}
            >
              <Ionicons name="remove" size={16} color={isLight ? tokens.accentPurple : tokens.textMuted} />
            </TouchableOpacity>
            <View style={styles.durationValue}>
              <Text style={{
                fontFamily: tokens.fontDisplay,
                fontSize: 48,
                color: tokens.textPrimary,
                lineHeight: 52,
              }}>
                {hours}
              </Text>
              <Text style={{ fontFamily: tokens.fontBodySemibold, fontSize: 20, color: tokens.textMuted }}>h</Text>
            </View>
            <TouchableOpacity
              onPress={() => setHours(h => Math.min(5, h + 0.5))}
              style={[styles.stepBtn, { backgroundColor: isLight ? tokens.accentPurpleMuted : tokens.surfaceRaised }]}
            >
              <Ionicons name="add" size={16} color={isLight ? tokens.accentPurple : tokens.accentPurple} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Activity + Format */}
        {!isTrainingSession && (
          <Card tokens={tokens} isLight={isLight}>
            <SectionLabel tokens={tokens}>Activity</SectionLabel>
            <View style={styles.activityRow}>
              {ACTIVITIES.map(opt => {
                const active = activity === opt.id;
                if (active && isLight) {
                  return (
                    <LinearGradient
                      key={opt.id}
                      colors={tokens.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activityBtnGradient}
                    >
                      <TouchableOpacity onPress={() => setActivity(opt.id)} style={styles.activityBtnInner}>
                        <Text style={{ color: '#FFF', fontFamily: tokens.fontBodyBold, fontSize: 14 }}>{opt.label}</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  );
                }
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setActivity(opt.id)}
                    style={[styles.activityBtn, active
                      ? { backgroundColor: tokens.accentPurple, borderColor: tokens.accentPurple }
                      : { backgroundColor: isLight ? tokens.bg : tokens.surfaceRaised, borderColor: tokens.borderSubtle },
                    ]}
                  >
                    <Text style={{
                      color: active ? (isLight ? '#FFF' : tokens.bg) : tokens.textMuted,
                      fontFamily: tokens.fontBodyBold,
                      fontSize: 14,
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionLabel tokens={tokens}>Format</SectionLabel>
            <View style={[styles.formatRow, { backgroundColor: isLight ? tokens.bg : tokens.surfaceRaised }]}>
              {FORMATS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setFormat(opt.id)}
                  style={[styles.formatBtn, format === opt.id && {
                    backgroundColor: isLight ? tokens.accentPurpleMuted : tokens.borderSubtle,
                  }]}
                >
                  <Text style={{
                    color: format === opt.id ? tokens.textPrimary : tokens.textMuted,
                    fontFamily: tokens.fontBodyBold,
                    fontSize: 14,
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Mood */}
        <Card tokens={tokens} isLight={isLight}>
          <SectionLabel tokens={tokens}>How did it feel?</SectionLabel>
          <View style={styles.moodRow}>
            {moodLevels.map(m => {
              const active = feeling === m.value;
              if (isLight) {
                return (
                  <TouchableOpacity
                    key={m.value}
                    onPress={() => setFeeling(m.value)}
                    style={[styles.moodChipLight, {
                      backgroundColor: m.bg,
                      opacity: active ? 1 : 0.35,
                      transform: [{ scale: active ? 1.05 : 1 }],
                    }]}
                  >
                    <Text style={{ color: m.text, fontFamily: tokens.fontBodyBold, fontSize: 11 }}>{m.label}</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setFeeling(m.value)}
                  style={[styles.moodChipDark, active && {
                    backgroundColor: `${m.color}20`,
                    borderColor: m.color,
                  }]}
                >
                  <Text style={{
                    color: active ? m.color : tokens.textMuted,
                    fontFamily: tokens.fontBodyBold,
                    fontSize: 10,
                    textAlign: 'center',
                  }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {activeMood && (
            <Text style={{
              textAlign: 'center',
              marginTop: 10,
              fontSize: 12,
              fontFamily: tokens.fontBodySemibold,
              color: isLight ? activeMood.text : (activeMood.color || tokens.textSecondary),
            }}>
              {MOOD_COPY[feeling]}
            </Text>
          )}
        </Card>

        {/* Strong skills */}
        <Card tokens={tokens} isLight={isLight}>
          <SkillChipSection
            tokens={tokens}
            isLight={isLight}
            title="What felt strong today?"
            selected={trainingFocus}
            onToggle={v => toggleSkill(setTrainingFocus, v)}
            activeBg={isLight ? tokens.accentPurple : tokens.accentPurple}
            activeColor={isLight ? '#FFFFFF' : tokens.bg}
          />
        </Card>

        {/* Challenging skills */}
        <Card tokens={tokens} isLight={isLight}>
          <SkillChipSection
            tokens={tokens}
            isLight={isLight}
            title="What challenged you?"
            selected={difficulty}
            onToggle={v => toggleSkill(setDifficulty, v)}
            activeBg={isLight ? tokens.accentRose : '#F97316'}
            activeColor={isLight ? '#FFFFFF' : tokens.bg}
          />
        </Card>

        {/* Notes */}
        <Card tokens={tokens} isLight={isLight}>
          <SectionLabel tokens={tokens}>Notes (optional)</SectionLabel>
          <TextInput
            style={[styles.notesInput, {
              backgroundColor: tokens.surfaceRaised,
              color: tokens.textPrimary,
              fontFamily: tokens.fontBody,
              borderRadius: tokens.radiusInner,
            }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything to remember or work on next time?"
            placeholderTextColor={tokens.textCaption}
            multiline
            textAlignVertical="top"
          />
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save CTA */}
      <View style={[styles.footer, {
        paddingBottom: insets.bottom + 12,
        paddingHorizontal: px,
        backgroundColor: tokens.bg,
        borderTopColor: tokens.borderSubtle,
      }]}>
        <LinearGradient
          colors={tokens.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.saveBtn, { borderRadius: isLight ? 16 : 12 }]}
        >
          <TouchableOpacity onPress={handleSave} style={styles.saveBtnInner} activeOpacity={0.9}>
            <Text style={{
              color: isDark ? tokens.bg : '#FFFFFF',
              fontFamily: isDark ? tokens.fontDisplay : tokens.fontBodyBold,
              fontSize: isDark ? 16 : 16,
              letterSpacing: isDark ? 1 : 0,
              textTransform: isDark ? 'uppercase' : 'none',
            }}>
              Save Session
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, gap: 12 },
  card: { padding: 16, marginBottom: 0 },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  activityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  activityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  activityBtnGradient: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  activityBtnInner: { paddingVertical: 10, alignItems: 'center' },
  formatRow: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  formatBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  moodRow: { flexDirection: 'row', gap: 6 },
  moodChipLight: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodChipDark: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  notesInput: {
    minHeight: 96,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: { overflow: 'hidden' },
  saveBtnInner: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
