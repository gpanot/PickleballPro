import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
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
import AdminSidebar from './admindashboard/AdminSidebar';
import ProgramsTable from './admindashboard/components/ProgramsTable';
import ExercisesTable from './admindashboard/components/ExercisesTable';
import RoutinesTable from './admindashboard/components/RoutinesTable';
import CategoriesTable from './admindashboard/components/CategoriesTable';
import WebUserLogbookModal from '../components/WebUserLogbookModal';
import skillsData from '../data/Commun_skills_tags.json';
import AdminTopBar from './admindashboard/components/AdminTopBar';
import styles from './admindashboard/adminDashboardStyles';

const getSkillNamesFromFocusAreas = (focusAreas) => {
  if (!Array.isArray(focusAreas) || focusAreas.length === 0) {
    return [];
  }

  const allSkills = Object.values(skillsData.skillCategories).flatMap(category => category.skills);

  return focusAreas
    .map(focusAreaId => allSkills.find(skill => skill.id === focusAreaId))
    .filter(Boolean);
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
  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [showProgramStructureModal, setShowProgramStructureModal] = useState(false);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
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
  const [coachToDelete, setCoachToDelete] = useState(null);
  const [showDeleteCoachConfirmation, setShowDeleteCoachConfirmation] = useState(false);
  const [programSortField, setProgramSortField] = useState(null);
  const [programSortDirection, setProgramSortDirection] = useState('asc');
  const [exerciseSortField, setExerciseSortField] = useState(null);
  const [exerciseSortDirection, setExerciseSortDirection] = useState('asc');
  const [exerciseFilterProgram, setExerciseFilterProgram] = useState(null);
  const [exerciseFilterRoutine, setExerciseFilterRoutine] = useState(null);
  const [showProgramFilterDropdown, setShowProgramFilterDropdown] = useState(false);
  const [showRoutineFilterDropdown, setShowRoutineFilterDropdown] = useState(false);
  const [exerciseProgramOptions, setExerciseProgramOptions] = useState([]);
  const [exerciseRoutineOptions, setExerciseRoutineOptions] = useState([]);
  const [routineFilterProgram, setRoutineFilterProgram] = useState(null);
  const [routineProgramOptions, setRoutineProgramOptions] = useState([]);
  const [showRoutineProgramFilterDropdown, setShowRoutineProgramFilterDropdown] = useState(false);
  const [routineSortField, setRoutineSortField] = useState(null);
  const [routineSortDirection, setRoutineSortDirection] = useState('asc');
  

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
              id,
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
                routineExerciseId: re.id,
                exerciseId: re.exercises.id,
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

  const handleEditRoutine = (routine) => {
    setSelectedRoutine(routine);
    setShowEditRoutineModal(true);
    setActiveDropdown(null);
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
      
      const exercisesData = data || [];
      const exerciseIds = exercisesData.map(ex => ex.id).filter(Boolean);

      let routineLinksByExercise = {};

      if (exerciseIds.length > 0) {
        const { data: routineLinks, error: routineLinksError } = await supabase
          .from('routine_exercises')
          .select(`
            exercise_id,
            routines!inner(
              id,
              name,
              programs!inner(
                id,
                name
              )
            )
          `)
          .in('exercise_id', exerciseIds);

        if (routineLinksError) {
          console.error('Error fetching routine links for exercises:', routineLinksError);
        } else {
          routineLinksByExercise = routineLinks.reduce((acc, link) => {
            if (!link || !link.exercise_id) {
              return acc;
            }

            const routine = link.routines || {};
            const program = routine.programs || {};

            const routineEntry = {
              id: routine.id || null,
              name: routine.name || null,
              program: program.id ? { id: program.id, name: program.name || null } : null
            };

            if (!acc[link.exercise_id]) {
              acc[link.exercise_id] = [];
            }
            acc[link.exercise_id].push(routineEntry);
            return acc;
          }, {});
        }
      }

      const exercisesWithRelations = exercisesData.map(exercise => {
        const linkedRoutines = (routineLinksByExercise[exercise.id] || []).filter(r => r.id && r.name);
        const sortedRoutines = [...linkedRoutines].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const programMap = new Map();
        sortedRoutines.forEach(routine => {
          if (routine.program?.id) {
            programMap.set(routine.program.id, routine.program.name || '');
          }
        });

        const linkedPrograms = Array.from(programMap.entries()).map(([id, name]) => ({ id, name }));
        const sortedPrograms = [...linkedPrograms].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return {
          ...exercise,
          linkedRoutines: sortedRoutines,
          linkedPrograms: sortedPrograms,
          primaryRoutineName: sortedRoutines[0]?.name || null,
          primaryProgramName: sortedPrograms[0]?.name || null
        };
      });

      setExercises(exercisesWithRelations);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const programSet = new Set();
    const routineSet = new Set();

    exercises.forEach(exercise => {
      (exercise.linkedPrograms || []).forEach(program => {
        if (program?.name) {
          programSet.add(program.name);
        }
      });
      (exercise.linkedRoutines || []).forEach(routine => {
        if (routine?.name) {
          routineSet.add(routine.name);
        }
      });
    });

    const programList = Array.from(programSet).sort((a, b) => a.localeCompare(b));
    const routineList = Array.from(routineSet).sort((a, b) => a.localeCompare(b));

    setExerciseProgramOptions(programList);
    setExerciseRoutineOptions(routineList);

    setExerciseFilterProgram(prev => (prev && !programSet.has(prev) ? null : prev));
    setExerciseFilterRoutine(prev => (prev && !routineSet.has(prev) ? null : prev));
  }, [exercises]);

  useEffect(() => {
    const programSet = new Set();

    routines.forEach(routine => {
      if (routine.programs?.name) {
        programSet.add(routine.programs.name);
      }
    });

    const programList = Array.from(programSet).sort((a, b) => a.localeCompare(b));

    setRoutineProgramOptions(programList);
    setRoutineFilterProgram(prev => (prev && !programSet.has(prev) ? null : prev));
  }, [routines]);

  useEffect(() => {
    if (contentTab !== 'routines') {
      setShowRoutineProgramFilterDropdown(false);
    }
  }, [contentTab]);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select(`
          *,
          users:user_id (
            id,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out reset coaches (coaches that have been "deleted" - reset to new profile state)
      // A reset coach is one where name is null/empty or is_active is explicitly false
      const activeCoaches = (data || []).filter(coach => {
        // Must have a valid name
        const hasName = coach.name && typeof coach.name === 'string' && coach.name.trim() !== '';
        // Must be explicitly active (not false, null, or undefined)
        const isActive = coach.is_active === true;
        // Only include coaches that have both a name and are active
        return hasName && isActive;
      });
      
      console.log(`📊 Filtered coaches: ${(data || []).length} total, ${activeCoaches.length} active`);
      
      setCoaches(activeCoaches);

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
    console.log('🔴 handleSignOut called');
    console.log('🔴 navigation object:', navigation);
    
    if (!navigation) {
      console.error('❌ Navigation object is undefined!');
      Alert.alert('Error', 'Navigation is not available');
      return;
    }
    
    Alert.alert(
      'Exit Admin Dashboard',
      'Return to your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'default',
          onPress: () => {
            console.log('🔴 Exit pressed, navigating back...');
            try {
              navigation.goBack();
              console.log('✅ Navigation goBack() called successfully');
            } catch (error) {
              console.error('❌ Error navigating back:', error);
            }
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
          { id: 'categories', label: 'Category Order (Library Tab)', icon: 'reorder-three-outline' }
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
      {contentTab === 'programs' ? (
        <ProgramsTable
          programs={programs}
          loading={loading}
          searchQuery={searchQuery}
          programSortField={programSortField}
          programSortDirection={programSortDirection}
          setProgramSortField={setProgramSortField}
          setProgramSortDirection={setProgramSortDirection}
          reorderingProgramId={reorderingProgramId}
          reorderProgram={reorderProgram}
          handleViewProgramStructure={handleViewProgramStructure}
          handleEditProgramStructure={handleEditProgramStructure}
          handleDeleteProgram={handleDeleteProgram}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          styles={styles}
        />
      ) : 
       contentTab === 'exercises' ? (
        <ExercisesTable
          exercises={exercises}
          loading={loading}
          searchQuery={searchQuery}
          exerciseSortField={exerciseSortField}
          exerciseSortDirection={exerciseSortDirection}
          setExerciseSortField={setExerciseSortField}
          setExerciseSortDirection={setExerciseSortDirection}
          exerciseFilterProgram={exerciseFilterProgram}
          setExerciseFilterProgram={setExerciseFilterProgram}
          exerciseFilterRoutine={exerciseFilterRoutine}
          setExerciseFilterRoutine={setExerciseFilterRoutine}
          exerciseProgramOptions={exerciseProgramOptions}
          exerciseRoutineOptions={exerciseRoutineOptions}
          showProgramFilterDropdown={showProgramFilterDropdown}
          setShowProgramFilterDropdown={setShowProgramFilterDropdown}
          showRoutineFilterDropdown={showRoutineFilterDropdown}
          setShowRoutineFilterDropdown={setShowRoutineFilterDropdown}
          togglePublishStatus={togglePublishStatus}
          handleEditExercise={handleEditExercise}
          handleDeleteExercise={handleDeleteExercise}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          styles={styles}
        />
      ) : 
       contentTab === 'routines' ? (
        <RoutinesTable
          routines={routines}
          loading={loading}
          searchQuery={searchQuery}
          routineFilterProgram={routineFilterProgram}
          setRoutineFilterProgram={setRoutineFilterProgram}
          routineProgramOptions={routineProgramOptions}
          showRoutineProgramFilterDropdown={showRoutineProgramFilterDropdown}
          setShowRoutineProgramFilterDropdown={setShowRoutineProgramFilterDropdown}
          routineSortField={routineSortField}
          routineSortDirection={routineSortDirection}
          setRoutineSortField={setRoutineSortField}
          setRoutineSortDirection={setRoutineSortDirection}
          handleEditRoutine={handleEditRoutine}
          styles={styles}
        />
      ) :
       contentTab === 'categories' ? (
        <CategoriesTable
          categories={categories}
          programs={programs}
          searchQuery={searchQuery}
          hasUnsavedCategoryChanges={hasUnsavedCategoryChanges}
          savingCategoryOrder={savingCategoryOrder}
          saveCategoryOrder={saveCategoryOrder}
          reorderCategory={reorderCategory}
          editingCategoryId={editingCategoryId}
          editingCategoryName={editingCategoryName}
          setEditingCategoryName={setEditingCategoryName}
          handleEditCategory={handleEditCategory}
          handleCancelCategoryEdit={handleCancelCategoryEdit}
          handleSaveCategoryName={handleSaveCategoryName}
          styles={styles}
        />
      ) : null}
    </View>
  );

  const renderCategoriesTable = () => {
    const filteredCategories = categories.filter(category => 
      category.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Category Order (Library Tab)</Text>
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
              {(() => {
                // Get user avatar URL - prioritize user avatar over coach avatar
                // Handle both object and array cases from Supabase relationship
                const userAvatarUrl = Array.isArray(coach.users) 
                  ? coach.users[0]?.avatar_url 
                  : coach.users?.avatar_url;
                const avatarUrl = userAvatarUrl || coach.avatar_url;
                
                return avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={styles.coachAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.coachAvatarText}>{getCoachInitials(coach.name)}</Text>
                );
              })()}
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
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.modernActionButton}
                onPress={() => {
                  const newDropdown = activeDropdown === `coach_${coach.id}` ? null : `coach_${coach.id}`;
                  console.log('⋯ Three dots clicked for coach:', coach.name, 'Setting dropdown to:', newDropdown);
                  setActiveDropdown(newDropdown);
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
              </TouchableOpacity>
              {activeDropdown === `coach_${coach.id}` && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      console.log('🗑️ Delete button clicked for coach:', coach.name, coach.id);
                      handleDeleteCoach(coach);
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

  const handleDeleteCoach = (coach) => {
    console.log('🗑️ Delete coach clicked:', coach.name, coach.id);
    setCoachToDelete(coach);
    setShowDeleteCoachConfirmation(true);
    setActiveDropdown(null);
  };

  const handleConfirmDeleteCoach = async () => {
    if (!coachToDelete) return;
    
    console.log('✅ User confirmed coach delete - starting reset process');
    
    try {
      console.log('🔄 Setting loading to true');
      setLoading(true);
      setShowDeleteCoachConfirmation(false);
      
      console.log('🎯 Coach details:', {
        id: coachToDelete.id,
        name: coachToDelete.name,
        type: typeof coachToDelete.id
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
      
      console.log('✅ User is admin, proceeding with coach reset');
      
      // Reset all coach fields to default/null values (like a new profile)
      // Start with is_active = false to hide from view, then clear other fields
      console.log('🚀 Resetting coach profile...');
      
      // First, set is_active to false to immediately hide from the list
      const updatePayload = {
        email: null,
        bio: null,
        avatar_url: null,
        location: null,
        specialties: null,
        hourly_rate: null,
        rating_avg: null,
        rating_count: null,
        dupr_rating: null,
        is_verified: false,
        is_active: false, // This is the critical field - must be false
        updated_at: new Date().toISOString(),
        name: '' // Try to clear name (may fail if NOT NULL constraint exists)
      };
      
      const { data: updateData, error: resetError } = await supabase
        .from('coaches')
        .update(updatePayload)
        .eq('id', coachToDelete.id)
        .select(); // Select to verify the update

      console.log('📥 Reset result:', { updateData, resetError });

      if (resetError) {
        console.error('❌ Reset error:', resetError);
        // If name constraint is the issue, try again without clearing name
        if (resetError.message?.includes('name') || resetError.message?.includes('NOT NULL')) {
          console.log('⚠️ Name field has constraint, retrying without clearing name...');
          const { name, ...retryPayload } = updatePayload; // Remove name from retry
          const { data: retryData, error: retryError } = await supabase
            .from('coaches')
            .update(retryPayload)
            .eq('id', coachToDelete.id)
            .select();
            
          if (retryError) {
            throw retryError;
          }
          
          console.log('✅ Retry successful:', retryData);
          const updatedCoach = retryData[0];
          console.log('✅ Coach reset verification:', {
            id: updatedCoach.id,
            name: updatedCoach.name,
            is_active: updatedCoach.is_active
          });
          
          Alert.alert('Success', `Coach "${coachToDelete.name}" has been reset and removed from the management view.`);
          fetchCoaches();
          return;
        }
        throw resetError;
      }

      // Verify the update was successful
      if (!updateData || updateData.length === 0) {
        throw new Error('Coach reset failed - no rows were updated');
      }

      const updatedCoach = updateData[0];
      console.log('✅ Coach reset verification:', {
        id: updatedCoach.id,
        name: updatedCoach.name || '(cleared)',
        is_active: updatedCoach.is_active
      });
      
      // Double-check that is_active was set to false
      if (updatedCoach.is_active !== false) {
        console.error('⚠️ Warning: is_active was not set to false!', updatedCoach);
        // Force it to false in another update
        await supabase
          .from('coaches')
          .update({ is_active: false })
          .eq('id', coachToDelete.id);
      }

      console.log('🎉 Coach reset successful');
      Alert.alert('Success', `Coach "${coachToDelete.name}" has been reset and removed from the management view.`);
      
      console.log('🔄 Refreshing coaches list...');
      fetchCoaches();
      
    } catch (error) {
      console.error('💥 Error in reset process:', error);
      console.error('💥 Error stack:', error.stack);
      Alert.alert('Error', `Failed to reset coach: ${error.message}`);
    } finally {
      console.log('🏁 Cleaning up - setting loading false and resetting states');
      setLoading(false);
      setCoachToDelete(null);
    }
  };

  const handleCancelDeleteCoach = () => {
    console.log('❌ User cancelled coach delete');
    setShowDeleteCoachConfirmation(false);
    setCoachToDelete(null);
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
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        profile={profile}
        user={user}
        onSignOut={handleSignOut}
        styles={styles}
      />
      <View style={[styles.mainContent, { marginLeft: sidebarWidth }]}>
        <AdminTopBar
          activeTab={activeTab}
          sidebarWidth={sidebarWidth}
          loading={loading}
          handleRefresh={handleRefresh}
          setShowCreateProgramModal={setShowCreateProgramModal}
          setShowCreateRoutineModal={setShowCreateRoutineModal}
          setShowCreateExerciseModal={setShowCreateExerciseModal}
          setShowAddCoachModal={setShowAddCoachModal}
          setShowAddUserModal={setShowAddUserModal}
          styles={styles}
        />
        <ScrollView 
          style={styles.contentScrollView} 
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            setActiveDropdown(null);
            setShowProgramFilterDropdown(false);
            setShowRoutineFilterDropdown(false);
            setShowRoutineProgramFilterDropdown(false);
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => {
              setActiveDropdown(null);
              setShowProgramFilterDropdown(false);
              setShowRoutineFilterDropdown(false);
              setShowRoutineProgramFilterDropdown(false);
            }}
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
      <WebCreateRoutineModal
        visible={showEditRoutineModal}
        onClose={() => {
          setShowEditRoutineModal(false);
          setSelectedRoutine(null);
        }}
        onSuccess={() => {
          fetchRoutines();
          setShowEditRoutineModal(false);
          setSelectedRoutine(null);
          handleRoutineCreated();
        }}
        editingRoutine={selectedRoutine}
        programId={selectedRoutine?.program_id}
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

      {/* Delete Coach Confirmation Modal */}
      {showDeleteCoachConfirmation && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Coach</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to reset "{coachToDelete?.name}"? 
              {'\n\n'}
              This will reset all coach information to a new profile state. The coach will no longer be visible in Coach Management. This action cannot be undone.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton}
                onPress={handleCancelDeleteCoach}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteModalConfirmButton}
                onPress={handleConfirmDeleteCoach}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Reset Coach</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
