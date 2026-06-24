import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = Platform.OS !== 'web' || SCREEN_WIDTH < 768;

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',         icon: 'grid-outline' },
  { id: 'content',    label: 'Content Management', icon: 'library-outline' },
  { id: 'users',      label: 'User Management',    icon: 'people-outline' },
  { id: 'coaches',    label: 'Coach Management',   icon: 'person-outline' },
  { id: 'feedback',   label: 'Feedback',           icon: 'heart-outline' },
  { id: 'analytics',  label: 'Analytics',          icon: 'analytics-outline' },
  { id: 'settings',   label: 'Settings',           icon: 'settings-outline' },
];

function SidebarContent({ sidebarCollapsed, activeTab, onChangeTab, profile, user, onExit, onToggleCollapse, isMobile }) {
  return (
    <View style={[localStyles.sidebar, isMobile ? localStyles.sidebarMobile : { width: sidebarCollapsed ? 80 : 280 }]}>
      {/* Header */}
      <View style={localStyles.sidebarHeader}>
        {(!sidebarCollapsed || isMobile) && (
          <View style={localStyles.logoContainer}>
            <View style={localStyles.logoIcon}>
              <Ionicons name="tennisball" size={20} color="#FFFFFF" />
            </View>
            <View style={localStyles.logoTextContainer}>
              <Text style={localStyles.logoText}>PicklePro</Text>
              <Text style={localStyles.logoSubtext}>Admin Dashboard</Text>
            </View>
          </View>
        )}
        {!isMobile && (
          <TouchableOpacity style={localStyles.collapseButton} onPress={onToggleCollapse}>
            <Ionicons name="menu" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        {isMobile && (
          <TouchableOpacity style={localStyles.collapseButton} onPress={onToggleCollapse}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Nav items */}
      <View style={localStyles.navigationMenu}>
        {NAV_ITEMS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              localStyles.navItem,
              activeTab === tab.id && localStyles.activeNavItem,
              !isMobile && sidebarCollapsed && localStyles.navItemCollapsed,
            ]}
            onPress={() => onChangeTab(tab.id)}
          >
            <View style={localStyles.navItemContent}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? '#000000' : '#6B7280'}
              />
              {(!sidebarCollapsed || isMobile) && (
                <Text style={[localStyles.navItemText, activeTab === tab.id && localStyles.activeNavItemText]}>
                  {tab.label}
                </Text>
              )}
            </View>
            {activeTab === tab.id && <View style={localStyles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* User / Exit section */}
      <View style={localStyles.userSection}>
        <View style={localStyles.userProfile}>
          <View style={localStyles.userAvatar}>
            <Text style={localStyles.userAvatarText}>
              {(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          {(!sidebarCollapsed || isMobile) && (
            <View style={localStyles.userInfo}>
              <Text style={localStyles.userName} numberOfLines={1}>{profile?.name || 'Admin'}</Text>
              <Text style={localStyles.userEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
          )}
        </View>

        {/* Exit button */}
        <TouchableOpacity
          style={[localStyles.exitButton, (!sidebarCollapsed || isMobile) && localStyles.exitButtonExpanded]}
          onPress={onExit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Exit admin panel"
        >
          <Ionicons name="arrow-back-outline" size={18} color="#EF4444" />
          {(!sidebarCollapsed || isMobile) && (
            <Text style={localStyles.exitButtonText}>Exit to App</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminSidebar({
  sidebarCollapsed,
  onToggleCollapse,
  activeTab,
  onChangeTab,
  profile,
  user,
  onSignOut,   // kept for back-compat, but we now call it "Exit"
  mobileDrawerOpen,
  onCloseMobileDrawer,
  styles: _ignored, // parent passes styles but we use local ones now
}) {
  const isMobile = IS_MOBILE;

  if (isMobile) {
    return (
      <Modal
        visible={!!mobileDrawerOpen}
        transparent
        animationType="slide"
        onRequestClose={onCloseMobileDrawer}
      >
        <TouchableWithoutFeedback onPress={onCloseMobileDrawer}>
          <View style={localStyles.drawerOverlay} />
        </TouchableWithoutFeedback>
        <SidebarContent
          sidebarCollapsed={false}
          activeTab={activeTab}
          onChangeTab={(tab) => { onChangeTab(tab); onCloseMobileDrawer(); }}
          profile={profile}
          user={user}
          onExit={onSignOut}
          onToggleCollapse={onCloseMobileDrawer}
          isMobile
        />
      </Modal>
    );
  }

  return (
    <SidebarContent
      sidebarCollapsed={sidebarCollapsed}
      activeTab={activeTab}
      onChangeTab={onChangeTab}
      profile={profile}
      user={user}
      onExit={onSignOut}
      onToggleCollapse={onToggleCollapse}
      isMobile={false}
    />
  );
}

const localStyles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e4e4e7',
    ...(Platform.OS === 'web' && {
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      zIndex: 1000,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
    }),
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 1001,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      position: 'fixed',
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
    }),
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    ...(Platform.OS === 'web' && {
      width: '100vw',
      height: '100vh',
    }),
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoTextContainer: { flex: 1 },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
  },
  logoSubtext: {
    fontSize: 11,
    color: '#71717a',
  },
  collapseButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  navigationMenu: {
    flex: 1,
    paddingTop: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginVertical: 1,
    borderRadius: 6,
    position: 'relative',
  },
  activeNavItem: {
    backgroundColor: '#f4f4f5',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginHorizontal: 12,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#71717a',
    marginLeft: 12,
    flex: 1,
  },
  activeNavItemText: {
    color: '#18181b',
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#18181b',
    borderRadius: 2,
  },
  userSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    gap: 8,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  userEmail: {
    fontSize: 11,
    color: '#71717a',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  exitButtonExpanded: {
    justifyContent: 'flex-start',
  },
  exitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});
