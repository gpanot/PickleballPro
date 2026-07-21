import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AddCoachModal from '../components/AddCoachModal';
import AddUserModal from '../components/AddUserModal';
import WebCreateProgramModal from '../components/WebCreateProgramModal';
import WebCreateRoutineModal from '../components/WebCreateRoutineModal';
import WebCreateExerciseModal from '../components/WebCreateExerciseModal';
import ProgramStructureModal from '../components/ProgramStructureModal';
import EditableProgramStructureModal from '../components/EditableProgramStructureModal';
import WebUserLogbookModal from '../components/WebUserLogbookModal';
import AdminSidebar from './admindashboard/AdminSidebar';
import AdminTopBar from './admindashboard/components/AdminTopBar';
import AssessmentsPanel from './admindashboard/components/AssessmentsPanel';
import SettingsPanel from './admindashboard/components/SettingsPanel';
import styles from './admindashboard/adminDashboardStyles';

// Tab components
import DashboardTab from './admindashboard/tabs/DashboardTab';
import ContentTab from './admindashboard/tabs/ContentTab';
import CoachesTab from './admindashboard/tabs/CoachesTab';
import UsersTab from './admindashboard/tabs/UsersTab';
import FeedbackTab from './admindashboard/tabs/FeedbackTab';
import AcademyTab from './admindashboard/tabs/AcademyTab';
import AcademiesTab from './admindashboard/tabs/AcademiesTab';

// Offerings components
import OfferingsTable from './admindashboard/components/OfferingsTable';
import OfferingDetailPanel from './admindashboard/components/OfferingDetailPanel';
import CreateOfferingModal from './admindashboard/components/CreateOfferingModal';
import EditOfferingModal from './admindashboard/components/EditOfferingModal';
import OfferingRosterModal from './admindashboard/components/OfferingRosterModal';

