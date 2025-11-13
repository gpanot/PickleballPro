import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa', // Shadcn/UI background
    flexDirection: 'row',
  },
  
  // Sidebar Styles
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e4e4e7', // zinc-300
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Shadcn/UI shadow-md
    }),
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5', // zinc-100
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 6, // Smaller radius like Shadcn/UI
    backgroundColor: '#18181b', // zinc-900
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoTextContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600', // Shadcn/UI uses semibold
    color: '#18181b', // zinc-900
    letterSpacing: -0.025, // Tight letter spacing
  },
  logoSubtext: {
    fontSize: 12,
    color: '#71717a', // zinc-500
    fontWeight: '400',
  },
  collapseButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f4f4f5', // zinc-100
    borderWidth: 1,
    borderColor: '#e4e4e7', // zinc-300
  },
  
  // Navigation Menu
  navigationMenu: {
    flex: 1,
    paddingTop: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginVertical: 1,
    borderRadius: 6, // Smaller radius like Shadcn/UI
    position: 'relative',
    transition: 'all 0.15s ease', // Smooth transitions
  },
  activeNavItem: {
    backgroundColor: '#f4f4f5', // zinc-100
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#71717a', // zinc-500
    marginLeft: 12,
    flex: 1,
  },
  activeNavItemText: {
    color: '#18181b', // zinc-900
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  
  // User Section
  userSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    zIndex: 100,
    position: 'relative',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5', // zinc-100
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle shadow
    }),
  },
  topBarLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600', // Shadcn/UI uses semibold
    color: '#18181b', // zinc-900
    letterSpacing: -0.025,
  },
  breadcrumb: {
    fontSize: 14,
    color: '#71717a', // zinc-500
    marginTop: 2,
    fontWeight: '400',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f8fafc', // slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      '&:hover': {
        backgroundColor: '#f1f5f9', // slate-100
        borderColor: '#cbd5e1', // slate-300
      },
    }),
  },
  refreshSpinning: {
    // Animation removed - use Animated API for cross-platform animations
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa', // muted background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7', // zinc-300
    minWidth: 300,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#18181b', // zinc-900
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  
  // Content Scroll View
  contentScrollView: {
    flex: 1,
  },
  content: {
    padding: 32,
  },
  
  // Modern Stats Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 32,
  },
  modernStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    flex: 1,
    minWidth: screenWidth > 768 ? '23%' : '45%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
    }),
  },
  modernStatCardHovered: {
    ...(Platform.OS === 'web' && {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
    }),
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: screenWidth > 768 ? '23%' : '45%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    }),
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  
  // Recent Activity
  recentActivitySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderTextGroup: {
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: '600',
    color: '#1E293B',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  
  // Page Headers
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  pageHeaderLeft: {
    flex: 1,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  exerciseFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 500,
  },
  exerciseFilterWrapper: {
    position: 'relative',
    width: 220,
  },
  exerciseFilterWrapperActive: {
    zIndex: 520,
  },
  exerciseFilterDropdown: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      cursor: 'pointer',
    }),
  },
  exerciseFilterDropdownContainer: {
    position: 'absolute',
    top: 44,
    right: 232,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
    zIndex: 520,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
  },
  exerciseFilterAbsoluteDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
    zIndex: 520,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
  },
  exerciseFilterDropdownList: {
    width: '100%',
    maxHeight: 400,
    flexShrink: 1,
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  dropdownPlaceholder: {
    borderColor: '#D1D5DB',
  },
  dropdownPlaceholderText: {
    color: '#9CA3AF',
  },
  routineFilterWrapper: {
    position: 'relative',
    width: 220,
  },
  routineFilterDropdown: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      cursor: 'pointer',
    }),
  },
  routineFilterDropdownContainer: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
    zIndex: 520,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
  },
  routineFilterDropdownList: {
    width: '100%',
    maxHeight: 400,
    flexShrink: 1,
  },
  contentSectionWrapper: {
    position: 'relative',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b', // zinc-900 - Shadcn/UI primary
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    height: 36, // Consistent height
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }),
  },
  primaryButtonText: {
    color: '#fafafa', // zinc-50
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: '#a1a1aa', // zinc-400
    opacity: 0.7,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  
  // Table Styles
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    maxHeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      '&:hover': {
        backgroundColor: '#F8FAFC',
      },
    }),
  },
  tableCell: {
    paddingRight: 16,
  },
  tableCellTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  tableCellSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tableCellText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  
  // Badges and Chips
  categoryBadge: {
    backgroundColor: '#f1f5f9', // slate-100
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569', // slate-600
  },
  difficultyBadge: {
    backgroundColor: '#fef3c7', // amber-100
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#d97706', // amber-600
  },
  tierText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f1f5f9', // slate-100
  },
  publishedChip: {
    backgroundColor: '#dcfce7', // green-100
  },
  draftChip: {
    backgroundColor: '#FFFBEB',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa', // muted background
    borderWidth: 1,
    borderColor: '#e4e4e7', // zinc-300
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#E2E8F0',
      },
    }),
  },

  // Content Management Styles
  contentStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    ...(screenWidth <= 768 && {
      flexDirection: 'column',
      gap: 8,
    }),
  },
  contentStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    minHeight: 80,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  contentStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contentStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  contentStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contentStatSubtext: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  contentTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 4,
  },
  contentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  activeContentTab: {
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }),
  },
  contentTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeContentTabText: {
    color: '#000000',
    fontWeight: '600',
  },

  // Search and Filter Bar
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  // Secondary Button
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7', // zinc-300
    height: 36, // Consistent height
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }),
  },
  secondaryButtonText: {
    color: '#71717a', // zinc-500
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },

  // Content Section
  contentSection: {
    flex: 1,
  },

  // Modern Table
  modernTable: {
    backgroundColor: '#ffffff',
    borderRadius: 8, // Slightly smaller radius like Shadcn/UI
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#e4e4e7', // zinc-300
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Shadcn/UI shadow-md
    }),
  },
  modernTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fafafa', // muted background
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7', // zinc-300
  },
  modernTableHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a', // zinc-500
    textTransform: 'uppercase',
    letterSpacing: 0.05, // Tighter letter spacing
  },
  modernTableBody: {
    maxHeight: 600,
  },
  modernTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      '&:hover': {
        backgroundColor: '#FAFBFC',
      },
    }),
  },
  modernTableCell: {
    paddingRight: 16,
    justifyContent: 'center',
  },

  // Program Details
  programInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programThumbnailContainer: {
    width: screenWidth >= 768 ? 60 : 40, // Larger thumbnails for tablets
    height: screenWidth >= 768 ? 60 : 40,
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  programThumbnail: {
    width: '100%',
    height: '100%',
  },
  programThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  programMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Category Pills with Position
  categoryWithPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 20,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6, // Smaller radius like Shadcn/UI
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent', // For consistency
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Content Text
  contentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  contentSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Users Container
  usersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 6,
  },

  // Modern Status Chips
  modernStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6, // Smaller radius like Shadcn/UI
    alignSelf: 'flex-start',
  },
  publishedStatusChip: {
    backgroundColor: '#dcfce7', // green-100
  },
  draftStatusChip: {
    backgroundColor: '#f4f4f5', // zinc-100
  },
  modernStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  publishedStatusText: {
    color: '#166534', // green-800
  },
  draftStatusText: {
    color: '#71717a', // zinc-500
  },
  coachProgramChip: {
    backgroundColor: '#DBEAFE', // blue-100
  },
  studentProgramChip: {
    backgroundColor: '#F3F4F6', // gray-100
  },
  coachProgramText: {
    color: '#1E40AF', // blue-800
  },
  studentProgramText: {
    color: '#6B7280', // gray-500
  },
  sortableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 4,
  },
  noRatingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Modern Action Buttons
  modernActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernActionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#F3F4F6',
      },
    }),
  },

  // Reorder Buttons
  reorderButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  reorderButton: {
    width: 24,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#F3F4F6',
      },
    }),
  },
  reorderButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
  reorderingIndicator: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown Menu
  dropdownContainer: {
    position: 'relative',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    }),
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  dropdownItemTextDelete: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },

  // Coming Soon
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    fontWeight: '500',
  },

  // Coach Management Styles
  coachStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  coachStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: screenWidth > 768 ? '18%' : '30%',
    alignItems: 'flex-start',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  coachStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  coachStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  coachStatSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  coachDirectorySection: {
    flex: 1,
  },

  // Coach Table Styles
  coachInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  coachAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  coachAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  verifiedIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  coachDetails: {
    flex: 1,
  },
  coachName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  coachEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  coachDupr: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  specialtyTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  hourlyRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  activeStatusChip: {
    backgroundColor: '#dcfce7', // green-100
    marginBottom: 4,
  },
  inactiveStatusChip: {
    backgroundColor: '#f4f4f5', // zinc-100
    marginBottom: 4,
  },
  activeStatusText: {
    color: '#166534', // green-800
  },
  inactiveStatusText: {
    color: '#71717a', // zinc-500
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 2,
  },



  // User Management Styles
  userStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  userStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: screenWidth > 768 ? '18%' : '30%',
    alignItems: 'flex-start',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  userStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userStatSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  newUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAccountsSection: {
    flex: 1,
  },

  // User Table Styles
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  userJoined: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  duprContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duprText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  noDuprText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activityText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 1,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  onboardedBadge: {
    backgroundColor: '#ECFDF5',
  },
  incompleteBadge: {
    backgroundColor: '#FFFBEB',
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  goalText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  lastActivityText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Skills Column Styles
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  skillEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreSkillsText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  noSkillsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Feedback Management Styles
  feedbackStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  feedbackStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: screenWidth > 768 ? '22%' : '45%',
    alignItems: 'flex-start',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  feedbackStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  feedbackStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  feedbackStatSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  feedbackSection: {
    flex: 1,
  },
  feedbackUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  feedbackUserEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedbackOptionsContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  feedbackOptionTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  feedbackOptionText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreOptionsText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  feedbackText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  feedbackDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  feedbackTime: {
    fontSize: 11,
    color: '#6B7280',
  },

  // Exercise Table Styles
  exerciseInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  exerciseDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 4,
  },
  exerciseGoal: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  difficultyContainer: {
    alignItems: 'flex-start',
  },
  difficultyStars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  exerciseCategoriesContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  exerciseCategoryTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  exerciseCategoryText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  noCategoryText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  moreCategoriesText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  exerciseTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  userCreatedBadge: {
    backgroundColor: '#ECFDF5',
  },
  defaultBadge: {
    backgroundColor: '#F3F4F6',
  },
  exerciseTypeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  userCreatedText: {
    color: '#10B981',
  },
  defaultText: {
    color: '#6B7280',
  },

  // DUPR Range Styles
  duprRangeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  duprRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  noDuprRangeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  exerciseProgramContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  programNameText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  moreProgramsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noProgramText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  exerciseRoutineContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  routineNameText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  moreRoutinesText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noRoutineText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Dashboard Styles
  dashboardQuickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dashboardPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  dashboardPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dashboardSecondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  dashboardSecondaryActionText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dashboardRefreshAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  dashboardRefreshActionText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Dashboard Stats Grid
  dashboardStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  dashboardStatCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    flex: 1,
    minWidth: screenWidth > 768 ? '22%' : '45%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  dashboardStatHeader: {
    marginBottom: 16,
  },
  dashboardStatNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dashboardStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dashboardStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashboardTrendBadge: {
    backgroundColor: '#f4f4f5', // zinc-100
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6, // Smaller radius
  },
  dashboardTrendSuccess: {
    backgroundColor: '#dcfce7', // green-100
  },
  dashboardTrendWarning: {
    backgroundColor: '#fef3c7', // amber-100
  },
  dashboardTrendPrimary: {
    backgroundColor: '#dbeafe', // blue-100
  },
  dashboardTrendText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717a', // zinc-500
  },
  dashboardTrendSuccessText: {
    color: '#166534', // green-800
  },
  dashboardTrendWarningText: {
    color: '#d97706', // amber-600
  },
  dashboardTrendPrimaryText: {
    color: '#1d4ed8', // blue-700
  },
  dashboardStatSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'right',
  },

  // Dashboard Main Grid
  dashboardMainGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
    ...(screenWidth <= 768 && {
      flexDirection: 'column',
    }),
  },

  // Activity Card
  dashboardActivityCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    flex: 1,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  dashboardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  dashboardCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  dashboardActivityList: {
    gap: 16,
  },
  dashboardActivityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dashboardActivityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F2937',
    marginTop: 6,
    marginRight: 12,
  },
  dashboardActivityContent: {
    flex: 1,
  },
  dashboardActivityText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  dashboardActivityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Programs Card
  dashboardProgramsCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    flex: 1,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  dashboardProgramsList: {
    gap: 20,
  },
  dashboardProgramItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashboardProgramInfo: {
    flex: 1,
    marginRight: 16,
  },
  dashboardProgramName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dashboardProgramUsers: {
    fontSize: 12,
    color: '#6B7280',
  },
  dashboardProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  dashboardProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  dashboardProgressFill: {
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 3,
  },
  dashboardProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 32,
    textAlign: 'right',
  },

  // Status Grid
  dashboardStatusGrid: {
    flexDirection: 'row',
    gap: 20,
    ...(screenWidth <= 768 && {
      flexDirection: 'column',
    }),
  },
  dashboardStatusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }),
  },
  dashboardStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dashboardStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  dashboardStatusSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  dashboardStorageBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dashboardStorageFill: {
    height: '100%',
    backgroundColor: '#6B7280',
    borderRadius: 4,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routineMeta: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },

  // Delete Modal Styles
  deleteModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    }),
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Category Table Styles
  categoryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  programCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Category Edit Styles
  categoryEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  categoryEditInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  categoryEditButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryEditSaveButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#059669',
      },
    }),
  },
  categoryEditCancelButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#E5E7EB',
      },
    }),
  },
  editingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default styles;
