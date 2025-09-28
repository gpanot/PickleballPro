import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Storage constants
const EXERCISE_RATINGS_KEY = '@pickleball_hero:exercise_ratings';
const COLLECTED_BADGES_KEY = '@pickleball_hero:collected_badges';
const PROGRAM_PROGRESS_KEY = '@pickleball_hero:program_progress';

// Storage functions for badges
const saveCollectedBadges = async (badges) => {
  try {
    const badgesArray = Array.from(badges);
    await AsyncStorage.setItem(COLLECTED_BADGES_KEY, JSON.stringify(badgesArray));
  } catch (error) {
    console.error('Error saving collected badges:', error);
  }
};

const loadCollectedBadges = async () => {
  try {
    const badgesJson = await AsyncStorage.getItem(COLLECTED_BADGES_KEY);
    if (badgesJson) {
      const badgesArray = JSON.parse(badgesJson);
      return new Set(badgesArray);
    }
    return new Set();
  } catch (error) {
    console.error('Error loading collected badges:', error);
    return new Set();
  }
};

// Storage functions for program progress
const saveProgramProgress = async (programProgress) => {
  try {
    const progressObject = Object.fromEntries(programProgress);
    await AsyncStorage.setItem(PROGRAM_PROGRESS_KEY, JSON.stringify(progressObject));
  } catch (error) {
    console.error('Error saving program progress:', error);
  }
};

const loadProgramProgress = async () => {
  try {
    const progressJson = await AsyncStorage.getItem(PROGRAM_PROGRESS_KEY);
    if (progressJson) {
      const progressObject = JSON.parse(progressJson);
      return new Map(Object.entries(progressObject));
    }
    return new Map();
  } catch (error) {
    console.error('Error loading program progress:', error);
    return new Map();
  }
};

// DUPR Programs data (from SkillsScreen) - needed for program completion detection
const duprPrograms = {
  "dupr_programs": [
    {
      "dupr": 2.0,
      "program_id": "P-2.0",
      "sessions": [
        {
          "session_id": "P-2.0-S1",
          "title": "Foundations: Control & Consistency",
          "drills": [
            { "skill": "Serve", "level": 1, "title": "Serve Consistency", "goal": "7/10 serves in play" },
            { "skill": "Return", "level": 1, "title": "Return Consistency", "goal": "7/10 returns in play" },
            { "skill": "Dink", "level": 1, "title": "Dink Rally", "goal": "10 consecutive dinks" }
          ]
        }
      ]
    },
    {
      "dupr": 2.1,
      "program_id": "P-2.1",
      "sessions": [
        {
          "session_id": "P-2.1-S1",
          "title": "Expanding the Basics",
          "drills": [
            { "skill": "Serve", "level": 1, "title": "Serve Accuracy", "goal": "8/10 serves in play" },
            { "skill": "Reset", "level": 1, "title": "Basic Reset", "goal": "4/10 into NVZ" }
          ]
        }
      ]
    }
    // More programs would be added here from the full DUPR matrix
  ]
};

