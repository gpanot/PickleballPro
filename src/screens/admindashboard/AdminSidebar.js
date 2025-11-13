import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { id: 'content', label: 'Content Management', icon: 'library-outline' },
  { id: 'users', label: 'User Management', icon: 'people-outline' },
  { id: 'coaches', label: 'Coach Management', icon: 'person-outline' },
  { id: 'feedback', label: 'Feedback', icon: 'heart-outline' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' }
];

export default function AdminSidebar({
  sidebarCollapsed,
  onToggleCollapse,
  activeTab,
  onChangeTab,
  profile,
  user,
  onSignOut,
  styles
}) {
  return (
    <View style={[styles.sidebar, { width: sidebarCollapsed ? 80 : 280 }]}>
      <View style={styles.sidebarHeader}>
        {!sidebarCollapsed && (
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="tennisball" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>PicklePro</Text>
              <Text style={styles.logoSubtext}>Admin Dashboard</Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={onToggleCollapse}
        >
          <Ionicons
            name="menu"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.navigationMenu}>
        {NAV_ITEMS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.navItem,
              activeTab === tab.id && styles.activeNavItem,
              sidebarCollapsed && styles.navItemCollapsed
            ]}
            onPress={() => onChangeTab(tab.id)}
          >
            <View style={styles.navItemContent}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? '#000000' : '#6B7280'}
              />
              {!sidebarCollapsed && (
                <Text style={[styles.navItemText, activeTab === tab.id && styles.activeNavItemText]}>
                  {tab.label}
                </Text>
              )}
            </View>
            {activeTab === tab.id && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.userSection}>
        <TouchableOpacity
          style={styles.userProfile}
          onPress={onSignOut}
          activeOpacity={0.7}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <View style={styles.userAvatar} pointerEvents="none">
            <Text style={styles.userAvatarText}>
              {(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          {!sidebarCollapsed && (
            <View style={styles.userInfo} pointerEvents="none">
              <Text style={styles.userName}>{profile?.name || 'Admin'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          )}
          <Ionicons name="log-out-outline" size={20} color="#EF4444" pointerEvents="none" />
        </TouchableOpacity>
      </View>
    </View>
  );
}


