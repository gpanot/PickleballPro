/**
 * CreateOfferingStep1Screen
 * Basic info: title, type, program, description, public/draft toggle.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { BookOpen, FileText, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../../lib/supabase';

export default function CreateOfferingStep1Screen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();

  // Allow coming back from Step 2/3 with pre-filled data
  const initial = route.params?.step1 ?? {};

  const [title,       setTitle]       = useState(initial.title ?? '');
  const [type,        setType]        = useState(initial.type  ?? 'cohort');
  const [description, setDescription] = useState(initial.description ?? '');
  const [isPublic,    setIsPublic]    = useState(initial.isPublic ?? false);
  const [programId,   setProgramId]   = useState(initial.programId ?? null);
  const [programs,    setPrograms]    = useState([]);
  const [loadingProg, setLoadingProg] = useState(true);

  useEffect(() => {
    supabase
      .from('programs')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (!error) setPrograms(data ?? []);
        setLoadingProg(false);
      });
  }, []);

  const onNext = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for this offering.');
      return;
    }
    if (!programId) {
      Alert.alert('Missing program', 'Please select a program.');
      return;
    }
    navigation.navigate('CreateOfferingStep2', {
      step1: { title: title.trim(), type, description: description.trim(), isPublic, programId },
      ...(route.params?.step2 ? { step2: route.params.step2 } : {}),
    });
  };

  const inp = [styles.input, { color: t.textPrimary, borderColor: isDark ? t.border : '#E5E7EB', backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB', fontFamily: t.fontBody }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.sectionLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>
        STEP 1 OF 3 — BASIC DETAILS
      </Text>

      {/* Title */}
      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Title *</Text>
      <TextInput
        style={inp}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Beginner Cohort — July 2026"
        placeholderTextColor={t.textMuted}
        maxLength={80}
      />

      {/* Type */}
      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Type *</Text>
      <View style={styles.toggleRow}>
        {(['cohort', 'event']).map(opt => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.typeBtn,
              { borderColor: type === opt ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                backgroundColor: type === opt ? `${t.accentPurple}15` : (isDark ? t.surfaceRaised : '#F9FAFB') },
            ]}
            onPress={() => setType(opt)}
          >
            <Text style={{ color: type === opt ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold, fontSize: 14 }}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Program */}
      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Program *</Text>
      {loadingProg
        ? <ActivityIndicator color={t.accentPurple} style={{ marginBottom: 16 }} />
        : programs.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.programRow,
              { borderColor: programId === p.id ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                backgroundColor: programId === p.id ? `${t.accentPurple}10` : (isDark ? t.surfaceRaised : '#F9FAFB') },
            ]}
            onPress={() => setProgramId(p.id)}
          >
            <BookOpen size={14} color={programId === p.id ? t.accentPurple : t.textMuted} strokeWidth={2} />
            <Text style={[styles.programName, { color: programId === p.id ? t.accentPurple : t.textPrimary, fontFamily: t.fontBody }]}>
              {p.name}
            </Text>
          </TouchableOpacity>
        ))
      }

      {/* Description */}
      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Description</Text>
      <TextInput
        style={[inp, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What will students learn?"
        placeholderTextColor={t.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Public toggle */}
      <View style={styles.row}>
        <FileText size={16} color={t.textMuted} strokeWidth={2} />
        <Text style={[styles.rowLabel, { color: t.textPrimary, fontFamily: t.fontBody }]}>
          Make publicly visible
        </Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: isDark ? t.border : '#D1D5DB', true: t.accentPurple }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: t.accentPurple }]}
        onPress={onNext}
        activeOpacity={0.85}
      >
        <Text style={[styles.nextBtnText, { fontFamily: t.fontBodySemibold }]}>Next: Location & Capacity</Text>
        <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:     { padding: 20, paddingBottom: 48 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 20, textTransform: 'uppercase' },
  label:       { fontSize: 14, marginBottom: 6, marginTop: 16 },
  input:       { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  textarea:    { height: 100, marginBottom: 4 },
  toggleRow:   { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn:     { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: 'center' },
  programRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 6 },
  programName: { fontSize: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 4 },
  rowLabel:    { flex: 1, fontSize: 15 },
  nextBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, padding: 16, borderRadius: 14 },
  nextBtnText: { color: '#fff', fontSize: 16 },
});
