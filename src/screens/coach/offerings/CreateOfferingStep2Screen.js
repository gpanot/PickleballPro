/**
 * CreateOfferingStep2Screen
 * Location, capacity, skill level range.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MapPin, Users, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function CreateOfferingStep2Screen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const { step1 } = route.params;
  const initial = route.params?.step2 ?? {};

  const [location,      setLocation]      = useState(initial.location ?? '');
  const [facilityName,  setFacilityName]  = useState(initial.facilityName ?? '');
  const [capacityStr,   setCapacityStr]   = useState(initial.capacity ? String(initial.capacity) : '');
  const [skillMinStr,   setSkillMinStr]   = useState(initial.skillLevelMin != null ? String(initial.skillLevelMin) : '');
  const [skillMaxStr,   setSkillMaxStr]   = useState(initial.skillLevelMax != null ? String(initial.skillLevelMax) : '');

  const onNext = () => {
    const capacity = parseInt(capacityStr, 10);
    if (!capacityStr.trim() || isNaN(capacity) || capacity < 1) {
      Alert.alert('Invalid capacity', 'Please enter a valid number of spots per run (minimum 1).');
      return;
    }

    const skillMin = skillMinStr.trim() ? parseFloat(skillMinStr) : null;
    const skillMax = skillMaxStr.trim() ? parseFloat(skillMaxStr) : null;

    if (skillMin !== null && skillMax !== null && skillMin > skillMax) {
      Alert.alert('Invalid skill range', 'Minimum skill level must not exceed maximum.');
      return;
    }

    navigation.navigate('CreateOfferingStep3', {
      step1,
      step2: {
        location:     location.trim(),
        facilityName: facilityName.trim(),
        capacity,
        skillLevelMin: skillMin,
        skillLevelMax: skillMax,
      },
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
        STEP 2 OF 3 — LOCATION & CAPACITY
      </Text>

      {/* Location */}
      <View style={styles.iconLabel}>
        <MapPin size={14} color={t.accentPurple} strokeWidth={2} />
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Location</Text>
      </View>
      <TextInput
        style={inp}
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. 123 Court St, Ho Chi Minh City"
        placeholderTextColor={t.textMuted}
      />

      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>Facility name</Text>
      <TextInput
        style={inp}
        value={facilityName}
        onChangeText={setFacilityName}
        placeholder="e.g. Saigon Pickleball Club"
        placeholderTextColor={t.textMuted}
      />

      {/* Capacity */}
      <View style={[styles.iconLabel, { marginTop: 20 }]}>
        <Users size={14} color={t.accentPurple} strokeWidth={2} />
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Spots per run *</Text>
      </View>
      <TextInput
        style={inp}
        value={capacityStr}
        onChangeText={setCapacityStr}
        placeholder="e.g. 12"
        placeholderTextColor={t.textMuted}
        keyboardType="number-pad"
        maxLength={4}
      />

      {/* Skill level range */}
      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 20 }]}>
        Skill level range (DUPR, optional)
      </Text>
      <View style={styles.rangeRow}>
        <TextInput
          style={[inp, styles.halfInput]}
          value={skillMinStr}
          onChangeText={setSkillMinStr}
          placeholder="Min (e.g. 2.0)"
          placeholderTextColor={t.textMuted}
          keyboardType="decimal-pad"
        />
        <Text style={[styles.rangeSep, { color: t.textMuted }]}>–</Text>
        <TextInput
          style={[inp, styles.halfInput]}
          value={skillMaxStr}
          onChangeText={setSkillMaxStr}
          placeholder="Max (e.g. 4.0)"
          placeholderTextColor={t.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: isDark ? t.border : '#E5E7EB' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <ChevronLeft size={18} color={t.textMuted} strokeWidth={2.5} />
          <Text style={[styles.backBtnText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: t.accentPurple }]}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { fontFamily: t.fontBodySemibold }]}>Next: First Run</Text>
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:     { padding: 20, paddingBottom: 48 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 20, textTransform: 'uppercase' },
  iconLabel:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label:       { fontSize: 14, marginBottom: 6 },
  input:       { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  rangeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  halfInput:   { flex: 1, marginBottom: 4 },
  rangeSep:    { fontSize: 18, lineHeight: 46, marginTop: -4 },
  btnRow:      { flexDirection: 'row', gap: 12, marginTop: 32 },
  backBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 14, padding: 16 },
  backBtnText: { fontSize: 15 },
  nextBtn:     { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  nextBtnText: { color: '#fff', fontSize: 16 },
});
