// Dynamic Program Generator for Pickleball Hero
// Generates personalized 4-session programs based on user focus areas and DUPR rating

import skillsData from '../data/Commun_skills_tags.json';

// Exercise bank with specific drills for each skill
const exerciseBank = {
  dinks: [
    {
      id: 'dink_1',
      title: 'Target Dinks',
      goal: 'Land 15/20 dinks in target zones',
      instructions: '1. Set up targets in opposite corners of NVZ\n2. Practice cross-court and straight dinks\n3. Focus on consistent placement\n4. Complete 20 attempts, track successful ones',
      targetType: 'count',
      targetValue: 15,
      difficulty: 2,
      timeEstimate: 15,
      skillCategory: 'dinks'
    },
    {
      id: 'dink_2',
      title: 'Dink Rally Challenge',
      goal: 'Maintain 20 consecutive dinks',
      instructions: '1. Start at NVZ line with partner\n2. Begin gentle dinking exchange\n3. Focus on control over power\n4. Count consecutive successful dinks',
      targetType: 'streak',
      targetValue: 20,
      difficulty: 3,
      timeEstimate: 12,
      skillCategory: 'dinks'
    },
    {
      id: 'dink_3',
      title: 'Dink & Move',
      goal: 'Complete 10 lateral movement sequences',
      instructions: '1. Dink to partner while sliding laterally\n2. Move 2 steps left, dink, move 2 steps right\n3. Maintain consistent dinking throughout movement\n4. Complete 10 full sequences',
      targetType: 'count',
      targetValue: 10,
      difficulty: 4,
      timeEstimate: 18,
      skillCategory: 'dinks'
    }
  ],
  drives: [
    {
      id: 'drive_1',
      title: 'Power Drive Placement',
      goal: 'Hit 12/15 drives past mid-court',
      instructions: '1. Position at baseline\n2. Drive balls with 70% power\n3. Aim for deep court placement\n4. Focus on consistent depth over speed',
      targetType: 'count',
      targetValue: 12,
      difficulty: 2,
      timeEstimate: 15,
      skillCategory: 'drives'
    },
    {
      id: 'drive_2',
      title: 'Cross-Court Drives',
      goal: 'Land 10/15 cross-court drives in target zone',
      instructions: '1. Set up targets in opposite corners\n2. Practice forehand and backhand drives\n3. Focus on angle and placement\n4. Alternate between corners',
      targetType: 'count',
      targetValue: 10,
      difficulty: 3,
      timeEstimate: 18,
      skillCategory: 'drives'
    },
    {
      id: 'drive_3',
      title: 'Drive-Volley Transition',
      goal: 'Complete 8 successful drive-volley sequences',
      instructions: '1. Drive from baseline\n2. Quickly advance to NVZ\n3. Prepare for volley return\n4. Execute clean volley finish',
      targetType: 'count',
      targetValue: 8,
      difficulty: 4,
      timeEstimate: 20,
      skillCategory: 'drives'
    }
  ],
  serves: [
    {
      id: 'serve_1',
      title: 'Deep Serve Consistency',
      goal: 'Land 8/10 serves in back third',
      instructions: '1. Stand behind baseline in ready position\n2. Aim for back third of service box\n3. Focus on consistent depth\n4. Use 75% power for control',
      targetType: 'count',
      targetValue: 8,
      difficulty: 2,
      timeEstimate: 12,
      skillCategory: 'serves'
    },
    {
      id: 'serve_2',
      title: 'Serve Placement Drill',
      goal: 'Hit 6/10 serves to chosen corners',
      instructions: '1. Choose target corner before each serve\n2. Alternate between forehand and backhand sides\n3. Focus on precision over power\n4. Mark successful placements',
      targetType: 'count',
      targetValue: 6,
      difficulty: 3,
      timeEstimate: 15,
      skillCategory: 'serves'
    },
    {
      id: 'serve_3',
      title: 'Spin Serve Introduction',
      goal: 'Execute 5/10 serves with visible spin',
      instructions: '1. Use continental grip\n2. Contact ball at side for sidespin\n3. Follow through across body\n4. Focus on consistent spin motion',
      targetType: 'count',
      targetValue: 5,
      difficulty: 4,
      timeEstimate: 18,
      skillCategory: 'serves'
    }
  ],
  returns: [
    {
      id: 'return_1',
      title: 'Deep Return Basics',
      goal: 'Return 8/10 serves past mid-court',
      instructions: '1. Position at baseline ready position\n2. Focus on getting returns deep\n3. Use controlled swing with good follow-through\n4. Aim for consistency over winners',
      targetType: 'count',
      targetValue: 8,
      difficulty: 2,
      timeEstimate: 15,
      skillCategory: 'returns'
    },
    {
      id: 'return_2',
      title: 'Return Placement',
      goal: 'Place 6/10 returns in target zones',
      instructions: '1. Set up targets in back corners\n2. Practice both forehand and backhand returns\n3. Focus on directional control\n4. Vary placement between corners',
      targetType: 'count',
      targetValue: 6,
      difficulty: 3,
      timeEstimate: 18,
      skillCategory: 'returns'
    },
    {
      id: 'return_3',
      title: 'Return-Advance Pattern',
      goal: 'Complete 5 successful return-advance sequences',
      instructions: '1. Return serve deep\n2. Immediately begin advance to NVZ\n3. Prepare for third shot\n4. Execute proper positioning at net',
      targetType: 'count',
      targetValue: 5,
      difficulty: 4,
      timeEstimate: 20,
      skillCategory: 'returns'
    }
  ],
  volleys: [
    {
      id: 'volley_1',
      title: 'Block Volley Basics',
      goal: 'Block 8/10 incoming drives',
      instructions: '1. Position at NVZ line\n2. Keep paddle up and ready\n3. Use compact blocking motion\n4. Focus on controlling ball direction',
      targetType: 'count',
      targetValue: 8,
      difficulty: 2,
      timeEstimate: 15,
      skillCategory: 'volleys'
    },
    {
      id: 'volley_2',
      title: 'Reset Volleys',
      goal: 'Successfully reset 6/10 attack shots',
      instructions: '1. Partner feeds aggressive shots\n2. Use soft hands to absorb pace\n3. Reset ball into NVZ\n4. Focus on neutralizing the attack',
      targetType: 'count',
      targetValue: 6,
      difficulty: 3,
      timeEstimate: 18,
      skillCategory: 'volleys'
    },
    {
      id: 'volley_3',
      title: 'Volley-Dink Transition',
      goal: 'Complete 8 volley-to-dink sequences',
      instructions: '1. Start with firm volley\n2. Transition to soft dinking\n3. Maintain net position throughout\n4. Focus on smooth pace transition',
      targetType: 'count',
      targetValue: 8,
      difficulty: 4,
      timeEstimate: 20,
      skillCategory: 'volleys'
    }
  ],
  lobs: [
    {
      id: 'lob_1',
      title: 'Defensive Lob Basics',
      goal: 'Land 6/10 lobs behind opponents',
      instructions: '1. Use when under pressure at net\n2. Aim for high arc over opponents\n3. Target deep court area\n4. Focus on getting ball behind opponents',
      targetType: 'count',
      targetValue: 6,
      difficulty: 3,
      timeEstimate: 15,
      skillCategory: 'lobs'
    },
    {
      id: 'lob_2',
      title: 'Offensive Lob Placement',
      goal: 'Place 5/10 lobs in target zones',
      instructions: '1. Set up targets in back corners\n2. Use lob when opponents are close to net\n3. Practice both forehand and backhand lobs\n4. Focus on precision placement',
      targetType: 'count',
      targetValue: 5,
      difficulty: 4,
      timeEstimate: 18,
      skillCategory: 'lobs'
    }
  ],
  drops: [
    {
      id: 'drop_1',
      title: 'Third Shot Drop',
      goal: 'Land 10/15 drops in NVZ',
      instructions: '1. Start from baseline position\n2. Use soft hands and low-to-high swing\n3. Aim for NVZ landing\n4. Focus on arc and placement over power',
      targetType: 'count',
      targetValue: 10,
      difficulty: 3,
      timeEstimate: 18,
      skillCategory: 'drops'
    },
    {
      id: 'drop_2',
      title: 'Drop-Advance Sequence',
      goal: 'Complete 6 successful drop-advance patterns',
      instructions: '1. Execute third shot drop\n2. Immediately begin advance to NVZ\n3. Prepare for next shot while moving\n4. Arrive at NVZ in ready position',
      targetType: 'count',
      targetValue: 6,
      difficulty: 4,
      timeEstimate: 20,
      skillCategory: 'drops'
    }
  ],
  resets: [
    {
      id: 'reset_1',
      title: 'Basic Reset Drill',
      goal: 'Reset 8/12 attacking shots into NVZ',
      instructions: '1. Partner feeds attacking shots\n2. Use soft hands to absorb pace\n3. Redirect ball into NVZ\n4. Focus on neutralizing aggression',
      targetType: 'count',
      targetValue: 8,
      difficulty: 3,
      timeEstimate: 18,
      skillCategory: 'resets'
    }
  ]
};

