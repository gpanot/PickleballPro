import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
  Share,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { generateAIProgram, validateUserForAIGeneration, saveAIProgram, syncUnsyncedAIPrograms } from '../lib/aiProgramGenerator';
import { supabase, getPrograms, transformProgramData, getStudentCode, getProgramDetails } from '../lib/supabase';
import { usePreload } from '../context/PreloadContext';
import WebIcon from '../components/WebIcon';
import WebLinearGradient from '../components/WebLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import {
  Target,
  Crosshair,
  BookOpen,
  Trophy,
  Dumbbell,
  Brain,
  Flower2,
  PersonStanding,
  Zap,
  CircleDot,
  Plus,
} from 'lucide-react-native';
import { useLastOpenedProgram } from '../hooks/useLastOpenedProgram';
import { ProgramSkeletonCard, CoachSkeletonCard, ImageWithSkeleton } from '../components/SkeletonCard';
import { useActiveTraining } from '../hooks/useActiveTraining';
import {
  matchRoadToXProgram,
  getAllSkillFocusPrograms,
  getSkillsWithPrograms,
  getProgramsForSkill,
} from '../lib/trainingTracksApi';
import { getSkillGroups } from '../lib/skillTaxonomy';
import PrimaryGoalCard from '../components/training/PrimaryGoalCard';
import SkillFocusCard from '../components/training/SkillFocusCard';
import EnrollmentConfirmSheet from '../components/training/EnrollmentConfirmSheet';
import WelcomeCard from '../components/training/WelcomeCard';
import SwipeableRow from '../components/SwipeableRow';
import EmptyState from '../components/EmptyState';
import { SkillIconBadge } from '../components/SkillIcon';

const { width, height } = Dimensions.get('window');

function CategoryIcon({ category, size = 24, color = '#6366F1' }) {
  const iconProps = { size, color, strokeWidth: 2 };
  switch ((category || '').toLowerCase()) {
    case 'pro training': return <Trophy {...iconProps} />;
    case 'fundamentals': return <BookOpen {...iconProps} />;
    case 'technique': return <Target {...iconProps} />;
    case 'fitness': return <Dumbbell {...iconProps} />;
    case 'strategy': return <Brain {...iconProps} />;
    case 'mental game': return <Flower2 {...iconProps} />;
    case 'conditioning': return <PersonStanding {...iconProps} />;
    case 'drills': return <Zap {...iconProps} />;
    default: return <CircleDot {...iconProps} />;
  }
}

// Enhanced responsive thumbnail sizing for iPad portrait mode
const getThumbnailSize = (screenWidth, screenHeight) => {
  // Special optimization for iPad portrait mode (768x1024)
  if (screenWidth === 768 && screenHeight >= 1024) {
    return { width: 90, height: 135 }; // Larger thumbnails for iPad portrait
  }
  if (screenWidth >= 768) {
    return { width: 80, height: 120 }; // Larger thumbnails for tablets
  }
  return { width: 60, height: 100 }; // Default for phones
};

// Responsive design helper functions for Library tab (from ExploreTrainingScreen)
const getColumnsForWidth = (screenWidth, screenHeight) => {
  // Special handling for iPad portrait mode (768x1024)
  if (screenWidth === 768 && screenHeight >= 1024) return 3; // iPad portrait - 3 columns
  if (screenWidth >= 1024) return 4; // Large tablets landscape (iPad Pro, etc.)
  if (screenWidth >= 768) return 3;  // iPad mini, standard tablets
  if (screenWidth >= 480) return 2;  // Large phones, small tablets
  return 2; // Default for phones
};

const getCardWidth = (screenWidth, screenHeight) => {
  const columns = getColumnsForWidth(screenWidth, screenHeight);
  // Optimized padding for iPad portrait mode
  const padding = (screenWidth === 768 && screenHeight >= 1024) ? 24 : 16;
  const margin = 12; // Slightly larger margin for better spacing
  const totalHorizontalSpace = padding * 2 + margin * (columns - 1);
  return (screenWidth - totalHorizontalSpace) / columns;
};

const getHorizontalCardWidth = (screenWidth, screenHeight) => {
  const cardWidth = getCardWidth(screenWidth, screenHeight);
  return cardWidth * 0.85; // Slightly smaller for horizontal scroll
};

// Enhanced thumbnail height calculation for portrait mode
const getThumbnailHeight = (screenWidth, screenHeight) => {
  const cardWidth = getCardWidth(screenWidth, screenHeight);
  // For iPad portrait, use a better aspect ratio
  if (screenWidth === 768 && screenHeight >= 1024) {
    return Math.max(180, cardWidth * 0.8); // Taller thumbnails for portrait
  }
  return Math.max(160, cardWidth * 0.75);
};

