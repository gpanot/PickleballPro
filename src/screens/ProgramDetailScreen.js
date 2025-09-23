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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebIcon from '../components/WebIcon';

export default function ProgramDetailScreen({ navigation, route }) {
  const { program: initialProgram, onUpdateProgram, source } = route.params;
  const insets = useSafeAreaInsets();
  const [program, setProgram] = React.useState(initialProgram);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = React.useState(false);
  const [newRoutineName, setNewRoutineName] = React.useState('');

  // Update program in parent (would be better with context/state management)
  React.useEffect(() => {
    navigation.setParams({ program });
    // Also update the parent screen's programs list
    if (onUpdateProgram) {
      onUpdateProgram(program);
    }
  }, [program, navigation, onUpdateProgram]);

  // Routine management functions
  const createRoutine = () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    
    const newRoutine = {
      id: Date.now().toString(),
      name: newRoutineName.trim(),
      exercises: [],
      createdAt: new Date().toISOString(),
    };
    
    const updatedProgram = {
      ...program,
      routines: [...program.routines, newRoutine]
    };
    
    setProgram(updatedProgram);
    
    setNewRoutineName('');
    setShowCreateRoutineModal(false);
    
    // Navigate to RoutineDetail first, then automatically open ExercisePicker
    navigation.navigate('RoutineDetail', { 
      program: updatedProgram,
      routine: newRoutine,
      onUpdateRoutine: (updatedRoutine) => {
        setProgram(prev => ({
          ...prev,
          routines: prev.routines.map(r => 
            r.id === updatedRoutine.id ? updatedRoutine : r
          )
        }));
      },
      autoOpenExercisePicker: true // Flag to automatically open exercise picker
    });
  };

  const deleteRoutine = (routineId) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setProgram(prev => ({
            ...prev,
            routines: prev.routines.filter(r => r.id !== routineId)
          }))
        }
      ]
    );
  };

  const navigateToRoutine = (routine) => {
    navigation.navigate('RoutineDetail', { 
      program,
      routine,
      source,
      onUpdateRoutine: (updatedRoutine) => {
        setProgram(prev => ({
          ...prev,
          routines: prev.routines.map(r => 
            r.id === updatedRoutine.id ? updatedRoutine : r
          )
        }));
      }
    });
  };

  const addToMyPrograms = () => {
    Alert.alert(
      'Add to My Programs',
      `Do you want to add "${program.name}" to your personal program list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Program', 
          onPress: () => {
            // Create a new program object with a new ID and timestamp for the user's collection
            const newProgram = {
              ...program,
              id: Date.now().toString(), // New ID for user's collection
              addedFromExplore: true,
              addedAt: new Date().toISOString(),
            };
            
            // Navigate back to main Programs screen and pass the new program
            navigation.navigate('Training2', { 
              newProgram: newProgram 
            });
            
            Alert.alert('Success', 'Program added to your list!');
          }
        }
      ]
    );
  };

  const renderRoutinesContent = () => (
    <View style={styles.routinesContainer}>
      {program.routines.length === 0 ? (
        <View style={styles.emptyRoutinesList}>
          <Text style={styles.emptyRoutinesIcon}>📋</Text>
          <Text style={styles.emptyRoutinesTitle}>No Routines Yet</Text>
          <Text style={styles.emptyRoutinesDescription}>
            {source === 'explore' 
              ? 'Preview this program and add it to your personal collection.'
              : 'Create your first routine to organize exercises within this program.'
            }
          </Text>
          <TouchableOpacity
            style={[
              styles.addFirstRoutineButton,
              source === 'explore' && styles.addToProgramsButton
            ]}
            onPress={source === 'explore' ? addToMyPrograms : () => setShowCreateRoutineModal(true)}
          >
            <WebIcon 
              name={source === 'explore' ? 'bookmark' : 'add'} 
              size={20} 
              color="white" 
            />
            <Text style={styles.addFirstRoutineButtonText}>
              {source === 'explore' ? 'Add to my Program List' : 'Create First Routine'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.routinesList}
          contentContainerStyle={styles.routinesContent}
        >
          <View style={styles.routinesHeader}>
            <Text style={styles.routinesTitle}>Routines ({program.routines.length})</Text>
            <Text style={styles.routinesSubtitle}>
              {source === 'explore' ? 'Tap to preview routine' : 'Tap to open • Long press to delete'}
            </Text>
          </View>
          
          {program.routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <TouchableOpacity
                style={styles.routineContent}
                onPress={() => navigateToRoutine(routine)}
                onLongPress={source === 'explore' ? undefined : () => deleteRoutine(routine.id)}
              >
                <View style={styles.routineInfo}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  {routine.description ? (
                    <Text style={styles.routineDescription}>{routine.description}</Text>
                  ) : null}
                  <View style={styles.routineStats}>
                    <Text style={styles.routineStatsText}>
                      {routine.exercises?.length || 0} exercise{(routine.exercises?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.routineActions}>
                  <View style={styles.routineButton}>
                    <WebIcon name="chevron-right" size={16} color="#6B7280" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.addMoreRoutinesButton,
              source === 'explore' && styles.addToProgramsButton
            ]}
            onPress={source === 'explore' ? addToMyPrograms : () => setShowCreateRoutineModal(true)}
          >
            <WebIcon 
              name={source === 'explore' ? 'bookmark' : 'add'} 
              size={20} 
              color="white" 
            />
            <Text style={styles.addMoreRoutinesButtonText}>
              {source === 'explore' ? 'Add to my Program List' : 'Add new routine'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{program.name}</Text>
            {program.description ? (
              <Text style={styles.headerSubtitle}>{program.description}</Text>
            ) : null}
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderRoutinesContent()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Routine Modal */}
      <Modal
        visible={showCreateRoutineModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateRoutineModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateRoutineModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Routine</Text>
            <TouchableOpacity
              style={[styles.modalCreateButton, !newRoutineName.trim() && styles.modalCreateButtonDisabled]}
              onPress={createRoutine}
              disabled={!newRoutineName.trim()}
            >
              <Text style={[styles.modalCreateText, !newRoutineName.trim() && styles.modalCreateTextDisabled]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Routine Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={newRoutineName}
                onChangeText={setNewRoutineName}
                placeholder="e.g., Session A - Dinking Focus"
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Routines styles
  routinesContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyRoutinesList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyRoutinesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyRoutinesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRoutinesDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstRoutineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  routinesList: {
    flex: 1,
  },
  routinesContent: {
    padding: 16,
    paddingBottom: 40,
  },
  routinesHeader: {
    marginBottom: 16,
  },
  routinesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  routinesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  routineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routineContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  routineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineButton: {
    padding: 8,
  },
  addMoreRoutinesButton: {
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
  addMoreRoutinesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addToProgramsButton: {
    backgroundColor: '#8B5CF6',
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
