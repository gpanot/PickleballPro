import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import skillsData from '../data/Commun_skills_tags.json';

export default function AddExerciseScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    selectedSkillCategory = 'dinks', 
    onExerciseCreated, 
    exercise = null, 
    isEditing = false, 
    onExerciseUpdated 
  } = route.params || {};
  
  // Form states
  const [exerciseName, setExerciseName] = useState('');
  const [goal, setGoal] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tip1, setTip1] = useState('');
  const [tip2, setTip2] = useState('');
  const [tip3, setTip3] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('10 min');
  const [difficulty, setDifficulty] = useState(3);
  const [loading, setLoading] = useState(false);

  // Set initial skill category based on the selected one from picker
  const [skillCategories, setSkillCategories] = useState([selectedSkillCategory]);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && exercise) {
      console.log('Populating form for editing:', exercise);
      setExerciseName(exercise.title || exercise.name || '');
      setGoal(exercise.goal || exercise.goal_text || exercise.description || '');
      setTargetValue(exercise.target_value ? exercise.target_value.toString() : '');
      setInstructions(exercise.instructions || '');
      
      // Handle tips - could be in tips_json array or individual fields
      if (exercise.tips_json && Array.isArray(exercise.tips_json)) {
        setTip1(exercise.tips_json[0] || '');
        setTip2(exercise.tips_json[1] || '');
        setTip3(exercise.tips_json[2] || '');
      }
      
      setYoutubeUrl(exercise.youtube_url || exercise.demo_video_url || '');
      setEstimatedTime(exercise.estimated_minutes ? `${exercise.estimated_minutes} min` : '10 min');
      setDifficulty(exercise.difficulty || 3);
      
      // Handle skill categories
      if (exercise.skill_categories_json && Array.isArray(exercise.skill_categories_json)) {
        setSkillCategories(exercise.skill_categories_json);
      } else if (exercise.skill_category) {
        setSkillCategories(exercise.skill_category.split(',').map(cat => cat.trim()));
      }
    }
  }, [isEditing, exercise]);

  const difficultyOptions = [
    { value: 1, label: '1 - Beginner' },
    { value: 2, label: '2 - Easy' },
    { value: 3, label: '3 - Intermediate' },
    { value: 4, label: '4 - Advanced' },
    { value: 5, label: '5 - Expert' },
  ];

  const timeOptions = [
    { value: '5 min', label: '5 min' },
    { value: '10 min', label: '10 min' },
    { value: '20 min', label: '20 min' },
    { value: '30 min', label: '30 min' },
  ];

  // Generate category options from skills data
  const categoryOptions = [
    // Technical Skills
    ...skillsData.skillCategories.technical.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      color: skill.color,
      category: 'technical'
    })),
    
    // Movement Skills
    ...skillsData.skillCategories.movement.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      color: skill.color,
      category: 'movement'
    })),
    
    // Strategic Skills
    ...skillsData.skillCategories.strategic.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      color: skill.color,
      category: 'strategic'
    })),
    
    // Physical Skills
    ...skillsData.skillCategories.physical.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      color: skill.color,
      category: 'physical'
    }))
  ];

  const toggleSkillCategory = (categoryId) => {
    setSkillCategories(prev => {
      if (prev.includes(categoryId)) {
        // Remove if already selected, but ensure at least one is always selected
        return prev.length > 1 ? prev.filter(id => id !== categoryId) : prev;
      } else {
        // Add if not selected
        return [...prev, categoryId];
      }
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete "${exerciseName}"?\n\nThis action cannot be undone and will:\n• Permanently delete this exercise from the database\n• Remove it from all routines that use it\n• Affect other users if this exercise was shared in programs\n\nThis will impact all users who have programs with this exercise.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              console.log('Deleting exercise with ID:', exercise.originalId || exercise.id);
              
              const { error } = await supabase.rpc('delete_exercise_as_user', {
                exercise_code: exercise.code
              });

              if (error) throw error;

              console.log('Exercise deleted successfully');
              
              Alert.alert('Success', 'Exercise deleted successfully!', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Call the callback if provided
                    if (onExerciseUpdated) {
                      onExerciseUpdated(null); // Pass null to indicate deletion
                    }
                    navigation.goBack();
                  }
                }
              ]);
              
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise: ' + error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const cleanExerciseName = exerciseName.trim();
    
    if (!cleanExerciseName) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    if (cleanExerciseName.length < 3) {
      Alert.alert('Error', 'Exercise name must be at least 3 characters long');
      return;
    }

    if (!goal.trim()) {
      Alert.alert('Error', 'Please enter the goal/success criteria');
      return;
    }

    // Validate target value if provided
    if (targetValue.trim()) {
      const targetNum = parseInt(targetValue.trim());
      if (isNaN(targetNum) || targetNum < 1 || targetNum > 999) {
        Alert.alert('Error', 'Target must be a number between 1 and 999');
        return;
      }
    }

    if (!instructions.trim()) {
      Alert.alert('Error', 'Please enter the exercise instructions');
      return;
    }

    try {
      setLoading(true);
      
      // Generate a clean code from the exercise name
      const cleanCode = cleanExerciseName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      
      const exerciseData = {
        title: cleanExerciseName,
        code: cleanCode,
        description: goal.trim() || 'Complete the exercise successfully',
        goal_text: goal.trim() || 'Complete the exercise successfully',
        instructions: instructions.trim() || 'Follow the provided guidelines',
        
        // Enhanced JSONB fields
        tips_json: [tip1.trim(), tip2.trim(), tip3.trim()].filter(tip => tip),
        skill_categories_json: skillCategories,
        estimated_minutes: parseInt(estimatedTime.replace(' min', '')),
        goal: goal.trim() || 'Complete the exercise successfully',
        youtube_url: youtubeUrl.trim() || '',
        
        // Existing schema fields
        demo_video_url: youtubeUrl.trim() || '',
        target_value: targetValue.trim() ? parseInt(targetValue.trim()) : null,
        skill_category: skillCategories.join(','),
        difficulty: difficulty,
        is_published: false, // User-created exercises start as drafts
        created_by: user.id,
        
        // Mark as user-created
        tags: ['user_created']
      };

      let data, error;

      if (isEditing && exercise) {
        // Update existing exercise using user function
        console.log('Updating exercise with ID:', exercise.originalId || exercise.id, 'and data:', exerciseData);
        const updateResult = await supabase.rpc('update_exercise_as_user', {
          exercise_code: exercise.code || cleanCode,
          exercise_title: exerciseData.title,
          exercise_description: exerciseData.description,
          exercise_instructions: exerciseData.instructions,
          exercise_goal: exerciseData.goal_text,
          exercise_difficulty: exerciseData.difficulty,
          exercise_target_value: exerciseData.target_value,
          exercise_target_unit: 'shots', // Default unit
          exercise_estimated_minutes: exerciseData.estimated_minutes,
          exercise_skill_category: exerciseData.skill_category,
          exercise_skill_categories_json: exerciseData.skill_categories_json,
          exercise_is_published: exerciseData.is_published
        });
        
        data = updateResult.data ? [updateResult.data] : updateResult.data;
        error = updateResult.error;
      } else {
        // Create new exercise using user function with duplicate prevention
        console.log('Creating exercise with title:', cleanExerciseName, 'and code:', cleanCode);
        const insertResult = await supabase.rpc('create_exercise_as_user_with_duplicate_check', {
          exercise_code: cleanCode,
          exercise_title: exerciseData.title,
          exercise_description: exerciseData.description,
          exercise_instructions: exerciseData.instructions,
          exercise_goal: exerciseData.goal_text,
          exercise_difficulty: exerciseData.difficulty,
          exercise_target_value: exerciseData.target_value,
          exercise_target_unit: 'shots', // Default unit
          exercise_estimated_minutes: exerciseData.estimated_minutes,
          exercise_skill_category: exerciseData.skill_category,
          exercise_skill_categories_json: exerciseData.skill_categories_json,
          exercise_is_published: exerciseData.is_published
        });
        
        data = insertResult.data ? [insertResult.data] : insertResult.data;
        error = insertResult.error;
      }

      if (error) throw error;

      console.log(`Exercise ${isEditing ? 'updated' : 'created'} successfully:`, data[0]);
      
      Alert.alert('Success', `Exercise "${cleanExerciseName}" ${isEditing ? 'updated' : 'created'} successfully!`, [
        {
          text: 'OK',
          onPress: () => {
            // Call the appropriate callback
            if (isEditing && onExerciseUpdated && data && data[0]) {
              onExerciseUpdated(data[0]);
            } else if (!isEditing && onExerciseCreated && data && data[0]) {
              onExerciseCreated(data[0]);
            }
            navigation.goBack();
          }
        }
      ]);
      
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} exercise:`, error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} exercise: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Exercise' : 'Create Exercise'}</Text>
          {/* Level dots */}
          <View style={styles.levelDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!exerciseName.trim() || !goal.trim() || !instructions.trim()) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!exerciseName.trim() || !goal.trim() || !instructions.trim() || loading}
        >
          <Text style={[
            styles.saveButtonText,
            (!exerciseName.trim() || !goal.trim() || !instructions.trim()) && styles.saveButtonTextDisabled
          ]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.label}>Exercise Name *</Text>
          <TextInput
            style={styles.input}
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="e.g., Cross-Court Dinking Drill"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Goal *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={goal}
            onChangeText={setGoal}
            placeholder="What is the goal/success criteria? e.g., Land 6 out of 10 drops in the NVZ, Complete 20 consecutive dinks"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Target</Text>
          <TextInput
            style={styles.input}
            value={targetValue}
            onChangeText={(text) => {
              // Only allow numbers and limit to 999
              const numericValue = text.replace(/[^0-9]/g, '');
              if (numericValue === '' || (parseInt(numericValue) <= 999)) {
                setTargetValue(numericValue);
              }
            }}
            placeholder="Enter target number (1-999)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={3}
          />

          <Text style={styles.label}>Instructions *</Text>
          <TextInput
            style={[styles.input, styles.largeTextArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Detailed step-by-step instructions..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Pro Tips</Text>
          <TextInput
            style={styles.input}
            value={tip1}
            onChangeText={setTip1}
            placeholder="Tip 1: e.g., Keep your paddle face open"
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={styles.input}
            value={tip2}
            onChangeText={setTip2}
            placeholder="Tip 2: e.g., Use your legs for power, not your arm"
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={styles.input}
            value={tip3}
            onChangeText={setTip3}
            placeholder="Tip 3: e.g., Aim for the kitchen line, not the net"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>YouTube URL</Text>
          <TextInput
            style={styles.input}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Estimated Time</Text>
          <View style={styles.selectorContainer}>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectorOption,
                  estimatedTime === option.value && styles.selectorOptionSelected
                ]}
                onPress={() => setEstimatedTime(option.value)}
              >
                <Text style={[
                  styles.selectorOptionText,
                  estimatedTime === option.value && styles.selectorOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Difficulty Level</Text>
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

          <Text style={styles.label}>Skill Categories (Select one or more)</Text>
          <View style={styles.categoryGrid}>
            {categoryOptions.map((category) => {
              const isSelected = skillCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.categoryOptionSelected,
                    isSelected && { borderColor: category.color }
                  ]}
                  onPress={() => toggleSkillCategory(category.id)}
                >
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.categoryOptionText,
                      isSelected && styles.categoryOptionTextSelected,
                      isSelected && { color: category.color }
                    ]}>
                      {category.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectionIndicator, { backgroundColor: category.color }]}>
                        <Text style={styles.selectionCheck}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Your exercise will be saved as a draft and appear in the selected skill categories.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="star-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                User-created exercises are marked with a special tag to distinguish them from default exercises.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Delete button - only show when editing */}
      {isEditing && (
        <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  largeTextArea: {
    height: 120,
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
    minWidth: 80,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 90,
    maxWidth: 120,
  },
  categoryOptionSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  categoryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 50,
  },
  categoryEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectionCheck: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
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
  
  // Bottom button styles
  bottomButtonContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
