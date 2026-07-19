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
import { supabase } from '../../../lib/supabase';
import { createOffering, createOfferingRun } from '../../../lib/offeringsApi';

const TODAY = new Date().toISOString().split('T')[0];

export default function CreateOfferingModal({ visible, onClose, onCreated }) {
  const [step,         setStep]         = useState(1);
  const [programs,     setPrograms]     = useState([]);
  const [loadingProgs, setLoadingProgs] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // Step 1
  const [title,        setTitle]        = useState('');
  const [type,         setType]         = useState('cohort');
  const [description,  setDescription]  = useState('');
  const [programId,    setProgramId]    = useState(null);
  const [isPublic,     setIsPublic]     = useState(false);
  // Step 2
  const [location,     setLocation]     = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [capacityStr,  setCapacityStr]  = useState('');
  const [skillMinStr,  setSkillMinStr]  = useState('');
  const [skillMaxStr,  setSkillMaxStr]  = useState('');
  // Step 3 (first run)
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [schedule,     setSchedule]     = useState('');
  const [priceStr,     setPriceStr]     = useState('0');
  const [priceCurrency, setPriceCurrency] = useState('USD');
  const [paymentLink,  setPaymentLink]  = useState('');

  useEffect(() => {
    if (visible && programs.length === 0) {
      setLoadingProgs(true);
      supabase.from('programs').select('id, name').order('name').then(({ data }) => {
        setPrograms(data ?? []);
        setLoadingProgs(false);
      });
    }
  }, [visible]);

  const reset = () => {
    setStep(1);
    setTitle(''); setType('cohort'); setDescription(''); setProgramId(null); setIsPublic(false);
    setLocation(''); setFacilityName(''); setCapacityStr(''); setSkillMinStr(''); setSkillMaxStr('');
    setStartDate(''); setEndDate(''); setSchedule(''); setPriceStr('0'); setPriceCurrency('USD'); setPaymentLink('');
  };

  const handleClose = () => { reset(); onClose(); };

  const goNext = () => {
    if (step === 1) {
      if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
      if (!programId)    { Alert.alert('Required', 'Please select a program.'); return; }
    }
    if (step === 2) {
      const cap = parseInt(capacityStr, 10);
      if (isNaN(cap) || cap < 1) { Alert.alert('Required', 'Enter a valid spots-per-run number.'); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!startDate.trim() || !endDate.trim() || !schedule.trim()) {
      Alert.alert('Required', 'Start date, end date, and schedule are required.');
      return;
    }
    const capacity = parseInt(capacityStr, 10);
    setSubmitting(true);

    const { data: offeringId, error: offeringErr } = await createOffering({
      programId,
      title:          title.trim(),
      type,
      location:       location.trim(),
      facilityName:   facilityName.trim(),
      capacityPerRun: capacity,
      skillLevelMin:  skillMinStr.trim() ? parseFloat(skillMinStr) : null,
      skillLevelMax:  skillMaxStr.trim() ? parseFloat(skillMaxStr) : null,
      description:    description.trim(),
      isPublic,
      status:         isPublic ? 'open' : 'draft',
    });

    if (offeringErr || !offeringId) {
      setSubmitting(false);
      Alert.alert('Error', offeringErr?.message || 'Failed to create offering.');
      return;
    }

    const { error: runErr } = await createOfferingRun({
      offeringId,
      startDate:       startDate.trim(),
      endDate:         endDate.trim(),
      sessionSchedule: schedule.trim(),
      priceAmount:     Math.max(0, parseInt(priceStr || '0', 10)),
      priceCurrency,
      paymentLinkUrl:  paymentLink.trim() || null,
    });

    setSubmitting(false);
    if (runErr) {
      Alert.alert('Warning', `Offering created but first run failed: ${runErr.message}`);
    }
    reset();
    onCreated?.(offeringId);
    onClose();
  };

  const inp = { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', marginBottom: 10, outlineStyle: Platform.OS === 'web' ? 'none' : undefined };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          {/* Header */}
          <View style={m.header}>
            <Text style={m.headerTitle}>New Offering — Step {step}/3</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={m.body} keyboardShouldPersistTaps="handled">
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <Text style={m.label}>Title *</Text>
                <TextInput style={inp} value={title} onChangeText={setTitle} placeholder="e.g. Beginner Cohort July 2026" placeholderTextColor="#9CA3AF" />

                <Text style={m.label}>Type</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {(['cohort', 'event']).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[m.typeBtn, type === opt && m.typeBtnActive]}
                      onPress={() => setType(opt)}
                    >
                      <Text style={[m.typeBtnText, type === opt && m.typeBtnTextActive]}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={m.label}>Program *</Text>
                {loadingProgs
                  ? <ActivityIndicator color="#7C3AED" style={{ marginBottom: 10 }} />
                  : programs.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[m.programRow, programId === p.id && m.programRowActive]}
                      onPress={() => setProgramId(p.id)}
                    >
                      <Text style={[m.programText, programId === p.id && { color: '#7C3AED' }]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))
                }

                <Text style={m.label}>Description</Text>
                <TextInput style={[inp, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="What will students learn?" placeholderTextColor="#9CA3AF" multiline />

                <View style={m.switchRow}>
                  <Text style={m.label}>Make publicly visible</Text>
                  <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#D1D5DB', true: '#7C3AED' }} thumbColor="#fff" />
                </View>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <Text style={m.label}>Location</Text>
                <TextInput style={inp} value={location} onChangeText={setLocation} placeholder="e.g. 123 Court St" placeholderTextColor="#9CA3AF" />

                <Text style={m.label}>Facility name</Text>
                <TextInput style={inp} value={facilityName} onChangeText={setFacilityName} placeholder="e.g. Saigon PB Club" placeholderTextColor="#9CA3AF" />

                <Text style={m.label}>Spots per run *</Text>
                <TextInput style={inp} value={capacityStr} onChangeText={setCapacityStr} placeholder="e.g. 12" placeholderTextColor="#9CA3AF" keyboardType="number-pad" />

                <Text style={m.label}>Skill level range (DUPR)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput style={[inp, { flex: 1 }]} value={skillMinStr} onChangeText={setSkillMinStr} placeholder="Min" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
                  <TextInput style={[inp, { flex: 1 }]} value={skillMaxStr} onChangeText={setSkillMaxStr} placeholder="Max" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
                </View>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <Text style={m.label}>Start date * (YYYY-MM-DD)</Text>
                <TextInput style={inp} value={startDate} onChangeText={setStartDate} placeholder={TODAY} placeholderTextColor="#9CA3AF" />

                <Text style={m.label}>End date * (YYYY-MM-DD)</Text>
                <TextInput style={inp} value={endDate} onChangeText={setEndDate} placeholder="2026-08-30" placeholderTextColor="#9CA3AF" />

                <Text style={m.label}>Session schedule *</Text>
                <TextInput style={inp} value={schedule} onChangeText={setSchedule} placeholder="e.g. Every Tue & Thu 7–9PM" placeholderTextColor="#9CA3AF" />

                <Text style={m.label}>Price (0 = free)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput style={[inp, { flex: 1 }]} value={priceStr} onChangeText={setPriceStr} placeholder="0" placeholderTextColor="#9CA3AF" keyboardType="number-pad" />
                  {(['USD', 'VND']).map(cur => (
                    <TouchableOpacity
                      key={cur}
                      style={[m.typeBtn, priceCurrency === cur && m.typeBtnActive, { marginBottom: 10 }]}
                      onPress={() => setPriceCurrency(cur)}
                    >
                      <Text style={[m.typeBtnText, priceCurrency === cur && m.typeBtnTextActive]}>{cur}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={m.label}>Payment link (optional)</Text>
                <TextInput style={inp} value={paymentLink} onChangeText={setPaymentLink} placeholder="https://buy.stripe.com/..." placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="url" />
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={m.footer}>
            {step > 1 && (
              <TouchableOpacity style={m.backBtn} onPress={() => setStep(s => s - 1)} disabled={submitting}>
                <Ionicons name="chevron-back-outline" size={16} color="#6B7280" />
                <Text style={m.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 3
              ? (
                <TouchableOpacity style={m.nextBtn} onPress={goNext}>
                  <Text style={m.nextBtnText}>Next</Text>
                  <Ionicons name="chevron-forward-outline" size={16} color="#fff" />
                </TouchableOpacity>
              )
              : (
                <TouchableOpacity style={[m.nextBtn, { opacity: submitting ? 0.7 : 1 }]} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.nextBtnText}>Create Offering</Text>}
                </TouchableOpacity>
              )
            }
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = {
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet:           { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90%', overflow: 'hidden' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle:     { fontSize: 16, fontWeight: '700', color: '#111827' },
  body:            { padding: 16, flexGrow: 0, maxHeight: 480 },
  label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 4 },
  switchRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typeBtn:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  typeBtnActive:   { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  typeBtnText:     { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  typeBtnTextActive: { color: '#7C3AED' },
  programRow:      { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 6 },
  programRowActive: { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  programText:     { fontSize: 14, color: '#374151' },
  footer:          { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', justifyContent: 'flex-end' },
  backBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  backBtnText:     { fontSize: 14, color: '#6B7280' },
  nextBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7C3AED', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  nextBtnText:     { fontSize: 14, fontWeight: '600', color: '#fff' },
};
