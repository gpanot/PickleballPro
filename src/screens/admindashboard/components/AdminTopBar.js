import React from 'react';
import { View, Text, TouchableOpacity, Platform, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = Platform.OS !== 'web' || SCREEN_WIDTH < 768;

const getPageInfo = (activeTab) => {
  switch (activeTab) {
    case 'content':   return { title: 'Content Management', subtitle: 'Manage training programs, exercises, and routines' };
    case 'dashboard': return { title: 'Dashboard',          subtitle: 'Overview of your admin panel' };
    case 'users':     return { title: 'User Management',    subtitle: 'Manage users and their accounts' };
    case 'coaches':   return { title: 'Coach Management',   subtitle: 'Manage coaches and their profiles' };
    case 'feedback':  return { title: 'User Feedback',      subtitle: 'View and analyze user feedback' };
    default:          return { title: activeTab.charAt(0).toUpperCase() + activeTab.slice(1), subtitle: '' };
  }
};

export default function AdminTopBar({
  activeTab,
  sidebarWidth,
  loading,
  handleRefresh,
  setShowCreateProgramModal,
  setShowCreateRoutineModal,
  setShowCreateExerciseModal,
  setShowAddCoachModal,
  setShowAddUserModal,
  onOpenMobileDrawer,
  styles: parentStyles,
}) {
  const pageInfo = getPageInfo(activeTab);
  const isMobile = IS_MOBILE;

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
          {!isMobile && <Text style={parentStyles.breadcrumb}>{pageInfo.title}</Text>}
          <Text style={[parentStyles.pageTitle, isMobile && localStyles.mobilePaneTitle]} numberOfLines={1}>
            {pageInfo.title}
          </Text>
          {!isMobile && pageInfo.subtitle ? (
            <Text style={parentStyles.pageSubtitle}>{pageInfo.subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={[parentStyles.topBarRight, isMobile && localStyles.mobileActions]}>
        <TouchableOpacity
          style={parentStyles.refreshButton}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={loading ? '#9CA3AF' : '#6B7280'}
            style={loading && parentStyles.refreshSpinning}
          />
        </TouchableOpacity>

        {activeTab === 'content' && (
          <>
            <TouchableOpacity
              style={parentStyles.primaryButton}
              onPress={() => setShowCreateProgramModal(true)}
            >
              <Ionicons name="add" size={18} color="white" />
              {!isMobile && <Text style={parentStyles.primaryButtonText}>Create Program</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={parentStyles.secondaryButton}
              onPress={() => setShowCreateRoutineModal(true)}
            >
              <Ionicons name="add" size={18} color="#6B7280" />
              {!isMobile && <Text style={parentStyles.secondaryButtonText}>Create Routine</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={parentStyles.secondaryButton}
              onPress={() => setShowCreateExerciseModal(true)}
            >
              <Ionicons name="add" size={18} color="#6B7280" />
              {!isMobile && <Text style={parentStyles.secondaryButtonText}>Create Exercise</Text>}
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
    gap: 8,
  },
});
