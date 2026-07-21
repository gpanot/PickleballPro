import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Users, Plus } from 'lucide-react-native';

const getPageTitle = (activeTab) => {
  switch (activeTab) {
    case 'content':     return 'Content Management';
    case 'dashboard':   return 'Dashboard';
    case 'users':       return 'User Management';
    case 'coaches':     return 'Coach Management';
    case 'academies':   return 'Academies';
    case 'feedback':    return 'User Feedback';
    case 'assessments': return 'Assessments';
    case 'academy':     return 'My Academy';
    default:            return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  }
};

export default function AdminTopBar({
  activeTab,
  sidebarWidth,
  setShowCreateProgramModal,
  setShowCreateRoutineModal,
  setShowCreateExerciseModal,
  setShowAddCoachModal,
  setShowAddUserModal,
  setShowNewAssessmentPicker,
  onOpenMobileDrawer,
  isMobile = false,
  styles: parentStyles,
  // My Academy tab callbacks
  academyId,
  onAcademyManageMembers,
  onAcademyInviteCoach,
}) {
  const pageTitle = getPageTitle(activeTab);

  return (
    <View style={[
      parentStyles.topBar,
      !isMobile && { marginLeft: sidebarWidth },
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
        {/* Hamburger — mobile only */}
        {isMobile && (
          <TouchableOpacity
            style={localStyles.hamburger}
            onPress={onOpenMobileDrawer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={24} color="#374151" />
          </TouchableOpacity>
        )}
        <View style={parentStyles.topBarLeft}>
          <Text style={[parentStyles.pageTitle, isMobile && localStyles.mobilePaneTitle]} numberOfLines={1}>
            {pageTitle}
          </Text>
        </View>
      </View>

      <View style={[parentStyles.topBarRight, isMobile && localStyles.mobileActions]}>
        {activeTab === 'content' && !isMobile && (
          <>
            <TouchableOpacity
              style={parentStyles.primaryButton}
              onPress={() => setShowCreateProgramModal(true)}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={parentStyles.primaryButtonText}>Create Program</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={parentStyles.secondaryButton}
              onPress={() => setShowCreateRoutineModal(true)}
            >
              <Ionicons name="add" size={18} color="#6B7280" />
              <Text style={parentStyles.secondaryButtonText}>Create Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={parentStyles.secondaryButton}
              onPress={() => setShowCreateExerciseModal(true)}
            >
              <Ionicons name="add" size={18} color="#6B7280" />
              <Text style={parentStyles.secondaryButtonText}>Create Exercise</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'coaches' && (
          <TouchableOpacity
            style={parentStyles.primaryButton}
            onPress={() => setShowAddCoachModal(true)}
          >
            <Ionicons name="add" size={18} color="white" />
            {!isMobile && <Text style={parentStyles.primaryButtonText}>Add Coach</Text>}
          </TouchableOpacity>
        )}

        {activeTab === 'users' && (
          <TouchableOpacity
            style={parentStyles.primaryButton}
            onPress={() => setShowAddUserModal(true)}
          >
            <Ionicons name="add" size={18} color="white" />
            {!isMobile && <Text style={parentStyles.primaryButtonText}>Add User</Text>}
          </TouchableOpacity>
        )}

        {activeTab === 'assessments' && (
          <TouchableOpacity
            style={parentStyles.primaryButton}
            onPress={() => setShowNewAssessmentPicker(v => !v)}
          >
            <Ionicons name="add" size={18} color="white" />
            {!isMobile && <Text style={parentStyles.primaryButtonText}>New template</Text>}
          </TouchableOpacity>
        )}

        {activeTab === 'academy' && !!academyId && !isMobile && (
          <>
            <TouchableOpacity
              style={localStyles.academyOutlineBtn}
              onPress={onAcademyManageMembers}
            >
              <Users size={14} color="#000000" />
              <Text style={localStyles.academyOutlineBtnText}>Manage Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.academyPrimaryBtn}
              onPress={onAcademyInviteCoach}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={localStyles.academyPrimaryBtnText}>Invite a Coach</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  hamburger: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
  },
  mobilePaneTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  mobileActions: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  academyOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  academyOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  academyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  academyPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
