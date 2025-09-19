import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';

// Program-based structure for explore content
const explorePrograms = [
  // For You Programs (Personalized content)
  {
    id: 'for_you_personalized',
    name: 'Personalized Training Plan',
    description: `4 one-hour sessions designed for your DUPR rating`,
    category: 'For You',
    tier: 'Personalized',
    routines: [
      {
        id: 'session_1',
        name: 'Session 1 - Foundation Building',
        description: 'Build your foundational skills with precise drills',
        timeEstimate: '60 min',
        exercises: [
          { id: "s1.1", name: "Corner Placement Serves", target: "8/12 to chosen corners", difficulty: 3, description: "Perfect serve placement to corners", routineExerciseId: 1001 },
          { id: "s1.2", name: "Deep Return Practice", target: "7/10 past midline", difficulty: 3, description: "Return serves deep into court", routineExerciseId: 1002 },
          { id: "s1.3", name: "Return & Approach", target: "5/8 successful approaches", difficulty: 4, description: "Return and move to net", routineExerciseId: 1003 }
        ],
        bonusExercises: [
          { id: "b1.1", name: "Serve Return Rally", target: "sustain 6 shots", difficulty: 3, description: "Maintain rally after serve", routineExerciseId: 1004 }
        ]
      },
      {
        id: 'session_2',
        name: 'Session 2 - Ground Stroke Power',
        description: 'Develop power and accuracy from the baseline',
        timeEstimate: '60 min',
        exercises: [
          { id: "s2.1", name: "Baseline Cross-Court", target: "10/15 deep cross-court", difficulty: 3, description: "Deep cross-court ground strokes", routineExerciseId: 2001 },
          { id: "s2.2", name: "Down-the-Line Power", target: "7/12 down-the-line", difficulty: 4, description: "Power shots down the line", routineExerciseId: 2002 },
          { id: "s2.3", name: "Recovery & Reset", target: "8/10 reset after power", difficulty: 3, description: "Reset position after power shots", routineExerciseId: 2003 }
        ],
        bonusExercises: [
          { id: "b2.1", name: "Power Rally Challenge", target: "rally to 15 shots", difficulty: 4, description: "Maintain power rally", routineExerciseId: 2004 }
        ]
      },
      {
        id: 'session_3',
        name: 'Session 3 - Net Play Excellence',
        description: 'Master the kitchen and net game',
        timeEstimate: '60 min',
        exercises: [
          { id: "s3.1", name: "Advanced Cross-Court Dinks", target: "12/15 in NVZ", difficulty: 3, description: "Precise cross-court dinks", routineExerciseId: 3001 },
          { id: "s3.2", name: "Speed Up & Reset", target: "10 resets", difficulty: 4, description: "Counter speed-ups with resets", routineExerciseId: 3002 },
          { id: "s3.3", name: "Attack the High Ball", target: "6/8 putaway attempts", difficulty: 4, description: "Aggressive high ball attacks", routineExerciseId: 3003 }
        ],
        bonusExercises: [
          { id: "b3.1", name: "Skinny Singles", target: "play to 11", difficulty: 3, description: "Practice net game in skinny singles", routineExerciseId: 3004 }
        ]
      },
      {
        id: 'session_4',
        name: 'Session 4 - Power & Placement',
        description: 'Combine power with precise placement',
        timeEstimate: '60 min',
        exercises: [
          { id: "s4.1", name: "Power Drive Targets", target: "7/12 to corners", difficulty: 4, description: "Powerful drives to specific targets", routineExerciseId: 4001 },
          { id: "s4.2", name: "Transition Zone Control", target: "8/12 effective shots", difficulty: 4, description: "Control from transition zone", routineExerciseId: 4002 },
          { id: "s4.3", name: "Finish at Net", target: "6/10 putaways", difficulty: 4, description: "Finish points at the net", routineExerciseId: 4003 }
        ],
        bonusExercises: [
          { id: "b4.1", name: "Pressure Points", target: "win 4/7 pressure points", difficulty: 5, description: "Win under pressure situations", routineExerciseId: 4004 }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  },
  // DUPR Training Programs (Tier-based progression)
  {
    id: 'dupr_beginner',
    name: 'Beginner Foundation (2.0-3.0)',
    description: 'Master fundamental skills to build a solid foundation',
    category: 'DUPR Training',
    tier: 'Beginner',
    routines: [
      {
        id: 'beginner_dinks',
        name: 'Level 1 - Dinks',
        description: 'Master the fundamentals of dinking',
        duprRange: '2.0-2.3',
        exercises: [
          { id: "1.1", name: "Dink Wall Drill", target: "15 consecutive soft dinks", difficulty: 2, description: "Practice consistent dinking against a wall", routineExerciseId: 5001 },
          { id: "1.2", name: "Cross-Court Dinks", target: "8 consecutive cross-court dinks", difficulty: 2, description: "Develop cross-court dinking accuracy", routineExerciseId: 5002 },
          { id: "1.3", name: "Dink Targets", target: "6/12 land in NVZ cones", difficulty: 3, description: "Precision dinking to specific targets", routineExerciseId: 5003 }
        ],
        extras: [{ id: "1E", name: "Survivor Dinks", type: "leaderboard", description: "See how long you can maintain a dinking rally" }]
      },
      {
        id: 'beginner_drives',
        name: 'Level 2 - Drives',
        description: 'Develop powerful and accurate drives',
        duprRange: '2.2-2.5',
        exercises: [
          { id: "2.1", name: "FH Drive Depth", target: "7/10 beyond NVZ", difficulty: 2, description: "Forehand drive depth control", routineExerciseId: 5004 },
          { id: "2.2", name: "BH Drive Depth", target: "6/10 beyond NVZ", difficulty: 3, description: "Backhand drive depth control", routineExerciseId: 5005 },
          { id: "2.3", name: "Drive & Recover", target: "5-drive sequence", difficulty: 3, description: "Drive and return to ready position", routineExerciseId: 5006 }
        ],
        extras: [{ id: "2E", name: "Alt FH/BH Rally", type: "streak", description: "Alternate forehand/backhand rally challenge" }]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'dupr_intermediate',
    name: 'Intermediate Skills (3.0-4.0)',
    description: 'Advanced techniques for competitive play',
    category: 'DUPR Training',
    tier: 'Intermediate',
    routines: [
      {
        id: 'intermediate_serves',
        name: 'Level 6 - Serve Upgrades',
        description: 'Advanced serving techniques',
        duprRange: '3.0-3.2',
        exercises: [
          { id: "6.1", name: "Deep Serve Mastery", target: "7/10 in back third", difficulty: 3, description: "Consistent deep serving", routineExerciseId: 6001 },
          { id: "6.2", name: "Spin Serve", target: "5/10 with visible spin", difficulty: 4, description: "Develop spin serve technique", routineExerciseId: 6002 },
          { id: "6.3", name: "Serve Placement Drill", target: "4/6 to chosen corner", difficulty: 3, description: "Precise serve placement", routineExerciseId: 6003 }
        ],
        extras: [{ id: "6E", name: "Ace Challenge", type: "leaderboard", description: "Score aces with advanced serving" }]
      },
      {
        id: 'intermediate_drops',
        name: 'Level 7 - Third Shot Drop',
        description: 'Master the critical third shot',
        duprRange: '3.1-3.3',
        exercises: [
          { id: "7.1", name: "Drop Consistency", target: "6/10 into NVZ", difficulty: 3, description: "Consistent third shot drops", routineExerciseId: 6004 },
          { id: "7.2", name: "Target Drops", target: "4/10 to backhand corner", difficulty: 4, description: "Target specific areas with drops", routineExerciseId: 6005 },
          { id: "7.3", name: "Drop Under Pressure", target: "5/10 vs drives", difficulty: 4, description: "Execute drops under pressure", routineExerciseId: 6006 }
        ],
        extras: [{ id: "7E", name: "Drop Rally", type: "streak", description: "Maintain rally with drop shots" }]
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export default function ExploreTrainingScreen({ navigation }) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = React.useState('For You');

  // Helper functions
  const filteredPrograms = explorePrograms.filter(program => 
    program.category === selectedCategory
  );

  const navigateToProgram = (program) => {
    navigation.navigate('ProgramDetail', { 
      program,
      source: 'explore' 
    });
  };

  const getCurrentRating = () => {
    return user.duprRating || 2.5;
  };

  const getNextMilestone = () => {
    const currentRating = getCurrentRating();
    const currentHalf = Math.floor(currentRating * 2) / 2;
    return currentHalf + 0.5;
  };

  const renderTabNavigation = () => {
    const currentRating = getCurrentRating();
    const nextMilestone = getNextMilestone();

    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedCategory === 'For You' && styles.tabButtonActive
          ]}
          onPress={() => setSelectedCategory('For You')}
        >
          <View style={styles.tabButtonContent}>
            <Text style={[
              styles.tabButtonText,
              selectedCategory === 'For You' && styles.tabButtonTextActive
            ]}>
              For You
            </Text>
            <Text style={[
              styles.tabButtonSubtext,
              selectedCategory === 'For You' && styles.tabButtonSubtextActive
            ]}>
              {currentRating.toFixed(1)} → {nextMilestone.toFixed(1)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedCategory === 'DUPR Training' && styles.tabButtonActive
          ]}
          onPress={() => setSelectedCategory('DUPR Training')}
        >
          <Text style={[
            styles.tabButtonText,
            selectedCategory === 'DUPR Training' && styles.tabButtonTextActive
          ]}>
            DUPR Training
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProgramsContent = () => (
    <View style={styles.programsContainer}>
      {filteredPrograms.length === 0 ? (
        <View style={styles.emptyList}>
          <Text style={styles.emptyListIcon}>🏆</Text>
          <Text style={styles.emptyListTitle}>No Programs Available</Text>
          <Text style={styles.emptyListDescription}>
            Programs for this category are coming soon!
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.programsList}
          contentContainerStyle={styles.programsContent}
        >
          <View style={styles.programsHeader}>
            <Text style={styles.headerTitle}>
              {selectedCategory === 'For You' ? 'Personalized Programs' : 'DUPR Training Programs'}
            </Text>
            <Text style={styles.programsSubtitle}>Tap to open a program and explore its routines</Text>
          </View>
          
          {filteredPrograms.map((program) => (
            <View key={program.id} style={styles.programCard}>
              <TouchableOpacity
                style={styles.programContent}
                onPress={() => navigateToProgram(program)}
              >
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {program.description ? (
                    <Text style={styles.programDescription}>{program.description}</Text>
                  ) : null}
                  <View style={styles.programStats}>
                    <Text style={styles.programStatsText}>
                      {program.routines.length} routine{program.routines.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.programStatsText}>•</Text>
                    <Text style={styles.programStatsText}>
                      {program.routines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0)} exercises
                    </Text>
                  </View>
                  {program.tier && (
                    <View style={styles.tierBadge}>
                      <Text style={styles.tierBadgeText}>{program.tier}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.programActions}>
                  <WebIcon name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        {renderTabNavigation()}
      </View>
      {renderProgramsContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSafeArea: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  // Tab Navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#3B82F6',
  },
  tabButtonContent: {
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: 'white',
  },
  tabButtonSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabButtonSubtextActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Programs Content styles
  programsContainer: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyListIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyListDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  programsList: {
    flex: 1,
  },
  programsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  programsHeader: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  programsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  programContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 18,
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
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  programStatsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  programActions: {
    padding: 4,
  },
});