// Session templates with skill focuses
const sessionTemplates = [
  {
    id: 1,
    name: 'Foundation Building',
    description: 'Master the fundamental skills',
    focus: ['serves', 'returns', 'dinks'],
    timeEstimate: 60
  },
  {
    id: 2,
    name: 'Power & Precision',
    description: 'Develop attacking shots and placement',
    focus: ['drives', 'volleys', 'serves'],
    timeEstimate: 60
  },
  {
    id: 3,
    name: 'Net Game Mastery',
    description: 'Dominate play at the net',
    focus: ['dinks', 'volleys', 'resets'],
    timeEstimate: 60
  },
  {
    id: 4,
    name: 'Complete Game Integration',
    description: 'Combine all skills in game situations',
    focus: ['drops', 'lobs', 'resets'],
    timeEstimate: 60
  }
];

/**
 * Generates a personalized 4-session program based on user's focus areas and DUPR rating
 * @param {Array} userFocusAreas - Array of skill IDs the user selected
 * @param {number} duprRating - User's DUPR rating (used for difficulty adjustment)
 * @param {Object} userProfile - Additional user info (name, tier, etc.)
 * @returns {Object} Complete program with 4 sessions and exercises
 */
export function generatePersonalizedProgram(userFocusAreas, duprRating = 3.0, userProfile = {}) {
  // Determine difficulty level based on DUPR rating
  const getDifficultyLevel = (rating) => {
    if (rating < 2.5) return 'beginner';
    if (rating < 3.5) return 'intermediate';
    return 'advanced';
  };

  const difficultyLevel = getDifficultyLevel(duprRating);
  const maxDifficulty = difficultyLevel === 'beginner' ? 3 : difficultyLevel === 'intermediate' ? 4 : 5;

  // Filter exercises based on user focus areas and difficulty
  const getExercisesForSkill = (skillId, count = 1) => {
    const skillExercises = exerciseBank[skillId] || [];
    return skillExercises
      .filter(exercise => exercise.difficulty <= maxDifficulty)
      .slice(0, count);
  };

  // Generate 4 sessions based on user focus and progressive difficulty
  const generateSessions = () => {
    const sessions = [];
    
    sessionTemplates.forEach((template, index) => {
      const session = {
        id: `personal_session_${index + 1}`,
        name: template.name,
        description: template.description,
        order_index: index + 1,
        time_estimate_minutes: template.timeEstimate,
        exercises: []
      };

      // Prioritize user focus areas in exercise selection
      const availableSkills = [...userFocusAreas];
      
      // Add template focus skills if not already in user focus
      template.focus.forEach(skill => {
        if (!availableSkills.includes(skill)) {
          availableSkills.push(skill);
        }
      });

      // Select 3-4 exercises per session
      const exerciseCount = Math.min(4, Math.max(3, availableSkills.length));
      let selectedExercises = [];

      // First, add exercises from user's top focus areas
      userFocusAreas.slice(0, 2).forEach(skillId => {
        const exercises = getExercisesForSkill(skillId, 1);
        if (exercises.length > 0) {
          selectedExercises.push(...exercises);
        }
      });

      // Fill remaining slots with template focus skills
      template.focus.forEach(skillId => {
        if (selectedExercises.length < exerciseCount) {
          const exercises = getExercisesForSkill(skillId, 1);
          if (exercises.length > 0 && !selectedExercises.find(ex => ex.skillCategory === skillId)) {
            selectedExercises.push(...exercises);
          }
        }
      });

      // If still need more exercises, add from remaining focus areas
      if (selectedExercises.length < exerciseCount) {
        userFocusAreas.slice(2).forEach(skillId => {
          if (selectedExercises.length < exerciseCount) {
            const exercises = getExercisesForSkill(skillId, 1);
            if (exercises.length > 0 && !selectedExercises.find(ex => ex.skillCategory === skillId)) {
              selectedExercises.push(...exercises);
            }
          }
        });
      }

      // Limit to target count and add routine exercise IDs
      session.exercises = selectedExercises.slice(0, exerciseCount).map((exercise, idx) => ({
        ...exercise,
        routineExerciseId: (index * 1000) + (idx + 1)
      }));

      sessions.push(session);
    });

    return sessions;
  };

  // Create the complete program
  const program = {
    id: `personal_program_${Date.now()}`,
    name: `${userProfile.name || 'Your'} Personal Training Program`,
    description: `Customized 4-session program focusing on: ${userFocusAreas.map(skill => 
      skillsData.skillCategories.technical?.skills?.find(s => s.id === skill)?.name ||
      skillsData.skillCategories.movement?.skills?.find(s => s.id === skill)?.name ||
      skillsData.skillCategories.strategic?.skills?.find(s => s.id === skill)?.name ||
      skillsData.skillCategories.physical?.skills?.find(s => s.id === skill)?.name ||
      skill
    ).join(', ')}`,
    category: 'Personal Training',
    tier: difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1),
    difficulty_level: difficultyLevel === 'beginner' ? 2 : difficultyLevel === 'intermediate' ? 3 : 4,
    estimated_duration_weeks: 2,
    focus_areas: userFocusAreas,
    dupr_rating: duprRating,
    routines: generateSessions(),
    createdAt: new Date().toISOString(),
    is_personalized: true
  };

  return program;
}

/**
 * Validates that a user has completed onboarding before generating program
 * @param {Object} userContext - User context with onboarding status
 * @returns {boolean} Whether user can receive personalized program
 */
export function canGenerateProgram(userContext) {
  return userContext?.hasCompletedOnboarding === true;
}
