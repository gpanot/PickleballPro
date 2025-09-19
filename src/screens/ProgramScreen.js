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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';

export default function ProgramScreen({ navigation }) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [programs, setPrograms] = React.useState([
    // Sample program to demonstrate the structure
    {
      id: 'sample_1',
      name: 'Master the Soft Game (4 weeks)',
      description: 'Focus on developing consistent dinking, drop shots, and net play fundamentals',
      routines: [
        {
          id: 'routine_1',
          name: 'Session A - Dinking Focus',
          description: 'Build consistency and accuracy in dinking exchanges',
          exercises: [
            { id: "1.1", name: "Target Dinks", target: "20 in zone", difficulty: 2, description: "Practice dinking to specific target areas", routineExerciseId: 1001 },
            { id: "1.2", name: "Dink & Move", target: "10 each side", difficulty: 3, description: "Dink while moving laterally", routineExerciseId: 1002 },
            { id: "s3.1", name: "Skinny Singles", target: "play to 11", difficulty: 3, description: "Practice game situations", routineExerciseId: 1003 }
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'routine_2',
          name: 'Session B - Drop Shot Focus',
          description: 'Master the critical third shot drop',
          exercises: [
            { id: "7.1", name: "3rd Shot Drop", target: "15 in a row", difficulty: 3, description: "Consecutive drops into kitchen", routineExerciseId: 2001 },
            { id: "7.2", name: "Drop-Advance", target: "10 sequences", difficulty: 4, description: "Drop then advance to net", routineExerciseId: 2002 },
            { id: "s5.3", name: "Transition Zone Reset", target: "15 resets", difficulty: 3, description: "Reset from transition zone", routineExerciseId: 2003 }
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'routine_3',
          name: 'Session C - Net Defense & Speed',
          description: 'Develop quick reflexes and defensive skills at the net',
          exercises: [
            { id: "v1", name: "Block Volleys", target: "10 blocks", difficulty: 3, description: "Defensive volley blocks", routineExerciseId: 3001 },
            { id: "s3.2", name: "Speed Up & Reset", target: "10 resets", difficulty: 4, description: "Counter speed-ups with resets", routineExerciseId: 3002 },
            { id: "s6.3", name: "Live Point Pressure", target: "start 9-9, win 3", difficulty: 4, description: "High pressure point situations", routineExerciseId: 3003 }
          ],
          createdAt: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
    }
  ]);
  const [showCreateProgramModal, setShowCreateProgramModal] = React.useState(false);
  const [newProgramName, setNewProgramName] = React.useState('');

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
  const createProgram = () => {
    if (!newProgramName.trim()) {
      Alert.alert('Error', 'Please enter a program name');
      return;
    }
    
    const newProgram = {
      id: Date.now().toString(),
      name: newProgramName.trim(),
      routines: [],
      createdAt: new Date().toISOString(),
    };
    
    setPrograms(prev => [...prev, newProgram]);
    setNewProgramName('');
    setShowCreateProgramModal(false);
  };

  const deleteProgram = (programId) => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setPrograms(prev => prev.filter(p => p.id !== programId))
        }
      ]
    );
  };

  const navigateToProgram = (program) => {
    navigation.navigate('ProgramDetail', { 
      program,
      onUpdateProgram: (updatedProgram) => {
        setPrograms(prev => prev.map(p => 
          p.id === updatedProgram.id ? updatedProgram : p
        ));
      }
    });
  };

  const renderProgramsContent = () => (
    <View style={styles.customizedContainer}>
      {programs.length === 0 ? (
        <View style={styles.emptyCustomList}>
          <Text style={styles.emptyCustomListIcon}>🏆</Text>
          <Text style={styles.emptyCustomListTitle}>Your Training Programs</Text>
          <Text style={styles.emptyCustomListDescription}>
            Create structured training programs with organized routines and exercises. Build your path to pickleball mastery!
          </Text>
          <TouchableOpacity
            style={styles.addFirstProgramButton}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <WebIcon name="add" size={20} color="white" />
            <Text style={styles.addFirstProgramButtonText}>Create Your First Program</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.programsList}
          contentContainerStyle={styles.programsContent}
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
                </View>
                
                <View style={styles.programActions}>
                  <View style={styles.programButton}>
                    <WebIcon name="chevron-right" size={16} color="#6B7280" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addMoreProgramsButton}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <WebIcon name="add" size={20} color="white" />
            <Text style={styles.addMoreProgramsButtonText}>Create new program</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Training Programs</Text>
          <Text style={styles.headerSubtitle}>Build structured training programs</Text>
        </View>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderProgramsContent()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Program Modal */}
      <Modal
        visible={showCreateProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateProgramModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateProgramModal(false)}
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
              
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
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
  programsList: {
    flex: 1,
  },
  programsContent: {
    padding: 16,
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
    padding: 16,
    alignItems: 'center',
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
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  programActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programButton: {
    padding: 8,
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
  bottomSpacing: {
    height: 24,
  },
});
