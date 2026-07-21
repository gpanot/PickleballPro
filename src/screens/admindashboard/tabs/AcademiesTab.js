import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, ActivityIndicator,
  Alert, Modal, Pressable, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import styles from '../adminDashboardStyles';

export default function AcademiesTab({ isMobile }) {
  const [allAcademies, setAllAcademies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminAcademySelected, setAdminAcademySelected] = useState(null);
  const [adminAcademyDetail, setAdminAcademyDetail] = useState(null);
  const [adminAcademyDetailLoading, setAdminAcademyDetailLoading] = useState(false);
  const [adminDetailEditName, setAdminDetailEditName] = useState('');
  const [adminDetailEditRoyaltyRate, setAdminDetailEditRoyaltyRate] = useState(10);
  const [adminDetailSaving, setAdminDetailSaving] = useState(false);
  const [showAdminEditAcademyModal, setShowAdminEditAcademyModal] = useState(false);

  useEffect(() => {
    fetchAllAcademies();
  }, []);

  const fetchAllAcademies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('academies')
        .select(`
          id, name, slug, logo_url, royalty_rate, created_at,
          academy_members(id, role),
          coach_students(id, is_active)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAllAcademies(data || []);
    } catch (err) {
      console.error('Error fetching all academies:', err);
      Alert.alert('Error', 'Failed to load academies');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminAcademyDetail = async (id) => {
    setAdminAcademyDetailLoading(true);
    try {
      const [{ data: acad }, { data: membersRaw }] = await Promise.all([
        supabase.from('academies').select('id, name, slug, logo_url, royalty_rate, created_at').eq('id', id).maybeSingle(),
        supabase.from('academy_members').select('id, user_id, role, joined_at').eq('academy_id', id).order('role', { ascending: true }),
      ]);

      const memberIds = (membersRaw || []).map(m => m.user_id).filter(Boolean);
      let profileMap = {};
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase.from('users').select('id, name, email, avatar_url').in('id', memberIds);
        profileMap = (profiles || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
      }

      const coachMembers = (membersRaw || []).filter(m => m.role === 'coach');
      const coachUserIds = coachMembers.map(m => m.user_id).filter(Boolean);
      let studentCountMap = {};
      if (coachUserIds.length > 0) {
        const { data: coachRows } = await supabase.from('coaches').select('id, user_id').in('user_id', coachUserIds);
        const coachIdMap = (coachRows || []).reduce((acc, c) => { acc[c.user_id] = c.id; return acc; }, {});
        const allCoachIds = Object.values(coachIdMap);
        if (allCoachIds.length > 0) {
          const { data: studentRows } = await supabase.from('coach_students').select('coach_id').in('coach_id', allCoachIds).eq('is_active', true);
          (studentRows || []).forEach(s => { studentCountMap[s.coach_id] = (studentCountMap[s.coach_id] || 0) + 1; });
          Object.entries(coachIdMap).forEach(([userId, cId]) => { studentCountMap[userId] = studentCountMap[cId] || 0; });
        }
      }

      setAdminAcademyDetail({
        ...acad,
        members: (membersRaw || []).map(m => ({
          ...m,
          user: profileMap[m.user_id] || { name: 'Unknown', email: '' },
          activeStudents: m.role === 'coach' ? (studentCountMap[m.user_id] || 0) : null,
        })),
      });
      if (acad?.name) setAdminDetailEditName(acad.name);
      if (acad?.royalty_rate != null) setAdminDetailEditRoyaltyRate(acad.royalty_rate);
    } catch (err) {
      console.error('Error fetching academy detail:', err);
      Alert.alert('Error', 'Failed to load academy details');
    } finally {
      setAdminAcademyDetailLoading(false);
    }
  };

  const handleAdminSaveAcademy = async (id) => {
    if (!adminDetailEditName.trim()) { Alert.alert('Validation', 'Academy name cannot be empty.'); return; }
    setAdminDetailSaving(true);
    try {
      const { error } = await supabase.from('academies').update({ name: adminDetailEditName.trim(), royalty_rate: adminDetailEditRoyaltyRate }).eq('id', id);
      if (error) throw error;
      await Promise.all([fetchAdminAcademyDetail(id), fetchAllAcademies()]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save academy details.');
    } finally {
      setAdminDetailSaving(false);
    }
  };

  const closeDetail = () => {
    setAdminAcademySelected(null);
    setAdminAcademyDetail(null);
    setAdminDetailEditName('');
    setAdminDetailEditRoyaltyRate(10);
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  if (adminAcademySelected) {
    const detail = adminAcademyDetail;
    const cardStyle = {
      backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
      padding: isMobile ? 16 : 20, marginBottom: 16,
    };

    return (
      <View style={styles.content}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 }}
          onPress={closeDetail}
        >
          <Ionicons name="chevron-back" size={18} color="#3B82F6" />
          <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600' }}>All Academies</Text>
        </TouchableOpacity>

        {adminAcademyDetailLoading || !detail ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Academy header card */}
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {detail.logo_url ? (
                  <Image source={{ uri: detail.logo_url }} style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 10, backgroundColor: '#F3F4F6', flexShrink: 0 }} />
                ) : (
                  <View style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="school-outline" size={isMobile ? 22 : 26} color="#9CA3AF" />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: isMobile ? 17 : 20, fontWeight: '700', color: '#111827' }} numberOfLines={2}>{detail.name}</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>@{detail.slug}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAdminEditAcademyModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.adminAcademyEditBtn}
                >
                  <Ionicons name="pencil-outline" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', ...(isMobile ? { gap: 8 } : { gap: 0 }) }}>
                {[
                  { label: 'Members', value: String(detail.members?.length ?? 0), color: '#111827' },
                  { label: 'Coaches', value: String(detail.members?.filter(m => m.role === 'coach').length ?? 0), color: '#111827' },
                  { label: 'Managers', value: String(detail.members?.filter(m => m.role === 'manager').length ?? 0), color: '#111827' },
                  { label: 'Royalty', value: `${detail.royalty_rate ?? 10}%`, color: '#7C3AED' },
                ].map(({ label, value, color }) => (
                  <View key={label} style={isMobile ? {
                    flexGrow: 1, flexBasis: '42%', maxWidth: '48%',
                    backgroundColor: '#F9FAFB', borderRadius: 10,
                    paddingVertical: 12, paddingHorizontal: 12,
                    borderWidth: 1, borderColor: '#F3F4F6',
                  } : { marginRight: 28 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
                    <Text style={{ fontSize: isMobile ? 20 : 22, fontWeight: '700', color, marginTop: 2 }}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Edit Modal */}
            <Modal visible={showAdminEditAcademyModal} transparent animationType="fade" onRequestClose={() => setShowAdminEditAcademyModal(false)}>
              <Pressable style={styles.adminEditModalOverlay} onPress={() => setShowAdminEditAcademyModal(false)}>
                <Pressable style={styles.adminEditModalSheet} onPress={e => e.stopPropagation()}>
                  <View style={styles.adminEditModalHeader}>
                    <Text style={styles.adminEditModalTitle}>Edit Academy</Text>
                    <TouchableOpacity onPress={() => setShowAdminEditAcademyModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={22} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.adminEditModalLabel}>Academy Name</Text>
                  <TextInput value={adminDetailEditName} onChangeText={setAdminDetailEditName} placeholder="Academy name" placeholderTextColor="#9CA3AF" style={styles.adminEditModalInput} />
                  <Text style={styles.adminEditModalLabel}>Commission / Royalty Rate</Text>
                  <Text style={styles.adminEditModalHint}>Percentage of earnings coaches pay back to this academy.</Text>
                  <View style={styles.adminEditModalRateRow}>
                    {[7, 10, 15].map(rate => {
                      const active = adminDetailEditRoyaltyRate === rate;
                      return (
                        <TouchableOpacity key={rate} onPress={() => setAdminDetailEditRoyaltyRate(rate)} activeOpacity={0.75} style={[styles.adminEditModalRateChip, active && styles.adminEditModalRateChipActive]}>
                          <Text style={[styles.adminEditModalRateText, active && styles.adminEditModalRateTextActive]}>{rate}%</Text>
                          {rate === 10 && <Text style={[styles.adminEditModalRateHint, active && { color: '#7C3AED' }]}>Standard</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    onPress={async () => { await handleAdminSaveAcademy(detail.id); setShowAdminEditAcademyModal(false); }}
                    disabled={adminDetailSaving} activeOpacity={0.8}
                    style={[styles.adminEditModalSaveBtn, adminDetailSaving && { backgroundColor: '#C4B5FD' }]}
                  >
                    {adminDetailSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                    <Text style={styles.adminEditModalSaveBtnText}>{adminDetailSaving ? 'Saving…' : 'Save Changes'}</Text>
                  </TouchableOpacity>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Members */}
            <Text style={[styles.sectionTitle, { fontSize: 15, marginBottom: 12, marginTop: 4 }]}>Members</Text>
            {(detail.members || []).length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No members yet</Text>
              </View>
            ) : isMobile ? (
              <View style={{ gap: 8, marginBottom: 32 }}>
                {(detail.members || []).map(member => {
                  const isManager = member.role === 'manager';
                  return (
                    <View key={member.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{(member.user?.name || 'U').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{member.user?.name || 'Unknown'}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>{member.user?.email || ''}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: isManager ? '#DBEAFE' : '#D1FAE5' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: isManager ? '#1D4ED8' : '#059669', textTransform: 'capitalize' }}>{member.role}</Text>
                        </View>
                        {member.role === 'coach' && <Text style={{ fontSize: 11, color: '#6B7280' }}>{member.activeStudents ?? 0} students</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.modernTable, { marginBottom: 24 }]}>
                <View style={styles.modernTableHeader}>
                  <View style={[styles.modernTableHeaderCell, { flex: 2 }]}><Text style={styles.modernTableHeaderText}>Member</Text></View>
                  <View style={[styles.modernTableHeaderCell, { flex: 1 }]}><Text style={styles.modernTableHeaderText}>Role</Text></View>
                  <View style={[styles.modernTableHeaderCell, { flex: 1 }]}><Text style={styles.modernTableHeaderText}>Active Students</Text></View>
                  <View style={[styles.modernTableHeaderCell, { flex: 1 }]}><Text style={styles.modernTableHeaderText}>Joined</Text></View>
                </View>
                {(detail.members || []).map(member => (
                  <View key={member.id} style={styles.modernTableRow}>
                    <View style={[styles.modernTableCell, { flex: 2 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{(member.user?.name || 'U').charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{member.user?.name || 'Unknown'}</Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>{member.user?.email || ''}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: member.role === 'manager' ? '#DBEAFE' : '#D1FAE5', alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: member.role === 'manager' ? '#1D4ED8' : '#059669', textTransform: 'capitalize' }}>{member.role}</Text>
                      </View>
                    </View>
                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      {member.role === 'coach'
                        ? <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{member.activeStudents ?? 0}</Text>
                        : <Text style={{ fontSize: 13, color: '#9CA3AF' }}>—</Text>}
                    </View>
                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <Text style={{ fontSize: 13, color: '#6B7280' }}>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.content}>
      <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
        <View>
          <Text style={styles.sectionTitle}>Academies</Text>
          <Text style={styles.sectionSubtitle}>All registered academies on the platform</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
      ) : allAcademies.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Ionicons name="school-outline" size={48} color="#D1D5DB" />
          <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 12 }}>No academies yet</Text>
        </View>
      ) : isMobile ? (
        <View style={{ gap: 10 }}>
          {allAcademies.map(acad => {
            const coachCount = (acad.academy_members || []).filter(m => m.role === 'coach').length;
            const studentCount = (acad.coach_students || []).filter(s => s.is_active).length;
            return (
              <TouchableOpacity
                key={acad.id}
                style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 12 }}
                onPress={() => { setAdminAcademySelected(acad.id); fetchAdminAcademyDetail(acad.id); }}
                activeOpacity={0.75}
              >
                {acad.logo_url ? (
                  <Image source={{ uri: acad.logo_url }} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6' }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="school-outline" size={22} color="#9CA3AF" />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{acad.name}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>@{acad.slug}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}><Text style={{ fontWeight: '700', color: '#111827' }}>{coachCount}</Text> coaches</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}><Text style={{ fontWeight: '700', color: '#111827' }}>{studentCount}</Text> students</Text>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: '#EDE9FE' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#7C3AED' }}>{acad.royalty_rate ?? 10}% royalty</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.modernTable}>
          <View style={styles.modernTableHeader}>
            <View style={[styles.modernTableHeaderCell, { flex: 2 }]}><Text style={styles.modernTableHeaderText}>Academy</Text></View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}><Text style={styles.modernTableHeaderText}>Coaches</Text></View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}><Text style={styles.modernTableHeaderText}>Active Students</Text></View>
            <View style={[styles.modernTableHeaderCell, { flex: 0.8 }]}><Text style={styles.modernTableHeaderText}>Royalty %</Text></View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}><Text style={styles.modernTableHeaderText}>Created</Text></View>
            <View style={[styles.modernTableHeaderCell, { flex: 0.5 }]}><Text style={styles.modernTableHeaderText}></Text></View>
          </View>
          {allAcademies.map(acad => {
            const coachCount = (acad.academy_members || []).filter(m => m.role === 'coach').length;
            const studentCount = (acad.coach_students || []).filter(s => s.is_active).length;
            return (
              <TouchableOpacity
                key={acad.id} style={styles.modernTableRow}
                onPress={() => { setAdminAcademySelected(acad.id); fetchAdminAcademyDetail(acad.id); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modernTableCell, { flex: 2 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {acad.logo_url ? (
                      <Image source={{ uri: acad.logo_url }} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6' }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="school-outline" size={18} color="#9CA3AF" />
                      </View>
                    )}
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{acad.name}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>@{acad.slug}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}><Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{coachCount}</Text></View>
                <View style={[styles.modernTableCell, { flex: 1 }]}><Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{studentCount}</Text></View>
                <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#EDE9FE', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED' }}>{acad.royalty_rate ?? 10}%</Text>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>{acad.created_at ? new Date(acad.created_at).toLocaleDateString() : '—'}</Text>
                </View>
                <View style={[styles.modernTableCell, { flex: 0.5, alignItems: 'flex-end' }]}>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
