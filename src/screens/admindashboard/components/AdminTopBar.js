import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getPageInfo = (activeTab) => {
  switch (activeTab) {
    case 'content':
      return {
        title: 'Content Management',
        subtitle: 'Manage training programs, exercises, and routines',
        breadcrumb: 'Content'
      };
    case 'dashboard':
      return {
        title: 'Dashboard',
        subtitle: 'Overview of your admin panel',
        breadcrumb: 'Dashboard'
      };
    case 'users':
      return {
        title: 'User Management',
        subtitle: 'Manage users and their accounts',
        breadcrumb: 'User Management'
      };
    case 'coaches':
      return {
        title: 'Coach Management',
        subtitle: 'Manage coaches and their profiles',
        breadcrumb: 'Coach Management'
      };
    case 'feedback':
      return {
        title: 'User Feedback',
        subtitle: 'View and analyze user feedback',
        breadcrumb: 'Feedback'
      };
    default:
      return {
        title: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
        subtitle: '',
        breadcrumb: activeTab
      };
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
  styles
}) {
  const pageInfo = getPageInfo(activeTab);

  return (
    <View style={[styles.topBar, { marginLeft: sidebarWidth }]}>
      <View style={styles.topBarLeft}>
        <Text style={styles.breadcrumb}>{pageInfo.breadcrumb}</Text>
        <Text style={styles.pageTitle}>{pageInfo.title}</Text>
        {pageInfo.subtitle && (
          <Text style={styles.pageSubtitle}>{pageInfo.subtitle}</Text>
        )}
      </View>
      <View style={styles.topBarRight}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={loading ? '#9CA3AF' : '#6B7280'}
            style={loading && styles.refreshSpinning}
          />
        </TouchableOpacity>

        {activeTab === 'content' && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowCreateProgramModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Create Program</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowCreateRoutineModal(true)}
            >
              <Ionicons name="add" size={20} color="#6B7280" />
              <Text style={styles.secondaryButtonText}>Create Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowCreateExerciseModal(true)}
            >
              <Ionicons name="add" size={20} color="#6B7280" />
              <Text style={styles.secondaryButtonText}>Create Exercise</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'coaches' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowAddCoachModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Add Coach</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'users' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowAddUserModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Add User</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
