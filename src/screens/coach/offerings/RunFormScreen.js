/**
 * RunFormScreen
 * Reusable full-screen form for creating or editing a run.
 *
 * Modes (route.params.mode):
 *   'create' — first run during offering creation.
 *              Expects: { mode: 'create', step1, step2 }
 *              On success: replaces with OfferingDetail.
 *
 *   'add'    — adding a subsequent run from OfferingDetailScreen.
 *              Expects: { mode: 'add', offeringId }
 *              On success: goes back to OfferingDetail (which reloads on focus).
 *
 *   'edit'   — editing an existing run.
 *              Expects: { mode: 'edit', run: { id, start_date, end_date,
 *                          session_schedule, price_amount, price_currency, payment_link_url } }
 *              On success: goes back to OfferingDetail (which reloads on focus).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, DollarSign, Link } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { ScreenHeaderShell } from '../../../components/logbook/ScreenHeader';
import { createOffering, createOfferingRun, updateOfferingRun } from '../../../lib/offeringsApi';

const toISODate  = (d) => d.toISOString().split('T')[0];
const toDisplay  = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const parseDate  = (s) => { const d = new Date(s + 'T00:00:00'); return isNaN(d) ? new Date() : d; };

export default function RunFormScreen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const { mode, step1, step2, offeringId, run: existingRun } = route.params ?? {};

  const isCreate = mode === 'create';
  const isEdit   = mode === 'edit';
  const today    = new Date();

  // Pre-fill when editing. price_amount in DB is cents for USD → convert back to dollars for display.
  const initStart = isEdit ? parseDate(existingRun.start_date) : today;
  const initEnd   = isEdit ? parseDate(existingRun.end_date)   : today;
  const initPrice = isEdit
    ? (existingRun.price_currency === 'VND'
        ? String(existingRun.price_amount ?? 0)
        : String(Math.round((existingRun.price_amount ?? 0) / 100)))
    : '0';

  const [startDate,       setStartDate]       = useState(initStart);
  const [endDate,         setEndDate]         = useState(initEnd);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);

  const [sessionSchedule, setSessionSchedule] = useState(isEdit ? (existingRun.session_schedule ?? '') : '');
  const [priceStr,        setPriceStr]        = useState(initPrice);
  const [priceCurrency,   setPriceCurrency]   = useState(isEdit ? (existingRun.price_currency ?? 'USD') : 'USD');
  const [paymentLink,     setPaymentLink]     = useState(isEdit ? (existingRun.payment_link_url ?? '') : '');
  const [submitting,      setSubmitting]      = useState(false);

  const onChangeStart = (_, selected) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selected) {
      setStartDate(selected);
      if (selected > endDate) setEndDate(selected);
    }
  };

  const onChangeEnd = (_, selected) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selected) setEndDate(selected);
  };

  const onSubmit = async () => {
    if (endDate < startDate) {
      alert('End date must be on or after start date.');
      return;
    }
    if (!sessionSchedule.trim()) {
      alert('Please describe the session schedule.');
      return;
    }

    // price_amount is stored in cents for USD; VND is stored as-is (no cents)
    const rawPrice = Math.max(0, parseInt(priceStr || '0', 10));
    const priceAmount = priceCurrency === 'VND' ? rawPrice : rawPrice * 100;
    setSubmitting(true);

    if (isCreate) {
      // 1. Create offering
      const { data: newOfferingId, error: offeringErr } = await createOffering({
        programId:      step1.programId,
        title:          step1.title,
        type:           step1.type,
        location:       step2.location,
        facilityName:   step2.facilityName,
        capacityPerRun: step2.capacity,
        skillLevelMin:  step2.skillLevelMin,
        skillLevelMax:  step2.skillLevelMax,
        description:    step1.description,
        thumbnailUrl:   step1.thumbnailUrl ?? null,
        isPublic:       step1.isPublic,
        status:         step1.isPublic ? 'open' : 'draft',
      });

      if (offeringErr || !newOfferingId) {
        setSubmitting(false);
        alert(offeringErr?.message || 'Failed to create offering.');
        return;
      }

      // 2. Create first run
      const { error: runErr } = await createOfferingRun({
        offeringId:      newOfferingId,
        startDate:       toISODate(startDate),
        endDate:         toISODate(endDate),
        sessionSchedule: sessionSchedule.trim(),
        priceAmount,
        priceCurrency,
        paymentLinkUrl:  paymentLink.trim() || null,
      });

      setSubmitting(false);

      if (runErr) {
        alert(`Offering created but first run failed: ${runErr.message}\n\nYou can add runs from the Offering Detail screen.`);
      }
      navigation.replace('OfferingDetail', { offeringId: newOfferingId });
    } else if (isEdit) {
      // Update existing run
      const { error } = await updateOfferingRun({
        offeringRunId:   existingRun.id,
        startDate:       toISODate(startDate),
        endDate:         toISODate(endDate),
        sessionSchedule: sessionSchedule.trim(),
        priceAmount,
        priceCurrency,
        paymentLinkUrl:  paymentLink.trim() || null,
      });

      setSubmitting(false);

      if (error) {
        alert(error.message || 'Failed to update run.');
        return;
      }
      navigation.goBack();
    } else {
      // Add run to existing offering
      const { error } = await createOfferingRun({
        offeringId,
        startDate:       toISODate(startDate),
        endDate:         toISODate(endDate),
        sessionSchedule: sessionSchedule.trim(),
        priceAmount,
        priceCurrency,
        paymentLinkUrl:  paymentLink.trim() || null,
      });

      setSubmitting(false);

      if (error) {
        alert(error.message || 'Failed to create run.');
        return;
      }
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
  const datePickerBg     = isDark ? t.surfaceRaised : '#F9FAFB';
  const datePickerBorder = isDark ? t.border : '#E5E7EB';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title={isCreate ? 'First Run' : isEdit ? 'Edit Run' : 'Add a Run'}
        eyebrow={isCreate ? 'Step 3 of 3' : undefined}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.saveHeaderBtn, { backgroundColor: t.accentPurple, opacity: submitting ? 0.5 : 1 }]}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={[styles.saveHeaderText, { fontFamily: t.fontBodySemibold }]}>
                  {isCreate ? 'Create' : 'Save'}
                </Text>
            }
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Start date ── */}
        <View style={styles.iconLabel}>
          <Calendar size={14} color={t.accentPurple} strokeWidth={2} />
          <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Start date *</Text>
        </View>
        <TouchableOpacity
          style={[styles.dateTrigger, { backgroundColor: datePickerBg, borderColor: showStartPicker ? t.accentPurple : datePickerBorder }]}
          onPress={() => { setShowStartPicker(true); setShowEndPicker(false); }}
          activeOpacity={0.75}
        >
          <Calendar size={16} color={showStartPicker ? t.accentPurple : t.textMuted} strokeWidth={2} />
          <Text style={[styles.dateText, { color: t.textPrimary, fontFamily: t.fontBody }]}>
            {toDisplay(startDate)}
          </Text>
        </TouchableOpacity>

        {showStartPicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={onChangeStart}
              themeVariant={isDark ? 'dark' : 'light'}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.pickerDone, { backgroundColor: t.accentPurple }]}
                onPress={() => setShowStartPicker(false)}
              >
                <Text style={[styles.pickerDoneText, { fontFamily: t.fontBodySemibold }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── End date ── */}
        <View style={[styles.iconLabel, { marginTop: 16 }]}>
          <Calendar size={14} color={t.accentPurple} strokeWidth={2} />
          <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>End date *</Text>
        </View>
        <TouchableOpacity
          style={[styles.dateTrigger, { backgroundColor: datePickerBg, borderColor: showEndPicker ? t.accentPurple : datePickerBorder }]}
          onPress={() => { setShowEndPicker(true); setShowStartPicker(false); }}
          activeOpacity={0.75}
        >
          <Calendar size={16} color={showEndPicker ? t.accentPurple : t.textMuted} strokeWidth={2} />
          <Text style={[styles.dateText, { color: t.textPrimary, fontFamily: t.fontBody }]}>
            {toDisplay(endDate)}
          </Text>
        </TouchableOpacity>

        {showEndPicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={startDate}
              onChange={onChangeEnd}
              themeVariant={isDark ? 'dark' : 'light'}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.pickerDone, { backgroundColor: t.accentPurple }]}
                onPress={() => setShowEndPicker(false)}
              >
                <Text style={[styles.pickerDoneText, { fontFamily: t.fontBodySemibold }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Session schedule ── */}
        <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold, marginTop: 16 }]}>
          Session schedule *
        </Text>
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

        {/* ── Price ── */}
        <View style={[styles.iconLabel, { marginTop: 20 }]}>
          <DollarSign size={14} color={t.accentPurple} strokeWidth={2} />
          <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
            {priceCurrency === 'VND' ? 'Price in ₫ (0 = free)' : 'Price in $ (0 = free)'}
          </Text>
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
          {['USD', 'VND'].map(cur => (
            <TouchableOpacity
              key={cur}
              style={[
                styles.curBtn,
                {
                  borderColor: priceCurrency === cur ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                  backgroundColor: priceCurrency === cur ? `${t.accentPurple}15` : (isDark ? t.surfaceRaised : '#F9FAFB'),
                },
              ]}
              onPress={() => setPriceCurrency(cur)}
            >
              <Text style={{ color: priceCurrency === cur ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold, fontSize: 14 }}>
                {cur}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Payment link ── */}
        <View style={[styles.iconLabel, { marginTop: 16 }]}>
          <Link size={14} color={t.accentPurple} strokeWidth={2} />
          <Text style={[styles.label, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Payment link (optional)</Text>
        </View>
        <TextInput
          style={inp}
          value={paymentLink}
          onChangeText={setPaymentLink}
          placeholder="https://..."
          placeholderTextColor={t.textMuted}
          keyboardType="url"
          autoCapitalize="none"
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content:        { padding: 20, paddingBottom: 32 },
  iconLabel:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label:          { fontSize: 14, marginBottom: 6 },
  input:          { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  textarea:       { height: 72, marginBottom: 4 },
  dateTrigger:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4 },
  dateText:       { fontSize: 15 },
  pickerWrap:     { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  pickerDone:     { marginTop: 6, padding: 12, borderRadius: 10, alignItems: 'center' },
  pickerDoneText: { color: '#fff', fontSize: 15 },
  priceRow:       { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  curBtn:         { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  saveHeaderBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  saveHeaderText: { fontSize: 15, color: '#fff' },
});
