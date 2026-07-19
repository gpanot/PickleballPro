/**
 * OfferingDetailScreen
 * Shows offering info, a list of runs, and the roster for the selected run.
 * Coaches can mark payment, cancel enrollments, send payment reminders,
 * add new runs, publish/unpublish the offering.
 * Phase 4 adds the Attendance section (injected at the bottom of the Runs tab).
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Users, Calendar, DollarSign,
  Bell, X, CheckCircle, PlusCircle, Globe, EyeOff,
  ClipboardCheck, UserCheck, UserX,
} from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import {
  getOfferingWithRuns,
  getRunRoster,
  cancelEnrollment,
  recordPayment,
  sendPaymentReminder,
  updateOffering,
  createOfferingRun,
  formatPrice,
  effectiveCapacity,
  getAttendanceForSession,
  updateAttendanceStatus,
} from '../../../lib/offeringsApi';

const PAYMENT_STATUS_COLOR = {
  not_required:       '#9CA3AF',
  pending:            '#F59E0B',
  payment_link_sent:  '#3B82F6',
  paid:               '#10B981',
  cash_collected:     '#10B981',
  refunded:           '#6366F1',
  waived:             '#9CA3AF',
};

export default function OfferingDetailScreen({ navigation, route }) {
  const { logbookTheme: t, isDark } = useTheme();
  const { offeringId } = route.params;

  const [offering,      setOffering]      = useState(null);
  const [runs,          setRuns]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [roster,        setRoster]        = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [activeTab,     setActiveTab]     = useState('runs');
  const [payModal,      setPayModal]      = useState(null); // enrollment row for payment modal
  // Attendance state (Phase 4)
  const [attendance,        setAttendance]        = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [todaySessionDate,  setTodaySessionDate]  = useState(null); // YYYY-MM-DD or null
  // Add Run inline modal state
  const [addRunModal,   setAddRunModal]   = useState(false);
  const [addRunStart,   setAddRunStart]   = useState('');
  const [addRunEnd,     setAddRunEnd]     = useState('');
  const [addRunSched,   setAddRunSched]   = useState('');
  const [addRunPrice,   setAddRunPrice]   = useState('0');
  const [addRunCur,     setAddRunCur]     = useState('USD');
  const [addRunLink,    setAddRunLink]    = useState('');
  const [addRunSaving,  setAddRunSaving]  = useState(false);
  // Prevents auto-selecting first run on re-focus; use ref so it doesn't cause re-renders
  const firstRunAutoSelectedRef = useRef(false);

  const load = useCallback(async () => {
    const { data, error } = await getOfferingWithRuns(offeringId);
    if (error || !data) {
      Alert.alert('Error', error?.message || 'Failed to load offering.');
      setLoading(false);
      return;
    }
    setOffering(data.offering);
    setRuns(data.runs ?? []);
    setLoading(false);

    // Auto-select first run only once (prevents double-fetch on selectedRunId state change)
    if (data.runs?.length && !firstRunAutoSelectedRef.current) {
      firstRunAutoSelectedRef.current = true;
      const firstRun = data.runs[0].run;
      setSelectedRunId(firstRun.id);
      const today = new Date().toISOString().split('T')[0];
      const sessions = Array.isArray(firstRun.sessions_json) ? firstRun.sessions_json : [];
      const todayDate = sessions.find(s => s?.date === today) ? today : null;
      setTodaySessionDate(todayDate);
    }
  }, [offeringId]);

  const loadRoster = useCallback(async (runId) => {
    setRosterLoading(true);
    const { data, error } = await getRunRoster(runId);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to load roster.');
    } else {
      setRoster(data ?? []);
    }
    setRosterLoading(false);
  }, []);

  const loadAttendance = useCallback(async (runId, sessionDate) => {
    if (!runId || !sessionDate) return;
    setAttendanceLoading(true);
    const { data, error } = await getAttendanceForSession(runId, sessionDate);
    if (!error) setAttendance(data ?? []);
    setAttendanceLoading(false);
  }, []);

  /**
   * Check if any session in a run's sessions_json falls on today.
   * Returns today's date string 'YYYY-MM-DD' or null.
   */
  const findTodaySession = useCallback((run) => {
    const today = new Date().toISOString().split('T')[0];
    if (!run?.sessions_json) return null;
    const sessions = Array.isArray(run.sessions_json)
      ? run.sessions_json
      : [];
    const match = sessions.find((s) => s?.date === today);
    return match ? today : null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleSelectRun = (runId) => {
    setSelectedRunId(runId);
    loadRoster(runId);
    const run = runs.find(r => r.run.id === runId)?.run;
    const todayDate = findTodaySession(run);
    setTodaySessionDate(todayDate);
    if (todayDate) loadAttendance(runId, todayDate);
  };

  const handleToggleAttendance = async (attendanceRow) => {
    const next = attendanceRow.status === 'present' ? 'absent' : 'present';
    const { error } = await updateAttendanceStatus(attendanceRow.id, next);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setAttendance(prev =>
        prev.map(a => a.id === attendanceRow.id ? { ...a, status: next } : a)
      );
    }
  };

  const handleTogglePublish = async () => {
    const next = !offering.is_public;
    const { error } = await updateOffering({
      offeringId,
      isPublic: next,
      status:   next ? 'open' : 'draft',
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setOffering(prev => ({ ...prev, is_public: next, status: next ? 'open' : 'draft' }));
    }
  };

  const handleCancelEnrollment = async (enrollmentId) => {
    Alert.alert(
      'Cancel enrollment',
      'This will free the spot and promote the next waitlisted student (if any). Continue?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            const { error } = await cancelEnrollment(enrollmentId);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              loadRoster(selectedRunId);
            }
          },
        },
      ]
    );
  };

  const handleSendReminder = async (enrollmentId) => {
    const { error } = await sendPaymentReminder(enrollmentId);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Sent', 'Payment reminder sent.');
    }
  };

  const handleAddRun = async () => {
    if (!addRunStart.trim() || !addRunEnd.trim() || !addRunSched.trim()) {
      Alert.alert('Missing fields', 'Start date, end date, and schedule are required.');
      return;
    }
    setAddRunSaving(true);
    const { error } = await createOfferingRun({
      offeringId,
      startDate:      addRunStart.trim(),
      endDate:        addRunEnd.trim(),
      sessionSchedule: addRunSched.trim(),
      priceAmount:    Math.max(0, parseInt(addRunPrice || '0', 10)),
      priceCurrency:  addRunCur,
      paymentLinkUrl: addRunLink.trim() || null,
    });
    setAddRunSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setAddRunModal(false);
      setAddRunStart(''); setAddRunEnd(''); setAddRunSched('');
      setAddRunPrice('0'); setAddRunCur('USD'); setAddRunLink('');
      load();
    }
  };

  const handleRecordPayment = async (enrollmentId, type) => {
    const { error } = await recordPayment({ enrollmentId, paymentType: type });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setPayModal(null);
      loadRoster(selectedRunId);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.accentPurple} />
      </View>
    );
  }

  if (!offering) return null;

  const selectedRun = runs.find(r => r.run.id === selectedRunId);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.surfaceRaised, borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.offeringTitle, { color: t.textPrimary, fontFamily: t.fontHeading }]} numberOfLines={2}>
            {offering.title}
          </Text>
          <TouchableOpacity
            style={[styles.publishBtn, { backgroundColor: offering.is_public ? `${t.accentGreen}20` : `${t.accentPurple}15` }]}
            onPress={handleTogglePublish}
          >
            {offering.is_public
              ? <Globe size={14} color={t.accentGreen} strokeWidth={2} />
              : <EyeOff size={14} color={t.accentPurple} strokeWidth={2} />
            }
            <Text style={[styles.publishBtnText, { color: offering.is_public ? t.accentGreen : t.accentPurple, fontFamily: t.fontBodySemibold }]}>
              {offering.is_public ? 'Public' : 'Draft'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          {[
            { id: 'runs',       label: 'Runs',       Icon: Calendar },
            { id: 'roster',     label: 'Roster',     Icon: Users },
            ...(todaySessionDate ? [{ id: 'attendance', label: 'Check-In', Icon: ClipboardCheck }] : []),
          ].map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.tab, { borderBottomColor: active ? t.accentPurple : 'transparent', borderBottomWidth: 2 }]}
                onPress={() => {
                  setActiveTab(id);
                  if (id === 'roster' && selectedRunId) loadRoster(selectedRunId);
                  if (id === 'attendance' && selectedRunId && todaySessionDate) {
                    loadAttendance(selectedRunId, todaySessionDate);
                  }
                }}
              >
                <Icon size={15} color={active ? t.accentPurple : t.textMuted} strokeWidth={2} />
                <Text style={[styles.tabText, { color: active ? t.accentPurple : t.textMuted, fontFamily: t.fontBodySemibold }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* RUNS TAB */}
      {activeTab === 'runs' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {runs.length === 0 && (
            <Text style={[styles.emptyMsg, { color: t.textMuted, fontFamily: t.fontBody }]}>
              No runs yet. Add the first one.
            </Text>
          )}
          {runs.map(({ run, confirmed_count, waitlist_count }) => {
            const cap       = effectiveCapacity(run, offering.capacity_per_run);
            const remaining = Math.max(0, cap - run.spots_filled);
            const selected  = run.id === selectedRunId;

            return (
              <TouchableOpacity
                key={run.id}
                style={[
                  styles.runCard,
                  { backgroundColor: t.surfaceRaised, borderColor: selected ? t.accentPurple : (isDark ? t.border : '#E5E7EB') },
                ]}
                onPress={() => handleSelectRun(run.id)}
                activeOpacity={0.75}
              >
                <View style={styles.runCardHeader}>
                  <Text style={[styles.runDates, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                    {run.start_date} → {run.end_date}
                  </Text>
                  <Text style={[styles.runPrice, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
                    {formatPrice(run.price_amount, run.price_currency)}
                  </Text>
                </View>
                <Text style={[styles.runSchedule, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {run.session_schedule}
                </Text>
                <View style={styles.runMeta}>
                  <Text style={[styles.runMetaText, { color: remaining > 0 ? t.accentGreen : t.textMuted, fontFamily: t.fontBody }]}>
                    {remaining > 0 ? `${remaining} spots left` : 'Full'}
                  </Text>
                  <Text style={[styles.runMetaText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    {confirmed_count} confirmed  ·  {waitlist_count} waitlisted
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.addRunBtn, { borderColor: t.accentPurple }]}
            onPress={() => setAddRunModal(true)}
          >
            <PlusCircle size={16} color={t.accentPurple} strokeWidth={2} />
            <Text style={[styles.addRunText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
              Add another run
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ROSTER TAB */}
      {activeTab === 'roster' && (
        <View style={{ flex: 1 }}>
          {/* Run picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.runPicker, { borderBottomColor: isDark ? t.border : '#E5E7EB' }]}
            contentContainerStyle={styles.runPickerContent}
          >
            {runs.map(({ run }) => (
              <TouchableOpacity
                key={run.id}
                style={[
                  styles.runChip,
                  { borderColor: run.id === selectedRunId ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                    backgroundColor: run.id === selectedRunId ? `${t.accentPurple}15` : (isDark ? t.surfaceRaised : '#F9FAFB') },
                ]}
                onPress={() => handleSelectRun(run.id)}
              >
                <Text style={[styles.runChipText, { color: run.id === selectedRunId ? t.accentPurple : t.textMuted, fontFamily: t.fontBody }]}>
                  {run.start_date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {rosterLoading
            ? <View style={styles.center}><ActivityIndicator color={t.accentPurple} /></View>
            : (
              <FlatList
                data={roster}
                keyExtractor={e => e.enrollment_id}
                contentContainerStyle={styles.tabContent}
                ListEmptyComponent={
                  <Text style={[styles.emptyMsg, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    No enrollments for this run.
                  </Text>
                }
                renderItem={({ item }) => (
                  <View style={[styles.rosterRow, { backgroundColor: t.surfaceRaised, borderColor: isDark ? t.border : '#E5E7EB' }]}>
                    <View style={styles.rosterLeft}>
                      <Text style={[styles.rosterName, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                        {item.student_name || 'Unknown'}
                      </Text>
                      <Text style={[styles.rosterEmail, { color: t.textMuted, fontFamily: t.fontBody }]}>
                        {item.student_email}
                      </Text>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: (item.status === 'confirmed' ? '#10B981' : '#F59E0B') + '20' }]}>
                          <Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#10B981' : '#F59E0B' }]}>
                            {item.status === 'waitlisted' ? `Waitlist #${item.waitlist_position}` : 'Confirmed'}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: (PAYMENT_STATUS_COLOR[item.payment_status] || '#9CA3AF') + '20' }]}>
                          <Text style={[styles.statusText, { color: PAYMENT_STATUS_COLOR[item.payment_status] || '#9CA3AF' }]}>
                            {item.payment_status?.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.rosterActions}>
                      {item.status === 'confirmed' && !['paid', 'cash_collected', 'waived', 'not_required'].includes(item.payment_status) && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: `${t.accentPurple}15` }]}
                            onPress={() => setPayModal(item)}
                          >
                            <DollarSign size={14} color={t.accentPurple} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: `${t.accentOrange}15` }]}
                            onPress={() => handleSendReminder(item.enrollment_id)}
                          >
                            <Bell size={14} color={t.accentOrange} strokeWidth={2} />
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
                        onPress={() => handleCancelEnrollment(item.enrollment_id)}
                      >
                        <X size={14} color="#EF4444" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          }
        </View>
      )}

      {/* ATTENDANCE TAB (Phase 4 — visible only when there's a session today) */}
      {activeTab === 'attendance' && todaySessionDate && (
        <View style={{ flex: 1 }}>
          <View style={[styles.attendanceHeader, { borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
            <ClipboardCheck size={16} color={t.accentPurple} strokeWidth={2} />
            <Text style={[styles.attendanceDateText, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
              Session: {todaySessionDate}
            </Text>
          </View>

          {attendanceLoading
            ? <View style={styles.center}><ActivityIndicator color={t.accentPurple} /></View>
            : (
              <FlatList
                data={attendance}
                keyExtractor={a => a.id}
                contentContainerStyle={styles.tabContent}
                ListEmptyComponent={
                  <Text style={[styles.emptyMsg, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    No attendance rows found.{'\n'}Run the generate-attendance function or check the DB.
                  </Text>
                }
                renderItem={({ item }) => {
                  const isPresent = item.status === 'present';
                  return (
                    <View style={[styles.attendanceRow, { backgroundColor: t.surfaceRaised, borderColor: isPresent ? `${t.accentGreen}50` : (isDark ? t.border : '#E5E7EB') }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rosterName, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                          {item.student_name}
                        </Text>
                        <Text style={[styles.rosterEmail, { color: t.textMuted, fontFamily: t.fontBody }]}>
                          {item.student_email}
                        </Text>
                        {isPresent && item.checked_in_at && (
                          <Text style={[styles.attendanceTime, { color: t.accentGreen, fontFamily: t.fontBody }]}>
                            Checked in at {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.attendanceToggle,
                          {
                            backgroundColor: isPresent ? `${t.accentGreen}20` : `${t.textMuted}15`,
                            borderColor: isPresent ? t.accentGreen : (isDark ? t.border : '#D1D5DB'),
                          },
                        ]}
                        onPress={() => handleToggleAttendance(item)}
                      >
                        {isPresent
                          ? <UserCheck size={20} color={t.accentGreen} strokeWidth={2} />
                          : <UserX size={20} color={t.textMuted} strokeWidth={2} />
                        }
                        <Text style={[styles.attendanceToggleText, { color: isPresent ? t.accentGreen : t.textMuted, fontFamily: t.fontBodySemibold }]}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )
          }
        </View>
      )}

      {/* Add Run Modal */}
      <Modal visible={addRunModal} transparent animationType="slide" onRequestClose={() => setAddRunModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalSheet, { backgroundColor: t.surfaceRaised }]} keyboardShouldPersistTaps="handled">
            <Text style={[styles.modalTitle, { color: t.textPrimary, fontFamily: t.fontHeading }]}>Add a new run</Text>
            {[
              { label: 'Start date *', value: addRunStart, setter: setAddRunStart, placeholder: 'YYYY-MM-DD', kbd: 'numbers-and-punctuation' },
              { label: 'End date *',   value: addRunEnd,   setter: setAddRunEnd,   placeholder: 'YYYY-MM-DD', kbd: 'numbers-and-punctuation' },
              { label: 'Schedule *',   value: addRunSched, setter: setAddRunSched, placeholder: 'e.g. Every Mon & Wed 7–9PM', kbd: 'default' },
              { label: 'Price',        value: addRunPrice, setter: setAddRunPrice, placeholder: '0',          kbd: 'number-pad' },
            ].map(({ label, value, setter, placeholder, kbd }) => (
              <View key={label}>
                <Text style={[styles.addRunLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{label}</Text>
                <TextInput
                  style={[styles.addRunInput, { color: t.textPrimary, borderColor: isDark ? t.border : '#E5E7EB', backgroundColor: isDark ? t.bg : '#F9FAFB', fontFamily: t.fontBody }]}
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  placeholderTextColor={t.textMuted}
                  keyboardType={kbd}
                />
              </View>
            ))}
            <Text style={[styles.addRunLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Payment link</Text>
            <TextInput
              style={[styles.addRunInput, { color: t.textPrimary, borderColor: isDark ? t.border : '#E5E7EB', backgroundColor: isDark ? t.bg : '#F9FAFB', fontFamily: t.fontBody }]}
              value={addRunLink}
              onChangeText={setAddRunLink}
              placeholder="https://..."
              placeholderTextColor={t.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 40 }}>
              <TouchableOpacity
                style={[styles.payTypeBtn, { flex: 1, justifyContent: 'center', borderColor: isDark ? t.border : '#E5E7EB' }]}
                onPress={() => setAddRunModal(false)}
                disabled={addRunSaving}
              >
                <Text style={[styles.payTypeTxt, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.payTypeBtn, { flex: 2, justifyContent: 'center', backgroundColor: t.accentPurple, borderColor: t.accentPurple, opacity: addRunSaving ? 0.7 : 1 }]}
                onPress={handleAddRun}
                disabled={addRunSaving}
              >
                {addRunSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={[styles.payTypeTxt, { color: '#fff', fontFamily: t.fontBodySemibold }]}>Save Run</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={!!payModal} transparent animationType="slide" onRequestClose={() => setPayModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: t.surfaceRaised }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary, fontFamily: t.fontHeading }]}>
              Record payment for {payModal?.student_name}
            </Text>
            {['cash', 'bank_transfer', 'other'].map(pt => (
              <TouchableOpacity
                key={pt}
                style={[styles.payTypeBtn, { backgroundColor: `${t.accentPurple}10`, borderColor: isDark ? t.border : '#E5E7EB' }]}
                onPress={() => handleRecordPayment(payModal?.enrollment_id, pt)}
              >
                <CheckCircle size={16} color={t.accentPurple} strokeWidth={2} />
                <Text style={[styles.payTypeTxt, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                  {pt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setPayModal(null)} style={styles.cancelModalBtn}>
              <Text style={[styles.cancelModalTxt, { color: t.textMuted, fontFamily: t.fontBody }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:         { padding: 16, borderBottomWidth: 1 },
  headerTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  offeringTitle:  { fontSize: 18, flex: 1, marginRight: 8 },
  publishBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  publishBtnText: { fontSize: 13 },
  tabRow:         { flexDirection: 'row', gap: 0 },
  tab:            { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16 },
  tabText:        { fontSize: 14 },
  tabContent:     { padding: 16, paddingBottom: 48 },
  runCard:        { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 10 },
  runCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  runDates:       { fontSize: 14 },
  runPrice:       { fontSize: 14 },
  runSchedule:    { fontSize: 13, marginBottom: 6 },
  runMeta:        { flexDirection: 'row', gap: 12 },
  runMetaText:    { fontSize: 12 },
  addRunBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 14, justifyContent: 'center', marginTop: 6 },
  addRunText:     { fontSize: 15 },
  runPicker:      { maxHeight: 52, borderBottomWidth: 1 },
  runPickerContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  runChip:        { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  runChipText:    { fontSize: 13 },
  rosterRow:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  rosterLeft:     { flex: 1 },
  rosterName:     { fontSize: 14, marginBottom: 2 },
  rosterEmail:    { fontSize: 12, marginBottom: 6 },
  statusRow:      { flexDirection: 'row', gap: 6 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText:     { fontSize: 11, fontWeight: '600' },
  rosterActions:  { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionBtn:      { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyMsg:       { textAlign: 'center', marginTop: 40, fontSize: 15, lineHeight: 22 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  payTypeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  payTypeTxt:     { fontSize: 15 },
  cancelModalBtn: { marginTop: 8, alignItems: 'center', padding: 12 },
  attendanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderBottomWidth: 1 },
  attendanceDateText: { fontSize: 14 },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  attendanceToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  attendanceToggleText: { fontSize: 13 },
  attendanceTime: { fontSize: 11, marginTop: 2 },
  cancelModalTxt: { fontSize: 15 },
  addRunLabel:    { fontSize: 14, marginBottom: 6, marginTop: 14 },
  addRunInput:    { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
});
