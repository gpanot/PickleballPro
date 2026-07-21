import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRunRoster,
  cancelEnrollment,
  recordPayment,
  sendPaymentReminder,
} from '../../../lib/offeringsApi';

const PAYMENT_STATUS_COLOR = {
  not_required:      { bg: '#F3F4F6', text: '#6B7280' },
  pending:           { bg: '#FEF3C7', text: '#92400E' },
  payment_link_sent: { bg: '#DBEAFE', text: '#1E40AF' },
  paid:              { bg: '#D1FAE5', text: '#065F46' },
  cash_collected:    { bg: '#D1FAE5', text: '#065F46' },
  refunded:          { bg: '#EDE9FE', text: '#5B21B6' },
  waived:            { bg: '#F3F4F6', text: '#6B7280' },
};

export default function OfferingRosterModal({ visible, offeringRunId, runLabel, onClose }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' || screenWidth < 600;

  const [roster,   setRoster]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [payModal, setPayModal] = useState(null);

  const load = async () => {
    if (!offeringRunId) return;
    setLoading(true);
    const { data, error } = await getRunRoster(offeringRunId);
    if (error) Alert.alert('Error', error.message);
    else setRoster(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (visible && offeringRunId) load();
  }, [visible, offeringRunId]);

  const handleCancel = (enrollmentId, name) => {
    Alert.alert(
      `Cancel ${name}'s enrollment`,
      'This will free the spot and promote the next waitlisted student. Continue?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const { error } = await cancelEnrollment(enrollmentId);
            if (error) Alert.alert('Error', error.message);
            else load();
          },
        },
      ]
    );
  };

  const handleReminder = async (enrollmentId) => {
    const { error } = await sendPaymentReminder(enrollmentId);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Sent', 'Payment reminder sent.');
  };

  const handleRecordPayment = async (enrollmentId, type) => {
    const { error } = await recordPayment({ enrollmentId, paymentType: type });
    if (error) Alert.alert('Error', error.message);
    else { setPayModal(null); load(); }
  };

  const confirmed  = roster.filter(e => e.status === 'confirmed');
  const waitlisted = roster.filter(e => e.status === 'waitlisted');

  const sheetStyle = isMobile
    ? { flex: 1, borderRadius: 0 }
    : { width: '100%', maxWidth: 560, borderRadius: 16, maxHeight: Math.min(screenHeight * 0.88, 700) };

  const overlayStyle = isMobile
    ? { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }
    : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 };

  return (
    <Modal visible={visible} transparent animationType={isMobile ? 'slide' : 'fade'} onRequestClose={onClose}>
      <View style={overlayStyle}>
        <View style={[r.sheet, sheetStyle]}>
          {/* Header */}
          <View style={r.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={r.headerTitle}>Roster</Text>
              {runLabel && <Text style={r.headerSub} numberOfLines={1}>{runLabel}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={r.center}><ActivityIndicator color="#7C3AED" /></View>
          ) : (
            <ScrollView style={{ flex: 1 }}>
              {/* Summary */}
              <View style={r.summary}>
                <SummaryItem num={confirmed.length} label="Confirmed" color="#111827" />
                <SummaryItem num={waitlisted.length} label="Waitlisted" color="#F59E0B" />
                <SummaryItem
                  num={confirmed.filter(e => ['paid', 'cash_collected'].includes(e.payment_status)).length}
                  label="Paid"
                  color="#10B981"
                />
                <SummaryItem
                  num={confirmed.filter(e => e.payment_status === 'pending').length}
                  label="Pending"
                  color="#EF4444"
                />
              </View>

              {confirmed.length > 0 && (
                <>
                  <Text style={r.sectionTitle}>Confirmed ({confirmed.length})</Text>
                  {confirmed.map(item => (
                    <RosterRow
                      key={item.enrollment_id}
                      item={item}
                      isMobile={isMobile}
                      onCancel={handleCancel}
                      onReminder={handleReminder}
                      onPay={setPayModal}
                    />
                  ))}
                </>
              )}

              {waitlisted.length > 0 && (
                <>
                  <Text style={r.sectionTitle}>Waitlisted ({waitlisted.length})</Text>
                  {waitlisted.map(item => (
                    <RosterRow
                      key={item.enrollment_id}
                      item={item}
                      isMobile={isMobile}
                      onCancel={handleCancel}
                      onReminder={null}
                      onPay={null}
                    />
                  ))}
                </>
              )}

              {roster.length === 0 && (
                <View style={r.empty}>
                  <Ionicons name="people-outline" size={36} color="#D1D5DB" />
                  <Text style={r.emptyText}>No enrollments for this run.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Payment sub-modal (bottom sheet on all sizes) */}
      <Modal visible={!!payModal} transparent animationType="slide" onRequestClose={() => setPayModal(null)}>
        <View style={r.subOverlay}>
          <View style={r.subSheet}>
            <Text style={r.subTitle}>Record payment</Text>
            {payModal?.student_name && (
              <Text style={r.subSub}>{payModal.student_name}</Text>
            )}
            {['cash', 'bank_transfer', 'other'].map(pt => (
              <TouchableOpacity
                key={pt}
                style={r.payTypeBtn}
                onPress={() => handleRecordPayment(payModal?.enrollment_id, pt)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#7C3AED" />
                <Text style={r.payTypeTxt}>
                  {pt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setPayModal(null)}
              style={{ marginTop: 12, alignItems: 'center', padding: 12 }}
            >
              <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function SummaryItem({ num, label, color }) {
  return (
    <View style={r.summaryItem}>
      <Text style={[r.summaryNum, { color }]}>{num}</Text>
      <Text style={r.summaryLabel}>{label}</Text>
    </View>
  );
}

function RosterRow({ item, isMobile, onCancel, onReminder, onPay }) {
  const ps = PAYMENT_STATUS_COLOR[item.payment_status] ?? { bg: '#F3F4F6', text: '#6B7280' };
  const canPay    = onPay && !['paid', 'cash_collected', 'waived', 'not_required'].includes(item.payment_status);
  const canRemind = onReminder && !['paid', 'cash_collected', 'waived', 'not_required'].includes(item.payment_status);

  return (
    <View style={r.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={r.name} numberOfLines={1}>{item.student_name || 'Unknown'}</Text>
        <Text style={r.email} numberOfLines={1}>{item.student_email}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
          <View style={[r.badge, { backgroundColor: ps.bg }]}>
            <Text style={[r.badgeText, { color: ps.text }]}>
              {item.payment_status?.replace(/_/g, ' ')}
            </Text>
          </View>
          {item.waitlist_position && (
            <View style={[r.badge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[r.badgeText, { color: '#92400E' }]}>#{item.waitlist_position}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={r.actions}>
        {canPay && (
          <TouchableOpacity style={[r.actionBtn, { backgroundColor: '#EDE9FE' }]} onPress={() => onPay(item)}>
            <Ionicons name="cash-outline" size={15} color="#7C3AED" />
          </TouchableOpacity>
        )}
        {canRemind && (
          <TouchableOpacity style={[r.actionBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => onReminder(item.enrollment_id)}>
            <Ionicons name="notifications-outline" size={15} color="#92400E" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[r.actionBtn, { backgroundColor: '#FEE2E2' }]}
          onPress={() => onCancel(item.enrollment_id, item.student_name)}
        >
          <Ionicons name="close-outline" size={15} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const r = {
  sheet:        { backgroundColor: '#fff', overflow: 'hidden' },
  header:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 10 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub:    { fontSize: 13, color: '#6B7280', marginTop: 2 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },

  summary:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 16, paddingHorizontal: 8 },
  summaryItem:  { flex: 1, alignItems: 'center', gap: 2 },
  summaryNum:   { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: '#6B7280' },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  name:         { fontSize: 14, fontWeight: '600', color: '#111827' },
  email:        { fontSize: 12, color: '#6B7280', marginTop: 1 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  actions:      { flexDirection: 'row', gap: 6, marginLeft: 10, flexShrink: 0 },
  actionBtn:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  empty:        { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText:    { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Pay sub-modal
  subOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  subSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44 },
  subTitle:     { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 },
  subSub:       { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  payTypeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#F5F3FF', borderRadius: 12, marginBottom: 8 },
  payTypeTxt:   { fontSize: 15, fontWeight: '600', color: '#7C3AED' },
};
