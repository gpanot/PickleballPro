import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AddCoachModal from '../components/AddCoachModal';
import AddUserModal from '../components/AddUserModal';
import WebCreateProgramModal from '../components/WebCreateProgramModal';
import WebCreateRoutineModal from '../components/WebCreateRoutineModal';
import WebCreateExerciseModal from '../components/WebCreateExerciseModal';
import ProgramStructureModal from '../components/ProgramStructureModal';
import EditableProgramStructureModal from '../components/EditableProgramStructureModal';
import WebUserLogbookModal from '../components/WebUserLogbookModal';
import skillsData from '../data/Commun_skills_tags.json';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to get skill names from focus area IDs
const getSkillNamesFromFocusAreas = (focusAreas) => {
  if (!focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) {
    return [];
  }

  const allSkills = [];
  
  // Collect all skills from all categories
  Object.values(skillsData.skillCategories).forEach(category => {
    allSkills.push(...category.skills);
  });

  // Map focus area IDs to skill objects
  return focusAreas
    .map(focusAreaId => allSkills.find(skill => skill.id === focusAreaId))
    .filter(Boolean); // Remove any undefined values
};

// Helper function to format skills for display
const formatSkillsDisplay = (skills) => {
  if (!skills || skills.length === 0) {
    return 'Not set';
  }

  return skills.map(skill => `${skill.emoji} ${skill.name}`).join(', ');
};

