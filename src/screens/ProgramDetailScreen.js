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
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

export default function ProgramDetailScreen({ navigation, route }) {
  const { program: initialProgram, onUpdateProgram, source } = route.params;
  const { user } = useUser();
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
  const createRoutine = async () => {
    console.log('🚀 [ProgramDetailScreen] createRoutine called');
    console.log('📝 [ProgramDetailScreen] Routine name:', newRoutineName.trim());
    console.log('🏠 [ProgramDetailScreen] Program ID:', program?.id);
    console.log('👤 [ProgramDetailScreen] Current user:', user?.id);
    
    if (!newRoutineName.trim()) {
      console.log('❌ [ProgramDetailScreen] Validation failed: Empty routine name');
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    
    if (!program?.id) {
      console.log('❌ [ProgramDetailScreen] Validation failed: No program ID');
      Alert.alert('Error', 'Program not found');
      return;
    }
    
    if (!user?.id) {
      console.log('❌ [ProgramDetailScreen] Validation failed: No user ID');
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      console.log('🔄 [ProgramDetailScreen] Starting routine creation process...');
      
      const newRoutine = {
        id: Date.now().toString(),
        name: newRoutineName.trim(),
        exercises: [],
        createdAt: new Date().toISOString(),
      };
      
      console.log('📋 [ProgramDetailScreen] Routine object created:', {
        id: newRoutine.id,
        name: newRoutine.name,
        programId: program.id,
        exercisesCount: newRoutine.exercises.length
      });
      
      // 🚨 ISSUE: This was only saving to LOCAL STATE, not to database!
      console.log('⚠️ [ProgramDetailScreen] WARNING: Previously only saved to local state - NOT to database!');
      console.log('🔧 [ProgramDetailScreen] Now attempting to save to database using user function...');
      
      // Try to save to database using the user function
      console.log('💾 [ProgramDetailScreen] Attempting to save routine to database...');
      try {
        const { data: savedRoutine, error: saveError } = await supabase.rpc('create_routine_as_user', {
          routine_program_id: program.id,
          routine_name: newRoutine.name,
          routine_description: `User-created routine: ${newRoutine.name}`,
          routine_order_index: (program.routines?.length || 0) + 1,
          routine_time_estimate_minutes: 30, // Default estimate
          routine_is_published: false
        });
        
        if (saveError) {
          console.error('❌ [ProgramDetailScreen] Database save failed:', saveError);
          console.log('📱 [ProgramDetailScreen] Falling back to local storage only');
          Alert.alert('Warning', 'Routine saved locally but could not sync to server. It will sync when connection is available.');
        } else {
          console.log('✅ [ProgramDetailScreen] Routine saved to database successfully:', savedRoutine);
          
          // 🔧 CRITICAL FIX: RPC functions return arrays, so get the first element
          const routineData = Array.isArray(savedRoutine) ? savedRoutine[0] : savedRoutine;
          
          if (routineData && routineData.id) {
            console.log('🔄 [ProgramDetailScreen] Updating routine ID from timestamp to UUID:', {
              oldId: newRoutine.id,
              newId: routineData.id,
              idType: typeof routineData.id
            });
            newRoutine.id = routineData.id;
            newRoutine.program_id = routineData.program_id;
            newRoutine.order_index = routineData.order_index;
            newRoutine.time_estimate_minutes = routineData.time_estimate_minutes;
            newRoutine.is_published = routineData.is_published;
            console.log('✅ [ProgramDetailScreen] Routine object updated with database UUID');
          } else {
            console.log('⚠️ [ProgramDetailScreen] No routine data returned from database function');
          }
        }
      } catch (dbError) {
        console.error('❌ [ProgramDetailScreen] Database operation failed:', dbError);
        console.log('📱 [ProgramDetailScreen] Continuing with local storage only');
        Alert.alert('Warning', `Database save failed: ${dbError.message}. Routine saved locally.`);
      }
      
      // Update local state (this was the only thing happening before)
      console.log('📱 [ProgramDetailScreen] Updating local state...');
      const updatedProgram = {
        ...program,
        routines: [...(program.routines || []), newRoutine]
      };
      
      console.log('📊 [ProgramDetailScreen] Local routines count after add:', updatedProgram.routines.length);
      setProgram(updatedProgram);
      
      // Clear form
      console.log('🧹 [ProgramDetailScreen] Clearing form...');
      setNewRoutineName('');
      setShowCreateRoutineModal(false);
      
      console.log('✅ [ProgramDetailScreen] Routine creation completed successfully');
      
      // Navigate to RoutineDetail first, then automatically open ExercisePicker
      console.log('🧭 [ProgramDetailScreen] Navigating to RoutineDetail...');
      navigation.navigate('RoutineDetail', { 
        program: updatedProgram,
        routine: newRoutine,
        onUpdateRoutine: (updatedRoutine) => {
          console.log('🔄 [ProgramDetailScreen] Updating routine from RoutineDetail:', updatedRoutine.id);
          setProgram(prev => ({
            ...prev,
            routines: prev.routines.map(r => 
              r.id === updatedRoutine.id ? updatedRoutine : r
            )
          }));
        },
        autoOpenExercisePicker: true // Flag to automatically open exercise picker
      });
      
    } catch (error) {
      console.error('💥 [ProgramDetailScreen] Unexpected error in createRoutine:', error);
      Alert.alert('Error', `Failed to create routine: ${error.message}`);
    }
  };

  const deleteRoutine = async (routineId) => {
    const routineToDelete = program.routines.find(r => r.id === routineId);
    
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routineToDelete?.name}"?\n\nThis action cannot be undone and will:\n• Delete all exercises from this routine\n• Remove this routine from other users if the program was shared\n\nThis will affect all users who have this program.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [ProgramDetailScreen] Deleting routine:', routineId);
              
              // Delete from database if it's a UUID (database routine)
              const isUUID = routineId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
              
              if (isUUID && user?.id) {
                console.log('💾 [ProgramDetailScreen] Deleting from database...');
                
                const { error } = await supabase.rpc('delete_routine_as_user', {
                  routine_id: routineId
                });
                
                if (error) {
                  console.error('❌ [ProgramDetailScreen] Database delete failed:', error);
                  Alert.alert('Error', `Failed to delete from database: ${error.message}`);
                  return;
                }
                
                console.log('✅ [ProgramDetailScreen] Routine deleted from database');
              }
              
              // Update local state
              const updatedProgram = {
                ...program,
                routines: program.routines.filter(r => r.id !== routineId)
              };
              setProgram(updatedProgram);
              
              // Update parent if callback exists
              if (onUpdateProgram) {
                onUpdateProgram(updatedProgram);
              }
              
              Alert.alert('Success', 'Routine deleted successfully');
              
            } catch (error) {
              console.error('💥 [ProgramDetailScreen] Error deleting routine:', error);
              Alert.alert('Error', `Failed to delete routine: ${error.message}`);
            }
          }
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
