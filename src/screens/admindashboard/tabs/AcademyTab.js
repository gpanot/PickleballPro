/**
 * AcademyTab — "My Academy" page for academy owners / managers.
 *
 * Props from parent (AdminDashboard):
 *   academyId        – the user's academy id (null = show create form)
 *   coachId          – coach row id for the current user
 *   isMobile         – responsive layout flag
 *   user             – auth user object
 *   myAcademySubTab  – active sub-tab ('overview'|'members'|'students'), owned by parent for TopBar wiring
 *   setMyAcademySubTab
 *   inviteCardRef    – ref forwarded from parent so the TopBar "Invite a Coach" button can scroll to the card
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, Modal, Pressable, Platform, Share,
} from 'react-native';

const INVITE_URL = 'https://academypro.thecourtflow.com/';
import { Ionicons } from '@expo/vector-icons';
import { Home, Mail, DollarSign, Users, Activity, Plus, Share2 } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import styles from '../adminDashboardStyles';

export default function AcademyTab({
  academyId,
  coachId,
  isMobile,
  user,
  myAcademySubTab,
  setMyAcademySubTab,
  inviteCardRef,
}) {
  // ── Academy data ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [academyInfo, setAcademyInfo] = useState(null);
  const [academyMembers, setAcademyMembers] = useState([]);
  const [academyStudents, setAcademyStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [inactiveCoaches, setInactiveCoaches] = useState([]);
  const [engagementTrend, setEngagementTrend] = useState([]);

  // ── Add member form ───────────────────────────────────────────────────────
  const [addCoachEmail, setAddCoachEmail] = useState('');
  const [addCoachLoading, setAddCoachLoading] = useState(false);
  const [addCoachError, setAddCoachError] = useState('');
  const [addCoachSuccess, setAddCoachSuccess] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  // ── Invite link ───────────────────────────────────────────────────────────
  const [copyConfirmed, setCopyConfirmed] = useState(false);

  // ── Academy settings / edit modal ────────────────────────────────────────
  const [showMyAcademyEditModal, setShowMyAcademyEditModal] = useState(false);
  const [academyEditName, setAcademyEditName] = useState('');
  const [academyEditRoyaltyRate, setAcademyEditRoyaltyRate] = useState(10);
  const [academySettingsSaving, setAcademySettingsSaving] = useState(false);
  const [academyLogoUploading, setAcademyLogoUploading] = useState(false);
  const [academySettingsError, setAcademySettingsError] = useState('');

  // ── Create academy form (no academy yet) ─────────────────────────────────
  const [createAcademyName, setCreateAcademyName] = useState('');
  const [creatingAcademy, setCreatingAcademy] = useState(false);

  useEffect(() => {
    if (academyId) {
      fetchAcademyMembers();
      fetchAcademyStudents();
    }
  }, [academyId]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchAcademyMembers = async () => {
    if (!academyId) return;
    setLoading(true);
    try {
      const { data: acad } = await supabase
        .from('academies')
        .select('id, name, slug, logo_url, royalty_rate')
        .eq('id', academyId)
        .maybeSingle();
      setAcademyInfo(acad);
      if (acad?.name) setAcademyEditName(acad.name);
      if (acad?.royalty_rate != null) setAcademyEditRoyaltyRate(acad.royalty_rate);

      const { data: members, error } = await supabase
        .from('academy_members')
        .select('id, user_id, role, joined_at')
        .eq('academy_id', academyId)
        .order('joined_at', { ascending: true });
      if (error) throw error;

      const memberIds = (members || []).map(m => m.user_id).filter(Boolean);
      let profileMap = {};
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users').select('id, name, email, avatar_url').in('id', memberIds);
        profileMap = (profiles || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
      }

      setAcademyMembers(
        (members || []).map(m => ({ ...m, user: profileMap[m.user_id] || { name: 'Unknown', email: '' } }))
      );

      // Health signals — coaches with no active students
      const coachMembers = (members || []).filter(m => m.role === 'coach');
      const coachUserIds = coachMembers.map(m => m.user_id).filter(Boolean);
      if (coachUserIds.length > 0) {
        const { data: coachRows } = await supabase.from('coaches').select('id, user_id, name').in('user_id', coachUserIds);
        const coachIdMap = (coachRows || []).reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
        const allCoachDbIds = Object.keys(coachIdMap);
        let activeSet = new Set();
        if (allCoachDbIds.length > 0) {
          const { data: activeSt } = await supabase.from('coach_students').select('coach_id').in('coach_id', allCoachDbIds).eq('is_active', true);
          (activeSt || []).forEach(s => activeSet.add(s.coach_id));
        }
        setInactiveCoaches((coachRows || []).filter(c => !activeSet.has(c.id)).map(c => ({
          ...c, displayName: profileMap[c.user_id]?.name || c.name || 'Unknown',
        })));
      } else {
        setInactiveCoaches([]);
      }

      // Engagement trend — last 8 weeks
      const now = new Date();
      const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: trendRows } = await supabase
        .from('coach_students').select('joined_at')
        .eq('academy_id', academyId).eq('is_active', true).gte('joined_at', eightWeeksAgo);

      const weekCounts = {};
      for (let i = 0; i < 8; i++) {
        const ws = new Date(now.getTime() - (7 - i) * 7 * 24 * 60 * 60 * 1000);
        ws.setHours(0, 0, 0, 0);
        const day = ws.getDay();
        ws.setDate(ws.getDate() - day + (day === 0 ? -6 : 1));
        weekCounts[ws.toISOString().slice(0, 10)] = 0;
      }
      (trendRows || []).forEach(row => {
        const d = new Date(row.joined_at);
        const day = d.getDay();
        d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        if (key in weekCounts) weekCounts[key]++;
      });
      setEngagementTrend(Object.entries(weekCounts).map(([week, count]) => ({ week, count })));
    } catch (error) {
      console.error('Error fetching academy members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademyStudents = async () => {
    if (!academyId) return;
    setStudentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_students')
        .select(`id, created_at, student_id, coach_id, users!student_id(name, email, avatar_url), coaches!coach_id(name)`)
        .eq('academy_id', academyId).eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      setAcademyStudents(data || []);
    } catch (err) {
      console.error('fetchAcademyStudents error:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddCoachToAcademy = async () => {
    setAddCoachError('');
    setAddCoachSuccess('');
    if (!addCoachEmail.trim()) { setAddCoachError('Please enter an email address.'); return; }
    setAddCoachLoading(true);
    try {
      const { data: userRow, error: lookupError } = await supabase
        .from('users').select('id, name, email').eq('email', addCoachEmail.trim().toLowerCase()).maybeSingle();
      if (lookupError) throw lookupError;
      if (!userRow) { setAddCoachError('No user found with that email address. They must sign up first.'); return; }

      const { error: rpcError } = await supabase.rpc('add_coach_to_academy', {
        target_academy_id: academyId, target_user_id: userRow.id, member_role: 'coach',
      });
      if (rpcError) { setAddCoachError(rpcError.message || 'Failed to add member.'); return; }

      setAddCoachSuccess(`${userRow.name || userRow.email} added to your academy as Coach.`);
      setAddCoachEmail('');
      await fetchAcademyMembers();
    } catch (err) {
      setAddCoachError(err.message || 'An unexpected error occurred.');
    } finally {
      setAddCoachLoading(false);
    }
  };

  const handleChangeMemberRole = async (member, newRole) => {
    if (!member || updatingMemberId) return;
    setUpdatingMemberId(member.id);
    try {
      const { error } = await supabase.from('academy_members').update({ role: newRole }).eq('id', member.id);
      if (error) throw error;
      await fetchAcademyMembers();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update member role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.user?.name || member.user?.email || 'this member'} from the academy?\n\nTheir programs and student history will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setRemovingMemberId(member.id);
            try {
              const { error: memberError } = await supabase.from('academy_members').delete().eq('id', member.id);
              if (memberError) throw memberError;

              const { data: coachRow } = await supabase.from('coaches').select('id').eq('user_id', member.user_id).maybeSingle();
              if (coachRow?.id) {
                await supabase.from('coach_students').update({ academy_id: null }).eq('coach_id', coachRow.id).eq('academy_id', academyId);
              }
              await fetchAcademyMembers();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            } finally {
              setRemovingMemberId(null);
            }
          },
        },
      ]
    );
  };

  const handleShareInvite = async () => {
    if (Platform.OS === 'web') {
      await navigator.clipboard?.writeText(INVITE_URL);
      setCopyConfirmed(true);
      setTimeout(() => setCopyConfirmed(false), 2000);
    } else {
      try {
        await Share.share({ message: `Join my academy on AcademyPro: ${INVITE_URL}`, url: INVITE_URL });
      } catch {}
    }
  };

  const handleSaveAcademySettings = async (logoUrl) => {
    if (!academyEditName.trim()) { setAcademySettingsError('Academy name cannot be empty.'); return; }
    setAcademySettingsError('');
    setAcademySettingsSaving(true);
    try {
      const update = { name: academyEditName.trim(), royalty_rate: academyEditRoyaltyRate };
      if (logoUrl !== undefined) update.logo_url = logoUrl;
      const { error } = await supabase.from('academies').update(update).eq('id', academyId);
      if (error) throw error;
      await fetchAcademyMembers();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save academy settings');
    } finally {
      setAcademySettingsSaving(false);
    }
  };

  const handleAcademyLogoFile = async (file) => {
    if (!file || !academyId) return;
    setAcademyLogoUploading(true);
    try {
      const ext = file.name?.split('.').pop() || 'jpg';
      const storagePath = `academy-logos/${academyId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(storagePath, file, { contentType: file.type || 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(storagePath);
      await handleSaveAcademySettings(publicUrl);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to upload logo');
    } finally {
      setAcademyLogoUploading(false);
    }
  };

  const handleCreateAcademy = async () => {
    const name = createAcademyName.trim();
    if (!name) { Alert.alert('Validation', 'Please enter an academy name.'); return; }
    setCreatingAcademy(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).slice(2, 7);
      const { data: acad, error: acadErr } = await supabase
        .from('academies').insert({ name, slug, created_by: user?.id }).select().single();
      if (acadErr) throw acadErr;
      await supabase.from('academy_members').insert({ academy_id: acad.id, user_id: user?.id, role: 'manager' });
      if (coachId) await supabase.from('coaches').update({ academy_id: acad.id }).eq('id', coachId);
      Alert.alert('Academy created!', `"${name}" is ready. Reload the app to see your full Academy dashboard.`);
      setCreateAcademyName('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create academy.');
    } finally {
      setCreatingAcademy(false);
    }
  };

  // ── "Invite a Coach" triggered from the TopBar ───────────────────────────
  const handleInviteCoachFromTopBar = () => {
    setMyAcademySubTab('members');
    if (Platform.OS === 'web') {
      setTimeout(() => {
        inviteCardRef?.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  };

  // ── Early return — no academy yet ─────────────────────────────────────────
  if (!academyId) {
    return (
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>My Academy</Text>
            <Text style={styles.sectionSubtitle}>Set up your academy to manage students and programs</Text>
          </View>
        </View>
        <View style={styles.academyEmptyCard}>
          <Ionicons name="school-outline" size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <Text style={styles.academyEmptyTitle}>Create your Academy</Text>
          <Text style={styles.academyEmptySubtext}>
            Give your academy a name and you can start adding coaches, students, and programs right away.
          </Text>
          <View style={styles.academyCreateForm}>
            <Text style={styles.academyFieldLabel}>Academy Name</Text>
            <TextInput
              style={styles.academyTextInput}
              placeholder="e.g. Challengers Academy"
              placeholderTextColor="#9CA3AF"
              value={createAcademyName}
              onChangeText={setCreateAcademyName}
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.academyPrimaryBtn, (creatingAcademy || !createAcademyName.trim()) && styles.academyPrimaryBtnDisabled]}
              onPress={handleCreateAcademy}
              disabled={creatingAcademy || !createAcademyName.trim()}
            >
              {creatingAcademy
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
              <Text style={styles.academyPrimaryBtnText}>{creatingAcademy ? 'Creating...' : 'Create Academy'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Derived data for Overview tab ─────────────────────────────────────────
  const roleBadgeBg = (r) => r === 'manager' ? '#FEF3C7' : r === 'staff' ? '#F3F4F6' : '#EFF6FF';
  const roleBadgeText = (r) => r === 'manager' ? '#92400E' : r === 'staff' ? '#4B5563' : '#1D4ED8';

  const coachMembers = academyMembers.filter(m => m.role === 'coach');
  const coachCount = coachMembers.length;
  const totalStudents = academyStudents.length;
  const royaltyRate = academyInfo?.royalty_rate ?? academyEditRoyaltyRate ?? 10;
  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const isThisMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const newCoachesThisMonth = coachMembers.filter(m => isThisMonth(m.joined_at)).length;
  const newStudentsThisMonth = academyStudents.filter(s => isThisMonth(s.created_at)).length;

  const avgRoyaltyPerCoach = 415;
  const projectionTarget = 2000;
  const projectionFillPct = coachCount >= 1 ? Math.min((0 / projectionTarget) * 100, 100) : 0;
  const coachesNeeded = coachCount >= 1 ? Math.max(Math.ceil((projectionTarget - 0) / avgRoyaltyPerCoach), 0) : 0;

  const studentCountByCoachName = {};
  academyStudents.forEach(s => {
    const name = s.coaches?.name || '';
    if (name) studentCountByCoachName[name] = (studentCountByCoachName[name] || 0) + 1;
  });

  return (
    <View style={styles.content}>

      {/* ── Academy page header ── */}
      <View style={styles.academyPageHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          {academyInfo?.logo_url ? (
            <Image source={{ uri: academyInfo.logo_url }} style={styles.academyPageLogo} />
          ) : (
            <View style={styles.academyPageLogoPlaceholder}>
              <Home size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.academyPageName} numberOfLines={1}>
              {academyInfo?.name || academyEditName || 'My Academy'}
            </Text>
            <Text style={styles.academyPageMeta} numberOfLines={1}>
              {academyInfo?.slug ? `@${academyInfo.slug} · ` : ''}{royaltyRate}% royalty
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowMyAcademyEditModal(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.adminAcademyEditBtn}
        >
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* ── Sub-tabs ── */}
      <View style={styles.academySubTabBar}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: 'Members' },
          { id: 'students', label: 'Students' },
        ].map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.academySubTab, myAcademySubTab === id && styles.academySubTabActive]}
            onPress={() => setMyAcademySubTab(id)}
          >
            <Text style={[styles.academySubTabText, myAcademySubTab === id && styles.academySubTabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ OVERVIEW TAB ══ */}
      {myAcademySubTab === 'overview' && (
        <View>
          {/* Revenue hero */}
          <View style={styles.academyRevenueHero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.academyRevenueLabel}>Monthly Royalty Income</Text>
              <Text style={styles.academyRevenueAmount}>$0</Text>
              <Text style={styles.academyRevenueSub}>
                {`from ${coachCount} affiliated ${coachCount === 1 ? 'coach' : 'coaches'} · ${monthLabel}`}
              </Text>
              <View style={styles.academyRevenueBreakdown}>
                {[
                  { val: String(coachCount), lab: 'Active Coaches' },
                  { val: String(totalStudents), lab: 'Total Students' },
                  { val: `${royaltyRate}%`, lab: 'Royalty Rate' },
                  { val: '$0', lab: 'Network Revenue' },
                ].map(({ val, lab }, i) => (
                  <View
                    key={lab}
                    style={[
                      styles.academyRevenueBreakdownCol,
                      i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)' },
                    ]}
                  >
                    <Text style={styles.academyRevenueBreakdownVal}>{val}</Text>
                    <Text style={styles.academyRevenueBreakdownLab}>{lab}</Text>
                  </View>
                ))}
              </View>
            </View>
            {!isMobile && (
              <View style={styles.academyProjectionBox}>
                <Text style={styles.academyProjectionLabel}>Path to $2,000/mo</Text>
                <Text style={styles.academyProjectionTarget}>$0 of $2,000</Text>
                {coachCount >= 1 ? (
                  <>
                    <View style={styles.academyProjectionTrack}>
                      <View style={[styles.academyProjectionFill, { width: `${projectionFillPct}%` }]} />
                    </View>
                    <Text style={styles.academyProjectionNote}>
                      {`Add ${coachesNeeded} more ${coachesNeeded === 1 ? 'coach' : 'coaches'} to reach your royalty goal.`}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.academyProjectionNote}>
                    Invite your first coach to start earning royalties.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Invite nudge */}
          {coachCount < 5 && (
            <View style={styles.academyInviteNudge}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <View style={styles.academyInviteNudgeIcon}><Mail size={18} color="#FFFFFF" /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.academyInviteNudgeTitle}>Grow your network</Text>
                  <Text style={styles.academyInviteNudgeSub}>
                    {coachCount >= 1
                      ? `Each new coach averages $${avgRoyaltyPerCoach}/mo in royalties. Share your invite link to expand.`
                      : 'Invite your first coach to start building your academy network.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.academyBtnSmPrimary} onPress={handleInviteCoachFromTopBar}>
                <Share2 size={14} color="#FFFFFF" />
                {!isMobile && <Text style={styles.academyBtnSmText}>Share invite link</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.academyOverviewStatGrid}>
            <View style={styles.academyOverviewStatCard}>
              <View style={[styles.academyOverviewStatIcon, { backgroundColor: '#E8F5FF' }]}>
                <DollarSign size={16} color="#007AFF" />
              </View>
              <Text style={styles.academyOverviewStatVal}>$0</Text>
              <Text style={styles.academyOverviewStatLabel}>Your direct revenue this month</Text>
              <Text style={[styles.academyOverviewStatDelta, { color: '#999999' }]}>Personal students</Text>
            </View>
            <View style={styles.academyOverviewStatCard}>
              <View style={[styles.academyOverviewStatIcon, { backgroundColor: '#F0EEFF' }]}>
                <Users size={16} color="#6366F1" />
              </View>
              <Text style={styles.academyOverviewStatVal}>{coachCount}</Text>
              <Text style={styles.academyOverviewStatLabel}>Affiliated coaches in your network</Text>
              <Text style={[styles.academyOverviewStatDelta, { color: newCoachesThisMonth > 0 ? '#22C55E' : '#999999' }]}>
                {newCoachesThisMonth > 0 ? `+${newCoachesThisMonth} this month` : 'No change'}
              </Text>
            </View>
            <View style={styles.academyOverviewStatCard}>
              <View style={[styles.academyOverviewStatIcon, { backgroundColor: '#E8FFF0' }]}>
                <Activity size={16} color="#22C55E" />
              </View>
              <Text style={styles.academyOverviewStatVal}>{totalStudents}</Text>
              <Text style={styles.academyOverviewStatLabel}>Students across all locations</Text>
              <Text style={[styles.academyOverviewStatDelta, { color: newStudentsThisMonth > 0 ? '#22C55E' : '#999999' }]}>
                {newStudentsThisMonth > 0 ? `+${newStudentsThisMonth} this month` : 'No change'}
              </Text>
            </View>
          </View>

          {/* Royalties by coach */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={styles.academyOverviewSectionTitle}>Royalties by Coach</Text>
            <TouchableOpacity onPress={() => setMyAcademySubTab('members')}>
              <Text style={styles.academyOverviewSectionLink}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.academyRoyaltiesTable}>
            {!isMobile && (
              <View style={styles.academyRoyaltiesHead}>
                <Text style={[styles.academyRoyaltiesHeadCell, { flex: 2 }]}>Coach</Text>
                <Text style={[styles.academyRoyaltiesHeadCell, { flex: 1 }]}>Students</Text>
                <Text style={[styles.academyRoyaltiesHeadCell, { flex: 1 }]}>Gross Rev</Text>
                <Text style={[styles.academyRoyaltiesHeadCell, { flex: 1 }]}>Royalty</Text>
                <Text style={[styles.academyRoyaltiesHeadCell, { flex: 1.4 }]}>Status</Text>
              </View>
            )}
            {coachCount === 0 ? (
              <View style={styles.academyRoyaltiesEmpty}>
                <Users size={32} color="#D1D5DB" />
                <Text style={styles.academyRoyaltiesEmptyTitle}>No coaches yet</Text>
                <Text style={styles.academyRoyaltiesEmptySub}>
                  Invite your first affiliated coach to start earning royalties.
                </Text>
                <TouchableOpacity
                  style={[styles.academyBtnSmPrimary, { marginTop: 12 }]}
                  onPress={handleInviteCoachFromTopBar}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.academyBtnSmText}>Invite a Coach</Text>
                </TouchableOpacity>
              </View>
            ) : (
              coachMembers.map((member, idx) => {
                const name = member.user?.name || '—';
                const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
                const studentCount = studentCountByCoachName[name] || 0;
                const maxStudents = Math.max(...coachMembers.map(m => studentCountByCoachName[m.user?.name || ''] || 0), 1);
                const isNewThisMonth = isThisMonth(member.joined_at);
                return (
                  <View
                    key={member.id}
                    style={[styles.academyRoyaltiesRow, idx === coachCount - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, isMobile ? { flex: 1 } : { flex: 2 }]}>
                      <View style={styles.academyRoyaltiesAvatar}>
                        <Text style={styles.academyRoyaltiesAvatarText}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.academyRoyaltiesCoachName} numberOfLines={1}>{name}</Text>
                        {member.user?.email ? (
                          <Text style={styles.academyRoyaltiesCoachSub} numberOfLines={1}>{member.user.email}</Text>
                        ) : null}
                      </View>
                    </View>
                    {!isMobile && (
                      <>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.academyRoyaltiesCellVal}>{studentCount}</Text>
                          <View style={styles.academyTrendBar}>
                            <View style={[styles.academyTrendFill, { width: `${(studentCount / maxStudents) * 100}%` }]} />
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.academyRoyaltiesCellVal}>$0</Text>
                          <Text style={styles.academyRoyaltiesCellSub}>this month</Text>
                        </View>
                        <Text style={[styles.academyRoyaltiesCellVal, { flex: 1, color: '#007AFF', fontWeight: '800', fontSize: 13 }]}>$0</Text>
                        <View style={{ flex: 1.4 }}>
                          {isNewThisMonth ? (
                            <View style={styles.academyStatusBadgePending}>
                              <View style={[styles.academyStatusDot, { backgroundColor: '#D97706' }]} />
                              <Text style={styles.academyStatusBadgePendingText}>
                                {`Joined ${new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.academyStatusBadgeActive}>
                              <View style={[styles.academyStatusDot, { backgroundColor: '#16A34A' }]} />
                              <Text style={styles.academyStatusBadgeActiveText}>Active</Text>
                            </View>
                          )}
                        </View>
                      </>
                    )}
                    {isMobile && (
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#007AFF' }}>$0</Text>
                        {isNewThisMonth ? (
                          <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '600' }}>
                            {`Joined ${new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>Active</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* ══ MEMBERS TAB ══ */}
      {myAcademySubTab === 'members' && (
        <View>
          {/* Add a Coach — 2-step inline flow */}
          <View ref={inviteCardRef} style={[styles.academyCard, { marginBottom: 24 }]}>
            <Text style={styles.academyCardTitle}>Add a Coach</Text>

            {/* ── Step 1 (inline) ── */}
            <View style={[styles.addCoachStepRow, { marginTop: 16 }]}>
              <View style={styles.addCoachStepBadge}>
                <Text style={styles.addCoachStepBadgeText}>1</Text>
              </View>
              <Text style={styles.addCoachStepTitle}>Invite to Register</Text>
              <View style={styles.addCoachStepAction}>
                <View style={[styles.academyInviteLinkPreview, { flex: 1, marginBottom: 0 }]}>
                  <Text style={styles.academyInviteLinkUrl} selectable numberOfLines={1}>{INVITE_URL}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.academyOutlineBtn, copyConfirmed && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]}
                  onPress={handleShareInvite}
                >
                  <Share2 size={14} color={copyConfirmed ? '#10B981' : '#374151'} />
                  <Text style={[styles.academyOutlineBtnText, copyConfirmed && { color: '#10B981' }]}>
                    {copyConfirmed ? 'Copied!' : 'Share'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={styles.addCoachStepDivider}>
              <View style={styles.addCoachStepDividerLine} />
              <Text style={styles.addCoachStepDividerLabel}>then</Text>
              <View style={styles.addCoachStepDividerLine} />
            </View>

            {/* ── Step 2 (inline) ── */}
            <View style={styles.addCoachStepRow}>
              <View style={[styles.addCoachStepBadge, { backgroundColor: '#111827' }]}>
                <Text style={styles.addCoachStepBadgeText}>2</Text>
              </View>
              <Text style={styles.addCoachStepTitle}>Add to Your Academy</Text>
              <View style={styles.addCoachStepAction}>
                <TextInput
                  style={[styles.academyTextInput, { flex: 1, marginBottom: 0 }, addCoachError && styles.academyTextInputError]}
                  placeholder="coach@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={addCoachEmail}
                  onChangeText={v => { setAddCoachEmail(v); setAddCoachError(''); setAddCoachSuccess(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={[styles.academyPrimaryBtn, { alignSelf: 'stretch' }]}
                  onPress={handleAddCoachToAcademy}
                  disabled={addCoachLoading}
                >
                  {addCoachLoading
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Ionicons name="person-add-outline" size={15} color="#FFFFFF" />}
                  <Text style={styles.academyPrimaryBtnText}>{addCoachLoading ? 'Adding…' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {addCoachError ? (
              <View style={[styles.academyFeedbackRow, { marginTop: 8, marginLeft: 42 }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                <Text style={styles.academyFeedbackError}>{addCoachError}</Text>
              </View>
            ) : null}
            {addCoachSuccess ? (
              <View style={[styles.academyFeedbackRow, { marginTop: 8, marginLeft: 42 }]}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#10B981" />
                <Text style={styles.academyFeedbackSuccess}>{addCoachSuccess}</Text>
              </View>
            ) : null}
          </View>

          {/* Members table */}
          <View style={styles.academyCard}>
            <Text style={styles.academyCardTitle}>Members ({academyMembers.length})</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.loadingText}>Loading members…</Text>
              </View>
            ) : academyMembers.length === 0 ? (
              <View style={[styles.comingSoon, { paddingVertical: 40 }]}>
                <Ionicons name="people-outline" size={28} color="#9CA3AF" />
                <Text style={[styles.comingSoonText, { fontWeight: '600', color: '#374151', marginTop: 12 }]}>No members yet</Text>
                <Text style={[styles.comingSoonSubtext, { marginTop: 4 }]}>Add coaches above to get started</Text>
              </View>
            ) : isMobile ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                {academyMembers.map(member => {
                  const isSelf = member.user_id === user?.id;
                  const isRemoving = removingMemberId === member.id;
                  return (
                    <View key={member.id} style={styles.academyMemberCard}>
                      <View style={styles.academyMemberCardHeader}>
                        <View style={styles.academyAvatar}>
                          <Text style={styles.academyAvatarText}>
                            {(member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.programTitle} numberOfLines={1}>{member.user?.name || '—'}</Text>
                          <Text style={styles.programMeta} numberOfLines={1}>{member.user?.email || ''}</Text>
                        </View>
                        <View style={[styles.modernStatusChip, { backgroundColor: roleBadgeBg(member.role) }]}>
                          <Text style={[styles.modernStatusText, { color: roleBadgeText(member.role) }]}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.academyMemberCardFooter}>
                        <Text style={styles.academyMetaText}>
                          Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
                        </Text>
                        {isSelf ? (
                          <Text style={styles.academySelfLabel}>You</Text>
                        ) : (
                          <TouchableOpacity onPress={() => handleRemoveMember(member)} disabled={isRemoving} style={styles.academyRemoveBtn}>
                            {isRemoving
                              ? <ActivityIndicator size="small" color="#EF4444" />
                              : <Text style={styles.academyRemoveBtnText}>Remove</Text>}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.modernTable, { marginTop: 4 }]}>
                <View style={styles.modernTableHeader}>
                  <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Member</Text>
                  <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Role</Text>
                  <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Joined</Text>
                  <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Actions</Text>
                </View>
                {academyMembers.map(member => {
                  const isSelf = member.user_id === user?.id;
                  const isUpdating = updatingMemberId === member.id;
                  const isRemoving = removingMemberId === member.id;
                  return (
                    <View key={member.id} style={styles.modernTableRow}>
                      <View style={[styles.modernTableCell, { flex: 2 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          {member.user?.avatar_url ? (
                            <Image source={{ uri: member.user.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                          ) : (
                            <View style={[styles.academyAvatar, { width: 32, height: 32, borderRadius: 16 }]}>
                              <Text style={styles.academyAvatarText}>
                                {(member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View>
                            <Text style={styles.programTitle} numberOfLines={1}>{member.user?.name || '—'}</Text>
                            <Text style={styles.programMeta}>{member.user?.email || ''}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.modernTableCell, { flex: 1 }]}>
                        <View style={[styles.modernStatusChip, { backgroundColor: roleBadgeBg(member.role) }]}>
                          <Text style={[styles.modernStatusText, { color: roleBadgeText(member.role) }]}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                        <Text style={styles.programMeta}>
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
                        </Text>
                      </View>
                      <View style={[styles.modernTableCell, { flex: 1.5, gap: 6 }]}>
                        {isSelf ? (
                          <Text style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>You</Text>
                        ) : (
                          <TouchableOpacity onPress={() => handleRemoveMember(member)} disabled={isRemoving}
                            style={[styles.academyRemoveBtn, { alignSelf: 'flex-start' }]}
                          >
                            {isRemoving
                              ? <ActivityIndicator size="small" color="#EF4444" />
                              : <Text style={styles.academyRemoveBtnText}>Remove</Text>}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ══ STUDENTS TAB ══ */}
      {myAcademySubTab === 'students' && (
        <View>
          {/* Students roster */}
          <View style={styles.academyCard}>
            <Text style={styles.academyCardTitle}>Students ({academyStudents.length})</Text>
            {studentsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.loadingText}>Loading students…</Text>
              </View>
            ) : academyStudents.length === 0 ? (
              <View style={[styles.comingSoon, { paddingVertical: 40 }]}>
                <Ionicons name="people-outline" size={28} color="#9CA3AF" />
                <Text style={[styles.comingSoonText, { fontWeight: '600', color: '#374151', marginTop: 12 }]}>No students enrolled yet</Text>
                <Text style={[styles.comingSoonSubtext, { marginTop: 4 }]}>
                  Students are added when academy coaches use "Add Student" in their coach dashboard.
                </Text>
              </View>
            ) : isMobile ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                {academyStudents.map(row => (
                  <View key={row.id} style={styles.academyMemberCard}>
                    <Text style={[styles.programTitle, { marginBottom: 2 }]} numberOfLines={1}>{row.users?.name || '—'}</Text>
                    <Text style={styles.programMeta} numberOfLines={1}>{row.users?.email || ''}</Text>
                    <View style={styles.academyMemberCardFooter}>
                      <Text style={styles.academyMetaText}>Coach: {row.coaches?.name || '—'}</Text>
                      <Text style={styles.academyMetaText}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.modernTable, { marginTop: 4 }]}>
                <View style={styles.modernTableHeader}>
                  <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Student</Text>
                  <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Assigned Coach</Text>
                  <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Date Added</Text>
                </View>
                {academyStudents.map(row => (
                  <View key={row.id} style={styles.modernTableRow}>
                    <View style={[styles.modernTableCell, { flex: 2 }]}>
                      <Text style={styles.programTitle} numberOfLines={1}>{row.users?.name || '—'}</Text>
                      <Text style={styles.programMeta}>{row.users?.email || ''}</Text>
                    </View>
                    <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                      <Text style={styles.programMeta}>{row.coaches?.name || '—'}</Text>
                    </View>
                    <View style={[styles.modernTableCell, { flex: 1 }]}>
                      <Text style={styles.programMeta}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Health Signals */}
          <View style={[styles.academyCard, { marginBottom: 8 }]}>
            <Text style={styles.academyCardTitle}>Health Signals</Text>
            <Text style={[styles.academyHintText, { marginBottom: 16 }]}>Coach activity and student growth at a glance</Text>
            <View style={styles.academySignalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.academySignalLabel}>Coaches with no active students</Text>
              </View>
              <View style={[styles.academySignalBadge, { backgroundColor: inactiveCoaches.length > 0 ? '#FEF2F2' : '#F0FDF4' }]}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: inactiveCoaches.length > 0 ? '#EF4444' : '#16A34A' }}>
                  {inactiveCoaches.length}
                </Text>
              </View>
            </View>
            {inactiveCoaches.length === 0 ? (
              <Text style={[styles.academyHintText, { marginBottom: 16 }]}>All coaches have at least one active student.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {inactiveCoaches.map(c => (
                  <View key={c.id} style={styles.academyInactiveChip}>
                    <Text style={{ fontSize: 13, color: '#991B1B' }}>{c.displayName}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.academySignalLabel}>Student growth — last 8 weeks</Text>
            {engagementTrend.length === 0 ? (
              <Text style={styles.academyHintText}>No student data yet.</Text>
            ) : (
              <View style={styles.academyBarChart}>
                {engagementTrend.map(({ week, count }, i) => {
                  const maxCount = Math.max(...engagementTrend.map(e => e.count), 1);
                  const barHeight = Math.max((count / maxCount) * 60, 4);
                  const isLast = i === engagementTrend.length - 1;
                  return (
                    <View key={week} style={styles.academyBarItem}>
                      <Text style={[styles.academyBarValue, isLast && { color: '#3B82F6' }]}>{count > 0 ? count : ''}</Text>
                      <View style={[styles.academyBar, { height: barHeight, backgroundColor: isLast ? '#3B82F6' : '#E5E7EB' }]} />
                      <Text style={styles.academyBarLabel}>{week.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Edit Academy Modal ── */}
      <Modal
        visible={showMyAcademyEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMyAcademyEditModal(false)}
      >
        <Pressable style={styles.adminEditModalOverlay} onPress={() => setShowMyAcademyEditModal(false)}>
          <Pressable style={styles.adminEditModalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.adminEditModalHeader}>
              <Text style={styles.adminEditModalTitle}>Edit Academy</Text>
              <TouchableOpacity onPress={() => setShowMyAcademyEditModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {academyInfo?.logo_url ? (
                <Image source={{ uri: academyInfo.logo_url }} style={styles.academyLogoImg} />
              ) : (
                <View style={styles.academyLogoPlaceholder}>
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
              )}
              {Platform.OS === 'web' ? (
                <label style={{ cursor: 'pointer', marginTop: 8 }}>
                  <View style={styles.academyLogoBtn}>
                    {academyLogoUploading
                      ? <ActivityIndicator size="small" color="#6B7280" />
                      : <Text style={styles.academyLogoBtnText}>Change Logo</Text>}
                  </View>
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAcademyLogoFile(f); e.target.value = ''; }}
                  />
                </label>
              ) : null}
            </View>
            <Text style={styles.adminEditModalLabel}>Academy Name</Text>
            <TextInput
              style={[styles.adminEditModalInput, academySettingsError && styles.academyTextInputError]}
              value={academyEditName}
              onChangeText={(v) => { setAcademyEditName(v); setAcademySettingsError(''); }}
              placeholder="Academy name"
              placeholderTextColor="#9CA3AF"
            />
            {academySettingsError ? (
              <Text style={[styles.academyErrorText, { marginTop: 4 }]}>{academySettingsError}</Text>
            ) : null}
            <Text style={styles.adminEditModalLabel}>Royalty Rate</Text>
            <Text style={styles.adminEditModalHint}>
              % coaches pay you from gross revenue. Coaches keep {100 - academyEditRoyaltyRate}%.
            </Text>
            <View style={styles.adminEditModalRateRow}>
              {[7, 10, 15].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.adminEditModalRateChip, academyEditRoyaltyRate === r && styles.adminEditModalRateChipActive]}
                  onPress={() => setAcademyEditRoyaltyRate(r)}
                >
                  <Text style={[styles.adminEditModalRateText, academyEditRoyaltyRate === r && styles.adminEditModalRateTextActive]}>
                    {r}%
                  </Text>
                  {r === 10 && (
                    <Text style={[styles.adminEditModalRateHint, academyEditRoyaltyRate === r && { color: '#3B82F6' }]}>
                      Standard
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.academyPrimaryBtn, academySettingsSaving && styles.academyPrimaryBtnDisabled, { marginTop: 20 }]}
              onPress={async () => {
                await handleSaveAcademySettings(undefined);
                if (!academySettingsError) setShowMyAcademyEditModal(false);
              }}
              disabled={academySettingsSaving}
            >
              {academySettingsSaving
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="save-outline" size={15} color="#FFFFFF" />}
              <Text style={styles.academyPrimaryBtnText}>
                {academySettingsSaving ? 'Saving…' : 'Save Settings'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
