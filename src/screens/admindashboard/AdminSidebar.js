import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ALL_NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',          icon: 'grid-outline' },
  { id: 'content',     label: 'Content Management', icon: 'library-outline' },
  { id: 'users',       label: 'User Management',    icon: 'people-outline' },
  { id: 'coaches',     label: 'Coach Management',   icon: 'person-outline' },
  { id: 'assessments', label: 'Assessments',        icon: 'clipboard-outline' },
  { id: 'feedback',    label: 'Feedback',            icon: 'heart-outline' },
  { id: 'analytics',   label: 'Analytics',          icon: 'analytics-outline' },
  { id: 'settings',    label: 'Settings',            icon: 'settings-outline' },
];

const COACH_NAV_IDS   = ['dashboard', 'content', 'assessments'];
const MANAGER_NAV_IDS = ['dashboard', 'content', 'academy', 'assessments'];

function SidebarContent({ sidebarCollapsed, activeTab, onChangeTab, profile, user, onExit, onToggleCollapse, isMobile, sessionRole, insets }) {
  const managerNavItem = { id: 'academy', label: 'My Academy', icon: 'school-outline' };

  let navItems;
  if (sessionRole === 'manager') {
    const base = ALL_NAV_ITEMS.filter(item => MANAGER_NAV_IDS.includes(item.id));
    // Insert Academy tab after Content
    const contentIdx = base.findIndex(i => i.id === 'content');
    navItems = [...base.slice(0, contentIdx + 1), managerNavItem, ...base.slice(contentIdx + 1)];
  } else if (sessionRole === 'coach') {
    navItems = ALL_NAV_ITEMS.filter(item => COACH_NAV_IDS.includes(item.id));
  } else {
    navItems = ALL_NAV_ITEMS;
  }

  const topPad = isMobile && insets ? insets.top : 0;
  const bottomPad = isMobile && insets ? insets.bottom : 0;

  return (
    <View style={[localStyles.sidebar, isMobile ? localStyles.sidebarMobile : { width: sidebarCollapsed ? 80 : 280 }]}>
      {/* Header — padded for status bar on mobile */}
      <View style={[localStyles.sidebarHeader, topPad > 0 && { paddingTop: topPad + 14 }]}>
        {(!sidebarCollapsed || isMobile) && (
          <View style={localStyles.logoContainer}>
            <View style={localStyles.logoIcon}>
              <Ionicons name="tennisball" size={20} color="#FFFFFF" />
            </View>
            <View style={localStyles.logoTextContainer}>
              <Text style={localStyles.logoText}>PicklePro</Text>
              <Text style={localStyles.logoSubtext}>
                {sessionRole === 'manager' ? 'Academy Dashboard'
                  : sessionRole === 'coach' ? 'Coach Dashboard'
                  : 'Admin Dashboard'}
              </Text>
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
      <ScrollView style={localStyles.navigationMenuScroll} contentContainerStyle={localStyles.navigationMenu}>
        {navItems.map(tab => (
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
      </ScrollView>

      {/* User / Exit section — padded for home indicator on mobile */}
      <View style={[localStyles.userSection, bottomPad > 0 && { paddingBottom: bottomPad + 16 }]}>
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
  sessionRole,
  isMobile = false,
  styles: _ignored, // parent passes styles but we use local ones now
}) {
  const insets = useSafeAreaInsets();

  if (isMobile) {
    return (
      <Modal
        visible={!!mobileDrawerOpen}
        transparent
        animationType="slide"
        onRequestClose={onCloseMobileDrawer}
        statusBarTranslucent
      >
        <View style={localStyles.drawerContainer}>
          <TouchableWithoutFeedback onPress={onCloseMobileDrawer}>
            <View style={localStyles.drawerOverlay} />
          </TouchableWithoutFeedback>
          <View style={localStyles.drawerSheet}>
            <SidebarContent
              sidebarCollapsed={false}
              activeTab={activeTab}
              onChangeTab={(tab) => { onChangeTab(tab); onCloseMobileDrawer(); }}
              profile={profile}
              user={user}
              onExit={onSignOut}
              onToggleCollapse={onCloseMobileDrawer}
              sessionRole={sessionRole}
              isMobile
              insets={insets}
            />
          </View>
        </View>
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
      sessionRole={sessionRole}
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
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navigationMenuScroll: {
    flex: 1,
  },
  navigationMenu: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  drawerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerSheet: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
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
