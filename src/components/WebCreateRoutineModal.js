import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function WebCreateRoutineModal({ visible, onClose, onSuccess, editingRoutine, programId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const isEditing = !!editingRoutine;

  // Fetch programs when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchPrograms();
      // Populate fields when editing
      if (editingRoutine) {
        setRoutineTitle(editingRoutine.name || '');
        setRoutineDescription(editingRoutine.description || '');
        // Set selected program based on programId or editingRoutine.program_id
        const programToSelect = programId || editingRoutine.program_id;
        if (programToSelect) {
          setSelectedProgram({ id: programToSelect });
        }
      } else {
        // Reset fields when creating new
        setRoutineTitle('');
        setRoutineDescription('');
        if (programId) {
          // Pre-select program if provided
          setSelectedProgram({ id: programId });
        } else {
          setSelectedProgram(null);
        }
      }
    }
  }, [visible, editingRoutine, programId]);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, description')
        .eq('is_published', true)
        .order('name');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleClose = () => {
    setRoutineTitle('');
    setRoutineDescription('');
    setSelectedProgram(null);
    onClose();
  };

  const handleCreateRoutine = async () => {
    if (!routineTitle.trim()) {
      Alert.alert('Error', 'Please enter a routine title');
      return;
    }

    if (!selectedProgram) {
      Alert.alert('Error', 'Please select a program for this routine');
      return;
    }

    try {
      setLoading(true);
      
      const routineData = {
        name: routineTitle.trim(),
        description: routineDescription.trim() || 'New training routine',
        program_id: selectedProgram.id,
        order_index: isEditing ? editingRoutine.order_index : 1, // Keep existing order or default
        is_published: isEditing ? editingRoutine.is_published : false
      };

      let data, error;

      if (isEditing) {
        // Update existing routine
        routineData.updated_at = new Date().toISOString();
        const result = await supabase
          .from('routines')
          .update(routineData)
          .eq('id', editingRoutine.id)
          .select();
        data = result.data;
        error = result.error;
      } else {
        // Create new routine
        const result = await supabase
          .from('routines')
          .insert([routineData])
          .select();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Routine "${routineTitle}" ${isEditing ? 'updated' : 'created'} successfully!`);
      handleClose();
      onSuccess && onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} routine:`, error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} routine: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={handleClose}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Routine' : 'Create Routine'}</Text>
          <TouchableOpacity
            style={[styles.modalCreateButton, (!routineTitle.trim() || !selectedProgram) && styles.modalCreateButtonDisabled]}
            onPress={handleCreateRoutine}
            disabled={!routineTitle.trim() || !selectedProgram || loading}
          >
            <Text style={[styles.modalCreateText, (!routineTitle.trim() || !selectedProgram) && styles.modalCreateTextDisabled]}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalForm}>
            <Text style={styles.modalLabel}>Routine Title *</Text>
            <TextInput
              style={styles.modalInput}
              value={routineTitle}
              onChangeText={setRoutineTitle}
              placeholder="e.g., Morning Warm-up Routine"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <Text style={styles.modalLabel}>Program *</Text>
            {loadingPrograms ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading programs...</Text>
              </View>
            ) : (
              <View style={styles.programContainer}>
                {programs.length > 0 ? (
                  programs.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={[
                        styles.programOption,
                        selectedProgram?.id === program.id && styles.programOptionSelected
                      ]}
                      onPress={() => setSelectedProgram(program)}
                    >
                      <View style={styles.programOptionContent}>
                        <Text style={[
                          styles.programOptionText,
                          selectedProgram?.id === program.id && styles.programOptionTextSelected
                        ]}>
                          {program.name}
                        </Text>
                        {program.description && (
                          <Text style={[
                            styles.programOptionDescription,
                            selectedProgram?.id === program.id && styles.programOptionDescriptionSelected
                          ]}>
                            {program.description}
                          </Text>
                        )}
                      </View>
                      {selectedProgram?.id === program.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noProgramsContainer}>
                    <Ionicons name="library-outline" size={32} color="#9CA3AF" />
                    <Text style={styles.noProgramsText}>No published programs available</Text>
                    <Text style={styles.noProgramsSubtext}>Create and publish a program first</Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={routineDescription}
              onChangeText={setRoutineDescription}
              placeholder="Describe the routine and its objectives..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Routine will be created as a draft. You can publish it later and assign exercises.
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="fitness-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  After creation, you can add exercises and set duration for each routine.
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="library-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Routines can be organized into programs or used as standalone workouts.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'ios' && {
      paddingTop: 60, // Account for status bar
    }),
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 17,
    color: '#EF4444',
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  modalCreateButton: {
    padding: 8,
  },
  modalCreateButtonDisabled: {
    opacity: 0.4,
  },
  modalCreateText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalCreateTextDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalForm: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  modalTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  programContainer: {
    marginBottom: 8,
  },
  programOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  programOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  programOptionContent: {
    flex: 1,
  },
  programOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programOptionTextSelected: {
    color: '#3B82F6',
  },
  programOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  programOptionDescriptionSelected: {
    color: '#1E40AF',
  },
  noProgramsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noProgramsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  noProgramsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
