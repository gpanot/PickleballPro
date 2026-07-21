import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateOffering } from '../../../lib/offeringsApi';

const STATUS_OPTIONS = ['draft', 'open', 'completed', 'cancelled'];

export default function EditOfferingModal({ visible, offering, onClose, onSaved }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' || screenWidth < 600;

  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [location,     setLocation]     = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [capacityStr,  setCapacityStr]  = useState('');
  const [skillMinStr,  setSkillMinStr]  = useState('');
  const [skillMaxStr,  setSkillMaxStr]  = useState('');
  const [isPublic,     setIsPublic]     = useState(false);
  const [status,       setStatus]       = useState('draft');
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    if (offering) {
      setTitle(offering.title ?? '');
      setDescription(offering.description ?? '');
      setLocation(offering.location ?? '');
      setFacilityName(offering.facility_name ?? '');
      setCapacityStr(offering.capacity_per_run != null ? String(offering.capacity_per_run) : '');
      setSkillMinStr(offering.skill_level_min != null ? String(offering.skill_level_min) : '');
      setSkillMaxStr(offering.skill_level_max != null ? String(offering.skill_level_max) : '');
      setIsPublic(offering.is_public ?? false);
      setStatus(offering.status ?? 'draft');
    }
  }, [offering]);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Title cannot be empty.'); return; }
    const cap = parseInt(capacityStr, 10);
    if (isNaN(cap) || cap < 1) { Alert.alert('Required', 'Enter a valid capacity.'); return; }

    setSubmitting(true);
    const { error } = await updateOffering({
      offeringId:     offering.id,
      title:          title.trim(),
      description:    description.trim() || null,
      location:       location.trim() || null,
      facilityName:   facilityName.trim() || null,
      capacityPerRun: cap,
      skillLevelMin:  skillMinStr.trim() ? parseFloat(skillMinStr) : null,
      skillLevelMax:  skillMaxStr.trim() ? parseFloat(skillMaxStr) : null,
      isPublic,
      status,
    });
    setSubmitting(false);

    if (error) Alert.alert('Error', error.message);
    else { onSaved?.(); onClose(); }
  };

  const inp = {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  };

  const sheetStyle = isMobile
    ? { flex: 1, borderRadius: 0 }
    : { width: '100%', maxWidth: 480, borderRadius: 16, maxHeight: Math.min(screenHeight * 0.88, 680) };

  const overlayStyle = isMobile
    ? { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }
    : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 };

  return (
    <Modal visible={visible} transparent animationType={isMobile ? 'slide' : 'fade'} onRequestClose={onClose}>
      <View style={overlayStyle}>
        <View style={[e.sheet, sheetStyle]}>
          {/* Header */}
          <View style={e.header}>
            <Text style={e.headerTitle}>Edit Offering</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={e.body} keyboardShouldPersistTaps="handled">
            <Text style={e.label}>Title *</Text>
            <TextInput style={inp} value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />

            <Text style={e.label}>Description</Text>
            <TextInput
              style={[inp, { minHeight: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#9CA3AF"
            />

            <Text style={e.label}>Location</Text>
            <TextInput style={inp} value={location} onChangeText={setLocation} placeholderTextColor="#9CA3AF" />

            <Text style={e.label}>Facility name</Text>
            <TextInput style={inp} value={facilityName} onChangeText={setFacilityName} placeholderTextColor="#9CA3AF" />

            <Text style={e.label}>Spots per run *</Text>
            <TextInput style={inp} value={capacityStr} onChangeText={setCapacityStr} keyboardType="number-pad" placeholderTextColor="#9CA3AF" />

            <Text style={e.label}>Skill range (DUPR)</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[inp, { flex: 1 }]} value={skillMinStr} onChangeText={setSkillMinStr} placeholder="Min" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
              <TextInput style={[inp, { flex: 1 }]} value={skillMaxStr} onChangeText={setSkillMaxStr} placeholder="Max" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
            </View>

            <Text style={e.label}>Status</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[e.statusBtn, status === opt && e.statusBtnActive]}
                  onPress={() => setStatus(opt)}
                >
                  <Text style={[e.statusBtnText, status === opt && { color: '#7C3AED', fontWeight: '600' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={e.switchRow}>
              <View>
                <Text style={e.label}>Publicly visible</Text>
                <Text style={e.hint}>Visible on your public booking page</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={e.footer}>
            <TouchableOpacity style={e.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={e.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[e.saveBtn, { flex: 1, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={e.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const e = {
  sheet:          { backgroundColor: '#fff', overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: '#111827' },
  body:           { padding: 16, paddingBottom: 24 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 4 },
  hint:           { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 },
  statusBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  statusBtnActive: { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  statusBtnText:  { fontSize: 13, color: '#6B7280' },
  footer:         { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cancelBtn:      { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:  { fontSize: 14, color: '#6B7280' },
  saveBtn:        { backgroundColor: '#7C3AED', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:    { fontSize: 14, fontWeight: '600', color: '#fff' },
};
