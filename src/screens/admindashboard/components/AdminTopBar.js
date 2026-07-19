import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getPageTitle = (activeTab) => {
  switch (activeTab) {
    case 'content':     return 'Content Management';
    case 'dashboard':   return 'Dashboard';
    case 'users':       return 'User Management';
    case 'coaches':     return 'Coach Management';
    case 'feedback':    return 'User Feedback';
    case 'assessments': return 'Assessments';
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
});
