/**
 * EditOfferingScreen
 * Allows a coach to edit the basic fields of an existing offering.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { ScreenHeaderShell } from '../../../components/logbook/ScreenHeader';
import { updateOffering } from '../../../lib/offeringsApi';
import ThumbnailPicker from '../../../components/ThumbnailPicker';

export default function EditOfferingScreen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const { offeringId, offering } = route.params ?? {};

  const [title,        setTitle]        = useState(offering?.title ?? '');
  const [description,  setDescription]  = useState(offering?.description ?? '');
  const [location,     setLocation]     = useState(offering?.location ?? '');
  const [facility,     setFacility]     = useState(offering?.facility_name ?? '');
  const [capacity,     setCapacity]     = useState(String(offering?.capacity_per_run ?? ''));
  const [skillMin,     setSkillMin]     = useState(offering?.skill_level_min != null ? String(offering.skill_level_min) : '');
  const [skillMax,     setSkillMax]     = useState(offering?.skill_level_max != null ? String(offering.skill_level_max) : '');
  const [isPublic,     setIsPublic]     = useState(offering?.is_public ?? false);
  const [thumbnailUrl, setThumbnailUrl] = useState(offering?.thumbnail_url ?? null);
  const [saving,       setSaving]       = useState(false);

  const onSave = async () => {
    if (!title.trim()) {
      alert('Title is required.');
      return;
    }
    const cap = parseInt(capacity || '0', 10);
    if (!cap || cap < 1) {
      alert('Capacity must be at least 1.');
      return;
    }
    const sMin = skillMin ? parseFloat(skillMin) : null;
    const sMax = skillMax ? parseFloat(skillMax) : null;
    if (sMin !== null && sMax !== null && sMin > sMax) {
      alert('Min skill level must not exceed max.');
      return;
    }

    setSaving(true);
    const { error } = await updateOffering({
      offeringId,
      title:          title.trim(),
      description:    description.trim() || null,
      location:       location.trim() || null,
      facilityName:   facility.trim() || null,
      capacityPerRun: cap,
      skillLevelMin:  sMin,
      skillLevelMax:  sMax,
      thumbnailUrl:   thumbnailUrl ?? null,
      isPublic,
      status:         isPublic ? 'open' : 'draft',
    });
    setSaving(false);

    if (error) {
      alert(error.message || 'Failed to save changes.');
    } else {
      navigation.goBack();
    }
  };

  const inp = [
    styles.input,
    {
      color: t.textPrimary,
      borderColor: isDark ? t.border : '#E5E7EB',
      backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB',
      fontFamily: t.fontBody,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="Edit Offering"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.saveHeaderBtn, { backgroundColor: t.accentPurple, opacity: saving ? 0.5 : 1 }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={[styles.saveHeaderText, { fontFamily: t.fontBodySemibold }]}>Save</Text>
            }
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover photo */}
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 0 }]}>Cover photo</Text>
        <ThumbnailPicker
          thumbnailUrl={thumbnailUrl}
          onUploaded={(url) => setThumbnailUrl(url)}
          navigation={navigation}
          offeringId={offeringId ?? 'edit'}
        />

        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Title *</Text>
        <TextInput style={inp} value={title} onChangeText={setTitle} placeholder="e.g. Beginner Cohort Spring 2026" placeholderTextColor={t.textMuted} />

        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>Description</Text>
        <TextInput style={[inp, styles.textarea]} value={description} onChangeText={setDescription} placeholder="What will students learn?" placeholderTextColor={t.textMuted} multiline numberOfLines={3} textAlignVertical="top" />

        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>Location</Text>
        <TextInput style={inp} value={location} onChangeText={setLocation} placeholder="City or venue" placeholderTextColor={t.textMuted} />

        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>Facility name</Text>
        <TextInput style={inp} value={facility} onChangeText={setFacility} placeholder="Court name or address" placeholderTextColor={t.textMuted} />

        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>Capacity per run *</Text>
        <TextInput style={inp} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="e.g. 12" placeholderTextColor={t.textMuted} />

        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>Skill level range (optional)</Text>
        <View style={styles.rangeRow}>
          <TextInput style={[inp, { flex: 1 }]} value={skillMin} onChangeText={setSkillMin} keyboardType="decimal-pad" placeholder="Min" placeholderTextColor={t.textMuted} />
          <Text style={[styles.rangeSep, { color: t.textMuted }]}>–</Text>
          <TextInput style={[inp, { flex: 1 }]} value={skillMax} onChangeText={setSkillMax} keyboardType="decimal-pad" placeholder="Max" placeholderTextColor={t.textMuted} />
        </View>

        <View style={[styles.row, { marginTop: 20 }]}>
          <Text style={[styles.rowLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Public (visible to students)</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: t.accentPurple, false: isDark ? t.border : '#D1D5DB' }} thumbColor="#fff" />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content:   { padding: 20, paddingBottom: 32 },
  label:     { fontSize: 14, marginBottom: 6 },
  input:     { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  textarea:  { height: 80, marginBottom: 4 },
  rangeRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeSep:  { fontSize: 18, lineHeight: 46 },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel:       { flex: 1, fontSize: 15 },
  saveHeaderBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  saveHeaderText: { fontSize: 15, color: '#fff' },
});
