import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useLogbook } from '../context/LogbookContext';
import skillsData from '../data/Commun_skills_tags.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

export default function AddTrainingSessionScreen({ navigation, route }) {
  const { addLogbookEntry } = useLogbook();
  const insets = useSafeAreaInsets();

  const prefillData = route?.params?.prefillData;
  const isTrainingSession = prefillData?.sessionType === 'training';

  function getDifficultyEmoji(difficulty) {
    return ({ 1: '🤩', 2: '😊', 3: '😐', 4: '😕', 5: '😓' })[difficulty] || '😐';
  }

  const [hours, setHours]               = useState(prefillData?.hours || 1.0);
  const [date, setDate]                 = useState(new Date());
  const [feeling, setFeeling]           = useState(3);
  const [trainingFocus, setTrainingFocus] = useState(['dinks']);
  const [difficulty, setDifficulty]     = useState(['dinks']);
  const [sessionType, setSessionType]   = useState(prefillData?.sessionType || 'single');
  const [notes, setNotes]               = useState(prefillData ? generateInitialNotes(prefillData) : '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  function generateInitialNotes(data) {
    let n = '';
    if (data.routineName && data.programName) n += `${data.programName} - ${data.routineName}\n\n`;
    if (data.exerciseLogs?.length > 0) {
      n += 'Exercise Results:\n';
      data.exerciseLogs.forEach((log, i) => {
        const name = log.exerciseName || log.name || log.title || `Exercise ${i + 1}`;
        const emoji = log.difficulty ? ` ${getDifficultyEmoji(log.difficulty)}` : '';
        n += `• ${name}: ${log.result}${emoji}`;
        if (log.target) n += ` (Target: ${log.target})`;
        if (log.notes) n += ` - ${log.notes}`;
        n += '\n';
      });
    }
    return n;
  }

  const feelingOptions = [
    { value: 1, emoji: '😓', label: 'Struggling', color: '#EF4444' },
    { value: 2, emoji: '😕', label: 'Difficult',  color: '#F97316' },
    { value: 3, emoji: '😐', label: 'Neutral',    color: '#6B7280' },
    { value: 4, emoji: '😊', label: 'Good',       color: '#10B981' },
    { value: 5, emoji: '🤩', label: 'Excellent',  color: '#8B5CF6' },
  ];

  const trainingFocusOptions = [
    ...skillsData.skillCategories.technical.skills.map(s => ({ value: s.id, label: s.name, color: s.color })),
    ...skillsData.skillCategories.movement.skills.map(s => ({ value: s.id, label: s.name, color: s.color })),
  ];

  const sessionTypeOptions = [
    { value: 'training', emoji: '🏋️', label: 'Training', color: '#EF4444' },
    { value: 'social',   emoji: '🎉', label: 'Social',   color: '#8B5CF6' },
    { value: 'class',    emoji: '🎓', label: 'Class',    color: '#F59E0B' },
    { value: 'single',   emoji: '👤', label: 'Single',   color: '#3B82F6' },
    { value: 'double',   emoji: '👥', label: 'Double',   color: '#10B981' },
  ];

  const incrementHours = () => setHours(p => Math.min(p + 0.5, 5));
  const decrementHours = () => setHours(p => Math.max(p - 0.5, 0.5));

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const formatDateForDisplay = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleSubmit = () => {
    if (!hours || !date) return;
    const entry = {
      id: Date.now().toString(),
      date: date.toISOString().split('T')[0],
      hours,
      feeling,
      trainingFocus,
      difficulty,
      sessionType,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    addLogbookEntry(entry);
    navigation.navigate('LogConfirmation', { entry, isTrainingSession });
  };

  const toggle = (setter, value) => setter(prev =>
    prev.includes(value)
      ? prev.length > 1 ? prev.filter(v => v !== value) : prev
      : [...prev, value]
  );

  const WrapperComponent = IS_WEB ? View : KeyboardAvoidingView;
  const wrapperProps = IS_WEB ? {} : {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: 0,
  };

  // Section card component for web layout
  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <WrapperComponent style={styles.container} {...wrapperProps}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || (IS_WEB ? 0 : 16) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isTrainingSession ? 'Save Training Session' : 'Log Training Session'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        testID="training-session-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Training session notes at top */}
        {isTrainingSession && (
          <Section title="Session Notes">
            <Text style={styles.inputHint}>Review your exercise results and add any additional notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes about your training session..."
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </Section>
        )}

        {/* Hours + Date row */}
        <View style={styles.twoColRow}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Hours Trained</Text>
            <View style={styles.hoursRow}>
              <TouchableOpacity
                style={[styles.hoursBtn, hours <= 0.5 && styles.hoursBtnDisabled]}
                onPress={decrementHours}
                disabled={hours <= 0.5}
              >
                <Text style={styles.hoursBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.hoursValue}>{`${hours}h`}</Text>
              <TouchableOpacity
                style={[styles.hoursBtn, hours >= 5 && styles.hoursBtnDisabled]}
                onPress={incrementHours}
                disabled={hours >= 5}
              >
                <Text style={styles.hoursBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Date</Text>
            {IS_WEB ? (
              <input
                type="date"
                value={date.toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(new Date(e.target.value + 'T12:00:00'))}
                style={webDateInputStyle}
              />
            ) : (
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateValue}>{formatDateForDisplay(date)}</Text>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
            {showDatePicker && !IS_WEB && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        </View>

        {/* Session Type */}
        {!isTrainingSession && (
          <Section title="Session Type">
            <View style={styles.chipRow}>
              {sessionTypeOptions.map(opt => {
                const active = sessionType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.sessionChip, active && { backgroundColor: opt.color + '18', borderColor: opt.color }]}
                    onPress={() => setSessionType(opt.value)}
                  >
                    <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.chipLabel, active && { color: opt.color, fontWeight: '600' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>
        )}

        {/* Feeling */}
        <Section title="How did you feel about your progress?">
          <View style={styles.feelingRow}>
            {feelingOptions.map(opt => {
              const active = feeling === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.feelingChip, active && { backgroundColor: opt.color + '18', borderColor: opt.color }]}
                  onPress={() => setFeeling(opt.value)}
                >
                  <Text style={styles.feelingEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.feelingLabel, active && { color: opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* What was good */}
        <Section title="What was good for you this session?">
          <View style={styles.skillGrid}>
            {trainingFocusOptions.map(opt => {
              const active = trainingFocus.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.skillChip, active && { backgroundColor: opt.color + '18', borderColor: opt.color }]}
                  onPress={() => toggle(setTrainingFocus, opt.value)}
                >
                  <Text style={[styles.skillLabel, active && { color: opt.color, fontWeight: '600' }]}>{opt.label}</Text>
                  {active && <Text style={[styles.skillCheck, { color: opt.color }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* What was difficult */}
        <Section title="What was the most difficult?">
          <View style={styles.skillGrid}>
            {trainingFocusOptions.map(opt => {
              const active = difficulty.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.skillChip, active && { backgroundColor: opt.color + '18', borderColor: opt.color }]}
                  onPress={() => toggle(setDifficulty, opt.value)}
                >
                  <Text style={[styles.skillLabel, active && { color: opt.color, fontWeight: '600' }]}>{opt.label}</Text>
                  {active && <Text style={[styles.skillCheck, { color: opt.color }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Notes for non-training sessions */}
        {!isTrainingSession && (
          <Section title="Notes (Optional)">
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="What did you work on? Any insights or goals for next time?"
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </Section>
        )}

        {/* Save button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Save Training Session</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </WrapperComponent>
  );
}

// Native HTML date input style (web only)
const webDateInputStyle = {
  width: '100%',
  border: '1px solid #D1D5DB',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: '#1F2937',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...(IS_WEB && { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }),
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 38 },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    ...(IS_WEB && SCREEN_WIDTH >= 640 && { maxWidth: 680, alignSelf: 'center', width: '100%' }),
  },

  // Section card
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...(IS_WEB && { boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },

  // Two-column row for hours + date
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },

  // Hours
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  hoursBtn: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  hoursBtnDisabled: { opacity: 0.35 },
  hoursBtnText: { fontSize: 22, fontWeight: '300', color: '#374151' },
  hoursValue: { fontSize: 20, fontWeight: '700', color: '#111827' },

  // Date
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#FFFFFF',
  },
  dateValue: { fontSize: 14, color: '#1F2937', flex: 1 },

  // Session type chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: '#4B5563' },

  // Feeling
  feelingRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  feelingChip: {
    flex: 1,
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  feelingEmoji: { fontSize: 22, marginBottom: 5 },
  feelingLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  // Skill chips grid
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 5,
  },
  skillLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  skillCheck: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Save button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    ...(IS_WEB && { cursor: 'pointer' }),
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
