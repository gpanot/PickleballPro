import React, { useState } from 'react';
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

export default function WebCreateExerciseModal({ visible, onClose, onSuccess, editingExercise }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [skillCategory, setSkillCategory] = useState('General');

  const isEditing = !!editingExercise;

  const difficultyOptions = [
    { value: 1, label: '1 - Beginner' },
    { value: 2, label: '2 - Easy' },
    { value: 3, label: '3 - Intermediate' },
    { value: 4, label: '4 - Advanced' },
    { value: 5, label: '5 - Expert' },
  ];

  const categoryOptions = [
    'General',
    'Dinking',
    'Drives',
    'Serves',
    'Returns',
    'Volleys',
    'Lobs',
    'Drop Shots',
    'Footwork',
    'Strategy',
    'Fitness',
  ];

  const handleClose = () => {
    setExerciseName('');
    setExerciseDescription('');
    setDifficulty(1);
    setSkillCategory('General');
    onClose();
  };

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          title: exerciseName.trim(),
          code: exerciseName.trim().toUpperCase().replace(/\s+/g, '_'),
          description: exerciseDescription.trim() || 'New exercise description',
          difficulty: difficulty,
          skill_category: skillCategory,
          is_published: false,
          created_by: user.id
        }])
        .select();

      if (error) throw error;

      Alert.alert('Success', `Exercise "${exerciseName}" created successfully!`);
      handleClose();
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error creating exercise:', error);
      Alert.alert('Error', 'Failed to create exercise: ' + error.message);
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
          <Text style={styles.modalTitle}>Create Exercise</Text>
          <TouchableOpacity
            style={[styles.modalCreateButton, !exerciseName.trim() && styles.modalCreateButtonDisabled]}
            onPress={handleCreateExercise}
            disabled={!exerciseName.trim() || loading}
          >
            <Text style={[styles.modalCreateText, !exerciseName.trim() && styles.modalCreateTextDisabled]}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalForm}>
            <Text style={styles.modalLabel}>Exercise Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="e.g., Cross-Court Dinking Drill"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={exerciseDescription}
              onChangeText={setExerciseDescription}
              placeholder="Detailed description of the exercise..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.modalLabel}>Difficulty Level</Text>
            <View style={styles.selectorContainer}>
              {difficultyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectorOption,
                    difficulty === option.value && styles.selectorOptionSelected
                  ]}
                  onPress={() => setDifficulty(option.value)}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    difficulty === option.value && styles.selectorOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Skill Category</Text>
            <View style={styles.categoryGrid}>
              {categoryOptions.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    skillCategory === category && styles.categoryOptionSelected
                  ]}
                  onPress={() => setSkillCategory(category)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    skillCategory === category && styles.categoryOptionTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Exercise will be created as a draft. You can publish it later from the exercises list.
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="code-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  A unique code will be generated automatically based on the exercise name.
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
    height: 100,
    textAlignVertical: 'top',
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectorOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
  },
  selectorOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  selectorOptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectorOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 80,
  },
  categoryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#10B981',
    fontWeight: '600',
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
});
