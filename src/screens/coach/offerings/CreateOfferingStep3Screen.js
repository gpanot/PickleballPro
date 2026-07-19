/**
 * CreateOfferingStep3Screen
 * First run: dates, schedule, price, payment link. Creates offering + run on submit.
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
  ActivityIndicator,
} from 'react-native';
import { Calendar, DollarSign, Link, ChevronLeft, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { createOffering, createOfferingRun } from '../../../lib/offeringsApi';

const TODAY = new Date().toISOString().split('T')[0];

export default function CreateOfferingStep3Screen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const { step1, step2 } = route.params;

  const [startDate,       setStartDate]       = useState('');
  const [endDate,         setEndDate]         = useState('');
  const [sessionSchedule, setSessionSchedule] = useState('');
  const [priceStr,        setPriceStr]        = useState('0');
  const [priceCurrency,   setPriceCurrency]   = useState('USD');
  const [paymentLink,     setPaymentLink]     = useState('');
  const [submitting,      setSubmitting]      = useState(false);

  const onSubmit = async () => {
    if (!startDate.trim()) {
      Alert.alert('Missing date', 'Please enter a start date (YYYY-MM-DD).');
      return;
    }
    if (!endDate.trim()) {
      Alert.alert('Missing date', 'Please enter an end date (YYYY-MM-DD).');
      return;
    }
    if (!sessionSchedule.trim()) {
      Alert.alert('Missing schedule', 'Please describe the session schedule.');
      return;
    }

    const priceAmount = Math.max(0, parseInt(priceStr || '0', 10));

    setSubmitting(true);

    // 1. Create offering
    const { data: offeringId, error: offeringErr } = await createOffering({
      programId:      step1.programId,
      title:          step1.title,
      type:           step1.type,
      location:       step2.location,
      facilityName:   step2.facilityName,
      capacityPerRun: step2.capacity,
      skillLevelMin:  step2.skillLevelMin,
      skillLevelMax:  step2.skillLevelMax,
      description:    step1.description,
      isPublic:       step1.isPublic,
      status:         step1.isPublic ? 'open' : 'draft',
    });

    if (offeringErr || !offeringId) {
      setSubmitting(false);
      Alert.alert('Error', offeringErr?.message || 'Failed to create offering.');
      return;
    }

    // 2. Create first run
    const { error: runErr } = await createOfferingRun({
      offeringId,
      startDate:      startDate.trim(),
      endDate:        endDate.trim(),
      sessionSchedule: sessionSchedule.trim(),
      priceAmount,
      priceCurrency,
      paymentLinkUrl: paymentLink.trim() || null,
    });

    setSubmitting(false);

    if (runErr) {
      Alert.alert('Warning', `Offering created but first run failed: ${runErr.message}\n\nYou can add runs from the Offering Detail screen.`);
      navigation.replace('OfferingDetail', { offeringId });
      return;
    }

    navigation.replace('OfferingDetail', { offeringId });
  };

  const inp = [styles.input, { color: t.textPrimary, borderColor: isDark ? t.border : '#E5E7EB', backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB', fontFamily: t.fontBody }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.sectionLabel, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>
        STEP 3 OF 3 — FIRST RUN
      </Text>

      {/* Dates */}
      <View style={styles.iconLabel}>
        <Calendar size={14} color={t.accentPurple} strokeWidth={2} />
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Start date *</Text>
      </View>
      <TextInput
        style={inp}
        value={startDate}
        onChangeText={setStartDate}
        placeholder={`e.g. ${TODAY}`}
        placeholderTextColor={t.textMuted}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 14 }]}>End date *</Text>
      <TextInput
        style={inp}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="e.g. 2026-08-30"
        placeholderTextColor={t.textMuted}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 14 }]}>Session schedule *</Text>
      <TextInput
        style={[inp, styles.textarea]}
        value={sessionSchedule}
        onChangeText={setSessionSchedule}
        placeholder="e.g. Every Tue & Thu 7:00–9:00 PM"
        placeholderTextColor={t.textMuted}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />

      {/* Price */}
      <View style={[styles.iconLabel, { marginTop: 20 }]}>
        <DollarSign size={14} color={t.accentPurple} strokeWidth={2} />
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Price (0 = free)</Text>
      </View>
      <View style={styles.priceRow}>
        <TextInput
          style={[inp, { flex: 1 }]}
          value={priceStr}
          onChangeText={setPriceStr}
          placeholder="0"
          placeholderTextColor={t.textMuted}
          keyboardType="number-pad"
        />
        {(['USD', 'VND']).map(cur => (
          <TouchableOpacity
            key={cur}
            style={[styles.curBtn, { borderColor: priceCurrency === cur ? t.accentPurple : (isDark ? t.border : '#E5E7EB'), backgroundColor: priceCurrency === cur ? `${t.accentPurple}15` : (isDark ? t.surfaceRaised : '#F9FAFB') }]}
            onPress={() => setPriceCurrency(cur)}
          >
            <Text style={{ color: priceCurrency === cur ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold, fontSize: 14 }}>{cur}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment link */}
      <View style={[styles.iconLabel, { marginTop: 16 }]}>
        <Link size={14} color={t.accentPurple} strokeWidth={2} />
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Payment link (optional)</Text>
      </View>
      <TextInput
        style={inp}
        value={paymentLink}
        onChangeText={setPaymentLink}
        placeholder="https://buy.stripe.com/..."
        placeholderTextColor={t.textMuted}
        autoCapitalize="none"
        keyboardType="url"
      />

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: isDark ? t.border : '#E5E7EB' }]}
          onPress={() => navigation.goBack()}
          disabled={submitting}
          activeOpacity={0.75}
        >
          <ChevronLeft size={18} color={t.textMuted} strokeWidth={2.5} />
          <Text style={[styles.backBtnText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: t.accentPurple, opacity: submitting ? 0.7 : 1 }]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : (
              <>
                <CheckCircle size={18} color="#fff" strokeWidth={2.5} />
                <Text style={[styles.submitBtnText, { fontFamily: t.fontBodySemibold }]}>Create Offering</Text>
              </>
            )
          }
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
  textarea:    { height: 72, marginBottom: 4 },
  priceRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  curBtn:      { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnRow:      { flexDirection: 'row', gap: 12, marginTop: 32 },
  backBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 14, padding: 16 },
  backBtnText: { fontSize: 15 },
  submitBtn:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  submitBtnText: { color: '#fff', fontSize: 16 },
});
