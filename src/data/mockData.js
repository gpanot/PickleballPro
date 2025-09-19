// Mock data for the PicklePro app

export const mockUser = {
  id: 1,
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  duprRating: 3.2,
  tier: 'Intermediate',
  joinedDate: '2024-01-15',
  badges: [
    { id: 1, name: 'Level 1 Complete', emoji: '🎯', unlocked: true },
    { id: 2, name: 'Level 2 Complete', emoji: '🚀', unlocked: true },
    { id: 3, name: 'Beginner Champion', emoji: '🏆', unlocked: true },
    { id: 4, name: 'Level 6 Complete', emoji: '⭐', unlocked: false },
  ],
};

export const tiers = [
  {
    id: 1,
    name: 'Beginner',
    duprRange: '2.0 - 3.0',
    color: '#10B981',
    levels: [1, 2, 3, 4, 5],
    completed: true,
  },
  {
    id: 2,
    name: 'Intermediate',
    duprRange: '3.0 - 4.0',
    color: '#F59E0B',
    levels: [6, 7, 8, 9, 10],
    completed: false,
    current: true,
  },
  {
    id: 3,
    name: 'Advanced',
    duprRange: '4.0 - 5.0',
    color: '#EF4444',
    levels: [11, 12, 13, 14, 15],
    completed: false,
  },
];

export const levels = [
  // Beginner Tier
  { 
    id: 1, 
    tier: 1, 
    name: 'Dinks', 
    subtitle: 'Master the soft game',
    duprRange: '2.0-2.3',
    exercises: ['1.1', '1.2', '1.3'],
    completed: true,
    unlocked: true,
  },
  { 
    id: 2, 
    tier: 1, 
    name: 'Drives', 
    subtitle: 'Power and placement',
    duprRange: '2.2-2.5',
    exercises: ['2.1', '2.2', '2.3'],
    completed: true,
    unlocked: true,
  },
  { 
    id: 3, 
    tier: 1, 
    name: 'Serves', 
    subtitle: 'Consistent serving',
    duprRange: '2.3-2.6',
    exercises: ['3.1', '3.2', '3.3'],
    completed: true,
    unlocked: true,
  },
  { 
    id: 4, 
    tier: 1, 
    name: 'Returns', 
    subtitle: 'Deep and strategic',
    duprRange: '2.4-2.7',
    exercises: ['4.1', '4.2', '4.3'],
    completed: true,
    unlocked: true,
  },
  { 
    id: 5, 
    tier: 1, 
    name: 'NVZ Transition', 
    subtitle: 'Get to the kitchen',
    duprRange: '2.6-3.0',
    exercises: ['5.1', '5.2', '5.3'],
    completed: true,
    unlocked: true,
  },
  
  // Intermediate Tier
  { 
    id: 6, 
    tier: 2, 
    name: 'Serve Upgrades', 
    subtitle: 'Advanced serving',
    duprRange: '3.0-3.2',
    exercises: ['6.1', '6.2', '6.3'],
    completed: false,
    unlocked: true,
    current: true,
  },
  { 
    id: 7, 
    tier: 2, 
    name: 'Third Shot Drop', 
    subtitle: 'The money shot',
    duprRange: '3.1-3.3',
    exercises: ['7.1', '7.2', '7.3'],
    completed: false,
    unlocked: false,
  },
  { 
    id: 8, 
    tier: 2, 
    name: 'Dink Pressure', 
    subtitle: 'Advanced dinking',
    duprRange: '3.2-3.5',
    exercises: ['8.1', '8.2', '8.3'],
    completed: false,
    unlocked: false,
  },
  { 
    id: 9, 
    tier: 2, 
    name: 'Speed-Ups', 
    subtitle: 'Volleying mastery',
    duprRange: '3.4-3.7',
    exercises: ['9.1', '9.2', '9.3'],
    completed: false,
    unlocked: false,
  },
  { 
    id: 10, 
    tier: 2, 
    name: 'Strategy Basics', 
    subtitle: 'Think the game',
    duprRange: '3.5-4.0',
    exercises: ['10.1', '10.2', '10.3'],
    completed: false,
    unlocked: false,
  },
];

export const exercises = [
  {
    id: '6.1',
    title: 'Deep Serve Mastery',
    goal: 'Land 7/10 serves in the back third of the service box',
    instructions: `1. Stand behind the baseline in ready position
2. Aim for the back third of the service box
3. Focus on consistent depth rather than power
4. Complete 10 serves and count successful ones`,
    targetType: 'count',
    targetValue: 7,
    completed: false,
    difficulty: 3,
  },
  {
    id: '6.2',
    title: 'Spin Serve',
    goal: 'Execute 5/10 serves with visible spin',
    instructions: `1. Use a continental grip
2. Contact the ball at its side for sidespin
3. Follow through across your body
4. Coach validation required for spin quality`,
    targetType: 'count',
    targetValue: 5,
    completed: false,
    difficulty: 4,
    requiresCoach: true,
  },
  {
    id: '6.3',
    title: 'Serve Placement Drill',
    goal: 'Hit 4/6 serves to chosen corner',
    instructions: `1. Choose a target corner before each serve
2. Alternate between forehand and backhand corners
3. Focus on precision over power
4. Mark your successful placements`,
    targetType: 'count',
    targetValue: 4,
    completed: false,
    difficulty: 3,
  },
];

export const coaches = [
  {
    id: 1,
    name: 'Sarah Williams',
    bio: 'Former tennis pro turned pickleball coach. Specializes in technique and mental game.',
    duprRating: 4.8,
    hourlyRate: 75,
    rating: 4.9,
    reviewCount: 32,
    specialties: ['Technique', 'Mental Game', 'Beginners'],
    location: 'San Francisco, CA',
    verified: true,
    image: null,
  },
  {
    id: 2,
    name: 'Mike Chen',
    bio: 'Tournament player with 10+ years experience. Focus on competitive strategy.',
    duprRating: 5.2,
    hourlyRate: 90,
    rating: 4.8,
    reviewCount: 28,
    specialties: ['Strategy', 'Advanced Play', 'Tournament Prep'],
    location: 'Austin, TX',
    verified: true,
    image: null,
  },
  {
    id: 3,
    name: 'Lisa Rodriguez',
    bio: 'Youth coach and fitness instructor. Great with beginners and conditioning.',
    duprRating: 4.2,
    hourlyRate: 60,
    rating: 4.7,
    reviewCount: 45,
    specialties: ['Beginners', 'Fitness', 'Youth'],
    location: 'Phoenix, AZ',
    verified: false,
    image: null,
  },
  {
    id: 4,
    name: 'David Park',
    bio: 'Professional player and certified instructor. All skill levels welcome.',
    duprRating: 5.5,
    hourlyRate: 100,
    rating: 5.0,
    reviewCount: 18,
    specialties: ['Professional Training', 'All Levels', 'Technique'],
    location: 'Seattle, WA',
    verified: true,
    image: null,
  },
];