export default function AdminDashboard({ navigation, adminRole, sessionRole, coachId, academyId }) {
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Navigation & layout ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // ── Academy sub-tab: kept here so AdminTopBar can drive it ────────────────
  const [myAcademySubTab, setMyAcademySubTab] = useState('overview');
  const inviteCardRef = useRef(null);

  // ── Shared modal state ────────────────────────────────────────────────────
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [showProgramStructureModal, setShowProgramStructureModal] = useState(false);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [showUserLogbookModal, setShowUserLogbookModal] = useState(false);
  const [showNewAssessmentPicker, setShowNewAssessmentPicker] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedUserForLogbook, setSelectedUserForLogbook] = useState(null);

  // ── Offerings state ───────────────────────────────────────────────────────
  const [selectedOffering, setSelectedOffering] = useState(null);
  const [showCreateOfferingModal, setShowCreateOfferingModal] = useState(false);
  const [showEditOfferingModal, setShowEditOfferingModal] = useState(false);
  const [rosterRunId, setRosterRunId] = useState(null);
  const [rosterRunLabel, setRosterRunLabel] = useState('');
  const [offeringsTableKey, setOfferingsTableKey] = useState(0);

  // ── Responsive ────────────────────────────────────────────────────────────
  const isWeb = Platform.OS === 'web';
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' || screenWidth < 768;
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 80 : 280);
  const scrollBottomPadding = Math.max(insets.bottom, 16) + 32;

  const isCoachSession = sessionRole === 'coach';
  const isManagerSession = sessionRole === 'manager';
  const COACH_ALLOWED_TABS = ['dashboard', 'content', 'offerings', 'academy', 'assessments'];
  const MANAGER_ALLOWED_TABS = ['dashboard', 'content', 'offerings', 'academy', 'assessments'];

  // ── Sign-out ───────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    if (!navigation) {
      if (Platform.OS === 'web') window.alert('Navigation is not available');
      else Alert.alert('Error', 'Navigation is not available');
      return;
    }
    const doExit = () => {
      signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    };
    if (Platform.OS === 'web') { doExit(); return; }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', onPress: doExit }]);
  };

  // ── Academy TopBar callbacks ───────────────────────────────────────────────
  const handleAcademyManageMembers = () => setMyAcademySubTab('members');
  const handleAcademyInviteCoach = () => {
    setMyAcademySubTab('members');
    if (Platform.OS === 'web') {
      setTimeout(() => {
        inviteCardRef?.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  };

  // ── Tab routing ────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    if (isCoachSession && !COACH_ALLOWED_TABS.includes(tab)) return;
    if (isManagerSession && !MANAGER_ALLOWED_TABS.includes(tab)) return;
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    if (isCoachSession && !COACH_ALLOWED_TABS.includes(activeTab)) return renderDashboard();
    if (isManagerSession && !MANAGER_ALLOWED_TABS.includes(activeTab)) return renderDashboard();

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'content':
        return (
          <ContentTab
            sessionRole={sessionRole}
            academyId={academyId}
            coachId={coachId}
            isMobile={isMobile}
            user={user}
            setBannerMessage={setBannerMessage}
            onCreateProgram={() => setShowCreateProgramModal(true)}
            onCreateRoutine={() => setShowCreateRoutineModal(true)}
            onCreateExercise={() => setShowCreateExerciseModal(true)}
            onViewProgramStructure={(program) => { setSelectedProgram(program); setShowProgramStructureModal(true); }}
            onEditProgramStructure={(program) => { setSelectedProgram(program); setShowEditProgramModal(true); }}
            onEditRoutine={(routine) => { setSelectedRoutine(routine); setShowEditRoutineModal(true); }}
            onEditExercise={(exercise) => { setSelectedExercise(exercise); setShowEditExerciseModal(true); }}
          />
        );
      case 'coaches':
        return (
          <CoachesTab
            user={user}
            onEditCoach={(coach) => { setSelectedCoach(coach); setShowAddCoachModal(true); }}
          />
        );
      case 'users':
        return (
          <UsersTab
            sessionRole={sessionRole}
            coachId={coachId}
            user={user}
            onEditUser={(u) => { setSelectedUser(u); setShowAddUserModal(true); }}
            onViewUserLogbook={(u) => { setSelectedUserForLogbook(u); setShowUserLogbookModal(true); }}
          />
        );
      case 'feedback':
        return <FeedbackTab />;
      case 'analytics':
        return (
          <View style={styles.content}>
            <View style={styles.comingSoon}>
              <Ionicons name="bar-chart-outline" size={48} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>Analytics Coming Soon</Text>
              <Text style={styles.comingSoonSubtext}>Advanced analytics and reporting features</Text>
            </View>
          </View>
        );
      case 'settings':
        return <SettingsPanel sessionRole={sessionRole} academyId={academyId} />;
      case 'academy':
        return (
          <AcademyTab
            academyId={academyId}
            coachId={coachId}
            isMobile={isMobile}
            user={user}
            myAcademySubTab={myAcademySubTab}
            setMyAcademySubTab={setMyAcademySubTab}
            inviteCardRef={inviteCardRef}
          />
        );
      case 'academies':
        return <AcademiesTab isMobile={isMobile} />;
      case 'assessments':
        return (
          <AssessmentsPanel
            academyId={academyId || null}
            sessionRole={sessionRole}
            showNewTypePicker={showNewAssessmentPicker}
            setShowNewTypePicker={setShowNewAssessmentPicker}
          />
        );
      case 'offerings':
        return renderOfferings();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <DashboardTab
      sessionRole={sessionRole}
      academyId={academyId}
      coachId={coachId}
      isMobile={isMobile}
      user={user}
      onCreateProgram={() => setShowCreateProgramModal(true)}
      onCreateRoutine={() => setShowCreateRoutineModal(true)}
      onCreateExercise={() => setShowCreateExerciseModal(true)}
      onAddCoach={() => setShowAddCoachModal(true)}
    />
  );

  const renderOfferings = () => (
    <View style={{ flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
      {(!isMobile || !selectedOffering) && (
        <View style={isMobile
          ? { flex: 1 }
          : { flex: selectedOffering ? 0.55 : 1, borderRightWidth: selectedOffering ? 1 : 0, borderRightColor: '#E5E7EB' }
        }>
          <OfferingsTable
            key={offeringsTableKey}
            sessionRole={sessionRole}
            isMobile={isMobile}
            onSelectOffering={(o) => setSelectedOffering(o)}
            onCreateOffering={() => setShowCreateOfferingModal(true)}
          />
        </View>
      )}
      {selectedOffering && (
        <View style={isMobile ? { flex: 1 } : { flex: 0.45 }}>
          <OfferingDetailPanel
            key={selectedOffering.id}
            offeringId={selectedOffering.id}
            isMobile={isMobile}
            onEdit={() => setShowEditOfferingModal(true)}
            onViewRoster={(runId, runLabel) => { setRosterRunId(runId); setRosterRunLabel(runLabel); }}
            onDeleted={() => { setSelectedOffering(null); setOfferingsTableKey(k => k + 1); }}
            onClose={() => setSelectedOffering(null)}
          />
        </View>
      )}
      <CreateOfferingModal visible={showCreateOfferingModal} onClose={() => setShowCreateOfferingModal(false)} onCreated={() => setOfferingsTableKey(k => k + 1)} />
      <EditOfferingModal visible={showEditOfferingModal} offering={selectedOffering} onClose={() => setShowEditOfferingModal(false)} onSaved={() => { setOfferingsTableKey(k => k + 1); setSelectedOffering(null); }} />
      <OfferingRosterModal visible={!!rosterRunId} offeringRunId={rosterRunId} runLabel={rosterRunLabel} onClose={() => { setRosterRunId(null); setRosterRunLabel(''); }} />
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: isWeb ? 0 : insets.top }]}>
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        profile={profile}
        user={user}
        onSignOut={handleSignOut}
        mobileDrawerOpen={mobileDrawerOpen}
        onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
        sessionRole={sessionRole}
        academyId={academyId}
        isMobile={isMobile}
        styles={styles}
      />

      <View style={[styles.mainContent, !isMobile && { marginLeft: sidebarWidth }]}>
        {/* Notification banner */}
        {bannerMessage ? (
          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>{bannerMessage}</Text>
            <TouchableOpacity onPress={() => setBannerMessage('')} style={{ marginLeft: 8 }}>
              <Ionicons name="close" size={16} color="#92400E" />
            </TouchableOpacity>
          </View>
        ) : null}

        <AdminTopBar
          activeTab={activeTab}
          sidebarWidth={sidebarWidth}
          setShowCreateProgramModal={setShowCreateProgramModal}
          setShowCreateRoutineModal={setShowCreateRoutineModal}
          setShowCreateExerciseModal={setShowCreateExerciseModal}
          setShowAddCoachModal={setShowAddCoachModal}
          setShowAddUserModal={setShowAddUserModal}
          setShowNewAssessmentPicker={setShowNewAssessmentPicker}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          isMobile={isMobile}
          styles={styles}
          academyId={academyId}
          onAcademyManageMembers={handleAcademyManageMembers}
          onAcademyInviteCoach={handleAcademyInviteCoach}
        />

        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={[styles.contentScrollContent, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {renderActiveTab()}
        </ScrollView>
      </View>

      {/* ── Global modals ── */}
      <AddCoachModal
        visible={showAddCoachModal}
        onClose={() => { setShowAddCoachModal(false); setSelectedCoach(null); }}
        onSuccess={() => { setShowAddCoachModal(false); setSelectedCoach(null); }}
        coach={selectedCoach}
      />
      <AddUserModal
        visible={showAddUserModal}
        onClose={() => { setShowAddUserModal(false); setSelectedUser(null); }}
        onSuccess={() => { setShowAddUserModal(false); setSelectedUser(null); }}
        user={selectedUser}
      />
      <WebCreateProgramModal
        visible={showCreateProgramModal}
        onClose={() => setShowCreateProgramModal(false)}
        onSuccess={() => setShowCreateProgramModal(false)}
        sessionRole={sessionRole}
      />
      <WebCreateRoutineModal
        visible={showCreateRoutineModal}
        onClose={() => setShowCreateRoutineModal(false)}
        onSuccess={() => setShowCreateRoutineModal(false)}
        sessionRole={sessionRole}
      />
      <WebCreateRoutineModal
        visible={showEditRoutineModal}
        onClose={() => { setShowEditRoutineModal(false); setSelectedRoutine(null); }}
        onSuccess={() => { setShowEditRoutineModal(false); setSelectedRoutine(null); }}
        editingRoutine={selectedRoutine}
        programId={selectedRoutine?.program_id}
        sessionRole={sessionRole}
      />
      <WebCreateExerciseModal
        visible={showCreateExerciseModal}
        onClose={() => setShowCreateExerciseModal(false)}
        onSuccess={() => setShowCreateExerciseModal(false)}
        sessionRole={sessionRole}
      />
      <ProgramStructureModal
        visible={showProgramStructureModal}
        program={selectedProgram}
        onClose={() => { setShowProgramStructureModal(false); setSelectedProgram(null); }}
      />
      <EditableProgramStructureModal
        visible={showEditProgramModal}
        program={selectedProgram}
        onClose={() => { setShowEditProgramModal(false); setSelectedProgram(null); }}
        onSave={() => { setShowEditProgramModal(false); setSelectedProgram(null); }}
        sessionRole={sessionRole}
      />
      <WebCreateExerciseModal
        visible={showEditExerciseModal}
        onClose={() => { setShowEditExerciseModal(false); setSelectedExercise(null); }}
        onSuccess={() => { setShowEditExerciseModal(false); setSelectedExercise(null); }}
        editingExercise={selectedExercise}
        sessionRole={sessionRole}
      />
      <WebUserLogbookModal
        visible={showUserLogbookModal}
        user={selectedUserForLogbook}
        onClose={() => { setShowUserLogbookModal(false); setSelectedUserForLogbook(null); }}
      />
    </View>
  );
}