// Badge matrix data
const badgeMatrix = {
  "badge_sets": [
    {
      "dupr": 2.0,
      "badges": [
        {
          "id": "rookie_20",
          "name": "Rookie",
          "type": "program_completion",
          "program_id": "P-2.0",
          "tiers": { "single": true }
        },
        {
          "id": "dink_debut_20",
          "name": "Dink Debut",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 1,
          "metric": "streak",
          "thresholds": { "bronze": 10, "silver": 20, "gold": 30 }
        }
      ]
    },
    {
      "dupr": 2.1,
      "badges": [
        {
          "id": "serve_starter_21",
          "name": "Serve Starter",
          "type": "drill_threshold",
          "skill": "Serve",
          "level": 1,
          "metric": "count_in",
          "thresholds": { "bronze": "8/10", "silver": "9/10", "gold": "10/10" }
        },
        {
          "id": "reset_beginner_21",
          "name": "Reset Beginner",
          "type": "drill_threshold",
          "skill": "Reset",
          "level": 1,
          "metric": "count_success",
          "thresholds": { "bronze": "4/10", "silver": "6/10", "gold": "8/10" }
        }
      ]
    },
    {
      "dupr": 2.2,
      "badges": [
        {
          "id": "return_builder_22",
          "name": "Return Builder",
          "type": "drill_threshold",
          "skill": "Return",
          "level": 2,
          "metric": "count_deep",
          "thresholds": { "bronze": "7/10", "silver": "8/10", "gold": "9/10" }
        },
        {
          "id": "dink_builder_22",
          "name": "Dink Builder",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 2,
          "metric": "streak",
          "thresholds": { "bronze": 12, "silver": 18, "gold": 25 }
        }
      ]
    },
    {
      "dupr": 2.3,
      "badges": [
        {
          "id": "volley_starter_23",
          "name": "Volley Starter",
          "type": "drill_threshold",
          "skill": "Volley",
          "level": 1,
          "metric": "count_success",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "transition_beginner_23",
          "name": "Transition Beginner",
          "type": "drill_threshold",
          "skill": "Transition",
          "level": 1,
          "metric": "count_success",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        }
      ]
    },
    {
      "dupr": 2.4,
      "badges": [
        {
          "id": "return_sniper_24",
          "name": "Return Sniper",
          "type": "drill_threshold",
          "skill": "Return",
          "level": 3,
          "metric": "count_crosscourt",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "footwork_first_24",
          "name": "Footwork First",
          "type": "drill_threshold",
          "skill": "Transition",
          "level": 2,
          "metric": "count_balanced_entry",
          "thresholds": { "bronze": "7/10", "silver": "9/10", "gold": "10/10" }
        }
      ]
    },
    {
      "dupr": 2.5,
      "badges": [
        {
          "id": "drop_artist_25",
          "name": "Drop Artist",
          "type": "drill_threshold",
          "skill": "Drop",
          "level": 1,
          "metric": "count_nvz",
          "thresholds": { "bronze": "4/10", "silver": "6/10", "gold": "8/10" }
        },
        {
          "id": "dink_grinder_25",
          "name": "Dink Grinder",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 2,
          "metric": "streak_crosscourt",
          "thresholds": { "bronze": 15, "silver": 25, "gold": 35 }
        }
      ]
    },
    {
      "dupr": 2.6,
      "badges": [
        {
          "id": "corner_server_26",
          "name": "Corner Server",
          "type": "drill_threshold",
          "skill": "Serve",
          "level": 3,
          "metric": "count_corners",
          "thresholds": { "bronze": "4/8", "silver": "6/8", "gold": "8/8" }
        },
        {
          "id": "reset_wizard_26",
          "name": "Reset Wizard",
          "type": "drill_threshold",
          "skill": "Reset",
          "level": 2,
          "metric": "count_under_pressure",
          "thresholds": { "bronze": "5/10", "silver": "7/10", "gold": "9/10" }
        }
      ]
    },
    {
      "dupr": 2.7,
      "badges": [
        {
          "id": "extended_rally_27",
          "name": "Extended Rally",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 3,
          "metric": "streak",
          "thresholds": { "bronze": 20, "silver": 30, "gold": 40 }
        },
        {
          "id": "volley_wall_27",
          "name": "Volley Wall",
          "type": "drill_threshold",
          "skill": "Volley",
          "level": 2,
          "metric": "count_redirect",
          "thresholds": { "bronze": "5/10", "silver": "7/10", "gold": "9/10" }
        }
      ]
    },
    {
      "dupr": 2.8,
      "badges": [
        {
          "id": "quick_hands_28",
          "name": "Quick Hands",
          "type": "drill_threshold",
          "skill": "Speed-up",
          "level": 1,
          "metric": "count_wins",
          "thresholds": { "bronze": "3/5", "silver": "4/5", "gold": "5/5" }
        },
        {
          "id": "pressure_dinker_28",
          "name": "Pressure Dinker",
          "type": "drill_threshold",
          "skill": "Dink",
          "level": 3,
          "metric": "streak_pressure",
          "thresholds": { "bronze": 12, "silver": 20, "gold": 30 }
        }
      ]
    },
    {
      "dupr": 2.9,
      "badges": [
        {
          "id": "consistent_server_29",
          "name": "Consistent Server",
          "type": "drill_threshold",
          "skill": "Serve",
          "level": 3,
          "metric": "count_deep",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "target_returner_29",
          "name": "Target Returner",
          "type": "drill_threshold",
          "skill": "Return",
          "level": 3,
          "metric": "count_target_side",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        },
        {
          "id": "reset_pro_29",
          "name": "Reset Pro",
          "type": "drill_threshold",
          "skill": "Reset",
          "level": 3,
          "metric": "count_under_pressure",
          "thresholds": { "bronze": "6/10", "silver": "8/10", "gold": "10/10" }
        }
      ]
    },
    {
      "dupr": 3.0,
      "badges": [
        {
          "id": "solid_30",
          "name": "Solid 3.0",
          "type": "program_completion",
          "program_id": "P-3.0",
          "tiers": { "single": true }
        },
        {
          "id": "all_rounder_30",
          "name": "All-Rounder",
          "type": "skill_collection",
          "requirement": { "skills_at_or_above_level": 3, "count": { "bronze": 5, "silver": 8, "gold": 12 } }
        },
        {
          "id": "club_ready_30",
          "name": "Club Ready",
          "type": "meta_sessions",
          "thresholds": { "bronze": 20, "silver": 30, "gold": 50 }
        }
      ]
    }
  ]
};