export default function ProgramScreen({ navigation, route }) {
  const { user } = useUser();
  const {
    getDataWithFallback,
    hasPreloadedData,
    isDataLoading,
    refreshData,
    getDataError,
    programs: preloadedPrograms,
  } = usePreload();
  const insets = useSafeAreaInsets();
  const { logbookTheme: t, isDark } = useTheme();
  const [currentView, setCurrentView] = React.useState(
    route.params?.initialView || 'myTraining'
  ); // 'myTraining', 'coach', 'programs', 'library' or 'fun'
  const [programs, setPrograms] = React.useState([]);
  const [showCreateProgramModal, setShowCreateProgramModal] = React.useState(false);
  const [newProgramName, setNewProgramName] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isCoachProgram, setIsCoachProgram] = React.useState(false);
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = React.useState(true);
  const [aiGenerationStep, setAiGenerationStep] = React.useState(0);

  // My Training state
  const {
    tracks,
    primaryTrack,
    skillTracks,
    skillSlotsFull,
    loading: tracksLoading,
    refreshing: tracksRefreshing,
    loadTracks,
    refreshTracks,
    enrollAsPrimary,
    enrollAsSkill,
    enrollWithRole,
    archiveTrack,
    saveProgram,
  } = useActiveTraining();
  const [enrollSheetProgram, setEnrollSheetProgram] = React.useState(null);
  const [enrollSheetRole, setEnrollSheetRole] = React.useState('primary');
  const [enrollSheetVisible, setEnrollSheetVisible] = React.useState(false);
  const [enrollLoading, setEnrollLoading] = React.useState(false);
  const [archiveConfirmProgram, setArchiveConfirmProgram] = React.useState(null);
  const [archiveConfirmVisible, setArchiveConfirmVisible] = React.useState(false);
  const [completedRoutinesByProgram, setCompletedRoutinesByProgram] = React.useState({});
  const [recommendedRoadProgram, setRecommendedRoadProgram] = React.useState(null);
  const [allSkillPrograms, setAllSkillPrograms] = React.useState([]);
  const [showSkillPicker, setShowSkillPicker] = React.useState(false);
  // Two-step skill picker
  const [skillPickerStep, setSkillPickerStep] = React.useState('skill'); // 'skill' | 'program'
  const [selectedPickerSkill, setSelectedPickerSkill] = React.useState(null); // { skill, programs[] }
  const [toastMessage, setToastMessage] = React.useState(null);
  
  // Coach Program tab state
  const [coachPrograms, setCoachPrograms] = React.useState([]);
  const [coachProgramsLoading, setCoachProgramsLoading] = React.useState(true);
  const [coachProgramsError, setCoachProgramsError] = React.useState(null);
  const [hasCoachRelationship, setHasCoachRelationship] = React.useState(false);
  const [hasAssessment, setHasAssessment] = React.useState(false);
  const [studentCode, setStudentCode] = React.useState(null);
  const [coaches, setCoaches] = React.useState([]); // Store all coaches
  const [coachAvatarErrors, setCoachAvatarErrors] = React.useState({}); // Track failed avatar loads
  const coachProgramsLoadedRef = React.useRef(false);
  const coachRotateAnim = React.useRef(new Animated.Value(0)).current;
  const { lastProgram, saveLastProgram } = useLastOpenedProgram();
  
  // Library tab state (ExploreTrainingScreen content)
  const [explorePrograms, setExplorePrograms] = React.useState([]);
  const [libraryLoading, setLibraryLoading] = React.useState(true);
  const [libraryError, setLibraryError] = React.useState(null);
  const [libraryRefreshing, setLibraryRefreshing] = React.useState(false);
  const [savedCategoryOrder, setSavedCategoryOrder] = React.useState([]);
  
  // Animation for library loading
  const libraryRotateAnim = React.useRef(new Animated.Value(0)).current;
  
  // Animation for rotating ball
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const aiRotateAnim = React.useRef(new Animated.Value(0)).current;

  // Load programs when component mounts
  React.useEffect(() => {
    if (user?.id) {
      loadPrograms();
      loadCoachPrograms();
      loadActiveTracks();
      
      // Always preload library data for faster access
      fetchLibraryPrograms();
      fetchCategoryOrder();
    }
  }, [user?.id]);

  // React to initialView / refreshTracks route param changes (e.g. after enroll from ProgramDetail)
  React.useEffect(() => {
    if (route.params?.initialView) {
      setCurrentView(route.params.initialView);
    }
    if (route.params?.refreshTracks) {
      refreshTracks();
    }
    if (route.params?.initialView || route.params?.refreshTracks) {
      navigation.setParams({ initialView: undefined, refreshTracks: undefined });
    }
  }, [route.params?.initialView, route.params?.refreshTracks, refreshTracks, navigation]);

  // Reload library data when switching to Library tab (if not already loaded)
  React.useEffect(() => {
    if (currentView === 'library' && explorePrograms.length === 0 && !libraryLoading) {
      fetchLibraryPrograms();
      fetchCategoryOrder();
    }
  }, [currentView]);

  // Don't reload coach programs on tab switch - only load once on mount

  // Start rotation animation when loading
  React.useEffect(() => {
    if (isLoadingPrograms) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      
      return () => {
        rotateAnimation.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [isLoadingPrograms, rotateAnim]);

  // Start library rotation animation when loading
  React.useEffect(() => {
    if (libraryLoading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(libraryRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      
      return () => {
        rotateAnimation.stop();
        libraryRotateAnim.setValue(0);
      };
    }
  }, [libraryLoading, libraryRotateAnim]);

  // Start coach programs rotation animation when loading
  React.useEffect(() => {
    if (coachProgramsLoading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(coachRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      
      return () => {
        rotateAnimation.stop();
        coachRotateAnim.setValue(0);
      };
    }
  }, [coachProgramsLoading, coachRotateAnim]);

  // Start AI generation animation and progress steps
  React.useEffect(() => {
    if (isGeneratingAI) {
      // Start ball rotation animation
      const aiRotateAnimation = Animated.loop(
        Animated.timing(aiRotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      aiRotateAnimation.start();
      
      // Progress through different steps to make it feel complex
      const progressSteps = [
        { step: 0, delay: 0 },     // Analyzing your profile...
        { step: 1, delay: 2000 },  // Finding perfect exercises...
        { step: 2, delay: 4000 },  // Building your routines...
        { step: 3, delay: 6500 },  // Finalizing your program...
      ];
      
      const timeouts = progressSteps.map(({ step, delay }) => 
        setTimeout(() => setAiGenerationStep(step), delay)
      );
      
      return () => {
        aiRotateAnimation.stop();
        aiRotateAnim.setValue(0);
        timeouts.forEach(timeout => clearTimeout(timeout));
        setAiGenerationStep(0);
      };
    }
  }, [isGeneratingAI, aiRotateAnim]);

  // Handle new program added from Explore
  React.useEffect(() => {
    if (route.params?.newProgram) {
      const newProgram = route.params.newProgram;
      setPrograms(prev => {
        // Check if program already exists to avoid duplicates
        const exists = prev.some(p => p.name === newProgram.name);
        if (!exists) {
          return [...prev, newProgram];
        }
        return prev;
      });
      
      // Clear the parameter to avoid re-adding on subsequent navigations
      navigation.setParams({ newProgram: undefined });
    }
  }, [route.params?.newProgram, navigation]);

  // Static exercises for customized tab
  const staticExercises = {
    dinks: [
      { id: "1.1", name: "Dink Wall Drill", target: "15 consecutive soft dinks", difficulty: 2, description: "Practice consistent dinking against a wall" },
      { id: "1.2", name: "Cross-Court Dinks", target: "8 consecutive cross-court dinks", difficulty: 2, description: "Develop cross-court dinking accuracy" },
      { id: "1.3", name: "Dink Targets", target: "6/12 land in NVZ cones", difficulty: 3, description: "Precision dinking to specific targets" },
      { id: "s3.1", name: "Advanced Cross-Court Dinks", target: "12/15 in NVZ", difficulty: 3, description: "From Net Play Excellence session" }
    ],
    drives: [
      { id: "2.1", name: "FH Drive Depth", target: "7/10 beyond NVZ", difficulty: 2, description: "Forehand drive depth control" },
      { id: "2.2", name: "BH Drive Depth", target: "6/10 beyond NVZ", difficulty: 3, description: "Backhand drive depth control" },
      { id: "2.3", name: "Drive & Recover", target: "5-drive sequence", difficulty: 3, description: "Drive and return to ready position" },
      { id: "s4.1", name: "Power Drive Targets", target: "7/12 to corners", difficulty: 4, description: "From Power & Placement session" }
    ],
    serves: [
      { id: "6.1", name: "Deep Serve Mastery", target: "7/10 in back third", difficulty: 3, description: "Consistent deep serving" },
      { id: "6.2", name: "Spin Serve", target: "5/10 with visible spin", difficulty: 4, description: "Develop spin serve technique" },
      { id: "6.3", name: "Serve Placement Drill", target: "4/6 to chosen corner", difficulty: 3, description: "Precise serve placement" },
      { id: "s1.1", name: "Corner Placement Serves", target: "8/12 to chosen corners", difficulty: 3, description: "From Serve & Return Mastery session" }
    ],
    returns: [
      { id: "s1.2", name: "Deep Return Practice", target: "7/10 past midline", difficulty: 3, description: "Return serves deep into court" },
      { id: "s1.3", name: "Return & Approach", target: "5/8 successful approaches", difficulty: 4, description: "Return and move to net" },
      { id: "r1", name: "Defensive Returns", target: "6/10 successful defensive returns", difficulty: 3, description: "Master defensive return shots" }
    ],
    volleys: [
      { id: "s3.2", name: "Volley Positioning", target: "8/10 clean volleys", difficulty: 3, description: "Perfect volley positioning" },
      { id: "s3.3", name: "Attack the High Ball", target: "6/8 putaway attempts", difficulty: 4, description: "Aggressive high ball volleys" },
      { id: "v1", name: "Reflex Volleys", target: "10/15 quick volleys", difficulty: 4, description: "Improve volley reaction time" }
    ],
    others: [
      { id: "7.1", name: "Drop Consistency", target: "6/10 into NVZ", difficulty: 3, description: "Master the critical third shot" },
      { id: "7.2", name: "Target Drops", target: "4/10 to backhand corner", difficulty: 4, description: "Precision third shot drops" },
      { id: "s4.2", name: "Lob Placement", target: "5/8 over opponent", difficulty: 3, description: "Effective lob placement" },
      { id: "s5.3", name: "Court Positioning", target: "8/10 optimal positions", difficulty: 4, description: "Maintain optimal court position" },
      { id: "s6.3", name: "Endurance Rally", target: "25+ shot rallies", difficulty: 4, description: "Long rally endurance training" }
    ]
  };

  // Program management functions
  
  // ─── My Training helpers ───────────────────────────────────────────────────

  const loadActiveTracks = React.useCallback(async () => {
    await refreshTracks();
  }, [refreshTracks]);

  // Load completed routine IDs from AsyncStorage for all active tracks
  const loadCompletedRoutines = React.useCallback(async (trackList) => {
    const result = {};
    for (const t of trackList) {
      const key = `@pickleHero_progress_${t.program.id}`;
      try {
        const raw = await AsyncStorage.getItem(key);
        result[t.program.id] = raw ? JSON.parse(raw) : [];
      } catch {
        result[t.program.id] = [];
      }
    }
    setCompletedRoutinesByProgram(result);
  }, []);

  // Match recommended Road-to-X and skill programs from library catalog
  const matchRecommendations = React.useCallback((allProgramsList) => {
    const userDupr = user?.dupr_rating ? parseFloat(user.dupr_rating) : null;
    const roadMatch = matchRoadToXProgram(userDupr, allProgramsList);
    setRecommendedRoadProgram(roadMatch || null);
    setAllSkillPrograms(getAllSkillFocusPrograms(allProgramsList));
  }, [user?.dupr_rating]);

  // Skill picker helpers
  const skillsWithPrograms = React.useMemo(
    () => getSkillsWithPrograms(allSkillPrograms),
    [allSkillPrograms]
  );

  const openSkillPicker = () => {
    setSkillPickerStep('skill');
    setSelectedPickerSkill(null);
    setShowSkillPicker(true);
    if (allSkillPrograms.length === 0) {
      fetchLibraryPrograms();
    }
  };

  // Refresh local session progress when returning to My Training (no network reload)
  React.useEffect(() => {
    if (currentView === 'myTraining' && tracks.length > 0) {
      loadCompletedRoutines(tracks);
    }
  }, [currentView, tracks, loadCompletedRoutines]);

  // After library programs load, compute recommendations
  React.useEffect(() => {
    if (explorePrograms.length > 0) {
      matchRecommendations(explorePrograms);
    }
  }, [explorePrograms, matchRecommendations]);

  // Sync preloaded catalog when auth preload finishes after mount
  React.useEffect(() => {
    if (preloadedPrograms?.length > 0 && explorePrograms.length === 0) {
      setExplorePrograms(preloadedPrograms);
      setLibraryLoading(false);
      setLibraryError(null);
    }
  }, [preloadedPrograms, explorePrograms.length]);

  const showToast = React.useCallback((message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 2500);
    }
  }, []);

  const openEnrollSheet = (program, role = 'primary') => {
    setEnrollSheetProgram(program);
    setEnrollSheetRole(role);
    setEnrollSheetVisible(true);
  };

  const handleEnrollConfirm = async (role) => {
    if (!enrollSheetProgram) return;
    // Capture name before nulling the state
    const programName = enrollSheetProgram.name;
    const programId = enrollSheetProgram.id;
    setEnrollLoading(true);
    try {
      await enrollWithRole(programId, role);
      setEnrollSheetVisible(false);
      setEnrollSheetProgram(null);
      // Switch to My Training tab and show toast
      setCurrentView('myTraining');
      const roleLabel = role === 'primary' ? 'primary focus' : 'skill focus';
      showToast(`${programName} is now your ${roleLabel}`);
    } catch (err) {
      Alert.alert('Could not enroll', err?.message || 'Please try again.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleArchiveTrack = async (programId) => {
    try {
      await archiveTrack(programId);
      setArchiveConfirmVisible(false);
      setArchiveConfirmProgram(null);
    } catch (err) {
      Alert.alert('Error', 'Could not archive track. Please try again.');
    }
  };

  // Navigate to ProgramDetail in training mode — resolving full program details if needed
  const navigateToTrainingDetail = async (track) => {
    try {
      let program = track.program;
      // If routines are missing (slim object), fetch the full detail
      if (!program.routines || program.routines.length === 0) {
        const full = await getProgramDetails(program.id);
        if (full) program = full;
      }
      navigation.navigate('ProgramDetail', {
        program,
        source: 'training',
      });
    } catch (err) {
      console.error('navigateToTrainingDetail error:', err);
      navigation.navigate('ProgramDetail', {
        program: track.program,
        source: 'training',
      });
    }
  };

  // Navigate directly to the last-opened session (resume)
  const navigateToContinueSession = async (track) => {
    try {
      let program = track.program;
      if (!program.routines || program.routines.length === 0) {
        const full = await getProgramDetails(program.id);
        if (full) program = full;
      }

      const routines = (program.routines || []).slice().sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );
      const completedIds = completedRoutinesByProgram[program.id] || [];

      // Pick next uncompleted routine; fall back to last opened
      const nextRoutine =
        routines.find(r => !completedIds.includes(r.id)) ||
        routines.find(r => r.id === track.currentRoutineId) ||
        routines[0];

      if (nextRoutine) {
        navigation.navigate('RoutineDetail', {
          routine: nextRoutine,
          program,
          source: 'training',
        });
      } else {
        navigateToTrainingDetail(track);
      }
    } catch (err) {
      navigateToTrainingDetail(track);
    }
  };

  const openArchiveConfirm = (track) => {
    setArchiveConfirmProgram(track);
    setArchiveConfirmVisible(true);
  };

  const renderMyTrainingSectionHeader = (title, { showAdd, onAdd }) => (
    <View style={styles.myTrainingSectionHeaderRow}>
      <Text style={styles.myTrainingSectionTitle}>{title}</Text>
      {showAdd ? (
        <TouchableOpacity
          style={styles.sectionAddBtn}
          onPress={onAdd}
          activeOpacity={0.85}
          accessibilityLabel={`Add ${title}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={16} color="#6366F1" strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // ─── renderMyTrainingContent ───────────────────────────────────────────────

  const renderMyTrainingContent = () => {
    if (tracksLoading && tracks.length === 0) {
      return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ProgramSkeletonCard />
          <ProgramSkeletonCard />
        </ScrollView>
      );
    }

    const hasActivePrimary = !!primaryTrack;
    const hasActiveSkills = skillTracks.length > 0;

    if (!hasActivePrimary && !hasActiveSkills) {
      // Empty state — show recommendations
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={tracksRefreshing}
              onRefresh={loadActiveTracks}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
        >
          <WelcomeCard />

          <View style={styles.myTrainingEmptyHeader}>
            <Text style={styles.myTrainingEmptyTitle}>What do you want to work on?</Text>
            <Text style={styles.myTrainingEmptySubtitle}>
              Pick one primary focus. You can add up to 2 skill tracks later.
            </Text>
          </View>

          {/* Road to X recommendation */}
          {recommendedRoadProgram && (
            <TouchableOpacity
              style={styles.goalCard}
              onPress={() => openEnrollSheet(recommendedRoadProgram, 'primary')}
              activeOpacity={0.88}
            >
              <View style={styles.goalCardInner}>
                <View style={styles.goalCardLeft}>
                  <Target size={26} color="#4338CA" strokeWidth={2} />
                  <View>
                    <Text style={styles.goalCardTitle}>{recommendedRoadProgram.name}</Text>
                    <Text style={styles.goalCardMeta}>
                      {(recommendedRoadProgram.routines || []).length} sessions
                      {user?.dupr_rating ? ` · DUPR ${parseFloat(user.dupr_rating).toFixed(2)}` : ''}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6366F1" />
              </View>
            </TouchableOpacity>
          )}

          {/* Master a skill */}
          <TouchableOpacity
            style={styles.goalCardSecondary}
            onPress={openSkillPicker}
            activeOpacity={0.88}
          >
            <Crosshair size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.goalCardSecondaryText}>Master a skill</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* Choose from library */}
          <TouchableOpacity
            style={styles.goalCardSecondary}
            onPress={() => setCurrentView('library')}
            activeOpacity={0.88}
          >
            <BookOpen size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.goalCardSecondaryText}>Choose from Library</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      );
    }

    const cardInSwipeStyle = { marginHorizontal: 0, marginBottom: 0 };

    // Active state — show primary card + skill cards
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tracksRefreshing}
            onRefresh={loadActiveTracks}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {renderMyTrainingSectionHeader('Primary Focus', {
          showAdd: !primaryTrack,
          onAdd: () => setCurrentView('library'),
        })}

        {primaryTrack && (
          <View style={styles.swipeRowWrap}>
            <SwipeableRow onDelete={() => openArchiveConfirm(primaryTrack)}>
              <PrimaryGoalCard
                track={primaryTrack}
                completedIds={completedRoutinesByProgram[primaryTrack.program.id] || []}
                onContinue={() => navigateToContinueSession(primaryTrack)}
                onViewAll={() => navigateToTrainingDetail(primaryTrack)}
                onStartNewGoal={() => openArchiveConfirm(primaryTrack)}
                style={cardInSwipeStyle}
              />
            </SwipeableRow>
          </View>
        )}

        {renderMyTrainingSectionHeader('Skill Focus', {
          showAdd: !skillSlotsFull,
          onAdd: openSkillPicker,
        })}

        {skillTracks.map(t => (
          <View key={t.enrollmentId} style={styles.swipeRowWrap}>
            <SwipeableRow onDelete={() => openArchiveConfirm(t)}>
              <SkillFocusCard
                track={t}
                completedIds={completedRoutinesByProgram[t.program.id] || []}
                onContinue={() => navigateToContinueSession(t)}
                onArchive={() => openArchiveConfirm(t)}
                style={cardInSwipeStyle}
              />
            </SwipeableRow>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // ─── Skill picker modal ───────────────────────────────────────────────────

  const renderSkillPickerModal = () => {
    const isStep2 = skillPickerStep === 'program' && selectedPickerSkill;
    const step2Programs = isStep2
      ? getProgramsForSkill(selectedPickerSkill.skill.id, allSkillPrograms)
      : [];

    // Build a lookup: skillId → entry (skill + programs[])
    const skillMap = skillsWithPrograms.reduce((acc, e) => {
      acc[e.skill.id] = e;
      return acc;
    }, {});

    // Groups filtered to only skills that have programs
    const skillGroups = getSkillGroups()
      .map(group => ({
        ...group,
        entries: group.skills
          .map(s => skillMap[s.id])
          .filter(Boolean),
      }))
      .filter(group => group.entries.length > 0);

    const handlePickSkill = (entry) => {
      if (entry.programs.length === 1) {
        navigateToSkillProgram(entry.programs[0]);
      } else {
        setSelectedPickerSkill(entry);
        setSkillPickerStep('program');
      }
    };

    const handlePickProgram = (program) => {
      navigateToSkillProgram(program);
    };

    return (
      <Modal
        visible={showSkillPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSkillPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            {isStep2 ? (
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => { setSkillPickerStep('skill'); setSelectedPickerSkill(null); }}
              >
                <Ionicons name="arrow-back" size={20} color="#6366F1" />
                <Text style={[styles.modalCancelText, { color: '#6366F1', marginLeft: 4 }]}>Skills</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSkillPicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.modalTitle}>
              {isStep2 ? 'Choose a program' : 'Choose a skill'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Step 1 subtitle */}
          {!isStep2 && skillsWithPrograms.length > 0 && (
            <Text style={styles.skillPickerSubtitle}>
              Find a program built around a specific skill.
            </Text>
          )}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

            {/* ── Step 1 — grouped skill list ─────────────────────────────── */}
            {!isStep2 && (
              skillGroups.length === 0 ? (
                libraryLoading ? (
                  <View style={styles.skillPickerEmptyState}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={[styles.skillPickerEmptyBody, { marginTop: 16, marginBottom: 0 }]}>
                      Loading skills…
                    </Text>
                  </View>
                ) : (
                // Empty state
                <View style={styles.skillPickerEmptyState}>
                  <Crosshair size={40} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.skillPickerEmptyTitle}>No skill programs yet</Text>
                  <Text style={styles.skillPickerEmptyBody}>
                    Skill-based programs are on the way. Browse the library to pick any program for now.
                  </Text>
                  <TouchableOpacity
                    style={styles.skillPickerEmptyCta}
                    onPress={() => { setShowSkillPicker(false); setCurrentView('library'); }}
                  >
                    <Text style={styles.skillPickerEmptyCtaText}>Browse Library</Text>
                  </TouchableOpacity>
                </View>
                )
              ) : (
                skillGroups.map(group => (
                  <View key={group.key}>
                    {/* Group header */}
                    <Text style={styles.skillPickerGroupHeader}>{group.name}</Text>
                    {group.entries.map(entry => (
                      <TouchableOpacity
                        key={entry.skill.id}
                        style={styles.skillPickerRow}
                        onPress={() => handlePickSkill(entry)}
                        activeOpacity={0.75}
                      >
                        <SkillIconBadge
                          skillId={entry.skill.id}
                          color={entry.skill.color}
                          style={{ marginRight: 12 }}
                        />
                        <View style={styles.skillPickerInfo}>
                          <Text style={styles.skillPickerName}>{entry.skill.name}</Text>
                          <Text style={styles.skillPickerMeta}>
                            {entry.programs.length} {entry.programs.length === 1 ? 'program' : 'programs'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )
            )}

            {/* ── Step 2 — program list for chosen skill ──────────────────── */}
            {isStep2 && (
              <View style={{ paddingBottom: 32 }}>
                {step2Programs.map(p => {
                  const sessionCount = (p.routines || []).length;
                  const rating = p.rating ? parseFloat(p.rating).toFixed(1) : null;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.skillPickerProgramRow}
                      onPress={() => handlePickProgram(p)}
                      activeOpacity={0.75}
                    >
                      {/* Thumbnail */}
                      {p.thumbnail_url || p.thumbnail ? (
                        <Image
                          source={{ uri: p.thumbnail_url || p.thumbnail }}
                          style={styles.skillPickerProgramThumb}
                        />
                      ) : (
                        <View style={[styles.skillPickerProgramThumb, styles.skillPickerProgramThumbPlaceholder]}>
                          <Target size={20} color="#4338CA" strokeWidth={2} />
                        </View>
                      )}
                      <View style={styles.skillPickerInfo}>
                        <Text style={styles.skillPickerName} numberOfLines={2}>{p.name}</Text>
                        <Text style={styles.skillPickerMeta}>
                          {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
                          {p.category ? ` · ${p.category}` : ''}
                          {rating ? ` · ★ ${rating}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ─── Archive confirm modal ────────────────────────────────────────────────

  const renderArchiveConfirmModal = () => {
    if (!archiveConfirmProgram) return null;
    const prog = archiveConfirmProgram.program || archiveConfirmProgram;
    const isPrimary = archiveConfirmProgram.trackRole === 'primary';
    const completedCount = (completedRoutinesByProgram[prog.id] || []).length;
    return (
      <Modal
        visible={archiveConfirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setArchiveConfirmVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          activeOpacity={1}
          onPress={() => setArchiveConfirmVisible(false)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {isPrimary ? 'Remove primary focus?' : 'Remove skill focus?'}
          </Text>
          <Text style={styles.sheetBody}>
            <Text style={{ fontWeight: '700' }}>{prog.name}</Text>
            {' '}will be removed from My Training. Your logbook entries are kept.
          </Text>
          {completedCount > 0 && (
            <Text style={styles.sheetMeta}>{completedCount} sessions completed</Text>
          )}
          <TouchableOpacity
            style={styles.sheetPrimaryBtn}
            onPress={() => handleArchiveTrack(prog.id)}
          >
            <Text style={styles.sheetPrimaryBtnText}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={() => setArchiveConfirmVisible(false)}
          >
            <Text style={styles.sheetCancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // ─── iOS toast overlay ────────────────────────────────────────────────────

  const renderToast = () => {
    if (!toastMessage || Platform.OS === 'android') return null;
    return (
      <View style={styles.toastOverlay} pointerEvents="none">
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────

  // Load programs from database and local storage
  const loadPrograms = async () => {
    try {
      setIsLoadingPrograms(true);
      
      if (!user?.id) {
        setIsLoadingPrograms(false);
        return;
      }
      
      // Try to load from database first — single joined query (no N+1)
      try {
        const { data: dbPrograms, error: dbError } = await supabase
          .from('programs')
          .select(`
            *,
            routines (
              id,
              name,
              description,
              order_index,
              time_estimate_minutes,
              is_published,
              created_at,
              routine_exercises (
                id,
                order_index,
                is_optional,
                custom_target_value,
                exercises (
                  id,
                  code,
                  title,
                  description,
                  goal_text,
                  skill_category,
                  skill_categories_json,
                  difficulty,
                  target_type,
                  target_value,
                  target_unit,
                  instructions,
                  tips_json,
                  estimated_minutes,
                  demo_video_url,
                  demo_image_url,
                  thumbnail_url,
                  tier_level,
                  tags,
                  is_published,
                  created_at
                )
              )
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error('❌ [ProgramScreen] Database load failed:', dbError.message || dbError);
        } else {
          if (dbPrograms && dbPrograms.length > 0) {
            // Transform database programs to match local format (synchronous — all data loaded)
            const transformedPrograms = dbPrograms.map((dbProgram) => {
              const thumbnail = dbProgram.thumbnail_url ? { uri: dbProgram.thumbnail_url } : null;

              const routines = (dbProgram.routines || [])
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map((dbRoutine) => {
                  const exercises = (dbRoutine.routine_exercises || [])
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .filter(re => re.exercises)
                    .map(re => ({
                      ...re.exercises,
                      name: re.exercises.title,
                      routineExerciseId: re.id,
                      routine_exercise_id: re.id,
                      order_index: re.order_index,
                      is_optional: re.is_optional,
                      custom_target_value: re.custom_target_value,
                      target: re.exercises.target_value && re.exercises.target_unit
                        ? `${re.exercises.target_value} ${re.exercises.target_unit}`
                        : `${re.exercises.target_value || 10} attempts`,
                    }));

                  return {
                    id: dbRoutine.id,
                    name: dbRoutine.name,
                    description: dbRoutine.description,
                    exercises,
                    createdAt: dbRoutine.created_at,
                    order_index: dbRoutine.order_index,
                    time_estimate_minutes: dbRoutine.time_estimate_minutes,
                    is_published: dbRoutine.is_published,
                  };
                });

              return {
                id: dbProgram.id,
                name: dbProgram.name,
                description: dbProgram.description,
                thumbnail,
                thumbnailUrl: dbProgram.thumbnail_url,
                routines,
                createdAt: dbProgram.created_at,
                category: dbProgram.category,
                tier: dbProgram.tier,
                isPublished: dbProgram.is_published,
                program_type: dbProgram.program_type,
                is_shareable: dbProgram.is_shareable,
                visibility: dbProgram.visibility,
              };
            });
            
            setPrograms(transformedPrograms);
            
            // Save to local storage as backup
            await AsyncStorage.setItem(`@user_programs_${user.id}`, JSON.stringify(transformedPrograms));
            
            // After loading programs, sync any unsynced AI programs
            try {
              const syncResult = await syncUnsyncedAIPrograms(transformedPrograms, setPrograms);
              if (syncResult.syncedCount > 0) {
                console.log(`✅ [ProgramScreen] Synced ${syncResult.syncedCount} AI programs`);
              }
            } catch (syncError) {
              console.error('❌ [ProgramScreen] Error syncing AI programs:', syncError.message || syncError);
            }
            
            return;
          }
        }
      } catch (dbError) {
        console.error('❌ [ProgramScreen] Database error:', dbError.message || dbError);
      }

      // Fallback to local storage
      try {
        const localPrograms = await AsyncStorage.getItem(`@user_programs_${user.id}`);
        if (localPrograms) {
          const parsedPrograms = JSON.parse(localPrograms);
          setPrograms(parsedPrograms);
          
          // After loading from local storage, try to sync any unsynced AI programs
          try {
            const syncResult = await syncUnsyncedAIPrograms(parsedPrograms, setPrograms);
            if (syncResult.syncedCount > 0) {
              console.log(`✅ [ProgramScreen] Synced ${syncResult.syncedCount} AI programs`);
            }
          } catch (syncError) {
            console.error('❌ [ProgramScreen] Error syncing AI programs:', syncError.message || syncError);
          }
        } else {
          setPrograms([]);
        }
      } catch (localError) {
        console.error('❌ [ProgramScreen] Local storage error:', localError.message || localError);
        setPrograms([]);
      }

    } catch (error) {
      console.error('💥 [ProgramScreen] Unexpected error in loadPrograms:', error);
      setPrograms([]);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  // Save programs to local storage
  const savePrograms = async (programsToSave) => {
    try {
      if (user?.id) {
        await AsyncStorage.setItem(`@user_programs_${user.id}`, JSON.stringify(programsToSave));
      }
    } catch (error) {
      console.error('❌ [ProgramScreen] Error saving programs:', error.message || error);
    }
  };

  // Update existing AI program function
  const updateAIProgramHandler = async () => {
    if (!existingAIProgram) {
      Alert.alert('Error', 'No existing AI program found to update.');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Update Your AI Program',
      `This will replace your current AI program "${existingAIProgram.name}" with a new one based on your current DUPR rating and focus areas.\n\nYour old program will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update Program', 
          style: 'default',
          onPress: async () => {
            try {
              console.log('🔄 [ProgramScreen] Updating AI program...');
              
              // Delete the existing AI program first
              await deleteExistingAIProgram(existingAIProgram.id);
              
              // Generate new AI program
              await generateAIProgramHandler();
              
            } catch (error) {
              console.error('❌ [ProgramScreen] Error updating AI program:', error);
              Alert.alert('Error', 'Failed to update AI program. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Delete existing AI program function
  const deleteExistingAIProgram = async (programId) => {
    try {
      console.log('🗑️ [ProgramScreen] Deleting existing AI program:', programId);
      
      // Delete from database if it's a UUID (database program)
      const isUUID = programId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID && user?.id) {
        console.log('💾 [ProgramScreen] Deleting AI program from database...');
        
        const { error } = await supabase.rpc('delete_program_as_user', {
          program_id: programId
        });
        
        if (error) {
          console.error('❌ [ProgramScreen] Database delete failed:', error);
          throw error;
        }
        
        console.log('✅ [ProgramScreen] AI program deleted from database');
      }
      
      // Update local state - remove the AI program
      setPrograms(prev => {
        const updated = prev.filter(p => p.id !== programId);
        // Save updated list to local storage
        savePrograms(updated);
        return updated;
      });
      
      console.log('✅ [ProgramScreen] AI program removed from local state');
      
    } catch (error) {
      console.error('💥 [ProgramScreen] Error deleting existing AI program:', error);
      throw error;
    }
  };

  // AI Program Generation function
  const generateAIProgramHandler = async () => {
    // Validate user can generate AI program
    let validation = validateUserForAIGeneration(user);
    
    // If validation fails due to focus areas, try refreshing the profile data
    if (!validation.isValid && validation.message.includes('Focus areas required')) {
      // Force refresh profile from database
      try {
        if (user?.id) {
          const { data: freshProfile } = await supabase
            .from('users')
            .select('focus_areas')
            .eq('id', user.id)
            .single();
          
          if (freshProfile?.focus_areas && Array.isArray(freshProfile.focus_areas) && freshProfile.focus_areas.length > 0) {
            // Update the user context with fresh data
            setUser(prevUser => ({
              ...prevUser,
              focus_areas: freshProfile.focus_areas
            }));
            // Wait a moment for state to update
            await new Promise(resolve => setTimeout(resolve, 100));
            validation = validateUserForAIGeneration({ ...user, focus_areas: freshProfile.focus_areas });
          }
        }
      } catch (error) {
        console.error('Error refreshing profile data:', error);
      }
    }
    
    if (!validation.isValid) {
      // Provide more helpful error message for focus areas issue
      if (validation.message.includes('Focus areas required')) {
        Alert.alert(
          'Cannot Generate AI Program', 
          'Focus areas are required to generate your personalized program. Please go back to the onboarding flow and select your focus areas again.\n\nTip: Try selecting fewer focus areas (3-5) if you selected many.'
        );
      } else {
        Alert.alert('Cannot Generate AI Program', validation.message);
      }
      return;
    }

    setIsGeneratingAI(true);

    try {
      console.log('🤖 Starting AI program generation...');
      
      // Generate the AI program
      const aiProgram = await generateAIProgram(user);
      
      // Save to database and local programs list
      const saveResult = await saveAIProgram(aiProgram, setPrograms);
      
      if (saveResult.success) {
        Alert.alert(
          'AI Program Created! 🤖',
          `"${aiProgram.name}" has been created with ${aiProgram.routines.length} routines tailored to your DUPR ${user.duprRating} level and focus areas.\n\n✅ Synced to your account - available on all devices!`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'AI Program Created! 🤖',
          `"${aiProgram.name}" has been created with ${aiProgram.routines.length} routines tailored to your DUPR ${user.duprRating} level and focus areas.\n\n⚠️ Saved locally only - will sync when connection is available.`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('AI Program Generation Error:', error);
      
      let title = 'Generation Failed';
      let message = error.message || 'Unable to generate AI program. Please check your internet connection and try again.';
      
      // Provide more specific guidance for database-related errors
      if (error.message && error.message.includes('No exercises found')) {
        title = 'No Matching Exercises Found';
        message = `We couldn't find exercises in our database that match your DUPR ${user.duprRating} level and focus areas (${user.focus_areas?.join(', ') || 'none selected'}).\n\nThis could be because:\n• Your DUPR level needs exercises to be added to our database\n• Your focus areas need more exercise content\n\nPlease contact support or try updating your focus areas in settings.`;
      }
      
      Alert.alert(title, message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Upload program thumbnail to Supabase Storage
  const uploadProgramThumbnail = async (imageUri, programName) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Safety check: Prevent blob URLs from being uploaded
      if (imageUri.startsWith('blob:')) {
        Alert.alert('Warning', 'Invalid image format. Program will be created without thumbnail.');
        return null;
      }

      // Generate a unique filename with user folder structure
      const fileExtension = 'jpg';
      const sanitizedProgramName = programName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${user.id}/${sanitizedProgramName}_${Date.now()}.${fileExtension}`;
      
      // Read file as array buffer (works for both web and React Native)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('program_thumbnails')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        // Provide specific error messages for common issues
        if (error.message?.includes('row-level security policy')) {
          Alert.alert(
            'Storage Setup Required',
            'The program thumbnails storage bucket needs to be set up. Creating program without thumbnail for now.'
          );
          return null;
        }
        
        if (error.message?.includes('bucket') && error.message?.includes('not found')) {
          Alert.alert(
            'Storage Bucket Missing',
            'Program thumbnails bucket needs to be created. Creating program without thumbnail for now.'
          );
          return null;
        }
        
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('program_thumbnails')
        .getPublicUrl(fileName);

      // Safety check: Ensure the returned URL is not a blob URL
      if (publicUrl.startsWith('blob:')) {
        Alert.alert('Warning', 'Thumbnail upload failed. Program will be created without image.');
        return null;
      }

      return publicUrl;

    } catch (error) {
      console.error('❌ [ProgramScreen] Error uploading thumbnail:', error.message || error);
      Alert.alert('Warning', 'Failed to upload thumbnail. Program will be created without image.');
      return null;
    }
  };

  const createProgram = async () => {
    if (!newProgramName.trim()) {
      Alert.alert('Error', 'Please enter a program name');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      let compressedThumbnail = null;
      let thumbnailUrl = null;
      
      if (selectedImage) {
        try {
          // Compress the selected image for local storage
          const manipResult = await ImageManipulator.manipulateAsync(
            selectedImage.uri,
            [{ resize: { width: 300, height: 300 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          compressedThumbnail = manipResult;
          
          // Upload to Supabase Storage for database storage
          thumbnailUrl = await uploadProgramThumbnail(manipResult.uri, newProgramName.trim());
          
        } catch (error) {
          console.error('❌ [ProgramScreen] Error processing image:', error.message || error);
          Alert.alert('Warning', 'Failed to process image. Program will be created without thumbnail.');
        }
      }
      
      const newProgram = {
        id: Date.now().toString(),
        name: newProgramName.trim(),
        thumbnail: compressedThumbnail, // For local storage
        thumbnailUrl: thumbnailUrl, // For database storage
        routines: [],
        createdAt: new Date().toISOString(),
      };
      
      // Save to database using the user function with thumbnail URL
      try {
        const { data: savedProgram, error: saveError } = await supabase.rpc('create_program_as_user', {
          program_name: newProgram.name,
          program_description: `User-created program: ${newProgram.name}`,
          program_category: 'Custom',
          program_tier: 'Beginner',
          program_is_published: false,
          program_thumbnail_url: thumbnailUrl,
          program_is_coach_program: isCoachProgram
        });
        
        if (saveError) {
          console.error('❌ [ProgramScreen] Database save failed:', saveError.message || saveError);
          Alert.alert('Warning', 'Program saved locally but could not sync to server. It will sync when connection is available.');
        } else {
          // 🔧 CRITICAL FIX: RPC functions return arrays, so get the first element
          const programData = Array.isArray(savedProgram) ? savedProgram[0] : savedProgram;
          
          if (programData && programData.id) {
            newProgram.id = programData.id;
            newProgram.program_id = programData.id; // Also set program_id for consistency
            newProgram.created_by = programData.created_by;
            newProgram.category = programData.category;
            newProgram.tier = programData.tier;
            newProgram.is_published = programData.is_published;
          }
        }
      } catch (dbError) {
        console.error('❌ [ProgramScreen] Database operation failed:', dbError.message || dbError);
        Alert.alert('Warning', `Database save failed: ${dbError.message}. Program saved locally.`);
      }
      
      // Update local state
      setPrograms(prev => {
        const updated = [...prev, newProgram];
        // Save to local storage immediately
        savePrograms(updated);
        return updated;
      });
      
      // Clear form
      setNewProgramName('');
      setSelectedImage(null);
      setIsCoachProgram(false);
      setShowCreateProgramModal(false);
      
      // Show success message with thumbnail status
      const successMessage = thumbnailUrl 
        ? `Program "${newProgram.name}" created successfully with thumbnail!`
        : `Program "${newProgram.name}" created successfully!`;
      Alert.alert('Success', successMessage);
      
    } catch (error) {
      console.error('💥 [ProgramScreen] Unexpected error in createProgram:', error.message || error);
      Alert.alert('Error', `Failed to create program: ${error.message}`);
    }
  };

  // Image handling functions
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need photo library permissions to add program thumbnails.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingImage(true);
        const asset = result.assets[0];
        
        try {
          // Ensure square crop and reasonable size
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 400, height: 400 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          
          setSelectedImage(manipResult);
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process the selected image.');
        } finally {
          setIsProcessingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker.');
      setIsProcessingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const deleteProgram = async (programId) => {
    const programToDelete = programs.find(p => p.id === programId);
    
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete "${programToDelete?.name}"?\n\nThis action cannot be undone and will:\n• Delete all routines in this program\n• Delete all exercises from these routines\n• Remove this program from other users if it was shared\n\nThis will affect all users who have this program.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [ProgramScreen] Deleting program:', programId);
              
              // Delete from database if it's a UUID (database program)
              const isUUID = programId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
              
              if (isUUID && user?.id) {
                console.log('💾 [ProgramScreen] Deleting from database...');
                
                const { error } = await supabase.rpc('delete_program_as_user', {
                  program_id: programId
                });
                
                if (error) {
                  console.error('❌ [ProgramScreen] Database delete failed:', error);
                  Alert.alert('Error', `Failed to delete from database: ${error.message}`);
                  return;
                }
                
                console.log('✅ [ProgramScreen] Program deleted from database');
              }
              
              // Update local state
              setPrograms(prev => {
                const updated = prev.filter(p => p.id !== programId);
                // Save updated list to local storage
                savePrograms(updated);
                return updated;
              });
              
              Alert.alert('Success', 'Program deleted successfully');
              
            } catch (error) {
              console.error('💥 [ProgramScreen] Error deleting program:', error);
              Alert.alert('Error', `Failed to delete program: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const navigateToProgram = (program) => {
    saveLastProgram(program);
    navigation.navigate('ProgramDetail', { 
      program,
      onUpdateProgram: (updatedProgram) => {
        setPrograms(prev => prev.map(p => 
          p.id === updatedProgram.id ? updatedProgram : p
        ));
      }
    });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Simulate refresh delay - in a real app, this would reload data from an API
    setTimeout(() => {
      // You can add any refresh logic here, such as:
      // - Reloading programs from a database
      // - Updating the PersonalizedProgramCard
      // - Syncing with cloud storage
      console.log('Programs refreshed');
      setRefreshing(false);
    }, 1000);
  }, []);

  // Coach Program tab functions
  const loadCoachPrograms = async () => {
    try {
      setCoachProgramsLoading(true);
      setCoachProgramsError(null);
      
      if (!user?.id) {
        setCoachProgramsLoading(false);
        coachProgramsLoadedRef.current = true;
        return;
      }

      // Load student code
      try {
        const { data: studentCodeData, error: studentCodeError } = await getStudentCode(user.id);
        if (!studentCodeError && studentCodeData?.student_code) {
          setStudentCode(studentCodeData.student_code);
        }
      } catch (error) {
        // Silently fail - student code is optional
      }

      // First, check if user has a coach relationship - load ALL coaches
      const { data: coachRelationships, error: relationshipError } = await supabase
        .from('coach_students')
        .select(`
          id,
          coach_id,
          is_active,
          coaches (
            id,
            name,
            user_id,
            avatar_url,
            bio,
            dupr_rating,
            is_verified,
            users:user_id (
              avatar_url
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (relationshipError) {
        console.error('❌ [ProgramScreen] Error checking coach relationship:', relationshipError.message || relationshipError);
        setHasCoachRelationship(false);
        setCoaches([]);
      } else if (coachRelationships && coachRelationships.length > 0) {
        setHasCoachRelationship(true);
        
        // Store all coaches with their info
        // Prioritize user avatar over coach avatar (same as AdminDashboard)
        const coachesList = await Promise.all(coachRelationships.map(async (cr) => {
            const coach = cr.coaches;
            
            // Get user avatar URL - handle both object and array cases from Supabase relationship
            const userAvatarUrl = Array.isArray(coach?.users) 
              ? coach.users[0]?.avatar_url 
              : coach?.users?.avatar_url;
            // Prioritize user avatar over coach avatar
            let avatarUrl = userAvatarUrl || coach?.avatar_url;

            // If still no avatar and we have a user_id, try a direct fetch
            if (!avatarUrl && coach?.user_id) {
              try {
                const { data: userData } = await supabase
                  .from('users')
                  .select('avatar_url')
                  .eq('id', coach.user_id)
                  .maybeSingle();
                if (userData?.avatar_url) {
                  avatarUrl = userData.avatar_url;
                }
              } catch (_) {
                // Silently ignore
              }
            }
            
            // Convert storage path to public URL if needed (same logic as transformCoachData)
            if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('blob:')) {
              // It's likely a storage path, convert to public URL
              try {
                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(avatarUrl);
                avatarUrl = publicUrl;
              } catch (error) {
                // Keep original URL if conversion fails
              }
            }
            
            return {
              id: cr.coach_id,
              relationshipId: cr.id,
              name: coach?.name || 'Coach',
              user_id: coach?.user_id,
              avatar_url: avatarUrl, // Use prioritized and converted avatar
              bio: coach?.bio,
              dupr_rating: coach?.dupr_rating,
              is_verified: coach?.is_verified
            };
          }));
        
        const filteredCoaches = coachesList.filter(c => c.id); // Filter out any null coaches
        setCoaches(filteredCoaches);
        
        // Check if user has assessments
        const { data: assessments, error: assessmentError } = await supabase
          .from('coach_assessments')
          .select('id')
          .eq('student_id', user.id)
          .limit(1);

        if (!assessmentError && assessments && assessments.length > 0) {
          setHasAssessment(true);
        }

        // Load programs assigned by coaches
        // Query programs created by coaches who have a relationship with this student
        // Get user_ids from coaches (coaches.user_id is the actual user who created programs)
        const coachUserIds = coachRelationships
          .map(cr => cr.coaches?.user_id)
          .filter(Boolean);
        
        if (coachUserIds.length > 0) {
          const { data: dbCoachPrograms, error: dbError } = await supabase
            .from('programs')
            .select(`
              *,
              routines (
                id,
                name,
                description,
                order_index,
                time_estimate_minutes,
                is_published,
                created_at
              ),
              creator:users!created_by(name)
            `)
            .in('created_by', coachUserIds)
            .order('created_at', { ascending: false });

          if (dbError) {
            console.error('❌ [ProgramScreen] Error loading coach programs:', dbError.message || dbError);
            setCoachProgramsError('Failed to load coach programs');
            setCoachPrograms([]);
          } else if (dbCoachPrograms && dbCoachPrograms.length > 0) {
            
            // Transform programs similar to regular programs
            const transformedCoachPrograms = await Promise.all(dbCoachPrograms.map(async (dbProgram) => {
              // Load exercises for each routine
              const routines = await Promise.all((dbProgram.routines || []).map(async (dbRoutine) => {
                let exercises = [];
                try {
                  const { data: routineExercises, error: exerciseError } = await supabase
                    .from('routine_exercises')
                    .select(`
                      id,
                      order_index,
                      is_optional,
                      exercises (
                        id,
                        code,
                        title,
                        description,
                        goal_text,
                        skill_category,
                        skill_categories_json,
                        difficulty,
                        target_type,
                        target_value,
                        target_unit,
                        instructions,
                        tips_json,
                        estimated_minutes,
                        demo_video_url,
                        demo_image_url,
                        thumbnail_url,
                        tier_level,
                        tags,
                        is_published,
                        created_at
                      )
                    `)
                    .eq('routine_id', dbRoutine.id)
                    .order('order_index', { ascending: true });
                  
                  if (!exerciseError && routineExercises) {
                    exercises = routineExercises.map(re => ({
                      ...re.exercises,
                      name: re.exercises.title,
                      routineExerciseId: re.id,
                      routine_exercise_id: re.id,
                      order_index: re.order_index,
                      is_optional: re.is_optional,
                      target: re.exercises.target_value && re.exercises.target_unit 
                        ? `${re.exercises.target_value} ${re.exercises.target_unit}`
                        : `${re.exercises.target_value || 10} attempts`
                    }));
                  }
                } catch (error) {
                  console.error('❌ [ProgramScreen] Error loading exercises for routine:', error.message || error);
                }
                
                return {
                  id: dbRoutine.id,
                  name: dbRoutine.name,
                  description: dbRoutine.description,
                  exercises: exercises,
                  createdAt: dbRoutine.created_at,
                  order_index: dbRoutine.order_index,
                  time_estimate_minutes: dbRoutine.time_estimate_minutes,
                  is_published: dbRoutine.is_published
                };
              }));

              return {
                id: dbProgram.id,
                name: dbProgram.name,
                description: dbProgram.description,
                thumbnail: dbProgram.thumbnail_url ? { uri: dbProgram.thumbnail_url } : null,
                thumbnailUrl: dbProgram.thumbnail_url,
                routines: routines,
                createdAt: dbProgram.created_at,
                category: dbProgram.category,
                tier: dbProgram.tier,
                isPublished: dbProgram.is_published,
                program_type: dbProgram.program_type,
                is_shareable: dbProgram.is_shareable,
                visibility: dbProgram.visibility,
                coach_name: dbProgram.creator?.name || 'Your Coach'
              };
            }));
            
            setCoachPrograms(transformedCoachPrograms);
          } else {
            setCoachPrograms([]);
          }
        }
      } else {
        setHasCoachRelationship(false);
        setCoaches([]);
      }
    } catch (error) {
      console.error('💥 [ProgramScreen] Unexpected error loading coach programs:', error);
      setCoachProgramsError('Failed to load coach programs');
      setCoachPrograms([]);
    } finally {
      setCoachProgramsLoading(false);
      coachProgramsLoadedRef.current = true;
    }
  };

  const navigateToCoachProgram = (program) => {
    saveLastProgram(program);
    navigation.navigate('ProgramDetail', { 
      program,
      source: 'coach' 
    });
  };

  const navigateToCoachProfile = (coach) => {
    // Navigate to PlayerProfileScreen showing the student's own profile (read-only)
    navigation.navigate('PlayerProfile', {
      studentId: user.id,
      student: user,
      isStudentView: true, // Hide assessment creation/deletion
      coachName: coach.name // Optional: pass coach name for context
    });
  };

  // Library tab functions (from ExploreTrainingScreen)
  const fetchLibraryPrograms = async () => {
    // Check if we have preloaded data first
    const preloadedPrograms = getDataWithFallback('programs');
    if (preloadedPrograms && preloadedPrograms.length > 0) {
      setExplorePrograms(preloadedPrograms);
      setLibraryLoading(false);
      setLibraryError(null);
      return;
    } else if (hasPreloadedData('programs')) {
      // We have preloaded data but it's empty
      setExplorePrograms([]);
      setLibraryLoading(false);
      setLibraryError(null);
      return;
    }

    // No preloaded data, fetch normally
    const fetchTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch programs timeout after 20 seconds')), 20000)
    );
    
    const fetchOperation = async () => {
      try {
        setLibraryLoading(true);
        const { data, error } = await getPrograms();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setExplorePrograms([]);
          setLibraryError(null);
          return;
        }
        
        if (Array.isArray(data) && data.length === 0) {
          setExplorePrograms([]);
          setLibraryError(null);
          return;
        }
        
        // Transform the data to match your current app structure
        const transformedPrograms = transformProgramData(data);
        setExplorePrograms(transformedPrograms);
        setLibraryError(null);
      } catch (err) {
        setLibraryError(err.message || 'Failed to load programs');
        setExplorePrograms([]);
      } finally {
        setLibraryLoading(false);
      }
    };
    
    try {
      await Promise.race([fetchOperation(), fetchTimeout]);
    } catch (timeoutError) {
      setLibraryError('Request timed out. Please try again.');
      setExplorePrograms([]);
      setLibraryLoading(false);
    }
  };

  const fetchCategoryOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, order_index, is_published')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        // Fallback to legacy RPC if categories table is unavailable
        const { data: rpcData } = await supabase.rpc('get_category_order');
        setSavedCategoryOrder(rpcData || []);
        return;
      }

      setSavedCategoryOrder(data || []);
    } catch {
      setSavedCategoryOrder([]);
    }
  };

  const onLibraryRefresh = async () => {
    setLibraryRefreshing(true);
    try {
      // Try to refresh from preload context first
      const refreshedPrograms = await refreshData('programs');
      if (refreshedPrograms) {
        setExplorePrograms(refreshedPrograms);
        setLibraryError(null);
      } else {
        // Fallback to direct API call
        const { data, error } = await getPrograms();
        
        if (error) {
          throw error;
        }
        
        // Transform the data to match your current app structure
        const transformedPrograms = transformProgramData(data);
        setExplorePrograms(transformedPrograms);
        setLibraryError(null);
      }
      
      // Also refresh category order
      await fetchCategoryOrder();
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setLibraryRefreshing(false);
    }
  };

  const navigateToLibraryProgram = (program) => {
    saveLastProgram(program);
    navigation.navigate('ProgramDetail', { 
      program,
      source: 'library' 
    });
  };

  const navigateToSkillProgram = (program) => {
    setShowSkillPicker(false);
    setSkillPickerStep('skill');
    setSelectedPickerSkill(null);
    saveLastProgram(program);
    navigation.navigate('ProgramDetail', {
      program,
      source: 'skill_picker',
      enrollRole: 'skill_1',
    });
  };

  // Render Fun tab content
  const renderFunContent = () => {
    return (
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.funContainer}>
          <TouchableOpacity
            style={styles.doubleChallengeCard}
            onPress={() => navigation.navigate('GamePlayedList')}
            activeOpacity={0.7}
          >
            <View style={styles.doubleChallengeIcon}>
              <Ionicons name="trophy" size={48} color="#FFB800" />
            </View>
            <Text style={styles.doubleChallengeTitle}>Double Challenge Game</Text>
            <Text style={styles.doubleChallengeDescription}>
              Play 15-point doubles games with friends. Track your matches and improve together!
            </Text>

          </TouchableOpacity>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  const getTotalExerciseCount = () => {
    return explorePrograms.reduce((total, program) => {
      const programExerciseCount = program.routines?.reduce((routineTotal, routine) => {
        return routineTotal + (routine.exercises?.length || 0);
      }, 0) || 0;
      return total + programExerciseCount;
    }, 0);
  };


  // Check if user already has an AI-generated program
  const hasAIProgram = programs.some(program => program.is_ai_generated);
  const existingAIProgram = programs.find(program => program.is_ai_generated);

  const renderLoadingScreen = () => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.loadingContainer}>
        <Animated.Image
          source={require('../../assets/images/icon_ball.png')}
          resizeMode="contain"
          style={[
            styles.loadingBall,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
        <Text style={styles.loadingText}>Loading your programs...</Text>
      </View>
    );
  };

  const renderAIGenerationOverlay = () => {
    const aiSpin = aiRotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const progressMessages = [
      {
        title: "Analyzing Your Profile",
        subtitle: "Reviewing your DUPR rating and focus areas..."
      },
      {
        title: "Finding Perfect Exercises", 
        subtitle: "Matching exercises to your skill level..."
      },
      {
        title: "Building Your Routines",
        subtitle: "Creating personalized training sessions..."
      },
      {
        title: "Finalizing Your Program",
        subtitle: "Adding the finishing touches..."
      }
    ];

    const currentMessage = progressMessages[aiGenerationStep] || progressMessages[0];

    return (
        <Modal
        visible={isGeneratingAI}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsGeneratingAI(false)}
      >
        <View style={styles.aiGenerationOverlay}>
          <View style={styles.aiGenerationContent}>
            <Animated.Image
              source={require('../../assets/images/icon_ball.png')}
              resizeMode="contain"
              style={[
                styles.aiGenerationBall,
                {
                  transform: [{ rotate: aiSpin }],
                },
              ]}
            />
            
            <Text style={styles.aiGenerationTitle}>
              {currentMessage.title}
            </Text>
            
            <Text style={styles.aiGenerationSubtitle}>
              {currentMessage.subtitle}
            </Text>
            
            <View style={styles.aiProgressContainer}>
              <View style={styles.aiProgressTrack}>
                <View 
                  style={[
                    styles.aiProgressFill, 
                    { width: `${((aiGenerationStep + 1) / 4) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.aiProgressText}>
                Step {aiGenerationStep + 1} of 4
              </Text>
            </View>
            
            <Text style={styles.aiGenerationNote}>
              🤖 Our AI is working hard to create your perfect program
            </Text>

            <TouchableOpacity
              style={styles.aiCancelButton}
              onPress={() => setIsGeneratingAI(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.aiCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Coach Program tab content
  const renderCoachProgramsContent = () => {
    // "Find your coach" section that appears in all states
    const renderFindYourCoach = () => (
      <View style={styles.findCoachSection}>
        <TouchableOpacity
          style={styles.findCoachCard}
          onPress={() => navigation.navigate('CoachDetail')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="#3B82F6" style={styles.findCoachIconDirect} />
          <View style={styles.findCoachContent}>
            <Text style={styles.findCoachTitle}>Find Your Coach</Text>
            <Text style={styles.findCoachDescription}>
              Browse certified coaches near you
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
    );

    // Loading state — skeleton cards
    if (coachProgramsLoading) {
      return (
        <View style={[styles.coachProgramsContainer, { paddingHorizontal: 16, paddingTop: 12 }]}>
          {[1, 2, 3].map(i => <CoachSkeletonCard key={i} />)}
        </View>
      );
    }

    // Error state
    if (coachProgramsError) {
      return (
        <View style={styles.coachProgramsContainer}>
          {renderFindYourCoach()}
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load coach programs</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCoachPrograms}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // No coach relationship - show explanation
    if (!hasCoachRelationship) {
      return (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.coachScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={coachProgramsLoading}
              onRefresh={loadCoachPrograms}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {renderFindYourCoach()}
          <View style={styles.coachEmptyContent}>
            {studentCode && (
              <View style={styles.studentCodeCard}>
                <View style={styles.studentCodeHeader}>
                  <Ionicons name="person-circle-outline" size={20} color="#3B82F6" />
                  <Text style={styles.studentCodeLabel}>Your Student Code</Text>
                </View>
                <View style={styles.studentCodeContainer}>
                  <Text style={styles.studentCodeValue}>{studentCode}</Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={async () => {
                      try {
                        if (Platform.OS !== 'web') {
                          await Share.share({
                            message: studentCode,
                          });
                        } else {
                          // For web, try clipboard API
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(studentCode);
                            Alert.alert('Copied!', 'Student code copied to clipboard');
                          } else {
                            Alert.alert('Student Code', studentCode);
                          }
                        }
                      } catch (error) {
                        console.error('Error sharing student code:', error);
                        // Fallback: show alert with code
                        Alert.alert('Your Student Code', studentCode);
                      }
                    }}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {!studentCode && (
              <TouchableOpacity
                style={styles.findCoachCTAButton}
                onPress={() => navigation.navigate('Coach')}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.findCoachCTAText}>Find a Coach</Text>
              </TouchableOpacity>
            )}

            <View style={styles.stepsContainer}>
              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="search" size={24} color="#3B82F6" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNumber}>Step 1</Text>
                  <Text style={styles.stepTitle}>
                    {studentCode ? 'Share Your Code With Your Certified Coach' : 'Find a Coach'}
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="clipboard-outline" size={24} color="#F59E0B" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNumber}>Step 2</Text>
                  <Text style={styles.stepTitle}>Complete Assessment To Get Your Score</Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="create-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNumber}>Step 3</Text>
                  <Text style={styles.stepTitle}>Get Your Program And Progress</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.bottomSpacing} />
        </ScrollView>
      );
    }

    // Has coach but no assessment yet
    if (hasCoachRelationship && !hasAssessment) {
      return (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.coachScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={coachProgramsLoading}
              onRefresh={loadCoachPrograms}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
        {renderFindYourCoach()}
        {/* Coach Cards Section */}
        {coaches.length > 0 && (
          <View style={styles.coachesSection}>
            {coaches.map((coach) => (
                <TouchableOpacity
                  key={coach.id}
                  style={styles.coachCard}
                  onPress={() => navigateToCoachProfile(coach)}
                  activeOpacity={0.7}
                >
                  <View style={styles.coachCardContent}>
                    {coach.avatar_url && !coachAvatarErrors[coach.id] ? (
                      <Image 
                        source={{ uri: coach.avatar_url }} 
                        style={styles.coachCardAvatar}
                        resizeMode="cover"
                        onError={() => setCoachAvatarErrors(prev => ({ ...prev, [coach.id]: true }))}
                      />
                    ) : (
                      <View style={styles.coachCardAvatarFallback}>
                        <Text style={styles.coachCardAvatarText}>
                          {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.coachCardInfo}>
                      <View style={styles.coachCardNameRow}>
                        <Text style={styles.coachCardName}>{coach.name}</Text>
                        {coach.is_verified && (
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        )}
                      </View>
                      {!hasAssessment && (
                        <Text style={styles.coachCardSubtext}>Complete your first assessment</Text>
                      )}
                      {coach.bio && (
                        <Text style={styles.coachCardBio} numberOfLines={2}>{coach.bio}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.coachEmptyContent}>
            {studentCode && (
              <View style={styles.studentCodeCard}>
                <View style={styles.studentCodeHeader}>
                  <Ionicons name="person-circle-outline" size={20} color="#3B82F6" />
                  <Text style={styles.studentCodeLabel}>Your Student Code</Text>
                </View>
                <View style={styles.studentCodeContainer}>
                  <Text style={styles.studentCodeValue}>{studentCode}</Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={async () => {
                      try {
                        if (Platform.OS !== 'web') {
                          await Share.share({
                            message: studentCode,
                          });
                        } else {
                          // For web, try clipboard API
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(studentCode);
                            Alert.alert('Copied!', 'Student code copied to clipboard');
                          } else {
                            Alert.alert('Student Code', studentCode);
                          }
                        }
                      } catch (error) {
                        console.error('Error sharing student code:', error);
                        // Fallback: show alert with code
                        Alert.alert('Your Student Code', studentCode);
                      }
                    }}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {!studentCode && (
              <TouchableOpacity
                style={styles.findCoachCTAButton}
                onPress={() => navigation.navigate('Coach')}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.findCoachCTAText}>Find a Coach</Text>
              </TouchableOpacity>
            )}

            <View style={styles.stepsContainer}>
              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="search" size={24} color="#3B82F6" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNumber}>Step 1</Text>
                  <Text style={styles.stepTitle}>
                    {studentCode ? 'Share Your Code With Your Certified Coach' : 'Find a Coach'}
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="clipboard-outline" size={24} color="#F59E0B" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNumber}>Step 2</Text>
                  <Text style={styles.stepTitle}>Complete Assessment To Get Your Score</Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="create-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepNumber}>Step 3</Text>
                  <Text style={styles.stepTitle}>Get Your Program And Progress</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.bottomSpacing} />
        </ScrollView>
      );
    }

    // Has coach and assessment but no programs yet - just show coaches and student code
    if (coachPrograms.length === 0) {
      return (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={coachProgramsLoading}
              onRefresh={loadCoachPrograms}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {renderFindYourCoach()}
          {/* Coach Cards Section */}
          {coaches.length > 0 && (
            <View style={styles.coachesSection}>
              {coaches.map((coach) => (
                <TouchableOpacity
                  key={coach.id}
                  style={styles.coachCard}
                  onPress={() => navigateToCoachProfile(coach)}
                  activeOpacity={0.7}
                >
                  <View style={styles.coachCardContent}>
                    {coach.avatar_url && !coachAvatarErrors[coach.id] ? (
                      <Image 
                        source={{ uri: coach.avatar_url }} 
                        style={styles.coachCardAvatar}
                        resizeMode="cover"
                        onError={() => setCoachAvatarErrors(prev => ({ ...prev, [coach.id]: true }))}
                      />
                    ) : (
                      <View style={styles.coachCardAvatarFallback}>
                        <Text style={styles.coachCardAvatarText}>
                          {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.coachCardInfo}>
                      <View style={styles.coachCardNameRow}>
                        <Text style={styles.coachCardName}>{coach.name}</Text>
                        {coach.is_verified && (
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        )}
                      </View>
                      {!hasAssessment && (
                        <Text style={styles.coachCardSubtext}>Complete your first assessment</Text>
                      )}
                      {coach.bio && (
                        <Text style={styles.coachCardBio} numberOfLines={2}>{coach.bio}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Student Code Display */}
              {studentCode && (
                <View style={styles.studentCodeCard}>
                  <View style={styles.studentCodeHeader}>
                    <Ionicons name="person-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.studentCodeLabel}>Your Student Code</Text>
                  </View>
                  <View style={styles.studentCodeContainer}>
                    <Text style={styles.studentCodeValue}>{studentCode}</Text>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={async () => {
                        try {
                          if (Platform.OS !== 'web') {
                            await Share.share({
                              message: studentCode,
                            });
                          } else {
                            // For web, try clipboard API
                            if (navigator.clipboard) {
                              await navigator.clipboard.writeText(studentCode);
                              Alert.alert('Copied!', 'Student code copied to clipboard');
                            } else {
                              Alert.alert('Student Code', studentCode);
                            }
                          }
                        } catch (error) {
                          console.error('Error sharing student code:', error);
                          // Fallback: show alert with code
                          Alert.alert('Your Student Code', studentCode);
                        }
                      }}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.shareButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      );
    }

    // Show coach programs
    return (
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={coachProgramsLoading}
            onRefresh={loadCoachPrograms}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
      >
        {renderFindYourCoach()}
        {/* Coach Cards Section */}
        {coaches.length > 0 && (
          <View style={styles.coachesSection}>
            {coaches.map((coach) => (
              <TouchableOpacity
                key={coach.id}
                style={styles.coachCard}
                onPress={() => navigateToCoachProfile(coach)}
                activeOpacity={0.7}
              >
                <View style={styles.coachCardContent}>
                  {coach.avatar_url && !coachAvatarErrors[coach.id] ? (
                    <Image 
                      source={{ uri: coach.avatar_url }} 
                      style={styles.coachCardAvatar}
                      resizeMode="cover"
                      onError={() => setCoachAvatarErrors(prev => ({ ...prev, [coach.id]: true }))}
                    />
                  ) : (
                    <View style={styles.coachCardAvatarFallback}>
                      <Text style={styles.coachCardAvatarText}>
                        {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.coachCardInfo}>
                    <View style={styles.coachCardNameRow}>
                      <Text style={styles.coachCardName}>{coach.name}</Text>
                      {coach.is_verified && (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      )}
                    </View>
                    {!hasAssessment && (
                      <Text style={styles.coachCardSubtext}>Complete your first assessment</Text>
                    )}
                    {coach.bio && (
                      <Text style={styles.coachCardBio} numberOfLines={2}>{coach.bio}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Student Code Display */}
            {studentCode && (
              <View style={styles.studentCodeCard}>
                <View style={styles.studentCodeHeader}>
                  <Ionicons name="person-circle-outline" size={20} color="#3B82F6" />
                  <Text style={styles.studentCodeLabel}>Your Student Code</Text>
                </View>
                <View style={styles.studentCodeContainer}>
                  <Text style={styles.studentCodeValue}>{studentCode}</Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={async () => {
                      try {
                        if (Platform.OS !== 'web') {
                          await Share.share({
                            message: studentCode,
                          });
                        } else {
                          // For web, try clipboard API
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(studentCode);
                            Alert.alert('Copied!', 'Student code copied to clipboard');
                          } else {
                            Alert.alert('Student Code', studentCode);
                          }
                        }
                      } catch (error) {
                        console.error('Error sharing student code:', error);
                        // Fallback: show alert with code
                        Alert.alert('Your Student Code', studentCode);
                      }
                    }}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Programs are now shown in player profile when tapping a coach */}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Render Library tab content (ExploreTrainingScreen content)
  const renderLibraryContent = () => {
    // Loading state
    if (libraryLoading) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {[1, 2, 3, 4].map(i => <ProgramSkeletonCard key={i} />)}
        </View>
      );
    }

    // Error state
    if (libraryError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load programs</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLibraryPrograms}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Get all unique categories present in the fetched programs
    const uniqueCategories = [...new Set(explorePrograms.map(p => p.category).filter(Boolean))];
    
    // Sort categories strictly by the admin-defined order_index from the categories table.
    // Only show categories that are published (savedCategoryOrder only contains published ones).
    // Categories not listed in savedCategoryOrder are hidden from users.
    let categories;
    if (savedCategoryOrder && savedCategoryOrder.length > 0) {
      categories = savedCategoryOrder
        .map(savedCat => savedCat.name)
        .filter(name => uniqueCategories.includes(name));
    } else {
      categories = uniqueCategories;
    }
    
    const exerciseCount = getTotalExerciseCount();

    return (
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={libraryRefreshing}
            onRefresh={onLibraryRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
      >
        {/* Dynamically render all categories */}
        {categories.map((category) => {
          const categoryPrograms = explorePrograms.filter(p => p.category === category);
          
          if (categoryPrograms.length === 0) return null;
          
          const useHorizontalScroll = categoryPrograms.length >= 2;
          
          return (
            <View key={category} style={styles.libraryCategoriesSection}>
              <Text style={styles.librarySectionTitle}>{category}</Text>
              {useHorizontalScroll ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.libraryHorizontalScrollContent}
                  style={styles.libraryHorizontalScroll}
                >
                  {categoryPrograms.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.libraryHorizontalProgramCard}
                      onPress={() => navigateToLibraryProgram(program)}
                    >
                      <View style={styles.libraryThumbnailContainer}>
                        {program.thumbnail ? (
                          <ImageWithSkeleton
                            source={{ uri: program.thumbnail }}
                            style={styles.libraryProgramThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.libraryPlaceholderThumbnail}>
                            <CategoryIcon category={category} size={28} color="#6366F1" />
                          </View>
                        )}
                      </View>
                      <View style={styles.libraryProgramDetails}>
                        <Text style={styles.libraryProgramTitle}>{program.name}</Text>
                        <View style={styles.libraryRatingContainer}>
                          <WebIcon name="star" size={12} color="#FFB800" />
                          <Text style={styles.libraryRatingText}>{program.rating}</Text>
                          <Text style={styles.libraryAddedText}>• Added {program.addedCount.toLocaleString()} times</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.libraryProgramsGrid}>
                  {categoryPrograms.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.libraryProgramCard}
                      onPress={() => navigateToLibraryProgram(program)}
                    >
                      <View style={styles.libraryThumbnailContainer}>
                        {program.thumbnail ? (
                          <ImageWithSkeleton
                            source={{ uri: program.thumbnail }}
                            style={styles.libraryProgramThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.libraryPlaceholderThumbnail}>
                            <CategoryIcon category={category} size={28} color="#6366F1" />
                          </View>
                        )}
                      </View>
                      <View style={styles.libraryProgramDetails}>
                        <Text style={styles.libraryProgramTitle}>{program.name}</Text>
                        <View style={styles.libraryRatingContainer}>
                          <WebIcon name="star" size={12} color="#FFB800" />
                          <Text style={styles.libraryRatingText}>{program.rating}</Text>
                          <Text style={styles.libraryAddedText}>• Added {program.addedCount.toLocaleString()} times</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Empty state */}
        {explorePrograms.length === 0 && !libraryLoading && !libraryError && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No programs available</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  const renderProgramsContent = () => (
    <View style={styles.customizedContainer}>
      {programs.length === 0 ? (
        <View style={styles.emptyCustomList}>
          <Text style={styles.emptyCustomListIcon}>✨</Text>
          <Text style={styles.emptyCustomListTitle}>Get Started</Text>
          <Text style={styles.emptyCustomListDescription}>
            Create your first custom training program to get started!
          </Text>
          {/* AI Generation temporarily hidden */}
          {/* <TouchableOpacity
            style={styles.aiGenerateButtonLarge}
            onPress={generateAIProgramHandler}
            disabled={isGeneratingAI}
          >
            <Text style={styles.aiGenerateButtonLargeText}>
              {isGeneratingAI ? 'Creating Your Program...' : 'Generate Your AI Program'}
            </Text>
          </TouchableOpacity> */}
          
          <TouchableOpacity
            style={styles.addFirstProgramButtonSecondary}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <Text style={styles.addFirstProgramButtonSecondaryText}>Create your first program</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.programsList}
          contentContainerStyle={styles.programsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          <View style={styles.programsHeader}>
            <Text style={styles.programsSubtitle}>Tap to open • Long press to delete</Text>
          </View>
          
          {programs.map((program) => (
            <View key={program.id} style={styles.programCard}>
              <TouchableOpacity
                style={styles.programContent}
                onPress={() => navigateToProgram(program)}
                onLongPress={() => deleteProgram(program.id)}
              >
                <View style={styles.programThumbnailContainer}>
                  {program.thumbnail ? (
                    <Image 
                      source={{ 
                        uri: typeof program.thumbnail === 'string' 
                          ? program.thumbnail 
                          : program.thumbnail.uri 
                      }} 
                      style={styles.programThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.programPlaceholder}>
                      <Text style={styles.placeholderText}>🏆</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {program.description ? (
                    <Text style={styles.programDescription}>{program.description}</Text>
                  ) : null}
                  <View style={styles.programStatsRow}>
                    <View style={styles.programStats}>
                      <Text style={styles.programStatsText}>
                        {program.routines.length} routine{program.routines.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.programStatsText}>•</Text>
                      <Text style={styles.programStatsText}>
                        {program.routines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0)} exercises
                      </Text>
                      {program.is_ai_generated && (
                        <>
                          <Text style={styles.programStatsText}>•</Text>
                          <Text style={[styles.programStatsText, styles.aiGeneratedText]}>
                            🤖 AI
                          </Text>
                          {program.is_synced_to_db === false && (
                            <>
                              <Text style={styles.programStatsText}>•</Text>
                              <Text style={[styles.programStatsText, styles.unsyncedText]}>
                                📱 Local
                              </Text>
                            </>
                          )}
                        </>
                      )}
                    </View>
                    <View style={styles.programActions}>
                      <Text style={styles.chevronText}>{'>'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* AI Generation buttons temporarily hidden */}
          {/* {!hasAIProgram ? (
            <TouchableOpacity
              style={styles.aiGenerateButton}
              onPress={generateAIProgramHandler}
              disabled={isGeneratingAI}
            >
              <Text style={styles.aiGenerateButtonIcon}>🤖</Text>
              <Text style={styles.aiGenerateButtonText}>
                {isGeneratingAI ? 'Generating...' : 'Generate Your AI Program'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.aiUpdateButton}
              onPress={updateAIProgramHandler}
              disabled={isGeneratingAI}
            >
              <Text style={styles.aiUpdateButtonIcon}>🔄</Text>
              <Text style={styles.aiUpdateButtonText}>
                {isGeneratingAI ? 'Updating...' : 'Update Your AI Program'}
              </Text>
            </TouchableOpacity>
          )} */}

          <TouchableOpacity
            style={styles.addMoreProgramsButton}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <Text style={styles.addIconText}>+</Text>
            <Text style={styles.addMoreProgramsButtonText}>Create new program</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="surface"
        bordered
        title={currentView === 'myTraining' ? 'My Training' : 'Training Programs'}
        subtitle={
          currentView === 'myTraining'
            ? 'Self-guided programs'
            : currentView === 'library'
            ? 'Browse catalog'
            : 'Coach-assigned training'
        }
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tab} onPress={() => setCurrentView('myTraining')}>
            <Text style={[styles.tabText, { color: t.textMuted }, currentView === 'myTraining' && { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>
              My Training
            </Text>
            {currentView === 'myTraining' && <View style={[styles.activeTabIndicator, { backgroundColor: t.accentPurple }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setCurrentView('library')}>
            <Text style={[styles.tabText, { color: t.textMuted }, currentView === 'library' && { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>
              Library
            </Text>
            {currentView === 'library' && <View style={[styles.activeTabIndicator, { backgroundColor: t.accentPurple }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setCurrentView('coach')}>
            <Text style={[styles.tabText, { color: t.textMuted }, currentView === 'coach' && { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>
              Coach Program
            </Text>
            {currentView === 'coach' && <View style={[styles.activeTabIndicator, { backgroundColor: t.accentPurple }]} />}
          </TouchableOpacity>
        </View>
      </ScreenHeaderShell>
      
      {currentView === 'myTraining' ? (
        renderMyTrainingContent()
      ) : currentView === 'coach' ? (
        renderCoachProgramsContent()
      ) : currentView === 'library' ? (
        renderLibraryContent()
      ) : currentView === 'fun' ? (
        renderFunContent()
      ) : isLoadingPrograms ? (
        renderLoadingScreen()
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {renderProgramsContent()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* AI Generation Loading Overlay */}
      {renderAIGenerationOverlay()}

      {/* Create Program Modal */}
      <Modal
        visible={showCreateProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateProgramModal(false);
          setNewProgramName('');
          setSelectedImage(null);
          setIsCoachProgram(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowCreateProgramModal(false);
                setNewProgramName('');
                setSelectedImage(null);
                setIsCoachProgram(false);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Program</Text>
            <TouchableOpacity
              style={[styles.modalCreateButton, !newProgramName.trim() && styles.modalCreateButtonDisabled]}
              onPress={createProgram}
              disabled={!newProgramName.trim()}
            >
              <Text style={[styles.modalCreateText, !newProgramName.trim() && styles.modalCreateTextDisabled]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Program Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={newProgramName}
                onChangeText={setNewProgramName}
                placeholder="e.g., Master the Soft Game (4 weeks)"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              
              <Text style={styles.modalLabel}>Program Thumbnail</Text>
              <View style={styles.imageUploadSection}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: selectedImage.uri }} 
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadImageButton}
                    onPress={pickImage}
                    disabled={isProcessingImage}
                  >
                    <Text style={styles.uploadImageText}>
                      {isProcessingImage ? 'Processing...' : 'Add Thumbnail'}
                    </Text>
                    <Text style={styles.uploadImageSubtext}>
                      Square images work best
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.modalLabel}>Coach Program Only</Text>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsCoachProgram(!isCoachProgram)}
              >
                <View style={[styles.checkbox, isCoachProgram && styles.checkboxChecked]}>
                  {isCoachProgram && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabel}>This program is for coaches only</Text>
                  <Text style={styles.checkboxDescription}>
                    Coach programs will be separated from student programs to keep content organized
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* My Training — Enrollment Confirm Sheet */}
      <EnrollmentConfirmSheet
        visible={enrollSheetVisible}
        program={enrollSheetProgram}
        initialRole={enrollSheetRole}
        existingPrimary={primaryTrack}
        skillSlotsFull={skillSlotsFull}
        onConfirm={handleEnrollConfirm}
        onCancel={() => setEnrollSheetVisible(false)}
        loading={enrollLoading}
      />

      {/* My Training — Skill picker modal */}
      {renderSkillPickerModal()}

      {/* My Training — Archive confirm sheet */}
      {renderArchiveConfirmModal()}

      {/* iOS toast overlay */}
      {renderToast()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  continueCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  continueCardText: { flex: 1 },
  continueLabel: { fontSize: 10, color: '#6366F1', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  continueTitle: { fontSize: 14, color: '#1F2937', fontWeight: '600', marginTop: 1 },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Programs styles
  customizedContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyCustomList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyCustomListIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCustomListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCustomListDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  aiGenerateButtonIcon: {
    fontSize: 18,
    color: 'white',
  },
  aiGenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  aiUpdateButtonIcon: {
    fontSize: 18,
    color: 'white',
  },
  aiUpdateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiGenerateButtonLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiGenerateButtonLargeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  addFirstProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstProgramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addFirstProgramButtonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  addFirstProgramButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  programsList: {
    flex: 1,
  },
  programsContent: {
    padding: (width === 768 && height >= 1024) ? 24 : (width >= 768 ? 32 : 16), // Optimized for iPad portrait
    paddingBottom: 40,
  },
  programsHeader: {
    marginBottom: 16,
  },
  programsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  programsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programContent: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    alignItems: 'center',
  },
  programThumbnailContainer: {
    width: getThumbnailSize(width, height).width,
    height: getThumbnailSize(width, height).height,
    borderRadius: 12,
    marginRight: (width === 768 && height >= 1024) ? 20 : 16, // More spacing for iPad portrait
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  programThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  programPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  programStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  programStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  aiGeneratedText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  unsyncedText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  programActions: {
    paddingLeft: 8,
  },
  addMoreProgramsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  addMoreProgramsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholderText: {
    fontSize: 24,
  },
  chevronText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCreateButton: {
    padding: 8,
  },
  modalCreateButtonDisabled: {
    opacity: 0.5,
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalCreateTextDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
  },
  modalForm: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInputMultiline: {
    height: 80,
    paddingTop: 12,
  },
  // Image upload styles
  imageUploadSection: {
    marginBottom: 16,
  },
  uploadImageButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  uploadImageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedImageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 24,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
  },
  loadingBall: {
    width: 60,
    height: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  // AI Generation Overlay styles
  aiGenerationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  aiGenerationContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  aiGenerationBall: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  aiGenerationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  aiGenerationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  aiProgressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  aiProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  aiProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
    transition: 'width 0.5s ease-in-out',
  },
  aiProgressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  aiGenerationNote: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  aiCancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  aiCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  findCoachCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  findCoachCTAText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
  },
  tab: {
    marginRight: 32,
    paddingBottom: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
  // Library tab styles (from ExploreTrainingScreen)
  libraryHeaderContainer: {
    paddingHorizontal: (width === 768 && height >= 1024) ? 24 : 16,
    paddingVertical: (width === 768 && height >= 1024) ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  libraryHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  libraryExerciseCount: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 4,
  },
  libraryCategoriesSection: {
    marginBottom: (width === 768 && height >= 1024) ? 28 : 32,
    paddingHorizontal: (width === 768 && height >= 1024) ? 24 : 16,
  },
  librarySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  libraryProgramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  libraryHorizontalScroll: {
    marginLeft: -16,
  },
  libraryHorizontalScrollContent: {
    paddingRight: (width === 768 && height >= 1024) ? 24 : 16,
  },
  libraryProgramCard: {
    width: getCardWidth(width, height),
    marginRight: 12,
    marginBottom: (width === 768 && height >= 1024) ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  libraryHorizontalProgramCard: {
    width: getHorizontalCardWidth(width, height),
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  libraryThumbnailContainer: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  libraryProgramThumbnail: {
    width: '100%',
    height: '100%',
  },
  libraryPlaceholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  libraryPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  libraryProgramDetails: {
    padding: (width === 768 && height >= 1024) ? 14 : 12,
  },
  libraryProgramTitle: {
    fontSize: (width === 768 && height >= 1024) ? 15 : 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: (width === 768 && height >= 1024) ? 20 : 18,
  },
  libraryRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  libraryRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  libraryAddedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flexShrink: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Coach Program tab styles
  coachScrollContent: {
    flexGrow: 1,
    paddingTop: 19, // Reduced by 40% from 32
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  coachEmptyContent: {
    paddingHorizontal: 32,
    paddingTop: 14, // Reduced by 40% from 24
    paddingBottom: 24,
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  coachEmptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  coachEmptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  coachEmptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  // Steps visual guide
  stepsContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 28,
    marginBottom: 4,
  },
  // Quick info cards
  quickInfoCards: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  quickInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  quickInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Status indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  coachProgramsHeader: {
    paddingHorizontal: (width === 768 && height >= 1024) ? 24 : 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  coachProgramsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  coachProgramsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  coachProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  coachBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coachBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Student code card styles
  studentCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  studentCodeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentCodeValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
    flex: 1,
    includeFontPadding: false,
  },
  shareButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 100,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Coaches section styles
  coachesSection: {
    paddingHorizontal: (width === 768 && height >= 1024) ? 24 : 16,
    paddingTop: 24,
    paddingBottom: 16,
    marginBottom: 8,
  },
  coachesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coachCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  coachCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  coachCardAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachCardAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coachCardInfo: {
    flex: 1,
  },
  coachCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  coachCardSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  coachCardBio: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Fun tab styles
  funContainer: {
    padding: 16,
  },
  doubleChallengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  doubleChallengeIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  doubleChallengeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  doubleChallengeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  doubleChallengeArrow: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  // Find your coach section styles
  coachProgramsContainer: {
    flex: 1,
  },
  findCoachSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  findCoachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  findCoachIconDirect: {
    marginRight: 14,
  },
  findCoachContent: {
    flex: 1,
  },
  findCoachTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  findCoachDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // ─── My Training styles ───────────────────────────────────────────────────
  myTrainingEmptyHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  myTrainingEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  myTrainingEmptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  goalCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    overflow: 'hidden',
  },
  goalCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  goalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  goalCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B' },
  goalCardMeta: { fontSize: 12, color: '#6366F1', marginTop: 2 },
  goalCardSecondary: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  goalCardSecondaryText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151' },
  myTrainingSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  myTrainingSectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  myTrainingSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  swipeRowWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  skillPickerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 2,
  },
  skillPickerGroupHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  skillPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skillPickerInfo: { flex: 1 },
  skillPickerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  skillPickerMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  skillPickerProgramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  skillPickerProgramThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    flexShrink: 0,
  },
  skillPickerProgramThumbPlaceholder: {
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillPickerEmptyState: {
    paddingHorizontal: 40,
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
  },
  skillPickerEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  skillPickerEmptyBody: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  skillPickerEmptyCta: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skillPickerEmptyCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // Archive / Start new goal sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  sheetBody: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 6 },
  sheetMeta: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  sheetPrimaryBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
  },
  sheetPrimaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sheetCancelBtn: { alignItems: 'center', paddingVertical: 14 },
  sheetCancelBtnText: { color: '#6B7280', fontSize: 15, fontWeight: '500' },
  // Toast
  toastOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toastBox: {
    backgroundColor: 'rgba(17,24,39,0.88)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
