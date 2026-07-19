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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateOffering } from '../../../lib/offeringsApi';

export default function EditOfferingModal({ visible, offering, onClose, onSaved }) {
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

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      onSaved?.();
      onClose();
    }
  };

  const inp = { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', marginBottom: 10, outlineStyle: Platform.OS === 'web' ? 'none' : undefined };
  const STATUS_OPTIONS = ['draft', 'open', 'completed', 'cancelled'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={e.overlay}>
        <View style={e.sheet}>
          <View style={e.header}>
            <Text style={e.headerTitle}>Edit Offering</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={e.body} keyboardShouldPersistTaps="handled">
            <Text style={e.label}>Title *</Text>
            <TextInput style={inp} value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />

            <Text style={e.label}>Description</Text>
            <TextInput style={[inp, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline placeholderTextColor="#9CA3AF" />

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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[e.statusBtn, status === opt && e.statusBtnActive]}
                  onPress={() => setStatus(opt)}
                >
                  <Text style={[e.statusBtnText, status === opt && { color: '#7C3AED' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={e.switchRow}>
              <Text style={e.label}>Publicly visible</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#D1D5DB', true: '#7C3AED' }} thumbColor="#fff" />
            </View>
          </ScrollView>

          <View style={e.footer}>
            <TouchableOpacity style={e.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={e.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[e.saveBtn, { opacity: submitting ? 0.7 : 1 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={e.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const e = {
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet:          { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90%', overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle:    { fontSize: 16, fontWeight: '700', color: '#111827' },
  body:           { padding: 16, flexGrow: 0, maxHeight: 440 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 4 },
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statusBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  statusBtnActive: { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  statusBtnText:  { fontSize: 13, color: '#6B7280' },
  footer:         { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', justifyContent: 'flex-end' },
  cancelBtn:      { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cancelBtnText:  { fontSize: 14, color: '#6B7280' },
  saveBtn:        { backgroundColor: '#7C3AED', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  saveBtnText:    { fontSize: 14, fontWeight: '600', color: '#fff' },
};