// Badge icons mapping
const getBadgeIcon = (badgeId, skillType) => {
  const iconMap = {
    // Skill-based icons
    'Serve': '🎯',
    'Return': '↩️',
    'Dink': '🏓',
    'Drop': '🎯',
    'Volley': '⚡',
    'Reset': '🔄',
    'Speed-up': '💨',
    'Transition': '🏃',
    
    // Special badges
    'rookie': '🔰',
    'solid': '🏆',
    'all_rounder': '⭐',
    'club_ready': '🎖️'
  };
  
  // Try skill-based mapping first
  if (skillType && iconMap[skillType]) {
    return iconMap[skillType];
  }
  
  // Fallback to badge name patterns
  for (const [key, icon] of Object.entries(iconMap)) {
    if (badgeId.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return '🏅'; // Default badge icon
};

export default function BadgesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // State
  const [exerciseRatings, setExerciseRatings] = React.useState(new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentFilter, setCurrentFilter] = React.useState('all'); // 'all', 'dupr', 'skill'
  const [selectedDupr, setSelectedDupr] = React.useState(null);
  const [selectedSkill, setSelectedSkill] = React.useState(null);
  const [collectedBadges, setCollectedBadges] = React.useState(new Set());
  const [showCongratulationModal, setShowCongratulationModal] = React.useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = React.useState(null);
  const [programProgress, setProgramProgress] = React.useState(new Map());

  // Load exercise ratings, collected badges, and program progress
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [ratingsJson, savedCollectedBadges, savedProgramProgress] = await Promise.all([
          AsyncStorage.getItem(EXERCISE_RATINGS_KEY),
          loadCollectedBadges(),
          loadProgramProgress()
        ]);
        
        if (ratingsJson) {
          const ratingsArray = JSON.parse(ratingsJson);
          setExerciseRatings(new Map(ratingsArray));
        }
        
        setCollectedBadges(savedCollectedBadges);
        setProgramProgress(savedProgramProgress);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save collected badges when they change
  React.useEffect(() => {
    if (!isLoading) {
      saveCollectedBadges(collectedBadges);
    }
  }, [collectedBadges, isLoading]);

  // Save program progress when it changes
  React.useEffect(() => {
    if (!isLoading) {
      saveProgramProgress(programProgress);
    }
  }, [programProgress, isLoading]);

  // Detect program completion when exercise ratings change
  React.useEffect(() => {
    if (!isLoading && exerciseRatings.size > 0) {
      detectAndUpdateProgramCompletion();
      checkForNewlyUnlockedBadges();
    }
  }, [exerciseRatings, isLoading]);

  // Check for newly unlocked badges when program progress changes
  React.useEffect(() => {
    if (!isLoading && programProgress.size > 0) {
      checkForNewlyUnlockedBadges();
    }
  }, [programProgress, isLoading]);

  // Function to detect and update program completion
  const detectAndUpdateProgramCompletion = () => {
    const updatedProgress = new Map(programProgress);
    
    // Check each program for completion
    duprPrograms.dupr_programs.forEach(program => {
      const programId = program.program_id;
      const currentStatus = programProgress.get(programId) || { completed: false, progress: 0 };
      
      if (!currentStatus.completed) {
        // Get all exercises for this program
        const allExercises = [];
        program.sessions.forEach(session => {
          if (session.drills) {
            session.drills.forEach(drill => {
              const skillKey = getSkillKey(drill.skill);
              const exerciseKey = `${program.dupr}-${skillKey}-${drill.title}`;
              allExercises.push(exerciseKey);
            });
          }
        });
        
        // Count completed exercises (marked as complete)
        const completedExercises = allExercises.filter(exerciseKey => {
          return exerciseRatings.has(exerciseKey);
        });
        
        const progress = allExercises.length > 0 ? completedExercises.length / allExercises.length : 0;
        const isCompleted = progress >= 1.0; // 100% completion
        
        if (isCompleted !== currentStatus.completed || progress !== currentStatus.progress) {
          updatedProgress.set(programId, {
            completed: isCompleted,
            progress: progress,
            completedAt: isCompleted ? new Date().toISOString() : null
          });
          
          console.log(`Program ${programId} progress: ${Math.round(progress * 100)}%, completed: ${isCompleted}`);
        }
      }
    });
    
    // Update state if there are changes
    if (updatedProgress.size !== programProgress.size || 
        Array.from(updatedProgress.entries()).some(([key, value]) => {
          const current = programProgress.get(key);
          return !current || current.completed !== value.completed || current.progress !== value.progress;
        })) {
      setProgramProgress(updatedProgress);
    }
  };

  // Check for newly unlocked badges that haven't been collected yet
  const checkForNewlyUnlockedBadges = () => {
    const allBadges = badgeMatrix.badge_sets.flatMap(set => 
      set.badges.map(badge => ({ ...badge, dupr: set.dupr }))
    );
    
    for (const badge of allBadges) {
      // Skip if badge is already collected
      if (collectedBadges.has(badge.id)) continue;
      
      // Calculate if this badge should be unlocked (ignoring collection status)
      const progress = calculateBadgeProgressRaw(badge);
      
      if (progress.isUnlocked) {
        // Badge is unlocked but not collected - show collection modal
        setNewlyUnlockedBadge(badge);
        setShowCongratulationModal(true);
        console.log(`Found unlocked badge for collection: ${badge.name}`);
        break; // Show one at a time
      }
    }
  };

  // Calculate badge progress based on exercise completion (ignoring collection status)
  const calculateBadgeProgressRaw = (badge) => {
    // Simple logic: just unlocked or locked based on actual progress
    if (badge.type === 'program_completion') {
      // Program completion badges (like Rookie) require completing entire program
      const programId = badge.program_id;
      const programStatus = programProgress.get(programId);
      
      if (programStatus && programStatus.completed) {
        // Program completed - badge unlocked
        return { isUnlocked: true, progress: 1.0 };
      }
      
      return { isUnlocked: false, progress: programStatus ? programStatus.progress : 0 };
    }
    
    if (badge.type === 'drill_threshold') {
      const skillKey = getSkillKey(badge.skill);
      
      // Count completed exercises for this skill at this DUPR level (marked as complete)
      const completedCount = Array.from(exerciseRatings.keys())
        .filter(key => key.startsWith(`${badge.dupr}-${skillKey}-`)).length;

      // Simple logic: 1+ completed = unlocked
      if (completedCount >= 1) return { isUnlocked: true, progress: 1.0 };
      
      return { isUnlocked: false, progress: 0 };
    }
    
    if (badge.type === 'skill_collection') {
      // Skill collection badges (like All-Rounder) require multiple skills at certain levels
      return { isUnlocked: false, progress: 0 };
    }
    
    if (badge.type === 'meta_sessions') {
      // Meta session badges (like Club Ready) require session count tracking
      return { isUnlocked: false, progress: 0 };
    }
    
    // All badges start locked by default
    return { isUnlocked: false, progress: 0 };
  };

  // Calculate badge progress for display (including collection status)
  const calculateBadgeProgress = (badge) => {
    // If badge is collected, it should be unlocked
    if (collectedBadges.has(badge.id)) {
      return { isUnlocked: true, progress: 1.0 };
    }
    
    return calculateBadgeProgressRaw(badge);
  };

  // Helper function to map skill names to keys (same as in SkillsScreen)
  const getSkillKey = (skillName) => {
    const skillMap = {
      'serve': 'serve',
      'return': 'return', 
      'drive': 'drive',
      'dink': 'dinking',
      'drop': 'thirdShot',
      'volley': 'volleys',
      'reset': 'resets',
      'speed-up': 'speedUps',
      'transition': 'transition',
      'strategy': 'strategy'
    };
    
    const normalizedName = skillName.toLowerCase();
    return skillMap[normalizedName] || normalizedName;
  };

  // Get all badges flattened
  const getAllBadges = () => {
    return badgeMatrix.badge_sets.flatMap(set => 
      set.badges.map(badge => ({
        ...badge,
        dupr: set.dupr,
        progress: calculateBadgeProgress(badge)
      }))
    );
  };

  // Filter badges based on current filter
  const getFilteredBadges = () => {
    const allBadges = getAllBadges();
    
    if (currentFilter === 'dupr' && selectedDupr) {
      return allBadges.filter(badge => badge.dupr === selectedDupr);
    }
    
    if (currentFilter === 'skill' && selectedSkill) {
      return allBadges.filter(badge => badge.skill === selectedSkill);
    }
    
    return allBadges;
  };

  // Get unique DUPR levels for filter
  const getDuprLevels = () => {
    return [...new Set(badgeMatrix.badge_sets.map(set => set.dupr))].sort();
  };

  // Get unique skills for filter
  const getSkills = () => {
    const skills = new Set();
    badgeMatrix.badge_sets.forEach(set => {
      set.badges.forEach(badge => {
        if (badge.skill) skills.add(badge.skill);
      });
    });
    return Array.from(skills).sort();
  };

  const renderBadgeRing = (progress) => {
    const { isUnlocked } = progress;
    
    return (
      <View style={[
        styles.badgeRing,
        isUnlocked && { borderColor: '#10B981' }
      ]}>
        {/* No fill needed for unlocked badges */}
      </View>
    );
  };

  const collectBadge = () => {
    if (newlyUnlockedBadge) {
      setCollectedBadges(prev => new Set([...prev, newlyUnlockedBadge.id]));
      setShowCongratulationModal(false);
      setNewlyUnlockedBadge(null);
    }
  };

  const clearAllProgress = async () => {
    try {
      // Clear all AsyncStorage keys related to progress
      await AsyncStorage.multiRemove([
        EXERCISE_RATINGS_KEY,
        COLLECTED_BADGES_KEY,
        PROGRAM_PROGRESS_KEY
      ]);
      
      // Reset all state
      setExerciseRatings(new Map());
      setCollectedBadges(new Set());
      setProgramProgress(new Map());
      
      console.log('All progress cleared successfully!');
      alert('All progress has been reset! You can now test from scratch.');
    } catch (error) {
      console.error('Error clearing progress:', error);
      alert('Error clearing progress. Check console for details.');
    }
  };

  const renderBadgeCard = (badge) => {
    const icon = getBadgeIcon(badge.id, badge.skill);
    const { isUnlocked } = badge.progress;
    const isCollected = collectedBadges.has(badge.id);
    
    // Debug logging for specific badges
    if (badge.name === "Dink Debut" || badge.name === "Rookie") {
      console.log(`Badge ${badge.name}:`, {
        isUnlocked,
        isCollected,
        badgeType: badge.type,
        progress: badge.progress
      });
    }
    
    return (
      <TouchableOpacity
        key={badge.id}
        style={[
          styles.badgeCard,
          !isUnlocked && styles.badgeCardLocked,
          isUnlocked && !isCollected && styles.badgeCardUnlocked,
          isUnlocked && isCollected && styles.badgeCardCollected,
        ]}
      >
        {/* Badge Ring */}
        <View style={styles.badgeIconContainer}>
          {renderBadgeRing(badge.progress)}
          <Text style={[
            styles.badgeIcon,
            !isUnlocked && styles.badgeIconLocked
          ]}>
            {icon}
          </Text>
          {isCollected && (
            <View style={styles.collectedIndicator}>
              <Text style={styles.collectedCheckmark}>✓</Text>
            </View>
          )}
        </View>
        
        {/* Badge Info */}
        <Text style={[
          styles.badgeName,
          !isUnlocked && styles.badgeNameLocked
        ]}>
          {badge.name}
        </Text>
        
        <Text style={[
          styles.badgeLabel,
          !isUnlocked && styles.badgeLabelLocked
        ]}>
          DUPR {badge.dupr}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, currentFilter === 'all' && styles.filterTabActive]}
        onPress={() => setCurrentFilter('all')}
      >
        <Text style={[styles.filterTabText, currentFilter === 'all' && styles.filterTabTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, currentFilter === 'dupr' && styles.filterTabActive]}
        onPress={() => setCurrentFilter('dupr')}
      >
        <Text style={[styles.filterTabText, currentFilter === 'dupr' && styles.filterTabTextActive]}>
          By DUPR
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, currentFilter === 'skill' && styles.filterTabActive]}
        onPress={() => setCurrentFilter('skill')}
      >
        <Text style={[styles.filterTabText, currentFilter === 'skill' && styles.filterTabTextActive]}>
          By Skill
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubFilters = () => {
    if (currentFilter === 'dupr') {
      return (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.subFilterContainer}
          contentContainerStyle={styles.subFilterContent}
        >
          {getDuprLevels().map(dupr => (
            <TouchableOpacity
              key={dupr}
              style={[
                styles.subFilterChip,
                selectedDupr === dupr && styles.subFilterChipActive
              ]}
              onPress={() => setSelectedDupr(selectedDupr === dupr ? null : dupr)}
            >
              <Text style={[
                styles.subFilterChipText,
                selectedDupr === dupr && styles.subFilterChipTextActive
              ]}>
                {dupr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
    
    if (currentFilter === 'skill') {
      return (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.subFilterContainer}
          contentContainerStyle={styles.subFilterContent}
        >
          {getSkills().map(skill => (
            <TouchableOpacity
              key={skill}
              style={[
                styles.subFilterChip,
                selectedSkill === skill && styles.subFilterChipActive
              ]}
              onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
            >
              <Text style={[
                styles.subFilterChipText,
                selectedSkill === skill && styles.subFilterChipTextActive
              ]}>
                {skill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading badges...</Text>
      </View>
    );
  }

  const filteredBadges = getFilteredBadges();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          Unlock achievements through skill mastery
        </Text>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}
      
      {/* Sub Filters */}
      {renderSubFilters()}

      {/* Debug Reset Button */}
      <View style={styles.debugContainer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={clearAllProgress}
        >
          <Text style={styles.resetButtonText}>🔄 Reset All Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Badge Grid */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.badgeGrid}
        showsVerticalScrollIndicator={false}
      >
        {filteredBadges.map(renderBadgeCard)}
      </ScrollView>

      {/* Congratulation Modal */}
      {showCongratulationModal && newlyUnlockedBadge && (
        <View style={styles.modalOverlay}>
          <View style={styles.congratulationModal}>
            <View style={styles.congratulationContent}>
              {/* Badge Icon */}
              <View style={styles.congratulationBadgeContainer}>
                <View style={styles.congratulationTierRing}>
                  <Text style={styles.congratulationBadgeIcon}>
                    {getBadgeIcon(newlyUnlockedBadge.id, newlyUnlockedBadge.skill)}
                  </Text>
                </View>
              </View>

              {/* Congratulation Text */}
              <Text style={styles.congratulationTitle}>Congratulations!</Text>
              <Text style={styles.congratulationMessage}>
                You've unlocked the "{newlyUnlockedBadge.name}" badge!
              </Text>
              
              <Text style={styles.congratulationTier}>
                Achievement Unlocked!
              </Text>

              {/* Collect Button */}
              <TouchableOpacity
                style={styles.collectButton}
                onPress={collectBadge}
              >
                <Text style={styles.collectButtonText}>Collect the Badge</Text>
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
  },
  filterTabActive: {
    backgroundColor: '#1F2937',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: 'white',
  },
  subFilterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    maxHeight: 60,
  },
  subFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subFilterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  subFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  subFilterChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  debugContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: (width - 48) / 3, // 3 columns with 16px padding
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeCardLocked: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  badgeCardUnlocked: {
    borderColor: '#10B981',
    backgroundColor: 'white',
  },
  badgeCardCollected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    borderWidth: 3, // Thicker border for collected badges
  },
  badgeIconContainer: {
    position: 'relative',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 24,
    zIndex: 1,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: '#D1D5DB',
  },
  collectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  collectedCheckmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Congratulation Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  congratulationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  congratulationContent: {
    padding: 32,
    alignItems: 'center',
  },
  congratulationBadgeContainer: {
    marginBottom: 24,
  },
  congratulationTierRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    borderWidth: 4,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratulationBadgeIcon: {
    fontSize: 40,
  },
  congratulationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  congratulationMessage: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  congratulationTier: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 32,
    textAlign: 'center',
  },
  collectButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  collectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
