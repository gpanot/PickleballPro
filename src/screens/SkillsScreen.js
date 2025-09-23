import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Storage constants
const EXERCISE_RATINGS_KEY = '@pickleball_hero:exercise_ratings';
const COLLECTED_BADGES_KEY = '@pickleball_hero:collected_badges';
const PROGRAM_PROGRESS_KEY = '@pickleball_hero:program_progress';

// Storage functions
const saveExerciseRatings = async (ratings) => {
  try {
    const ratingsArray = Array.from(ratings.entries());
    await AsyncStorage.setItem(EXERCISE_RATINGS_KEY, JSON.stringify(ratingsArray));
  } catch (error) {
    console.error('Error saving exercise ratings:', error);
  }
};

const loadExerciseRatings = async () => {
  try {
    const ratingsJson = await AsyncStorage.getItem(EXERCISE_RATINGS_KEY);
    if (ratingsJson) {
      const ratingsArray = JSON.parse(ratingsJson);
      return new Map(ratingsArray);
    }
    return new Map();
  } catch (error) {
    console.error('Error loading exercise ratings:', error);
    return new Map();
  }
};

// Storage functions for badges and program progress
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

// Complete Badge matrix data from 2.0to3.0_badges_matrix.md
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

// Badge icon mapping
const getBadgeIcon = (badgeId, skillType) => {
  const iconMap = {
    'Serve': '🎯', 'Return': '↩️', 'Dink': '🏓', 'Drop': '🎯',
    'Volley': '⚡', 'Reset': '🔄', 'Speed-up': '💨', 'Transition': '🏃',
    'rookie': '🔰', 'solid': '🏆', 'all_rounder': '⭐', 'club_ready': '🎖️'
  };
  
  if (skillType && iconMap[skillType]) return iconMap[skillType];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (badgeId.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '🏅';
};

export default function SkillsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // DUPR Program Matrix Data - Correct JSON structure
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
            "title": "Building Depth & Stability",
            "drills": [
              { "skill": "Serve", "level": 1, "title": "Serve Consistency", "goal": "8/10 serves in" },
              { "skill": "Return", "level": 1, "title": "Deep Return Intro", "goal": "5/10 past midline" },
              { "skill": "Drive", "level": 1, "title": "FH Drive Depth", "goal": "6/10 beyond NVZ" },
              { "skill": "Reset", "level": 1, "title": "Mid-Court Reset", "goal": "4/10 into NVZ" },
              { "skill": "Dink", "level": 1, "title": "Cross-Court Dinks", "goal": "8 in a row" }
            ]
          }
        ]
      },
      {
        "dupr": 2.2,
        "program_id": "P-2.2",
        "sessions": [
          {
            "session_id": "P-2.2-S1",
            "title": "Deep Control",
            "drills": [
              { "skill": "Serve", "level": 2, "title": "Deep Serve", "goal": "7/10 serves to back third" },
              { "skill": "Return", "level": 2, "title": "Deep Return", "goal": "7/10 past midline" },
              { "skill": "Dink", "level": 2, "title": "Cross-Court Dinks", "goal": "12 in a row" },
              { "skill": "Drive", "level": 1, "title": "BH Drive Depth", "goal": "6/10 beyond NVZ" },
              { "skill": "Reset", "level": 1, "title": "Mid-Court Reset", "goal": "4/10 into NVZ" }
            ]
          }
        ]
      },
      {
        "dupr": 2.3,
        "program_id": "P-2.3",
        "sessions": [
          {
            "session_id": "P-2.3-S1",
            "title": "Consistency Under Structure",
            "drills": [
              { "skill": "Serve", "level": 2, "title": "Corner Target Serve", "goal": "4/8 to corners" },
              { "skill": "Return", "level": 2, "title": "Return + Approach", "goal": "6/10 reach NVZ" },
              { "skill": "Dink", "level": 2, "title": "Dink Target Drill", "goal": "6/12 into cones" },
              { "skill": "Volley", "level": 1, "title": "Block Volley", "goal": "6/10 into NVZ" },
              { "skill": "Transition", "level": 1, "title": "Approach Drill", "goal": "6/10 successful entries" }
            ]
          }
        ]
      },
      {
        "dupr": 2.4,
        "program_id": "P-2.4",
        "sessions": [
          {
            "session_id": "P-2.4-S1",
            "title": "Return Targets & NVZ Entry",
            "drills": [
              { "skill": "Serve", "level": 2, "title": "Deep Serve", "goal": "7/10 to back third" },
              { "skill": "Return", "level": 3, "title": "Cross-Court Return", "goal": "6/10 successful" },
              { "skill": "Dink", "level": 2, "title": "Middle Dink Control", "goal": "10 in a row" },
              { "skill": "Transition", "level": 2, "title": "Approach Footwork", "goal": "7/10 balanced" }
            ]
          }
        ]
      },
      {
        "dupr": 2.5,
        "program_id": "P-2.5",
        "sessions": [
          {
            "session_id": "P-2.5-S1",
            "title": "Introduce Third Shot Drop",
            "drills": [
              { "skill": "Serve", "level": 2, "title": "Serve Consistency", "goal": "9/10 serves in" },
              { "skill": "Return", "level": 2, "title": "Deep Return", "goal": "7/10 past midline" },
              { "skill": "Dink", "level": 2, "title": "Cross-Court Rally", "goal": "15 in a row" },
              { "skill": "Drop", "level": 1, "title": "Basic Third Shot Drop", "goal": "4/10 into NVZ" },
              { "skill": "Reset", "level": 2, "title": "Reset Under Pressure", "goal": "6/10 successful" }
            ]
          }
        ]
      },
      {
        "dupr": 2.6,
        "program_id": "P-2.6",
        "sessions": [
          {
            "session_id": "P-2.6-S1",
            "title": "Drop + Drive Choice",
            "drills": [
              { "skill": "Serve", "level": 3, "title": "Corner Serve", "goal": "4/8 to corner" },
              { "skill": "Return", "level": 3, "title": "Cross-Court Return", "goal": "7/10 successful" },
              { "skill": "Dink", "level": 3, "title": "Dink Target Drill", "goal": "6/12 cones" },
              { "skill": "Drop", "level": 2, "title": "Controlled Drop", "goal": "6/10 into NVZ" },
              { "skill": "Drive", "level": 2, "title": "Drive Depth Control", "goal": "7/10 past midline" },
              { "skill": "Volley", "level": 2, "title": "Punch Volley", "goal": "7/10 in play" },
              { "skill": "Reset", "level": 2, "title": "Reset vs Hard Feed", "goal": "5/10 successful" }
            ]
          }
        ]
      },
      {
        "dupr": 2.7,
        "program_id": "P-2.7",
        "sessions": [
          {
            "session_id": "P-2.7-S1",
            "title": "NVZ Rally Strength",
            "drills": [
              { "skill": "Serve", "level": 3, "title": "Reinforce Serve Placement", "goal": "7/10 targeted serves" },
              { "skill": "Return", "level": 3, "title": "Reinforce Cross-Court Return", "goal": "7/10 successful" },
              { "skill": "Dink", "level": 3, "title": "Extended Dink Rally", "goal": "20 consecutive dinks" },
              { "skill": "Drop", "level": 2, "title": "Target Drop to BH", "goal": "5/10 successful" },
              { "skill": "Volley", "level": 2, "title": "Redirect Volley", "goal": "5/10 to target" },
              { "skill": "Reset", "level": 2, "title": "Reset + Transition", "goal": "7/10 successful" }
            ]
          }
        ]
      },
      {
        "dupr": 2.8,
        "program_id": "P-2.8",
        "sessions": [
          {
            "session_id": "P-2.8-S1",
            "title": "Introduce Pressure & Speed-ups",
            "drills": [
              { "skill": "Dink", "level": 3, "title": "Pressure Dinking", "goal": "12 in a row without errors" },
              { "skill": "Speed-up", "level": 1, "title": "Controlled Speed-up", "goal": "5/10 into BH/body" },
              { "skill": "Volley", "level": 2, "title": "Counter-Volley", "goal": "5/10 successful" },
              { "skill": "Reset", "level": 3, "title": "Consistency Under Pressure", "goal": "7/10 soft resets" }
            ]
          }
        ]
      },
      {
        "dupr": 2.9,
        "program_id": "P-2.9",
        "sessions": [
          {
            "session_id": "P-2.9-S1",
            "title": "Match-Ready Consistency",
            "drills": [
              { "skill": "Serve", "level": 3, "title": "Spin + Depth Serve", "goal": "6/10 with spin" },
              { "skill": "Return", "level": 3, "title": "Target Weak Side Return", "goal": "6/10 successful" },
              { "skill": "Dink", "level": 3, "title": "Extended Rally", "goal": "20+ in a row" },
              { "skill": "Drop", "level": 3, "title": "Third Shot Drop Test", "goal": "6/10 soft into NVZ" },
              { "skill": "Volley", "level": 3, "title": "Counter Volley Battles", "goal": "win 3/5" },
              { "skill": "Reset", "level": 3, "title": "Reset + Counter", "goal": "6/10 successful" },
              { "skill": "Speed-up", "level": 2, "title": "Speed-up + Hands Battle", "goal": "win 3/5 exchanges" },
              { "skill": "Strategy", "level": 1, "title": "Doubles Positioning Basics", "goal": "8/10 correct" }
            ]
          }
        ]
      },
      {
        "dupr": 3.0,
        "program_id": "P-3.0",
        "sessions": [
          {
            "session_id": "P-3.0-S1",
            "title": "3.0 Readiness Check",
            "drills": [
              { "skill": "Serve", "level": 3, "title": "Corners Under Pressure", "goal": "4/8 successful" },
              { "skill": "Return", "level": 3, "title": "Return + NVZ Transition", "goal": "7/10 successful" },
              { "skill": "Dink", "level": 3, "title": "Unattackable Dinks", "goal": "8/10 judged safe" },
              { "skill": "Drop", "level": 3, "title": "Controlled Target Drop", "goal": "6/10 successful" },
              { "skill": "Reset", "level": 3, "title": "Consistent Transition Resets", "goal": "7/10 successful" },
              { "skill": "Speed-up", "level": 2, "title": "Hands Battle Challenge", "goal": "win 3/5" },
              { "skill": "Strategy", "level": 2, "title": "Target Weakness + Basic Stacking", "goal": "6/10 tactical choices" }
            ]
          }
        ]
      }
    ]
  };

  // Helper functions
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
    
    // Handle both directions - from drill skill to UI skill and from UI skill to drill skill
    const normalizedName = skillName.toLowerCase();
    
    // Direct mapping
    if (skillMap[normalizedName]) {
      return skillMap[normalizedName];
    }
    
    // Reverse mapping for UI skills
    const reverseMap = {
      'thirdsho': 'drop',
      'thirdshot': 'drop',
      'dinking': 'dink',
      'volleys': 'volley',
      'resets': 'reset',
      'speedups': 'speed-up'
    };
    
    if (reverseMap[normalizedName]) {
      return reverseMap[normalizedName];
    }
    
    return normalizedName;
  };

  // Dynamic skill progression based on DUPR matrix
  const getUserSkillsForRating = (rating, currentExerciseRatings = new Map()) => {
    const targetRating = rating.toFixed(1);
    const program = duprPrograms.dupr_programs.find(p => p.dupr.toFixed(1) === targetRating);
    
    // Define all possible skills with their display names
    const allSkills = {
      serve: { id: 'serve', name: 'Serve', level: 0, progress: 0.0, unlocked: false },
      return: { id: 'return', name: 'Return', level: 0, progress: 0.0, unlocked: false },
      drive: { id: 'drive', name: 'Drive', level: 0, progress: 0.0, unlocked: false },
      dinking: { id: 'dinking', name: 'Dinking', level: 0, progress: 0.0, unlocked: false },
      thirdShot: { id: 'thirdShot', name: 'Third Shot Drop', level: 0, progress: 0.0, unlocked: false },
      volleys: { id: 'volleys', name: 'Volleys', level: 0, progress: 0.0, unlocked: false },
      resets: { id: 'resets', name: 'Resets', level: 0, progress: 0.0, unlocked: false },
      speedUps: { id: 'speedUps', name: 'Speed-ups', level: 0, progress: 0.0, unlocked: false },
      overheads: { id: 'overheads', name: 'Overheads', level: 0, progress: 0.0, unlocked: false },
      lobs: { id: 'lobs', name: 'Lobs', level: 0, progress: 0.0, unlocked: false },
      transition: { id: 'transition', name: 'Transition', level: 0, progress: 0.0, unlocked: false },
      strategy: { id: 'strategy', name: 'Strategy', level: 0, progress: 0.0, unlocked: false },
    };

    // Only include skills that have exercises for this rating
    const activeSkills = {};

    // Get all drills from all sessions for this rating
    if (program && program.sessions) {
      program.sessions.forEach(session => {
        if (session.drills) {
          session.drills.forEach(drill => {
            const skillKey = getSkillKey(drill.skill);
            console.log(`Processing drill: ${drill.skill} -> ${skillKey}`, drill);
            
            if (allSkills[skillKey]) {
              // Initialize skill if not already added
              if (!activeSkills[skillKey]) {
                activeSkills[skillKey] = { ...allSkills[skillKey] };
              }
              
              activeSkills[skillKey].unlocked = true;
              activeSkills[skillKey].level = Math.max(activeSkills[skillKey].level, drill.level);
              console.log(`Unlocked skill: ${skillKey} at level ${activeSkills[skillKey].level}`);
            } else {
              console.log(`Skill key not found: ${skillKey} for drill: ${drill.skill}`);
            }
          });
        }
      });
    }

    // Calculate progress based on completed exercises
    Object.keys(activeSkills).forEach(skillKey => {
      const skillExercises = [];
      if (program && program.sessions) {
        program.sessions.forEach(session => {
          if (session.drills) {
            const exercises = session.drills.filter(drill => {
              if (skillKey === 'thirdShot' && drill.skill.toLowerCase() === 'drop') return true;
              if (skillKey === 'dinking' && drill.skill.toLowerCase() === 'dink') return true;
              if (skillKey === 'volleys' && drill.skill.toLowerCase() === 'volley') return true;
              if (skillKey === 'resets' && drill.skill.toLowerCase() === 'reset') return true;
              if (skillKey === 'speedUps' && drill.skill.toLowerCase() === 'speed-up') return true;
              if (skillKey.toLowerCase() === drill.skill.toLowerCase()) return true;
              return false;
            });
            skillExercises.push(...exercises);
          }
        });
      }
      
      const completedCount = skillExercises.filter(exercise => 
        currentExerciseRatings.has(`${targetRating}-${skillKey}-${exercise.title}`)
      ).length;
      const totalCount = skillExercises.length;
      activeSkills[skillKey].progress = totalCount > 0 ? completedCount / totalCount : 0;
    });

    console.log(`Rating ${targetRating} has ${Object.keys(activeSkills).length} active skills:`, Object.keys(activeSkills));
    return activeSkills;
  };

  // State
  const [currentRating, setCurrentRating] = React.useState(2.0);
  const [selectedSkill, setSelectedSkill] = React.useState(null);
  const [showExerciseModal, setShowExerciseModal] = React.useState(false);
  const [userSkills, setUserSkills] = React.useState(() => getUserSkillsForRating(2.0, new Map()));
  const [exerciseRatings, setExerciseRatings] = React.useState(new Map());
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [selectedExerciseForRating, setSelectedExerciseForRating] = React.useState(null);
  const [collectedBadges, setCollectedBadges] = React.useState(new Set());
  const [programProgress, setProgramProgress] = React.useState(new Map());
  const [showBadgeCongratulationModal, setShowBadgeCongratulationModal] = React.useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(false);

  // Load exercise ratings, badges, and program progress from storage on component mount
  React.useEffect(() => {
    const loadInitialData = async () => {
      const [savedRatings, savedCollectedBadges, savedProgramProgress] = await Promise.all([
        loadExerciseRatings(),
        loadCollectedBadges(),
        loadProgramProgress()
      ]);
      
      setExerciseRatings(savedRatings);
      setCollectedBadges(savedCollectedBadges);
      setProgramProgress(savedProgramProgress);
      setUserSkills(getUserSkillsForRating(currentRating, savedRatings));
      setIsLoading(false);
    };
    
    loadInitialData();
  }, []);

  // Save exercise ratings to storage whenever they change
  React.useEffect(() => {
    if (!isLoading) {
      saveExerciseRatings(exerciseRatings);
    }
  }, [exerciseRatings, isLoading]);

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
      // Also check for drill threshold badges
      checkForNewlyUnlockedBadges();
    }
  }, [exerciseRatings, isLoading]);

  // Update skills when rating changes or exercises are completed
  React.useEffect(() => {
    if (!isLoading) {
      setUserSkills(getUserSkillsForRating(currentRating, exerciseRatings));
    }
  }, [currentRating, exerciseRatings, isLoading]);

  const skillsData = [
    { 
      id: 'serve', 
      name: 'Serve', 
      emoji: '🎾',
      color: '#F59E0B',
      levels: [
        'Get 7/10 serves in play',
        '8/10 serves land past midline', 
        'Place 5/10 serves to target zones',
        'Add spin/variety with 70% success',
        'Tactical serving based on opponent'
      ]
    },
    { 
      id: 'return', 
      name: 'Return of Serve', 
      emoji: '↩️',
      color: '#8B5CF6',
      levels: [
        'Get 7/10 returns in play',
        '8/10 returns land deep past midline',
        'Place 5/10 returns cross-court',
        'Return + transition successfully 7/10 times',
        'Tactical returns (aim at gaps)'
      ]
    },
    { 
      id: 'thirdShot', 
      name: 'Third Shot Drop', 
      emoji: '🥒',
      color: '#10B981',
      levels: [
        'Land 4/10 drops into NVZ',
        'Land 6/10 drops softly into NVZ',
        'Place 5/10 drops to opponent\'s backhand',
        'Mix drop/drive decisions correctly 6/10',
        'Execute drop reliably under pressure'
      ]
    },
    { 
      id: 'drive', 
      name: 'Drive (Groundstrokes)', 
      emoji: '🚀',
      color: '#3B82F6',
      levels: [
        '6/10 forehand drives beyond NVZ',
        '6/10 backhand drives beyond NVZ',
        'Drive with depth (7/10 past midline)',
        'Drive variation (change speed/spin)',
        'Tactical drives (setup for 5th shot)'
      ]
    },
    { 
      id: 'dinking', 
      name: 'Dinking (NVZ Play)', 
      emoji: '🥒',
      color: '#10B981',
      levels: [
        '10 consecutive dinks with partner',
        '15 cross-court dinks without error',
        'Hit 6/12 dink targets in NVZ',
        'Win dink rally under pressure',
        'Variety dinks in rallies'
      ]
    },
    { 
      id: 'volleys', 
      name: 'Volleys (Control)', 
      emoji: '🛡️',
      color: '#EF4444',
      levels: [
        '6/10 controlled volleys land in NVZ',
        '7/10 block volleys keep ball in play',
        'Redirect volleys to target zones (5/10)',
        'Counter-attack volleys (5/10)',
        'Tactical volleys (mix block, punch, redirect)'
      ]
    },
    { 
      id: 'resets', 
      name: 'Resets', 
      emoji: '🔄',
      color: '#6366F1',
      levels: [
        'Reset 4/10 balls into NVZ from mid-court',
        'Reset 6/10 drives softly into NVZ',
        'Reset under pressure (5/10)',
        'Reset while transitioning (7/10)',
        'Tactical resets (neutralize hard hitters)'
      ]
    },
    { 
      id: 'speedUps', 
      name: 'Speed-ups (Attack)', 
      emoji: '⚡',
      color: '#F97316',
      levels: [
        '5/10 successful speed-ups from NVZ',
        'Mix speed-up directions (BH/FH)',
        'Win 3/5 hands battles after speed-up',
        'Deceptive speed-ups (disguise)',
        'Tactical speed-ups (choose right ball)'
      ]
    },
    { 
      id: 'overheads', 
      name: 'Overheads / Smashes', 
      emoji: '💥',
      color: '#DC2626',
      levels: [
        '7/10 smashes in play',
        '6/10 smashes put away point',
        'Smashes to target zones',
        'Overheads from deep court',
        'Tactical smashes (power vs placement)'
      ]
    },
    { 
      id: 'lobs', 
      name: 'Lobs', 
      emoji: '🌙',
      color: '#7C3AED',
      levels: [
        '4/10 offensive lobs land in bounds',
        '6/10 defensive lobs escape pressure',
        'Lob placement (deep cross-court)',
        'Mix lob + dink effectively',
        'Tactical lobs (change pace)'
      ]
    },
    { 
      id: 'transition', 
      name: 'Transition Game', 
      emoji: '🏃',
      color: '#059669',
      levels: [
        'Approach NVZ after return 6/10',
        'Reset 5/10 mid-court balls',
        'Transition footwork (split step)',
        'Transition under pressure',
        'Tactical transitions (cover partner)'
      ]
    },
    { 
      id: 'strategy', 
      name: 'Strategy & Team Play', 
      emoji: '🧠',
      color: '#6B7280',
      levels: [
        'Call out balls "in/out" with partner',
        'Communicate targets with partner',
        'Cover middle effectively 7/10 times',
        'Stack or switch successfully',
        'Tactical shot selection in matches'
      ]
    }
  ];

  // Rating progression path data
  const ratingSteps = [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0];

  // Helper functions
  const getExercisesForSkill = (skillName) => {
    const exercises = [];
    const targetRating = currentRating.toFixed(1);
    const program = duprPrograms.dupr_programs.find(p => p.dupr.toFixed(1) === targetRating);
    
    console.log(`Getting exercises for skill: ${skillName} at rating: ${targetRating}`);
    
    if (program && program.sessions) {
      program.sessions.forEach(session => {
        if (session.drills) {
          const skillExercises = session.drills.filter(drill => {
            // For thirdShot, we need to match with "Drop" drills
            if (skillName === 'thirdShot' && drill.skill.toLowerCase() === 'drop') {
              return true;
            }
            // For dinking, we need to match with "Dink" drills  
            if (skillName === 'dinking' && drill.skill.toLowerCase() === 'dink') {
              return true;
            }
            // For volleys, we need to match with "Volley" drills
            if (skillName === 'volleys' && drill.skill.toLowerCase() === 'volley') {
              return true;
            }
            // For resets, we need to match with "Reset" drills
            if (skillName === 'resets' && drill.skill.toLowerCase() === 'reset') {
              return true;
            }
            // For speedUps, we need to match with "Speed-up" drills
            if (skillName === 'speedUps' && drill.skill.toLowerCase() === 'speed-up') {
              return true;
            }
            // For exact matches
            if (skillName.toLowerCase() === drill.skill.toLowerCase()) {
              return true;
            }
            
            console.log(`No match: skill ${skillName} vs drill ${drill.skill}`);
            return false;
          });
          exercises.push(...skillExercises);
        }
      });
    }
    
    console.log(`Found ${exercises.length} exercises for ${skillName}:`, exercises);
    return exercises;
  };

  const handleSkillPress = (skill) => {
    const exercises = getExercisesForSkill(skill.id);
    if (exercises.length > 0) {
      setSelectedSkill({...skill, exercises});
      setShowExerciseModal(true);
    }
  };

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setSelectedSkill(null);
  };

  const toggleExerciseCompletion = (exercise, skillId) => {
    const exerciseKey = `${currentRating}-${skillId}-${exercise.title}`;
    setExerciseRatings(prev => {
      const newRatings = new Map(prev);
      if (newRatings.has(exerciseKey)) {
        // Remove if already exists (toggle off)
        newRatings.delete(exerciseKey);
      } else {
        // Show rating modal for new completion
        setSelectedExerciseForRating({ exercise, skillId, key: exerciseKey });
        setShowRatingModal(true);
        return prev; // Don't update yet, wait for rating selection
      }
      return newRatings;
    });
  };

  const rateExercise = (exerciseKey, rating) => {
    setExerciseRatings(prev => new Map(prev.set(exerciseKey, rating)));
    setShowRatingModal(false);
    setSelectedExerciseForRating(null);
  };

  const isExerciseCompleted = (exercise, skillId) => {
    const exerciseKey = `${currentRating}-${skillId}-${exercise.title}`;
    return exerciseRatings.has(exerciseKey);
  };

  const getExerciseRating = (exercise, skillId) => {
    const exerciseKey = `${currentRating}-${skillId}-${exercise.title}`;
    return exerciseRatings.get(exerciseKey);
  };

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
          
          // Check for newly unlocked badges when program is completed
          if (isCompleted && !currentStatus.completed) {
            checkForNewlyUnlockedBadges(programId);
          }
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

  // Check for newly unlocked badges
  const checkForNewlyUnlockedBadges = (completedProgramId = null) => {
    const allBadges = badgeMatrix.badge_sets.flatMap(set => 
      set.badges.map(badge => ({ ...badge, dupr: set.dupr }))
    );
    
    for (const badge of allBadges) {
      // Skip if badge is already collected
      if (collectedBadges.has(badge.id)) continue;
      
      // Check program completion badges
      if (badge.type === 'program_completion' && completedProgramId && badge.program_id === completedProgramId) {
        setNewlyUnlockedBadge({
          ...badge,
          progress: { tier: 'unlocked', progress: 1.0 }
        });
        setShowBadgeCongratulationModal(true);
        break; // Show one at a time
      }
      
      // Check drill threshold badges
      if (badge.type === 'drill_threshold') {
        const badgeProgress = calculateDrillThresholdBadgeProgress(badge);
        if (badgeProgress.tier !== 'locked' && badgeProgress.tier !== undefined) {
          setNewlyUnlockedBadge({
            ...badge,
            progress: badgeProgress
          });
          setShowBadgeCongratulationModal(true);
          break; // Show one at a time
        }
      }
    }
  };

  // Simple drill threshold badge calculation
  const calculateDrillThresholdBadgeProgress = (badge) => {
    const skillKey = getSkillKey(badge.skill);
    
    // Count completed exercises for this skill at this DUPR level (marked as complete)
    const completedCount = Array.from(exerciseRatings.keys())
      .filter(key => key.startsWith(`${badge.dupr}-${skillKey}-`)).length;

    // Simple logic: Bronze = 1+ completed, Silver = 2+ completed, Gold = 3+ completed
    if (completedCount >= 3) return { tier: 'gold', progress: 1.0 };
    if (completedCount >= 2) return { tier: 'silver', progress: 0.75 };
    if (completedCount >= 1) return { tier: 'bronze', progress: 0.5 };
    
    return { tier: 'locked', progress: 0 };
  };

  // Collect badge function
  const collectBadge = () => {
    if (newlyUnlockedBadge) {
      setCollectedBadges(prev => new Set([...prev, newlyUnlockedBadge.id]));
      setShowBadgeCongratulationModal(false);
      setNewlyUnlockedBadge(null);
    }
  };

  const handleRatingStepPress = (rating) => {
    setCurrentRating(rating);
  };

  const getRatingDescription = (rating) => {
    const targetRating = rating.toFixed(1);
    const program = duprPrograms.dupr_programs.find(p => p.dupr.toFixed(1) === targetRating);
    
    if (program && program.sessions && program.sessions[0]) {
      return program.sessions[0].title;
    }
    
    return "Advanced skill development continues.";
  };

  // Helper function to check if a DUPR level is unlocked
  const isRatingUnlocked = (rating) => {
    // 2.0 is always unlocked (starting level)
    if (rating <= 2.0) return true;
    
    // For other levels, check if the previous level is completed
    const previousRating = Math.round((rating - 0.1) * 10) / 10; // Handle floating point precision
    return isRatingCompleted(previousRating);
  };

  // Helper function to check if a DUPR level is completed
  const isRatingCompleted = (rating) => {
    const ratingKey = rating.toFixed(1);
    const program = duprPrograms.dupr_programs.find(p => p.dupr.toFixed(1) === ratingKey);
    
    if (!program) return false;
    
    // Get all exercises for this program
    const allExercises = [];
    program.sessions.forEach(session => {
      if (session.drills) {
        session.drills.forEach(drill => {
          const skillKey = getSkillKey(drill.skill);
          // Use the same format as when saving: currentRating format
          const exerciseKey = `${rating}-${skillKey}-${drill.title}`;
          allExercises.push(exerciseKey);
        });
      }
    });
    
    // Check if all exercises are completed (regardless of rating)
    const completedExercises = allExercises.filter(exerciseKey => {
      return exerciseRatings.has(exerciseKey);
    });
    
    const isCompleted = allExercises.length > 0 && completedExercises.length === allExercises.length;
    
    
    return isCompleted;
  };

  const renderProgressPath = () => {
    return (
      <View style={styles.progressPathContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressPathContent}
          style={styles.progressPathScroll}
        >
          {ratingSteps.map((rating, index) => {
            const isCompleted = isRatingCompleted(rating);
            const isUnlocked = isRatingUnlocked(rating);
            const isCurrent = rating === currentRating;
            const isLocked = !isUnlocked;
            
            return (
              <View key={rating} style={[
                styles.progressStepContainer,
                index === ratingSteps.length - 1 && styles.lastProgressStep
              ]}>
                {/* Connection line to next step */}
                {index < ratingSteps.length - 1 && (
                  <View style={[
                    styles.connectionLine,
                    isCompleted && styles.connectionLineCompleted
                  ]} />
                )}
                
                {/* Progress step circle */}
                <TouchableOpacity 
                  style={[
                    styles.progressStep,
                    isCompleted && styles.progressStepCompleted,
                    isCurrent && !isCompleted && styles.progressStepCurrent,
                    isLocked && styles.progressStepLocked
                  ]}
                  onPress={() => isUnlocked && handleRatingStepPress(rating)}
                  disabled={isLocked}
                >
                  {isCompleted ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : isLocked ? (
                    <Ionicons name="lock-closed" size={16} color="rgba(255, 255, 255, 0.5)" />
                  ) : isCurrent ? (
                    <Text style={styles.currentStepText}>{rating.toFixed(1)}</Text>
                  ) : (
                    <Text style={styles.progressStepText}>{rating.toFixed(1)}</Text>
                  )}
                </TouchableOpacity>
                
                {/* Current rating label */}
                {isCurrent && !isCompleted && !isLocked && (
                  <Text style={styles.currentRatingLabel}>Current</Text>
                )}
                
                {/* Completed rating label */}
                {isCompleted && isCurrent && (
                  <Text style={styles.completedRatingLabel}>Completed</Text>
                )}
                
                {/* Locked rating label */}
                {isLocked && isCurrent && (
                  <Text style={styles.lockedRatingLabel}>Locked</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSkillNode = (skill) => {
    const skillProgress = userSkills[skill.id];
    
    // Skip if skill doesn't exist in userSkills (no exercises for this rating)
    if (!skillProgress) {
      return null;
    }
    
    const isUnlocked = skillProgress.unlocked;
    const isRatingLocked = !isRatingUnlocked(currentRating);
    const currentLevel = skillProgress.level;
    const isCompleted = currentLevel >= 5;
    const exercises = getExercisesForSkill(skill.id);
    const hasExercises = exercises.length > 0;
    const canAccessExercises = hasExercises && !isRatingLocked;
    
    return (
      <TouchableOpacity 
        key={skill.id} 
        style={[
          styles.skillNode,
          isRatingLocked && styles.skillNodeLocked
        ]}
        onPress={() => canAccessExercises && handleSkillPress(skill)}
        disabled={!canAccessExercises}
      >
        <View style={styles.skillInfo}>
          <View style={styles.skillHeader}>
            <Text style={[
              styles.skillName,
              (!isUnlocked || isRatingLocked) && styles.skillNameLocked
            ]}>
              {skill.name}
            </Text>
            <View style={styles.skillHeaderIcons}>
              {isRatingLocked && (
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              )}
              {hasExercises && canAccessExercises && (
                <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 8 }} />
              )}
            </View>
          </View>
          
          {isUnlocked && (
            <View style={styles.skillProgress}>
              <View style={styles.levelDots}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View 
                    key={level}
                    style={[
                      styles.levelDot,
                      level <= currentLevel ? styles.levelDotCompleted : styles.levelDotEmpty
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.skillLevelText}>
                {currentLevel === 0 ? 'Start' : `L${currentLevel}`}
                {currentLevel < 5 && ` → L${currentLevel + 1}`}
              </Text>
            </View>
          )}
          
          {!isUnlocked && !isRatingLocked && (
            <Text style={styles.skillLockedText}>Complete more skills to unlock</Text>
          )}
          
          {isRatingLocked && (
            <Text style={styles.skillLockedText}>Complete previous level to unlock</Text>
          )}
          
          {hasExercises && (
            <View style={styles.completedIndicator}>
              {(() => {
                const completedCount = exercises.filter(exercise => 
                  isExerciseCompleted(exercise, skill.id)
                ).length;
                return completedCount > 0 && (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.completedCountText}>{completedCount} completed</Text>
                  </>
                );
              })()}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator while data is being loaded
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Collapsible Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity 
              style={styles.headerToggle}
              onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
            >
              <View style={styles.headerToggleContent}>
                <Text style={styles.headerTitle}>DUPR Skill Progression</Text>
                <Ionicons 
                  name={isHeaderExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              {!isHeaderExpanded && (
                <Text style={styles.headerCompactSubtitle}>2.0 → 3.0 • {(() => {
                  const completedLevels = ratingSteps.filter(rating => isRatingCompleted(rating));
                  return `${completedLevels.length}/${ratingSteps.length} completed`;
                })()}</Text>
              )}
            </TouchableOpacity>
            
            {isHeaderExpanded && (
              <>
                <Text style={styles.headerSubtitle}>Master your way from 2.0 to 3.0</Text>
                <View style={styles.headerRangeContainer}>
                  <View style={styles.headerRangeBadge}>
                    <Text style={styles.headerRangeText}>2.0</Text>
                  </View>
                  <View style={styles.headerRangeArrow}>
                    <Text style={styles.headerRangeArrowText}>→</Text>
                  </View>
                  <View style={styles.headerRangeBadge}>
                    <Text style={styles.headerRangeText}>3.0</Text>
                  </View>
                </View>
                {/* Overall Progress */}
                <View style={styles.headerProgressContainer}>
                  <Text style={styles.headerProgressText}>
                    {(() => {
                      const completedLevels = ratingSteps.filter(rating => isRatingCompleted(rating));
                      return `${completedLevels.length} of ${ratingSteps.length} levels completed`;
                    })()}
                  </Text>
                  <View style={styles.headerProgressBar}>
                    <View style={[
                      styles.headerProgressFill,
                      { width: `${(ratingSteps.filter(rating => isRatingCompleted(rating)).length / ratingSteps.length) * 100}%` }
                    ]} />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Rating Progress Path */}
          {renderProgressPath()}

          {/* Current Rating Info */}
          <View style={styles.ratingInfoSection}>
            <Text style={styles.ratingInfoTitle}>
              Rating {currentRating.toFixed(1)} Focus
              {!isRatingUnlocked(currentRating) && (
                <Ionicons name="lock-closed" size={16} color="#6B7280" style={{marginLeft: 8}} />
              )}
            </Text>
            <Text style={styles.ratingInfoText}>
              {!isRatingUnlocked(currentRating) 
                ? `Complete rating ${(currentRating - 0.1).toFixed(1)} to unlock this level`
                : getRatingDescription(currentRating)
              }
            </Text>
            {!isRatingUnlocked(currentRating) && (
              <Text style={styles.ratingInfoSkills}>
                Skills locked until previous level is completed
              </Text>
            )}
          </View>

          {/* Skills Grid */}
          <View style={styles.skillsGrid}>
            {Object.values(userSkills).map((skill) => {
              // Find the corresponding skillsData entry for display info
              const skillTemplate = skillsData.find(s => s.id === skill.id);
              if (!skillTemplate) return null;
              
              return renderSkillNode(skillTemplate);
            })}
          </View>

          {/* Achievement Summary */}
          <View style={styles.achievementSection}>
            <Text style={styles.achievementTitle}>Progress Summary</Text>
            <View style={styles.achievementStats}>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementNumber}>
                  {Object.values(userSkills).filter(s => s.unlocked).length}
                </Text>
                <Text style={styles.achievementLabel}>Skills Available</Text>
              </View>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementNumber}>
                  {Array.from(exerciseRatings.keys()).filter(key => key.startsWith(`${currentRating}-`)).length}
                </Text>
                <Text style={styles.achievementLabel}>Exercises Complete</Text>
              </View>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementNumber}>
                  {Object.values(userSkills).filter(s => s.progress === 1.0).length}
                </Text>
                <Text style={styles.achievementLabel}>Skills Mastered</Text>
              </View>
            </View>
            
            {/* Rating Distribution */}
            {Array.from(exerciseRatings.keys()).filter(key => key.startsWith(`${currentRating}-`)).length > 0 && (
              <View style={styles.ratingDistribution}>
                <Text style={styles.ratingDistributionTitle}>How you felt:</Text>
                <View style={styles.ratingDistributionEmojis}>
                  {[
                    { emoji: '😭', value: 1 },
                    { emoji: '😔', value: 2 },
                    { emoji: '😐', value: 3 },
                    { emoji: '😊', value: 4 },
                    { emoji: '🤩', value: 5 }
                  ].map((ratingType) => {
                    const count = Array.from(exerciseRatings.entries())
                      .filter(([key, rating]) => 
                        key.startsWith(`${currentRating}-`) && rating.value === ratingType.value
                      ).length;
                    
                    return count > 0 ? (
                      <View key={ratingType.value} style={styles.ratingDistributionItem}>
                        <Text style={styles.ratingDistributionEmoji}>{ratingType.emoji}</Text>
                        <Text style={styles.ratingDistributionCount}>{count}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Exercise Detail Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeExerciseModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeExerciseModal}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedSkill?.name} Exercises
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedSkill?.exercises?.map((exercise, index) => {
              const isCompleted = isExerciseCompleted(exercise, selectedSkill.id);
              const exerciseRating = getExerciseRating(exercise, selectedSkill.id);
              
              return (
                <View key={index} style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <View style={styles.exerciseHeaderRight}>
                      <View style={styles.exerciseLevelBadge}>
                        <Text style={styles.exerciseLevelText}>Level {exercise.level}</Text>
                      </View>
                      {isCompleted && exerciseRating && (
                        <Text style={styles.exerciseRatingEmoji}>{exerciseRating.emoji}</Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.exerciseGoal}>Target: {exercise.goal}</Text>
                  
                  {isCompleted && exerciseRating && (
                    <Text style={styles.exerciseRatingText}>
                      How it felt: {exerciseRating.label}
                    </Text>
                  )}
                  
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseDetailTitle}>Instructions:</Text>
                    <Text style={styles.exerciseDetailText}>
                      Focus on achieving the target goal through consistent practice. 
                      Break down the exercise into manageable repetitions and maintain 
                      proper form throughout each attempt.
                    </Text>
                    
                    <Text style={styles.exerciseDetailTitle}>Success Criteria:</Text>
                    <Text style={styles.exerciseDetailText}>
                      {exercise.goal}
                    </Text>
                    
                    <Text style={styles.exerciseDetailTitle}>Tips:</Text>
                    <Text style={styles.exerciseDetailText}>
                      • Practice with proper form and technique{'\n'}
                      • Take your time with each repetition{'\n'}
                      • Stay consistent for best results
                    </Text>
                  </View>
                  
                  {/* Mark as Complete Button */}
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      isCompleted && styles.completeButtonCompleted
                    ]}
                    onPress={() => toggleExerciseCompletion(exercise, selectedSkill.id)}
                  >
                    <Ionicons 
                      name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={20} 
                      color={isCompleted ? "#FFFFFF" : "#10B981"} 
                    />
                    <Text style={[
                      styles.completeButtonText,
                      isCompleted && styles.completeButtonTextCompleted
                    ]}>
                      {isCompleted ? "Tap to Remove" : "Mark as Complete"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRatingModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>How did it feel?</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          
          <View style={styles.ratingModalContent}>
            <Text style={styles.ratingQuestion}>
              How did completing "{selectedExerciseForRating?.exercise?.title}" feel?
            </Text>
            
            <View style={styles.ratingOptions}>
              {[
                { emoji: '😭', label: 'Very Hard', value: 1 },
                { emoji: '😔', label: 'Hard', value: 2 },
                { emoji: '😐', label: 'Okay', value: 3 },
                { emoji: '😊', label: 'Good', value: 4 },
                { emoji: '🤩', label: 'Excellent', value: 5 }
              ].map((rating) => (
                <TouchableOpacity
                  key={rating.value}
                  style={styles.ratingOption}
                  onPress={() => rateExercise(selectedExerciseForRating?.key, {
                    emoji: rating.emoji,
                    label: rating.label,
                    value: rating.value
                  })}
                >
                  <Text style={styles.ratingEmoji}>{rating.emoji}</Text>
                  <Text style={styles.ratingLabel}>{rating.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Badge Congratulation Modal */}
      {showBadgeCongratulationModal && newlyUnlockedBadge && (
        <Modal
          visible={showBadgeCongratulationModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowBadgeCongratulationModal(false)}
        >
          <View style={styles.badgeModalOverlay}>
            <View style={styles.badgeCongratulationModal}>
              <View style={styles.badgeCongratulationContent}>
                {/* Badge Icon */}
                <View style={styles.badgeCongratulationBadgeContainer}>
                  <View style={styles.badgeCongratulationTierRing}>
                    <Text style={styles.badgeCongratulationBadgeIcon}>
                      {getBadgeIcon(newlyUnlockedBadge.id, newlyUnlockedBadge.skill)}
                    </Text>
                  </View>
                </View>

                {/* Congratulation Text */}
                <Text style={styles.badgeCongratulationTitle}>Congratulations!</Text>
                <Text style={styles.badgeCongratulationMessage}>
                  You've unlocked the "{newlyUnlockedBadge.name}" badge!
                </Text>
                
                <Text style={styles.badgeCongratulationTier}>
                  {newlyUnlockedBadge.progress?.tier === 'unlocked' 
                    ? 'Achievement Unlocked' 
                    : `${newlyUnlockedBadge.progress?.tier?.charAt(0).toUpperCase() + newlyUnlockedBadge.progress?.tier?.slice(1)} Tier Unlocked`
                  }
                </Text>

                {/* Collect Button */}
                <TouchableOpacity
                  style={styles.badgeCollectButton}
                  onPress={collectBadge}
                >
                  <Text style={styles.badgeCollectButtonText}>Collect the Badge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Header Section
  headerSection: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerToggle: {
    width: '100%',
  },
  headerToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerCompactSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  headerRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerRangeBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  headerRangeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRangeArrow: {
    paddingHorizontal: 8,
  },
  headerRangeArrowText: {
    fontSize: 20,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  headerProgressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  headerProgressText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  headerProgressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  // Progress Path Styles
  progressPathContainer: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 24,
    minHeight: 88, // Ensure minimum height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressPathScroll: {
    flex: 1,
  },
  progressPathContent: {
    paddingHorizontal: 24,
    paddingRight: 24,
    alignItems: 'center',
    minHeight: 40, // Ensure content has height
  },
  progressStepContainer: {
    alignItems: 'center',
    position: 'relative',
    marginRight: 32,
  },
  lastProgressStep: {
    marginRight: 0,
  },
  connectionLine: {
    position: 'absolute',
    top: 19, // Center of 40px circle (20px) minus 1px for 2px line height
    left: 40, // Start from the right edge of the circle
    width: 32, // Match the marginRight between steps
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  connectionLineCompleted: {
    backgroundColor: '#10B981',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  progressStepCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  progressStepCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentRatingLabel: {
    position: 'absolute',
    top: 48,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedRatingLabel: {
    position: 'absolute',
    top: 48,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockedRatingLabel: {
    position: 'absolute',
    top: 48,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressStepLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Rating Info Section
  ratingInfoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ratingInfoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  ratingInfoSkills: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  // Skills Grid Styles
  skillsGrid: {
    padding: 16,
  },
  skillNode: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skillNodeLocked: {
    opacity: 0.6,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  skillNameLocked: {
    color: '#9CA3AF',
  },
  skillProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelDots: {
    flexDirection: 'row',
    gap: 6,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelDotCompleted: {
    backgroundColor: '#10B981',
  },
  levelDotEmpty: {
    backgroundColor: '#E5E7EB',
  },
  skillLevelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  skillLockedText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Achievement Section Styles
  achievementSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  achievementLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 24,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    marginTop: 4,
  },
  completedCountText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  // Modal Styles
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
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalHeaderSpacer: {
    width: 40, // Match close button width
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseCardCompleted: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  exerciseLevelBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  exerciseGoal: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 16,
  },
  exerciseDetails: {
    marginTop: 8,
  },
  exerciseDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  exerciseDetailText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  completeButtonCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  completeButtonText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  completeButtonTextCompleted: {
    color: '#FFFFFF',
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseRatingEmoji: {
    fontSize: 20,
  },
  exerciseRatingText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 8,
  },
  ratingModalContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  ratingQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  ratingOptions: {
    width: '100%',
    gap: 16,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
  },
  ratingDistribution: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  ratingDistributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  ratingDistributionEmojis: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingDistributionItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingDistributionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  ratingDistributionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
  // Badge Congratulation Modal Styles
  badgeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCongratulationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeCongratulationContent: {
    padding: 32,
    alignItems: 'center',
  },
  badgeCongratulationBadgeContainer: {
    marginBottom: 24,
  },
  badgeCongratulationTierRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    borderWidth: 4,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCongratulationBadgeIcon: {
    fontSize: 40,
  },
  badgeCongratulationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeCongratulationMessage: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  badgeCongratulationTier: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 32,
    textAlign: 'center',
  },
  badgeCollectButton: {
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
  badgeCollectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