export default function AdminDashboard({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contentTab, setContentTab] = useState('programs'); // For Content Management sub-tabs
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [programs, setPrograms] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Dashboard-specific data
  const [recentActivity, setRecentActivity] = useState([]);
  const [popularPrograms, setPopularPrograms] = useState([]);
  const [publishedStats, setPublishedStats] = useState({});
  const [coachStats, setCoachStats] = useState({});
  
  // UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [reorderingProgramId, setReorderingProgramId] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [showProgramStructureModal, setShowProgramStructureModal] = useState(false);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalType, setModalType] = useState(''); // 'program', 'routine', 'exercise'
  const [hasUnsavedCategoryChanges, setHasUnsavedCategoryChanges] = useState(false);
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showDeleteExerciseConfirmation, setShowDeleteExerciseConfirmation] = useState(false);
  const [showUserLogbookModal, setShowUserLogbookModal] = useState(false);
  const [selectedUserForLogbook, setSelectedUserForLogbook] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  

  // Web responsiveness
  const isWeb = Platform.OS === 'web';
  const sidebarWidth = sidebarCollapsed ? 80 : 280;

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'content') {
      if (contentTab === 'programs') {
        fetchPrograms();
      } else if (contentTab === 'routines') {
        fetchRoutines();
      } else if (contentTab === 'exercises') {
        fetchExercises();
      } else if (contentTab === 'categories') {
        fetchCategories();
      }
    } else if (activeTab === 'coaches') {
      fetchCoaches();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab, contentTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [programsRes, exercisesRes, coachesRes, usersRes, publishedProgramsRes] = await Promise.all([
        supabase.from('programs').select('id', { count: 'exact' }),
        supabase.from('exercises').select('id', { count: 'exact' }),
        supabase.from('coaches').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('programs').select('id', { count: 'exact' }).eq('is_published', true)
      ]);

      setStats({
        programs: programsRes.count || 0,
        exercises: exercisesRes.count || 0,
        coaches: coachesRes.count || 0,
        users: usersRes.count || 0
      });

      setPublishedStats({
        published_programs: publishedProgramsRes.count || 0
      });

      // Fetch dashboard-specific data
      await Promise.all([
        fetchRecentActivity(),
        fetchPopularPrograms()
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      // Initialize program order if needed (only runs once if all programs have order_index = 0)
      await initializeProgramOrder();
      
      // Normalize order indices to ensure sequential ordering
      await normalizeOrderIndices();
      
      // Fetch programs with routine and exercise counts
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;

      // For each program, fetch the count of routines and exercises
      const programsWithCounts = await Promise.all(
        (programsData || []).map(async (program) => {
          // Get routine count for this program
          const { count: routineCount, error: routineError } = await supabase
            .from('routines')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id);

          if (routineError) {
            console.error('Error fetching routine count:', routineError);
          }

          // Get exercise count through routine_exercises for this program's routines
          const { data: routineIds, error: routineIdsError } = await supabase
            .from('routines')
            .select('id')
            .eq('program_id', program.id);

          let exerciseCount = 0;
          if (!routineIdsError && routineIds && routineIds.length > 0) {
            const routineIdsList = routineIds.map(r => r.id);
            const { count: exerciseCountResult, error: exerciseError } = await supabase
              .from('routine_exercises')
              .select('*', { count: 'exact', head: true })
              .in('routine_id', routineIdsList);

            if (!exerciseError) {
              exerciseCount = exerciseCountResult || 0;
            }
          }

          return {
            ...program,
            routine_count: routineCount || 0,
            exercise_count: exerciseCount
          };
        })
      );

      setPrograms(programsWithCounts);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramDetails = async (programId) => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          routines (
            *,
            routine_exercises (
              order_index,
              custom_target_value,
              exercises (*)
            )
          )
        `)
        .eq('id', programId)
        .single();

      if (error) throw error;
      
      // Transform the data to match the expected structure
      const transformedProgram = {
        ...data,
        routines: data.routines
          .sort((a, b) => a.order_index - b.order_index)
          .map(routine => ({
            ...routine,
            exercises: routine.routine_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map(re => ({
                id: re.exercises.code,
                name: re.exercises.title,
                target: `${re.custom_target_value || re.exercises.target_value} ${re.exercises.target_unit}`,
                difficulty: re.exercises.difficulty,
                description: re.exercises.description,
                order_index: re.order_index
              }))
          }))
      };

      return transformedProgram;
    } catch (error) {
      console.error('Error fetching program details:', error);
      Alert.alert('Error', 'Failed to fetch program details');
      return null;
    }
  };

  const handleViewProgramStructure = async (program) => {
    const programDetails = await fetchProgramDetails(program.id);
    if (programDetails) {
      setSelectedProgram(programDetails);
      setShowProgramStructureModal(true);
    }
  };

  const handleEditProgramStructure = async (program) => {
    const programDetails = await fetchProgramDetails(program.id);
    if (programDetails) {
      setSelectedProgram(programDetails);
      setShowEditProgramModal(true);
    }
  };

  const handleProgramSaved = () => {
    // Refresh programs list after saving
    fetchPrograms();
  };

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          *,
          programs(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      Alert.alert('Error', 'Failed to fetch routines');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          users:created_by(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Increase limit to show more exercises

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoaches(data || []);

      // Calculate coach stats
      if (data) {
        const totalCoaches = data.length;
        const verifiedCoaches = data.filter(coach => coach.is_verified).length;
        const activeCoaches = data.filter(coach => coach.is_active).length;
        const ratingsSum = data.reduce((sum, coach) => sum + (coach.rating_avg || 0), 0);
        const avgRating = totalCoaches > 0 ? (ratingsSum / totalCoaches).toFixed(1) : 0;

        setCoachStats({
          total: totalCoaches,
          verified: verifiedCoaches,
          active: activeCoaches,
          avgRating: avgRating
        });
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      Alert.alert('Error', 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          email, 
          avatar_url,
          created_at, 
          updated_at, 
          is_active,
          tier,
          dupr_rating,
          goal,
          onboarding_completed,
          time_commitment,
          focus_areas,
          rating_type
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          id,
          rating,
          selected_options,
          what_you_like,
          what_to_add,
          app_version,
          platform,
          created_at,
          updated_at,
          users (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Alert.alert('Error', 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Get distinct categories from programs
      const { data, error } = await supabase
        .from('programs')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      
      // Try to get saved category order from database
      let savedOrder = null;
      try {
        const { data: orderData, error: orderError } = await supabase
          .rpc('get_category_order');
        
        if (orderError) {
          console.log('📋 No saved category order found or RPC not available:', orderError.message);
        } else {
          savedOrder = orderData;
          console.log('📋 Loaded saved category order:', savedOrder);
        }
      } catch (orderError) {
        console.log('📋 Could not load saved category order:', orderError.message);
      }
      
      // Create category objects
      let categoryObjects;
      
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        // Use saved order
        console.log('📋 Using saved category order');
        categoryObjects = savedOrder
          .filter(savedCat => uniqueCategories.includes(savedCat.name)) // Only include existing categories
          .map((savedCat, index) => ({
            id: savedCat.name.toLowerCase().replace(/\s+/g, '_'),
            name: savedCat.name,
            order_index: index,
            created_at: new Date().toISOString()
          }));
        
        // Add any new categories that weren't in saved order
        const savedCategoryNames = savedOrder.map(sc => sc.name);
        const newCategories = uniqueCategories
          .filter(cat => !savedCategoryNames.includes(cat))
          .map((category, index) => ({
            id: category.toLowerCase().replace(/\s+/g, '_'),
            name: category,
            order_index: categoryObjects.length + index,
            created_at: new Date().toISOString()
          }));
        
        categoryObjects = [...categoryObjects, ...newCategories];
      } else {
        // Use default alphabetical order
        console.log('📋 Using default alphabetical order');
        categoryObjects = uniqueCategories.map((category, index) => ({
          id: category.toLowerCase().replace(/\s+/g, '_'),
          name: category,
          order_index: index,
          created_at: new Date().toISOString()
        }));
        
        // Sort by name for default order
        categoryObjects.sort((a, b) => a.name.localeCompare(b.name));
        
        // Update order_index after sorting
        categoryObjects.forEach((cat, index) => {
          cat.order_index = index;
        });
      }

      setCategories(categoryObjects);
      setHasUnsavedCategoryChanges(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent users (last 5)
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recently published programs (last 2)
      const { data: recentPrograms, error: programsError } = await supabase
        .from('programs')
        .select('name, created_at, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(2);

      // Get recent coach updates (last 2)
      const { data: recentCoaches, error: coachesError } = await supabase
        .from('coaches')
        .select('name, updated_at')
        .order('updated_at', { ascending: false })
        .limit(2);

      const activities = [];

      // Add user registrations
      if (recentUsers && !usersError) {
        recentUsers.forEach(user => {
          const timeAgo = getTimeAgo(user.created_at);
          activities.push({
            text: `New user registration: ${user.name || user.email}`,
            time: timeAgo,
            type: 'user',
            timestamp: new Date(user.created_at)
          });
        });
      }

      // Add program updates
      if (recentPrograms && !programsError) {
        recentPrograms.forEach(program => {
          const timeAgo = getTimeAgo(program.updated_at);
          activities.push({
            text: `Program "${program.name}" published`,
            time: timeAgo,
            type: 'program',
            timestamp: new Date(program.updated_at)
          });
        });
      }

      // Add coach updates
      if (recentCoaches && !coachesError) {
        recentCoaches.forEach(coach => {
          const timeAgo = getTimeAgo(coach.updated_at);
          activities.push({
            text: `Coach profile updated: ${coach.name}`,
            time: timeAgo,
            type: 'coach',
            timestamp: new Date(coach.updated_at)
          });
        });
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => b.timestamp - a.timestamp);
      
      // Take only the 5 most recent
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Fallback to empty array if error
      setRecentActivity([]);
    }
  };

  const fetchPopularPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, added_count, rating')
        .eq('is_published', true)
        .order('added_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Transform the data to match the expected format
      const programsWithProgress = (data || []).map(program => ({
        name: program.name,
        users: program.added_count || 0,
        progress: Math.min(Math.round((program.rating || 0) * 20), 100) // Convert rating (0-5) to percentage
      }));

      setPopularPrograms(programsWithProgress);
    } catch (error) {
      console.error('Error fetching popular programs:', error);
      // Fallback to empty array if error
      setPopularPrograms([]);
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const togglePublishStatus = async (type, id, currentStatus) => {
    try {
      const { error } = await supabase
        .from(type === 'program' ? 'programs' : 'exercises')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      if (type === 'program') {
        fetchPrograms();
      } else {
        fetchExercises();
      }

      Alert.alert('Success', `${type} ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating publish status:', error);
      Alert.alert('Error', 'Failed to update publish status');
    }
  };

  const renderSidebar = () => (
    <View style={[styles.sidebar, { width: sidebarWidth }]}>
      {/* Logo and Header */}
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
          onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Ionicons 
            name="menu" 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Menu */}
      <View style={styles.navigationMenu}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
          { id: 'content', label: 'Content Management', icon: 'library-outline' },
          { id: 'users', label: 'User Management', icon: 'people-outline' },
          { id: 'coaches', label: 'Coach Management', icon: 'person-outline' },
          { id: 'feedback', label: 'Feedback', icon: 'heart-outline' },
          { id: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
          { id: 'settings', label: 'Settings', icon: 'settings-outline' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.navItem, 
              activeTab === tab.id && styles.activeNavItem,
              sidebarCollapsed && styles.navItemCollapsed
            ]}
            onPress={() => setActiveTab(tab.id)}
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

      {/* User Section */}
      <View style={styles.userSection}>
        <TouchableOpacity style={styles.userProfile} onPress={handleSignOut}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          {!sidebarCollapsed && (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.name || 'Admin'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          )}
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTopBar = () => {
    const getPageInfo = () => {
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

    const pageInfo = getPageInfo();

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
          {/* Refresh Button - Always visible */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={loading ? "#9CA3AF" : "#6B7280"} 
              style={loading && styles.refreshSpinning}
            />
          </TouchableOpacity>

          {/* Tab-specific buttons */}
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
  };

  const renderOverview = () => (
    <View style={styles.content}>
      {/* Quick Action Buttons */}
      <View style={styles.dashboardQuickActions}>
        <TouchableOpacity 
          style={styles.dashboardRefreshAction}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={loading ? "#9CA3AF" : "#3B82F6"}
          />
          <Text style={[styles.dashboardRefreshActionText, loading && { color: "#9CA3AF" }]}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardPrimaryAction}
          onPress={() => setShowCreateProgramModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.dashboardPrimaryActionText}>Add Program</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardSecondaryAction}
          onPress={() => setShowCreateRoutineModal(true)}
        >
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text style={styles.dashboardSecondaryActionText}>Add Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardSecondaryAction}
          onPress={() => setShowCreateExerciseModal(true)}
        >
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text style={styles.dashboardSecondaryActionText}>Add Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardSecondaryAction}
          onPress={() => setShowAddCoachModal(true)}
        >
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text style={styles.dashboardSecondaryActionText}>Add Coach</Text>
        </TouchableOpacity>
      </View>

      {/* Main Stats Cards */}
      <View style={styles.dashboardStatsGrid}>
        <View style={styles.dashboardStatCard}>
          <View style={styles.dashboardStatHeader}>
            <Ionicons name="people-outline" size={24} color="#6B7280" />
          </View>
          <Text style={styles.dashboardStatNumber}>{loading ? '—' : stats.users?.toLocaleString() || '0'}</Text>
          <Text style={styles.dashboardStatLabel}>Total Users</Text>
          <View style={styles.dashboardStatTrend}>
            <View style={styles.dashboardTrendBadge}>
              <Text style={styles.dashboardTrendText}>—</Text>
            </View>
            <Text style={styles.dashboardStatSubtext}>Registered users</Text>
          </View>
        </View>

        <View style={styles.dashboardStatCard}>
          <View style={styles.dashboardStatHeader}>
            <Ionicons name="library-outline" size={24} color="#6B7280" />
          </View>
          <Text style={styles.dashboardStatNumber}>{loading ? '—' : publishedStats.published_programs?.toLocaleString() || '0'}</Text>
          <Text style={styles.dashboardStatLabel}>Published Programs</Text>
          <View style={styles.dashboardStatTrend}>
            <View style={[styles.dashboardTrendBadge, styles.dashboardTrendSuccess]}>
              <Text style={[styles.dashboardTrendText, styles.dashboardTrendSuccessText]}>Live</Text>
            </View>
            <Text style={styles.dashboardStatSubtext}>Available training programs</Text>
          </View>
        </View>

        <View style={styles.dashboardStatCard}>
          <View style={styles.dashboardStatHeader}>
            <Ionicons name="fitness-outline" size={24} color="#6B7280" />
          </View>
          <Text style={styles.dashboardStatNumber}>{loading ? '—' : stats.exercises?.toLocaleString() || '0'}</Text>
          <Text style={styles.dashboardStatLabel}>Exercise Library</Text>
          <View style={styles.dashboardStatTrend}>
            <View style={[styles.dashboardTrendBadge, styles.dashboardTrendWarning]}>
              <Text style={[styles.dashboardTrendText, styles.dashboardTrendWarningText]}>Total</Text>
            </View>
            <Text style={styles.dashboardStatSubtext}>Total exercises available</Text>
          </View>
        </View>

        <View style={styles.dashboardStatCard}>
          <View style={styles.dashboardStatHeader}>
            <Ionicons name="people-circle-outline" size={24} color="#6B7280" />
          </View>
          <Text style={styles.dashboardStatNumber}>{loading ? '—' : stats.coaches?.toLocaleString() || '0'}</Text>
          <Text style={styles.dashboardStatLabel}>Total Coaches</Text>
          <View style={styles.dashboardStatTrend}>
            <View style={[styles.dashboardTrendBadge, styles.dashboardTrendPrimary]}>
              <Text style={[styles.dashboardTrendText, styles.dashboardTrendPrimaryText]}>All</Text>
            </View>
            <Text style={styles.dashboardStatSubtext}>Coach profiles</Text>
          </View>
        </View>
      </View>

      {/* Main Content Grid */}
      <View style={styles.dashboardMainGrid}>
        {/* Recent Activity */}
        <View style={styles.dashboardActivityCard}>
          <View style={styles.dashboardCardHeader}>
            <Ionicons name="pulse" size={20} color="#1F2937" />
            <Text style={styles.dashboardCardTitle}>Recent Activity</Text>
          </View>
          <Text style={styles.dashboardCardSubtitle}>Latest updates across the platform</Text>
          
          <View style={styles.dashboardActivityList}>
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <View key={index} style={styles.dashboardActivityItem}>
                <View style={styles.dashboardActivityDot} />
                <View style={styles.dashboardActivityContent}>
                  <Text style={styles.dashboardActivityText}>{activity.text}</Text>
                  <Text style={styles.dashboardActivityTime}>{activity.time}</Text>
                </View>
              </View>
            )) : (
              <View style={styles.dashboardActivityItem}>
                <View style={styles.dashboardActivityDot} />
                <View style={styles.dashboardActivityContent}>
                  <Text style={styles.dashboardActivityText}>
                    {loading ? 'Loading recent activity...' : 'No recent activity found'}
                  </Text>
                  <Text style={styles.dashboardActivityTime}>—</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Popular Programs */}
        <View style={styles.dashboardProgramsCard}>
          <View style={styles.dashboardCardHeader}>
            <Ionicons name="trending-up" size={20} color="#1F2937" />
            <Text style={styles.dashboardCardTitle}>Popular Programs</Text>
          </View>
          <Text style={styles.dashboardCardSubtitle}>Most enrolled training programs</Text>
          
          <View style={styles.dashboardProgramsList}>
            {popularPrograms.length > 0 ? popularPrograms.map((program, index) => (
              <View key={index} style={styles.dashboardProgramItem}>
                <View style={styles.dashboardProgramInfo}>
                  <Text style={styles.dashboardProgramName}>{program.name}</Text>
                  <Text style={styles.dashboardProgramUsers}>{program.users} user{program.users !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.dashboardProgressContainer}>
                  <View style={styles.dashboardProgressBar}>
                    <View style={[styles.dashboardProgressFill, { width: `${program.progress}%` }]} />
                  </View>
                  <Text style={styles.dashboardProgressText}>{program.progress}%</Text>
                </View>
              </View>
            )) : (
              <View style={styles.dashboardProgramItem}>
                <View style={styles.dashboardProgramInfo}>
                  <Text style={styles.dashboardProgramName}>
                    {loading ? 'Loading programs...' : 'No programs found'}
                  </Text>
                  <Text style={styles.dashboardProgramUsers}>—</Text>
                </View>
                <View style={styles.dashboardProgressContainer}>
                  <View style={styles.dashboardProgressBar}>
                    <View style={[styles.dashboardProgressFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.dashboardProgressText}>—</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.dashboardStatusGrid}>
        <View style={styles.dashboardStatusCard}>
          <Text style={styles.dashboardStatusTitle}>API Status</Text>
          <View style={styles.dashboardStatusIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.dashboardStatusText}>All systems operational</Text>
          </View>
          <Text style={styles.dashboardStatusSubtext}>Last checked: 2 minutes ago</Text>
        </View>

        <View style={styles.dashboardStatusCard}>
          <Text style={styles.dashboardStatusTitle}>Database Performance</Text>
          <View style={styles.dashboardStatusIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.dashboardStatusText}>125ms avg response</Text>
          </View>
          <Text style={styles.dashboardStatusSubtext}>Excellent performance</Text>
        </View>

        <View style={styles.dashboardStatusCard}>
          <Text style={styles.dashboardStatusTitle}>Storage Usage</Text>
          <View style={styles.dashboardStorageBar}>
            <View style={[styles.dashboardStorageFill, { width: '35%' }]} />
          </View>
          <Text style={styles.dashboardStatusSubtext}>2.1 GB of 6.0 GB used</Text>
        </View>
      </View>
    </View>
  );

  const renderContentManagement = () => (
    <View style={styles.content}>
      {/* Content Stats */}
      <View style={styles.contentStatsGrid}>
        <View style={styles.contentStatCard}>
          <View style={styles.contentStatIcon}>
            <Ionicons name="library-outline" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.contentStatNumber}>{loading ? '—' : programs.length.toLocaleString()}</Text>
          <Text style={styles.contentStatLabel}>Programs</Text>
          <Text style={styles.contentStatSubtext}>
            {loading ? '—' : programs.filter(p => p.is_published).length} published
          </Text>
        </View>
        <View style={styles.contentStatCard}>
          <View style={styles.contentStatIcon}>
            <Ionicons name="play-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.contentStatNumber}>{loading ? '—' : routines.length.toLocaleString()}</Text>
          <Text style={styles.contentStatLabel}>Routines</Text>
          <Text style={styles.contentStatSubtext}>
            {loading ? '—' : routines.filter(r => r.is_published).length} published
          </Text>
        </View>
        <View style={styles.contentStatCard}>
          <View style={styles.contentStatIcon}>
            <Ionicons name="fitness-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.contentStatNumber}>{loading ? '—' : exercises.length.toLocaleString()}</Text>
          <Text style={styles.contentStatLabel}>Exercises</Text>
          <Text style={styles.contentStatSubtext}>
            {loading ? '—' : exercises.filter(e => e.is_published).length} published
          </Text>
        </View>
      </View>

      {/* Content Tabs */}
      <View style={styles.contentTabs}>
        {[
          { id: 'programs', label: 'Programs', icon: 'library-outline' },
          { id: 'exercises', label: 'Exercises', icon: 'fitness-outline' },
          { id: 'routines', label: 'Routines', icon: 'play-outline' },
          { id: 'categories', label: 'Category Order', icon: 'reorder-three-outline' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.contentTab, contentTab === tab.id && styles.activeContentTab]}
            onPress={() => setContentTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={contentTab === tab.id ? '#000000' : '#6B7280'} 
            />
            <Text style={[styles.contentTabText, contentTab === tab.id && styles.activeContentTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${contentTab}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="funnel-outline" size={20} color="#6B7280" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {contentTab === 'programs' ? renderProgramsTable() : 
       contentTab === 'exercises' ? renderExercisesTable() : 
       contentTab === 'routines' ? renderRoutinesTable() :
       renderCategoriesTable()}
    </View>
  );

  const renderProgramsTable = () => {
    const filteredPrograms = programs.filter(program => 
      program.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Training Programs</Text>
          <Text style={styles.sectionSubtitle}>Manage and organize training programs</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading programs...</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Program</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Category</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Tier</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Content</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Users</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Rating</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 0.8 }]}>Order</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            <ScrollView style={styles.modernTableBody}>
              {filteredPrograms.length > 0 ? filteredPrograms.map(program => (
                <View key={program.id} style={styles.modernTableRow}>
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <View style={styles.programInfoContainer}>
                      <View style={styles.programThumbnailContainer}>
                        {program.thumbnail_url ? (
                          <Image 
                            source={{ uri: program.thumbnail_url }} 
                            style={styles.programThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.programThumbnailPlaceholder}>
                            <Ionicons name="image-outline" size={16} color="#9CA3AF" />
                          </View>
                        )}
                      </View>
                      <View style={styles.programInfo}>
                        <Text style={styles.programTitle}>{program.name}</Text>
                        <Text style={styles.programMeta}>Created {new Date(program.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                    <View style={styles.categoryWithPosition}>
                      <Text style={styles.positionNumber}>
                        ({filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) + 1})
                      </Text>
                      <View style={[styles.categoryPill, { 
                        backgroundColor: program.category === 'Fundamentals' ? '#F0F9FF' : '#F8F4FF'
                      }]}>
                        <Text style={[styles.categoryPillText, {
                          color: program.category === 'Fundamentals' ? '#0369A1' : '#7C3AED'
                        }]}>{program.category}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.tierText}>{program.tier || 'Beginner'}</Text>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                    <Text style={styles.contentText}>
                      {program.routine_count || 0} routine{program.routine_count !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.contentSubtext}>
                      {program.exercise_count || 0} exercise{program.exercise_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.usersContainer}>
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text style={styles.usersText}>{program.added_count || 0}</Text>
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={[styles.modernStatusChip, 
                      program.is_published ? styles.publishedStatusChip : styles.draftStatusChip
                    ]}>
                      <Text style={[styles.modernStatusText,
                        program.is_published ? styles.publishedStatusText : styles.draftStatusText
                      ]}>{program.is_published ? 'Published' : 'Draft'}</Text>
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    {program.rating ? (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.ratingText}>{program.rating}</Text>
                      </View>
                    ) : (
                      <Text style={styles.noRatingText}>—</Text>
                    )}
                  </View>
                  <View style={[styles.modernTableCell, { flex: 0.8 }]}>
                    <View style={styles.reorderButtons}>
                      {reorderingProgramId === program.id ? (
                        <View style={styles.reorderingIndicator}>
                          <ActivityIndicator size="small" color="#6B7280" />
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={[
                              styles.reorderButton, 
                              filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 0 && styles.reorderButtonDisabled
                            ]}
                            onPress={() => reorderProgram(program.id, 'up')}
                            disabled={
                              reorderingProgramId !== null || 
                              filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 0
                            }
                          >
                            <Ionicons 
                              name="chevron-up" 
                              size={14} 
                              color={
                                filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 0 
                                  ? "#D1D5DB" 
                                  : "#6B7280"
                              } 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[
                              styles.reorderButton, 
                              filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 
                              filteredPrograms.filter(p => p.category === program.category).length - 1 && styles.reorderButtonDisabled
                            ]}
                            onPress={() => reorderProgram(program.id, 'down')}
                            disabled={
                              reorderingProgramId !== null || 
                              filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 
                              filteredPrograms.filter(p => p.category === program.category).length - 1
                            }
                          >
                            <Ionicons 
                              name="chevron-down" 
                              size={14} 
                              color={
                                filteredPrograms.filter(p => p.category === program.category).findIndex(p => p.id === program.id) === 
                                filteredPrograms.filter(p => p.category === program.category).length - 1 
                                  ? "#D1D5DB" 
                                  : "#6B7280"
                              } 
                            />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.modernActionButtons}>
                      <TouchableOpacity 
                        style={styles.modernActionButton}
                        onPress={() => handleViewProgramStructure(program)}
                      >
                        <Ionicons name="eye-outline" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.modernActionButton}
                        onPress={() => handleEditProgramStructure(program)}
                      >
                        <Ionicons name="create-outline" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity 
                          style={styles.modernActionButton}
                          onPress={() => {
                            const newDropdown = activeDropdown === program.id ? null : program.id;
                            console.log('⋯ Three dots clicked for program:', program.name, 'Setting dropdown to:', newDropdown);
                            setActiveDropdown(newDropdown);
                          }}
                        >
                          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        {activeDropdown === program.id && (
                          <View style={styles.dropdownMenu}>
                            <TouchableOpacity 
                              style={styles.dropdownItem}
                              onPress={() => {
                                console.log('🗑️ Delete button clicked for program:', program.name, program.id);
                                handleDeleteProgram(program);
                              }}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                              <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )) : (
                <View style={styles.comingSoon}>
                  <Ionicons name="library-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.comingSoonText}>No programs found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderExercisesTable = () => {
    const filteredExercises = exercises.filter(exercise => 
      exercise.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.skill_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exercise.dupr_range_min && exercise.dupr_range_max && 
       `${exercise.dupr_range_min}–${exercise.dupr_range_max}`.includes(searchQuery))
    );

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercise Library</Text>
          <Text style={styles.sectionSubtitle}>Manage individual exercises and drills</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Exercise</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Description</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Difficulty</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Categories</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Range</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Type</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            <ScrollView style={styles.modernTableBody}>
              {filteredExercises.length > 0 ? filteredExercises.map(exercise => (
                <View key={exercise.id} style={styles.modernTableRow}>
                  {/* Exercise Info */}
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <View style={styles.exerciseInfoContainer}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseTitle}>{exercise.title || exercise.code}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.code && exercise.title !== exercise.code && `Code: ${exercise.code}`}
                        </Text>
                        {exercise.estimated_minutes && (
                          <Text style={styles.exerciseMeta}>
                            ⏱️ {exercise.estimated_minutes} min
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <Text style={styles.exerciseDescription} numberOfLines={2}>
                      {exercise.description || exercise.instructions || '—'}
                    </Text>
                    {exercise.goal && (
                      <Text style={styles.exerciseGoal} numberOfLines={1}>
                        Goal: {exercise.goal}
                      </Text>
                    )}
                  </View>

                  {/* Difficulty */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.difficultyContainer}>
                      <View style={styles.difficultyStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons
                            key={star}
                            name={star <= (exercise.difficulty || 1) ? "star" : "star-outline"}
                            size={12}
                            color={star <= (exercise.difficulty || 1) ? "#F59E0B" : "#E5E7EB"}
                          />
                        ))}
                      </View>
                      <Text style={styles.difficultyText}>{exercise.difficulty || 1}/5</Text>
                    </View>
                  </View>

                  {/* Categories */}
                  <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                    <View style={styles.exerciseCategoriesContainer}>
                      {exercise.skill_categories_json && Array.isArray(exercise.skill_categories_json) ? (
                        exercise.skill_categories_json.slice(0, 2).map((category, index) => (
                          <View key={index} style={styles.exerciseCategoryTag}>
                            <Text style={styles.exerciseCategoryText}>{category}</Text>
                          </View>
                        ))
                      ) : exercise.skill_category ? (
                        exercise.skill_category.split(',').slice(0, 2).map((category, index) => (
                          <View key={index} style={styles.exerciseCategoryTag}>
                            <Text style={styles.exerciseCategoryText}>{category.trim()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noCategoryText}>—</Text>
                      )}
                      {((exercise.skill_categories_json && exercise.skill_categories_json.length > 2) ||
                        (exercise.skill_category && exercise.skill_category.split(',').length > 2)) && (
                        <Text style={styles.moreCategoriesText}>
                          +{((exercise.skill_categories_json && exercise.skill_categories_json.length) || 
                             (exercise.skill_category && exercise.skill_category.split(',').length) || 0) - 2} more
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* DUPR Range */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    {exercise.dupr_range_min && exercise.dupr_range_max ? (
                      <View style={styles.duprRangeBadge}>
                        <Text style={styles.duprRangeText}>
                          {exercise.dupr_range_min}–{exercise.dupr_range_max}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noDuprRangeText}>—</Text>
                    )}
                  </View>

                  {/* Type */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={[styles.exerciseTypeBadge, 
                      exercise.created_by ? styles.userCreatedBadge : styles.defaultBadge
                    ]}>
                      <Text style={[styles.exerciseTypeText,
                        exercise.created_by ? styles.userCreatedText : styles.defaultText
                      ]}>
                        {exercise.created_by ? 'User' : 'Default'}
                      </Text>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <TouchableOpacity
                      style={[styles.modernStatusChip, 
                        exercise.is_published ? styles.publishedStatusChip : styles.draftStatusChip
                      ]}
                      onPress={() => togglePublishStatus('exercise', exercise.id, exercise.is_published)}
                    >
                      <Text style={[styles.modernStatusText,
                        exercise.is_published ? styles.publishedStatusText : styles.draftStatusText
                      ]}>
                        {exercise.is_published ? 'Published' : 'Draft'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Actions */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.modernActionButtons}>
                      <TouchableOpacity style={styles.modernActionButton}>
                        <Ionicons name="eye-outline" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.modernActionButton}
                        onPress={() => handleEditExercise(exercise)}
                      >
                        <Ionicons name="create-outline" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity 
                          style={styles.modernActionButton}
                          onPress={() => {
                            const newDropdown = activeDropdown === exercise.id ? null : exercise.id;
                            console.log('⋯ Three dots clicked for exercise:', exercise.title, 'Setting dropdown to:', newDropdown);
                            setActiveDropdown(newDropdown);
                          }}
                        >
                          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        {activeDropdown === exercise.id && (
                          <View style={styles.dropdownMenu}>
                            <TouchableOpacity 
                              style={styles.dropdownItem}
                              onPress={() => {
                                console.log('🗑️ Delete button clicked for exercise:', exercise.title, exercise.id);
                                handleDeleteExercise(exercise);
                              }}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                              <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )) : (
                <View style={styles.comingSoon}>
                  <Ionicons name="fitness-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.comingSoonText}>No exercises found</Text>
                  <Text style={styles.comingSoonSubtext}>
                    {searchQuery ? 'Try adjusting your search criteria' : 'Create your first exercise to get started'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderRoutinesTable = () => {
    const filteredRoutines = routines.filter(routine => 
      routine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.programs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Training Routines</Text>
          <Text style={styles.sectionSubtitle}>Manage workout routines and sessions</Text>
        </View>

        <View style={styles.modernTable}>
          <View style={styles.modernTableHeader}>
            <View style={[styles.modernTableHeaderCell, { flex: 2 }]}>
              <Text style={styles.modernTableHeaderText}>Routine</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1.5 }]}>
              <Text style={styles.modernTableHeaderText}>Program</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
              <Text style={styles.modernTableHeaderText}>Order</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
              <Text style={styles.modernTableHeaderText}>Status</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
              <Text style={styles.modernTableHeaderText}>Created</Text>
            </View>
          </View>

          <ScrollView style={styles.modernTableBody}>
            {filteredRoutines.length > 0 ? filteredRoutines.map(routine => (
              <View key={routine.id} style={styles.modernTableRow}>
                <View style={[styles.modernTableCell, { flex: 2 }]}>
                  <Text style={styles.routineTitle}>{routine.name}</Text>
                  {routine.description && (
                    <Text style={styles.routineMeta}>{routine.description}</Text>
                  )}
                </View>
                <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                  <Text style={styles.cellText}>
                    {routine.programs?.name || 'No Program'}
                  </Text>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <Text style={styles.cellText}>{routine.order_index}</Text>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={[styles.statusBadge, routine.is_published ? styles.statusPublished : styles.statusDraft]}>
                    <Text style={[styles.statusText, routine.is_published ? styles.statusTextPublished : styles.statusTextDraft]}>
                      {routine.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <Text style={styles.cellText}>
                    {new Date(routine.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )) : (
              <View style={styles.comingSoon}>
                <Ionicons name="library-outline" size={48} color="#9CA3AF" />
                <Text style={styles.comingSoonText}>No routines found</Text>
                <Text style={styles.comingSoonSubtext}>Create your first routine to get started</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderCategoriesTable = () => {
    const filteredCategories = categories.filter(category => 
      category.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Category Order</Text>
            <Text style={styles.sectionSubtitle}>Manage the order of program categories in the app</Text>
          </View>
          {hasUnsavedCategoryChanges && (
            <TouchableOpacity 
              style={[styles.primaryButton, savingCategoryOrder && styles.primaryButtonDisabled]}
              onPress={saveCategoryOrder}
              disabled={savingCategoryOrder}
            >
              {savingCategoryOrder ? (
                <ActivityIndicator size="small" color="#fafafa" />
              ) : (
                <Ionicons name="save-outline" size={20} color="#fafafa" />
              )}
              <Text style={styles.primaryButtonText}>
                {savingCategoryOrder ? 'Saving...' : 'Save Order'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modernTable}>
          <View style={styles.modernTableHeader}>
            <View style={[styles.modernTableHeaderCell, { flex: 2 }]}>
              <Text style={styles.modernTableHeaderText}>Category</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
              <Text style={styles.modernTableHeaderText}>Programs</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
              <Text style={styles.modernTableHeaderText}>Order</Text>
            </View>
            <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
              <Text style={styles.modernTableHeaderText}>Actions</Text>
            </View>
          </View>

          <ScrollView style={styles.modernTableBody}>
            {filteredCategories.length > 0 ? filteredCategories.map((category, index) => {
              const programCount = programs.filter(p => p.category === category.name).length;
              
              return (
                <View key={category.id} style={styles.modernTableRow}>
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <View style={styles.categoryInfoContainer}>
                      <View style={styles.categoryIcon}>
                        <Text style={styles.categoryIconText}>
                          {category.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.categoryDetails}>
                        {editingCategoryId === category.id ? (
                          <View style={styles.categoryEditContainer}>
                            <TextInput
                              style={styles.categoryEditInput}
                              value={editingCategoryName}
                              onChangeText={setEditingCategoryName}
                              placeholder="Category name"
                              placeholderTextColor="#9CA3AF"
                              autoFocus={true}
                              onSubmitEditing={handleSaveCategoryName}
                            />
                            <View style={styles.categoryEditButtons}>
                              <TouchableOpacity 
                                style={styles.categoryEditSaveButton}
                                onPress={handleSaveCategoryName}
                              >
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.categoryEditCancelButton}
                                onPress={handleCancelCategoryEdit}
                              >
                                <Ionicons name="close" size={14} color="#6B7280" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.categoryName}>{category.name}</Text>
                            <Text style={styles.categoryMeta}>
                              Position: {index + 1}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.programCountText}>{programCount} programs</Text>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.reorderButtons}>
                      <TouchableOpacity 
                        style={[
                          styles.reorderButton, 
                          index === 0 && styles.reorderButtonDisabled
                        ]}
                        onPress={() => reorderCategory(category.id, 'up')}
                        disabled={index === 0}
                      >
                        <Ionicons 
                          name="chevron-up" 
                          size={14} 
                          color={index === 0 ? "#D1D5DB" : "#6B7280"} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.reorderButton, 
                          index === filteredCategories.length - 1 && styles.reorderButtonDisabled
                        ]}
                        onPress={() => reorderCategory(category.id, 'down')}
                        disabled={index === filteredCategories.length - 1}
                      >
                        <Ionicons 
                          name="chevron-down" 
                          size={14} 
                          color={index === filteredCategories.length - 1 ? "#D1D5DB" : "#6B7280"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.modernActionButtons}>
                      {editingCategoryId === category.id ? (
                        <Text style={styles.editingText}>Editing...</Text>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={styles.modernActionButton}
                            onPress={() => handleEditCategory(category)}
                          >
                            <Ionicons name="create-outline" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.modernActionButton}>
                            <Ionicons name="eye-outline" size={16} color="#6B7280" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            }) : (
              <View style={styles.comingSoon}>
                <Ionicons name="reorder-three-outline" size={48} color="#9CA3AF" />
                <Text style={styles.comingSoonText}>No categories found</Text>
                <Text style={styles.comingSoonSubtext}>Categories are created automatically from programs</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderCoaches = () => (
    <View style={styles.content}>
      {/* Coach Stats Cards */}
      <View style={styles.coachStatsGrid}>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.total || '0'}</Text>
          <Text style={styles.coachStatLabel}>Total Coaches</Text>
          <Text style={styles.coachStatSubtext}>Registered coaches</Text>
        </View>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.verified || '0'}</Text>
          <Text style={styles.coachStatLabel}>Verified</Text>
          <Text style={styles.coachStatSubtext}>Verified profiles</Text>
        </View>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.active || '0'}</Text>
          <Text style={styles.coachStatLabel}>Active</Text>
          <Text style={styles.coachStatSubtext}>Currently active</Text>
        </View>
        <View style={styles.coachStatCard}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.coachStatNumber}>{loading ? '—' : coachStats.avgRating || '0'}</Text>
          </View>
          <Text style={styles.coachStatLabel}>Avg Rating</Text>
          <Text style={styles.coachStatSubtext}>Average coach rating</Text>
        </View>
        <View style={styles.coachStatCard}>
          <Text style={styles.coachStatNumber}>—</Text>
          <Text style={styles.coachStatLabel}>Total Students</Text>
          <Text style={styles.coachStatSubtext}>Not tracked yet</Text>
        </View>
      </View>

      {/* Coach Directory Section */}
      <View style={styles.coachDirectorySection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Coach Directory</Text>
            <Text style={styles.sectionSubtitle}>Manage coach profiles and verification status</Text>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coaches..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="funnel-outline" size={20} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Coach Table */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading coaches...</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Coach</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Rating & Reviews</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Specialties</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Location</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Rate</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Students</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            <ScrollView style={styles.modernTableBody}>
              {renderCoachRows()}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  const renderCoachRows = () => {
    // Helper function to get coach initials
    const getCoachInitials = (name) => {
      if (name && name.trim()) {
        const names = name.trim().split(' ');
        if (names.length >= 2) {
          return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return names[0].substring(0, 2).toUpperCase();
      }
      return 'C';
    };

    // Filter coaches based on search query
    const filteredCoaches = coaches.filter(coach => 
      coach.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Use only real data from database
    const coachesToRender = filteredCoaches;

    if (coachesToRender.length === 0) {
      return (
        <View style={styles.comingSoon}>
          <Ionicons name="people-outline" size={48} color="#9CA3AF" />
          <Text style={styles.comingSoonText}>
            {loading ? 'Loading coaches...' : 'No coaches found'}
          </Text>
          {!loading && searchQuery && (
            <Text style={styles.comingSoonSubtext}>Try adjusting your search</Text>
          )}
        </View>
      );
    }

    return coachesToRender.map(coach => (
      <View key={coach.id} style={styles.modernTableRow}>
        {/* Coach Info */}
        <View style={[styles.modernTableCell, { flex: 2 }]}>
          <View style={styles.coachInfoContainer}>
            <View style={styles.coachAvatar}>
              {coach.avatar_url ? (
                <Image 
                  source={{ uri: coach.avatar_url }} 
                  style={styles.coachAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.coachAvatarText}>{getCoachInitials(coach.name)}</Text>
              )}
              {coach.is_verified && (
                <View style={styles.verifiedIcon}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.coachDetails}>
              <Text style={styles.coachName}>{coach.name}</Text>
              <Text style={styles.coachEmail}>{coach.email}</Text>
              <Text style={styles.coachDupr}>⚡ DUPR: {coach.dupr_rating}</Text>
            </View>
          </View>
        </View>

        {/* Rating & Reviews */}
        <View style={[styles.modernTableCell, { flex: 1.5 }]}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>{coach.rating_avg || 0}</Text>
            <Text style={styles.reviewCount}>({coach.rating_count || 0})</Text>
          </View>
        </View>

        {/* Specialties */}
        <View style={[styles.modernTableCell, { flex: 1.5 }]}>
          <View style={styles.specialtiesContainer}>
            {(coach.specialties || []).slice(0, 2).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            {(coach.specialties || []).length > 2 && (
              <Text style={styles.moreSpecialties}>+{(coach.specialties || []).length - 2}</Text>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>{coach.location}</Text>
          </View>
        </View>

        {/* Rate */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <Text style={styles.hourlyRate}>
            {coach.hourly_rate ? `$${(coach.hourly_rate / 100).toFixed(0)}/hr` : '—'}
          </Text>
        </View>

        {/* Students */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={styles.studentsContainer}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.studentsText}>—</Text>
          </View>
        </View>

        {/* Status */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={styles.statusContainer}>
            <View style={[styles.modernStatusChip, 
              coach.is_active ? styles.activeStatusChip : styles.inactiveStatusChip
            ]}>
              <Text style={[styles.modernStatusText,
                coach.is_active ? styles.activeStatusText : styles.inactiveStatusText
              ]}>{coach.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
            {coach.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {!coach.is_verified && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={12} color="#F59E0B" />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={styles.modernActionButtons}>
            <TouchableOpacity style={styles.modernActionButton}>
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modernActionButton}
              onPress={() => handleEditCoach(coach)}
            >
              <Ionicons name="create-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernActionButton}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ));
  };

  const renderUsers = () => (
    <View style={styles.content}>
      {/* User Stats Cards */}
      <View style={styles.userStatsGrid}>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{stats.users || 0}</Text>
          <Text style={styles.userStatLabel}>Total Users</Text>
          <Text style={styles.userStatSubtext}>All registered users</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{users.filter(u => u.is_active).length}</Text>
          <Text style={styles.userStatLabel}>Active Users</Text>
          <Text style={styles.userStatSubtext}>Currently active</Text>
        </View>
        <View style={styles.userStatCard}>
          <View style={styles.newUsersContainer}>
            <Text style={styles.userStatNumber}>
              +{users.filter(u => {
                const createdDate = new Date(u.created_at);
                const now = new Date();
                const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
                return createdDate >= oneMonthAgo;
              }).length}
            </Text>
          </View>
          <Text style={styles.userStatLabel}>New This Month</Text>
          <Text style={styles.userStatSubtext}>New registrations</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>
            {users.length > 0 ? Math.round((users.filter(u => u.onboarding_completed).length / users.length) * 100) : 0}%
          </Text>
          <Text style={styles.userStatLabel}>Onboarding Rate</Text>
          <Text style={styles.userStatSubtext}>Completed onboarding</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{users.filter(u => u.dupr_rating).length}</Text>
          <Text style={styles.userStatLabel}>DUPR Users</Text>
          <Text style={styles.userStatSubtext}>Users with DUPR rating</Text>
        </View>
        <View style={styles.userStatCard}>
          <Text style={styles.userStatNumber}>{users.filter(u => u.focus_areas && u.focus_areas.length > 0).length}</Text>
          <Text style={styles.userStatLabel}>Users with Skills</Text>
          <Text style={styles.userStatSubtext}>Users with selected skills</Text>
        </View>
      </View>

      {/* User Accounts Section */}
      <View style={styles.userAccountsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>User Accounts</Text>
            <Text style={styles.sectionSubtitle}>
              {searchQuery ? 
                `${users.filter(user => 
                  user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length} users found` : 
                `${users.length} total users`
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => setShowAddUserModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Add User</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="funnel-outline" size={20} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* User Table */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.comingSoon}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.comingSoonText}>No users found</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>User</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Tier</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>DUPR Rating</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Skills</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1.5 }]}>Activity</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Progress</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>
            <ScrollView style={styles.modernTableBody}>
              {renderUserRows()}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  const renderUserRows = () => {
    // Filter users based on search query
    const filteredUsers = users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    // Helper function to get user initials
    const getUserInitials = (name, email) => {
      if (name && name.trim()) {
        const names = name.trim().split(' ');
        if (names.length >= 2) {
          return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return names[0].substring(0, 2).toUpperCase();
      }
      if (email) {
        return email.substring(0, 2).toUpperCase();
      }
      return 'U';
    };

    // Helper function to get time since last activity
    const getTimeSince = (dateString) => {
      if (!dateString) return 'Never';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    };

    return filteredUsers.map(user => (
      <View key={user.id} style={styles.modernTableRow}>
        {/* User Info */}
        <View style={[styles.modernTableCell, { flex: 2 }]}>
          <View style={styles.userInfoContainer}>
            <View style={styles.userAvatar}>
              {user.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={styles.userAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.userAvatarText}>{getUserInitials(user.name, user.email)}</Text>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name || 'No Name'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userJoined}>Joined {formatDate(user.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Tier */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          {user.tier ? (
            <View style={[styles.tierBadge, { backgroundColor: getTierColor(user.tier) + '20' }]}>
              <Text style={[styles.tierText, { color: getTierColor(user.tier) }]}>{user.tier}</Text>
            </View>
          ) : (
            <Text style={styles.noDuprText}>Not set</Text>
          )}
        </View>

        {/* DUPR Rating */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          {user.dupr_rating ? (
            <Text style={styles.duprText}>{parseFloat(user.dupr_rating).toFixed(3)}</Text>
          ) : (
            <Text style={styles.noDuprText}>—</Text>
          )}
        </View>

        {/* Skills */}
        <View style={[styles.modernTableCell, { flex: 2 }]}>
          <View style={styles.skillsContainer}>
            {user.focus_areas && user.focus_areas.length > 0 ? (
              <>
                {getSkillNamesFromFocusAreas(user.focus_areas).slice(0, 3).map((skill, index) => (
                  <View key={skill.id} style={[styles.skillTag, { backgroundColor: skill.color + '20' }]}>
                    <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                    <Text style={[styles.skillText, { color: skill.color }]}>{skill.name}</Text>
                  </View>
                ))}
                {user.focus_areas.length > 3 && (
                  <Text style={styles.moreSkillsText}>+{user.focus_areas.length - 3} more</Text>
                )}
              </>
            ) : (
              <Text style={styles.noSkillsText}>No skills selected</Text>
            )}
          </View>
        </View>

        {/* Activity */}
        <View style={[styles.modernTableCell, { flex: 1.5 }]}>
          <Text style={styles.activityText}>Time: {user.time_commitment || 'Not set'}</Text>
          <Text style={styles.activitySubtext}>Rating: {user.rating_type || 'none'}</Text>
        </View>

        {/* Progress */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={[styles.progressBadge, 
            user.onboarding_completed ? styles.onboardedBadge : styles.incompleteBadge
          ]}>
            <View style={[styles.progressDot, { 
              backgroundColor: user.onboarding_completed ? '#10B981' : '#F59E0B' 
            }]} />
            <Text style={[styles.progressText, {
              color: user.onboarding_completed ? '#10B981' : '#F59E0B'
            }]}>{user.onboarding_completed ? 'Completed' : 'Incomplete'}</Text>
          </View>
          <Text style={styles.goalText}>Goal: {user.goal || 'Not set'}</Text>
        </View>

        {/* Status */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={[styles.modernStatusChip, 
            user.is_active ? styles.activeStatusChip : styles.inactiveStatusChip
          ]}>
            <Text style={[styles.modernStatusText,
              user.is_active ? styles.activeStatusText : styles.inactiveStatusText
            ]}>{user.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
          <Text style={styles.lastActivityText}>Last: {getTimeSince(user.updated_at)}</Text>
        </View>

        {/* Actions */}
        <View style={[styles.modernTableCell, { flex: 1 }]}>
          <View style={styles.modernActionButtons}>
            <TouchableOpacity style={styles.modernActionButton}>
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modernActionButton}
              onPress={() => handleEditUser(user)}
            >
              <Ionicons name="create-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernActionButton}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.modernActionButton}
                onPress={() => {
                  const newDropdown = activeDropdown === `user_${user.id}` ? null : `user_${user.id}`;
                  console.log('⋯ Three dots clicked for user:', user.name, 'Setting dropdown to:', newDropdown);
                  setActiveDropdown(newDropdown);
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
              </TouchableOpacity>
              {activeDropdown === `user_${user.id}` && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      console.log('📋 User logbook clicked for user:', user.name, user.id);
                      handleViewUserLogbook(user);
                    }}
                  >
                    <Ionicons name="book-outline" size={16} color="#3B82F6" />
                    <Text style={styles.dropdownItemText}>User logbook</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      console.log('🗑️ Delete button clicked for user:', user.name, user.id);
                      handleDeleteUser(user.id, user.name || user.email);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={styles.dropdownItemTextDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    ));
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#3B82F6';
      case 'Advanced': return '#8B5CF6';
      case 'Pro': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderOverview();
      case 'content':
        return renderContentManagement();
      case 'coaches':
        return renderCoaches();
      case 'users':
        return renderUsers();
      case 'feedback':
        return renderFeedback();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  const renderFeedback = () => (
    <View style={styles.content}>
      {/* Feedback Stats */}
      <View style={styles.feedbackStatsGrid}>
        <View style={styles.feedbackStatCard}>
          <Text style={styles.feedbackStatNumber}>{feedback.length}</Text>
          <Text style={styles.feedbackStatLabel}>Total Feedback</Text>
          <Text style={styles.feedbackStatSubtext}>All time submissions</Text>
        </View>
        <View style={styles.feedbackStatCard}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.feedbackStatNumber}>
              {feedback.length > 0 
                ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
                : '0.0'
              }
            </Text>
          </View>
          <Text style={styles.feedbackStatLabel}>Average Rating</Text>
          <Text style={styles.feedbackStatSubtext}>User satisfaction</Text>
        </View>
        <View style={styles.feedbackStatCard}>
          <Text style={styles.feedbackStatNumber}>
            {feedback.filter(f => f.rating >= 4).length}
          </Text>
          <Text style={styles.feedbackStatLabel}>Positive Reviews</Text>
          <Text style={styles.feedbackStatSubtext}>4+ star ratings</Text>
        </View>
        <View style={styles.feedbackStatCard}>
          <Text style={styles.feedbackStatNumber}>
            {feedback.filter(f => f.what_to_add?.trim()).length}
          </Text>
          <Text style={styles.feedbackStatLabel}>Feature Requests</Text>
          <Text style={styles.feedbackStatSubtext}>Improvement suggestions</Text>
        </View>
      </View>

      {/* Feedback Table */}
      <View style={styles.feedbackSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>User Feedback</Text>
            <Text style={styles.sectionSubtitle}>
              {feedback.length} feedback submissions
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading feedback...</Text>
          </View>
        ) : feedback.length === 0 ? (
          <View style={styles.comingSoon}>
            <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
            <Text style={styles.comingSoonText}>No feedback yet</Text>
            <Text style={styles.comingSoonSubtext}>User feedback will appear here</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 0.5 }]}>Rating</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>User</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Options</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>What They Like</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Suggestions</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Date</Text>
            </View>
            <ScrollView style={styles.modernTableBody}>
              {feedback.map(item => (
                <View key={item.id} style={styles.modernTableRow}>
                  {/* Rating */}
                  <View style={[styles.modernTableCell, { flex: 0.5 }]}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>

                  {/* User */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.feedbackUserName}>
                      {item.users?.name || 'Anonymous'}
                    </Text>
                    <Text style={styles.feedbackUserEmail}>
                      {item.users?.email || 'No email'}
                    </Text>
                  </View>

                  {/* Selected Options */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.feedbackOptionsContainer}>
                      {item.selected_options?.slice(0, 2).map((option, index) => (
                        <View key={index} style={styles.feedbackOptionTag}>
                          <Text style={styles.feedbackOptionText}>{option}</Text>
                        </View>
                      ))}
                      {item.selected_options?.length > 2 && (
                        <Text style={styles.moreOptionsText}>
                          +{item.selected_options.length - 2} more
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* What They Like */}
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <Text style={styles.feedbackText} numberOfLines={3}>
                      {item.what_you_like || '—'}
                    </Text>
                  </View>

                  {/* Suggestions */}
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <Text style={styles.feedbackText} numberOfLines={3}>
                      {item.what_to_add || '—'}
                    </Text>
                  </View>

                  {/* Date */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.feedbackDate}>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.feedbackTime}>
                      {new Date(item.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.content}>
      <View style={styles.comingSoon}>
        <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
        <Text style={styles.comingSoonText}>Analytics dashboard coming soon</Text>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.content}>
      <View style={styles.comingSoon}>
        <Ionicons name="settings-outline" size={48} color="#9CA3AF" />
        <Text style={styles.comingSoonText}>Settings panel coming soon</Text>
      </View>
    </View>
  );

  const handleEditCoach = (coach) => {
    setSelectedCoach(coach);
    setShowAddCoachModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowAddUserModal(true);
  };

  const handleViewUserLogbook = (user) => {
    setSelectedUserForLogbook(user);
    setShowUserLogbookModal(true);
    setActiveDropdown(null);
  };

  const handleEditExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowEditExerciseModal(true);
  };

  const handleDeleteExercise = (exercise) => {
    console.log('🗑️ Delete exercise clicked:', exercise.title, exercise.id);
    setExerciseToDelete(exercise);
    setShowDeleteExerciseConfirmation(true);
    setActiveDropdown(null);
  };

  const handleConfirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;
    
    console.log('✅ User confirmed exercise delete - starting deletion process');
    
    try {
      console.log('🔄 Setting loading to true');
      setLoading(true);
      setShowDeleteExerciseConfirmation(false);
      
      console.log('🎯 Exercise details:', {
        id: exerciseToDelete.id,
        title: exerciseToDelete.title,
        type: typeof exerciseToDelete.id
      });
      
      console.log('👤 Current user check:', user?.id);
      
      // Check user admin status first
      console.log('🔍 Checking user admin status...');
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('is_admin, id, email')
        .eq('id', user.id)
        .single();
      
      console.log('👥 User profile check result:', { userProfile, userError });
      
      if (userError) {
        console.error('❌ Error checking user profile:', userError);
        throw new Error(`User profile check failed: ${userError.message}`);
      }
      
      if (!userProfile?.is_admin) {
        console.error('❌ User is not admin:', userProfile);
        throw new Error('You do not have admin privileges');
      }
      
      console.log('✅ User is admin, proceeding with deletion');
      
      // Delete the exercise directly from the exercises table
      console.log('🚀 Deleting exercise from database...');
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseToDelete.id);

      console.log('📥 Delete result:', { deleteError });

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        throw deleteError;
      }

      console.log('🎉 Delete successful');
      Alert.alert('Success', `Exercise "${exerciseToDelete.title}" has been deleted successfully.`);
      
      console.log('🔄 Refreshing exercises list...');
      fetchExercises();
      
    } catch (error) {
      console.error('💥 Error in delete process:', error);
      console.error('💥 Error stack:', error.stack);
      Alert.alert('Error', `Failed to delete exercise: ${error.message}`);
    } finally {
      console.log('🏁 Cleaning up - setting loading false and resetting states');
      setLoading(false);
      setExerciseToDelete(null);
    }
  };

  const handleCancelDeleteExercise = () => {
    console.log('❌ User cancelled exercise delete');
    setShowDeleteExerciseConfirmation(false);
    setExerciseToDelete(null);
  };

  const handleCoachCreated = () => {
    // Refresh coaches list when a new coach is created
    if (activeTab === 'coaches') {
      fetchCoaches();
    }
  };

  const handleUserCreated = () => {
    // Refresh users list when a new user is created
    if (activeTab === 'users') {
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Delete user from the database
              const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

              if (error) throw error;

              Alert.alert('Success', `User "${userName}" has been deleted successfully.`);
              
              // Refresh users list
              fetchUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', `Failed to delete user: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleProgramCreated = () => {
    // Refresh programs list when a new program is created
    if (activeTab === 'content' && contentTab === 'programs') {
      fetchPrograms();
    }
    // Also refresh stats if on dashboard
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  };

  const handleExerciseCreated = () => {
    // Refresh exercises list when a new exercise is created
    if (activeTab === 'content' && contentTab === 'exercises') {
      fetchExercises();
    }
    // Note: Exercise counts are managed through routine_exercises junction table
    // So we don't need to refresh programs here unless exercises are directly added to routines
  };

  const handleRoutineCreated = () => {
    // Refresh routines list when a new routine is created
    if (activeTab === 'content' && contentTab === 'routines') {
      fetchRoutines();
    }
    // Refresh programs list to update routine counts
    if (activeTab === 'content' && contentTab === 'programs') {
      fetchPrograms();
    }
    // Also refresh stats if on dashboard
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  };

  const handleDeleteProgram = (program) => {
    console.log('🔥 DELETE CLICKED - handleDeleteProgram called with program:', program);
    console.log('📱 Opening custom confirmation dialog...');
    setProgramToDelete(program);
    setShowDeleteConfirmation(true);
    setActiveDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!programToDelete) return;
    
    console.log('✅ User confirmed delete - starting deletion process');
    
    try {
      console.log('🔄 Setting loading to true');
      setLoading(true);
      setShowDeleteConfirmation(false);
      
      console.log('🎯 Program details:', {
        id: programToDelete.id,
        name: programToDelete.name,
        type: typeof programToDelete.id
      });
      
      console.log('👤 Current user check:', user?.id);
      
      // Check user admin status first
      console.log('🔍 Checking user admin status...');
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('is_admin, id, email')
        .eq('id', user.id)
        .single();
      
      console.log('👥 User profile check result:', { userProfile, userError });
      
      if (userError) {
        console.error('❌ Error checking user profile:', userError);
        throw new Error(`User profile check failed: ${userError.message}`);
      }
      
      if (!userProfile?.is_admin) {
        console.error('❌ User is not admin:', userProfile);
        throw new Error('You do not have admin privileges');
      }
      
      console.log('✅ User is admin, proceeding with deletion');
      
      // Use the secure delete function
      console.log('🚀 Calling delete_program_as_admin RPC...');
      const { data, error } = await supabase
        .rpc('delete_program_as_admin', {
          program_id: programToDelete.id
        });

      console.log('📥 Delete RPC result:', { 
        data, 
        error,
        dataType: typeof data,
        errorType: typeof error 
      });

      if (error) {
        console.error('❌ Delete RPC error:', error);
        throw error;
      }

      console.log('🎉 Delete successful, data returned:', data);

      if (data === true) {
        console.log('✅ Deletion confirmed successful');
        Alert.alert('Success', `Program "${programToDelete.name}" has been deleted successfully.`);
        
        console.log('🔄 Refreshing programs list...');
        fetchPrograms();
        
        if (activeTab === 'dashboard') {
          console.log('🔄 Refreshing dashboard stats...');
          fetchStats();
        }
      } else {
        console.error('❌ Delete returned unexpected value:', data);
        throw new Error(`Delete operation returned: ${data}`);
      }
    } catch (error) {
      console.error('💥 Error in delete process:', error);
      console.error('💥 Error stack:', error.stack);
      Alert.alert('Error', `Failed to delete program: ${error.message}`);
    } finally {
      console.log('🏁 Cleaning up - setting loading false and resetting states');
      setLoading(false);
      setProgramToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    console.log('❌ User cancelled delete');
    setShowDeleteConfirmation(false);
    setProgramToDelete(null);
  };

  const initializeProgramOrder = async () => {
    try {
      // Get all programs ordered by category and created_at to establish initial order
      const { data: allPrograms, error } = await supabase
        .from('programs')
        .select('id, order_index, created_at, category')
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Check if programs need order initialization (all have order_index = 0)
      const needsInitialization = allPrograms.every(p => p.order_index === 0);
      
      if (needsInitialization && allPrograms.length > 1) {
        console.log('Initializing program order_index values by category...');
        
        // Group programs by category
        const programsByCategory = allPrograms.reduce((acc, program) => {
          if (!acc[program.category]) {
            acc[program.category] = [];
          }
          acc[program.category].push(program);
          return acc;
        }, {});
        
        // Update each program with its index position within its category
        const updates = [];
        Object.values(programsByCategory).forEach(categoryPrograms => {
          categoryPrograms.forEach((program, index) => {
            updates.push(
              supabase
                .from('programs')
                .update({ order_index: index })
                .eq('id', program.id)
            );
          });
        });
        
        const results = await Promise.all(updates);
        const hasError = results.some(result => result.error);
        
        if (hasError) {
          console.error('Error initializing program order:', results.filter(r => r.error));
        } else {
          console.log('Program order initialized successfully by category');
        }
      }
    } catch (error) {
      console.error('Error initializing program order:', error);
    }
  };

  const reorderProgram = async (programId, direction) => {
    try {
      setReorderingProgramId(programId);
      
      // Get current programs list
      const currentPrograms = [...programs];
      const currentProgram = currentPrograms.find(p => p.id === programId);
      
      if (!currentProgram) {
        throw new Error('Program not found');
      }
      
      // Get programs in the same category only
      const categoryPrograms = currentPrograms.filter(p => p.category === currentProgram.category);
      const currentIndex = categoryPrograms.findIndex(p => p.id === programId);
      
      let targetIndex;
      if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < categoryPrograms.length - 1) {
        targetIndex = currentIndex + 1;
      } else {
        // No change needed (already at top/bottom of category)
        setReorderingProgramId(null);
        return;
      }
      
      // Get the target program within the same category
      const targetProgram = categoryPrograms[targetIndex];
      
      // Update order_index values in database
      const updates = [
        supabase
          .from('programs')
          .update({ order_index: targetProgram.order_index })
          .eq('id', currentProgram.id),
        supabase
          .from('programs')
          .update({ order_index: currentProgram.order_index })
          .eq('id', targetProgram.id)
      ];
      
      const results = await Promise.all(updates);
      
      // Check for errors
      const hasError = results.some(result => result.error);
      if (hasError) {
        const errors = results.filter(result => result.error).map(result => result.error);
        throw new Error(`Failed to update program order: ${errors.map(e => e.message).join(', ')}`);
      }
      
      // Refresh the programs list to show new order
      await fetchPrograms();
      
    } catch (error) {
      console.error('Error reordering program:', error);
      Alert.alert('Error', `Failed to reorder program: ${error.message}`);
    } finally {
      setReorderingProgramId(null);
    }
  };

  const normalizeOrderIndices = async () => {
    try {
      console.log('🔧 Normalizing order indices to fix sequence...');
      
      // Get all programs grouped by category
      const { data: allPrograms, error } = await supabase
        .from('programs')
        .select('id, category, order_index, created_at')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group programs by category
      const programsByCategory = allPrograms.reduce((acc, program) => {
        if (!acc[program.category]) {
          acc[program.category] = [];
        }
        acc[program.category].push(program);
        return acc;
      }, {});
      
      // Normalize order_index for each category (0, 1, 2, 3...)
      const updates = [];
      Object.values(programsByCategory).forEach(categoryPrograms => {
        categoryPrograms.forEach((program, index) => {
          if (program.order_index !== index) {
            updates.push(
              supabase
                .from('programs')
                .update({ order_index: index })
                .eq('id', program.id)
            );
          }
        });
      });
      
      if (updates.length > 0) {
        console.log(`🔧 Updating ${updates.length} programs with normalized order indices...`);
        const results = await Promise.all(updates);
        const hasError = results.some(result => result.error);
        
        if (hasError) {
          console.error('Error normalizing order indices:', results.filter(r => r.error));
        } else {
          console.log('✅ Order indices normalized successfully');
        }
      } else {
        console.log('✅ Order indices already normalized');
      }
    } catch (error) {
      console.error('Error normalizing order indices:', error);
    }
  };

  const reorderCategory = async (categoryId, direction) => {
    try {
      // Get current categories list
      const currentCategories = [...categories];
      const currentIndex = currentCategories.findIndex(c => c.id === categoryId);
      
      if (currentIndex === -1) {
        throw new Error('Category not found');
      }
      
      let targetIndex;
      if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < currentCategories.length - 1) {
        targetIndex = currentIndex + 1;
      } else {
        // No change needed (already at top/bottom)
        return;
      }
      
      // Swap the categories in the array
      const updatedCategories = [...currentCategories];
      [updatedCategories[currentIndex], updatedCategories[targetIndex]] = 
      [updatedCategories[targetIndex], updatedCategories[currentIndex]];
      
      // Update order_index for both categories
      updatedCategories[currentIndex].order_index = currentIndex;
      updatedCategories[targetIndex].order_index = targetIndex;
      
      // Update local state immediately for responsive UI
      setCategories(updatedCategories);
      setHasUnsavedCategoryChanges(true);
      
      console.log('Category order updated:', updatedCategories.map(c => `${c.name} (${c.order_index})`));
      
    } catch (error) {
      console.error('Error reordering category:', error);
      Alert.alert('Error', `Failed to reorder category: ${error.message}`);
    }
  };

  const saveCategoryOrder = async () => {
    try {
      setSavingCategoryOrder(true);
      
      console.log('💾 Saving category order to database...');
      
      // Create category order data
      const categoryOrder = categories.map((category, index) => ({
        name: category.name,
        order_index: index
      }));
      
      console.log('💾 Category order to save:', categoryOrder);
      
      // We'll store the category order in a settings table or as metadata
      // For now, let's use a simple approach: store it in the users table as admin settings
      // or create a simple key-value storage approach
      
      const { data: adminUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .eq('is_admin', true)
        .single();
      
      if (userError || !adminUser) {
        throw new Error('Admin user not found');
      }
      
      // Store category order in a way that can be retrieved globally
      // Option 1: Use a settings table (if it exists)
      // Option 2: Use a simple JSON field in programs metadata
      // Option 3: Create a category_order table
      
      // For now, let's use a simple approach - we'll create an RPC function
      const { error: saveError } = await supabase
        .rpc('save_category_order', {
          category_order: categoryOrder
        });
      
      if (saveError) {
        console.error('💾 Error saving category order:', saveError);
        // If RPC doesn't exist, fall back to a simpler approach
        if (saveError.message?.includes('function save_category_order')) {
          console.log('💾 RPC function not found, using fallback approach...');
          
          // Fallback: Save as JSON in a simple way
          // We'll add a comment to create the RPC function later
          console.log('💾 Category order saved locally (database RPC function needed)');
          Alert.alert('Success', 'Category order saved locally. Database function needs to be created for full persistence.');
        } else {
          throw saveError;
        }
      } else {
        console.log('💾 ✅ Category order saved successfully');
        Alert.alert('Success', 'Category order saved successfully!');
      }
      
      setHasUnsavedCategoryChanges(false);
      
    } catch (error) {
      console.error('💾 Error saving category order:', error);
      Alert.alert('Error', `Failed to save category order: ${error.message}`);
    } finally {
      setSavingCategoryOrder(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveCategoryName = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    try {
      // Find the category being edited
      const categoryToEdit = categories.find(c => c.id === editingCategoryId);
      if (!categoryToEdit) {
        throw new Error('Category not found');
      }

      const oldCategoryName = categoryToEdit.name;
      const newCategoryName = editingCategoryName.trim();

      // Check if the name has actually changed
      if (oldCategoryName === newCategoryName) {
        setEditingCategoryId(null);
        setEditingCategoryName('');
        return;
      }

      // Check if the new name already exists
      const existingCategory = categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase() && c.id !== editingCategoryId);
      if (existingCategory) {
        Alert.alert('Error', 'A category with this name already exists');
        return;
      }

      console.log('📝 Updating category name from', oldCategoryName, 'to', newCategoryName);

      // Update all programs that use this category
      const { error: updateError } = await supabase
        .from('programs')
        .update({ category: newCategoryName })
        .eq('category', oldCategoryName);

      if (updateError) {
        throw updateError;
      }

      // Update the local categories state
      const updatedCategories = categories.map(category => {
        if (category.id === editingCategoryId) {
          return {
            ...category,
            name: newCategoryName,
            id: newCategoryName.toLowerCase().replace(/\s+/g, '_')
          };
        }
        return category;
      });

      setCategories(updatedCategories);
      setHasUnsavedCategoryChanges(true);

      // Clear editing state
      setEditingCategoryId(null);
      setEditingCategoryName('');

      Alert.alert('Success', `Category renamed from "${oldCategoryName}" to "${newCategoryName}"`);

      // Refresh programs to show updated category names
      if (contentTab === 'programs') {
        fetchPrograms();
      }

    } catch (error) {
      console.error('Error updating category name:', error);
      Alert.alert('Error', `Failed to update category name: ${error.message}`);
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleRefresh = () => {
    // Refresh data based on current active tab
    switch (activeTab) {
      case 'dashboard':
        fetchStats();
        break;
      case 'content':
        if (contentTab === 'programs') {
          fetchPrograms();
        } else if (contentTab === 'routines') {
          fetchRoutines();
        } else if (contentTab === 'exercises') {
          fetchExercises();
        } else if (contentTab === 'categories') {
          fetchCategories();
        }
        break;
      case 'coaches':
        fetchCoaches();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'feedback':
        fetchFeedback();
        break;
      default:
        fetchStats();
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 0 : insets.top }]}>
      {renderSidebar()}
      <View style={[styles.mainContent, { marginLeft: sidebarWidth }]}>
        {renderTopBar()}
        <ScrollView 
          style={styles.contentScrollView} 
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setActiveDropdown(null)}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setActiveDropdown(null)}
          >
            {renderContent()}
          </TouchableOpacity>
        </ScrollView>
      </View>
      <AddCoachModal
        visible={showAddCoachModal}
        onClose={() => {
          setShowAddCoachModal(false);
          setSelectedCoach(null);
        }}
        onSuccess={handleCoachCreated}
        coach={selectedCoach}
      />
      <AddUserModal
        visible={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserCreated}
        user={selectedUser}
      />

      {/* Create Program Modal */}
      <WebCreateProgramModal
        visible={showCreateProgramModal}
        onClose={() => setShowCreateProgramModal(false)}
        onSuccess={handleProgramCreated}
      />

      {/* Create Routine Modal */}
      <WebCreateRoutineModal
        visible={showCreateRoutineModal}
        onClose={() => setShowCreateRoutineModal(false)}
        onSuccess={handleRoutineCreated}
      />

      {/* Create Exercise Modal */}
      <WebCreateExerciseModal
        visible={showCreateExerciseModal}
        onClose={() => setShowCreateExerciseModal(false)}
        onSuccess={handleExerciseCreated}
      />

      {/* Program Structure Modal */}
      <ProgramStructureModal
        visible={showProgramStructureModal}
        program={selectedProgram}
        onClose={() => {
          setShowProgramStructureModal(false);
          setSelectedProgram(null);
        }}
      />

      {/* Editable Program Structure Modal */}
      <EditableProgramStructureModal
        visible={showEditProgramModal}
        program={selectedProgram}
        onClose={() => {
          setShowEditProgramModal(false);
          setSelectedProgram(null);
        }}
        onSave={handleProgramSaved}
      />

      {/* Edit Exercise Modal */}
      <WebCreateExerciseModal
        visible={showEditExerciseModal}
        onClose={() => {
          setShowEditExerciseModal(false);
          setSelectedExercise(null);
        }}
        onSuccess={() => {
          fetchExercises();
          setShowEditExerciseModal(false);
          setSelectedExercise(null);
        }}
        editingExercise={selectedExercise}
      />

      {/* User Logbook Modal */}
      <WebUserLogbookModal
        visible={showUserLogbookModal}
        user={selectedUserForLogbook}
        onClose={() => {
          setShowUserLogbookModal(false);
          setSelectedUserForLogbook(null);
        }}
      />

      {/* Delete Program Confirmation Modal */}
      {showDeleteConfirmation && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Program</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{programToDelete?.name}"? 
              {'\n\n'}
              This action cannot be undone and will also delete all associated routines and exercises.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton}
                onPress={handleCancelDelete}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteModalConfirmButton}
                onPress={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delete Exercise Confirmation Modal */}
      {showDeleteExerciseConfirmation && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Exercise</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{exerciseToDelete?.title}"? 
              {'\n\n'}
              This action cannot be undone and will remove the exercise from any routines that use it.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton}
                onPress={handleCancelDeleteExercise}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteModalConfirmButton}
                onPress={handleConfirmDeleteExercise}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

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
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
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
    overflow: 'hidden',
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
