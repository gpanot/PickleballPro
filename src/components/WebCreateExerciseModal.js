import React, { useState, useMemo, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import skillsData from '../data/Commun_skills_tags.json';

export default function WebCreateExerciseModal({ visible, onClose, onSuccess, editingExercise }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [exerciseName, setExerciseName] = useState('');
  const [targetCriteria, setTargetCriteria] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tip1, setTip1] = useState('');
  const [tip2, setTip2] = useState('');
  const [tip3, setTip3] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('10 min');
  const [difficulty, setDifficulty] = useState(1);
  const [skillCategories, setSkillCategories] = useState(['general']);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [programs, setPrograms] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [allRoutines, setAllRoutines] = useState([]);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showRoutineDropdown, setShowRoutineDropdown] = useState(false);

  const isEditing = !!editingExercise;

  // Load programs and routines on component mount
  useEffect(() => {
    loadPrograms();
    loadRoutines();
  }, [visible]);

  // Filter routines when program changes
  useEffect(() => {
    if (selectedProgram) {
      const filteredRoutines = allRoutines.filter(routine => routine.program_id === selectedProgram);
      setRoutines(filteredRoutines);
      // Reset routine selection if current routine doesn't belong to selected program
      if (selectedRoutine && !filteredRoutines.find(r => r.id === selectedRoutine)) {
        setSelectedRoutine('');
      }
    } else {
      setRoutines([]);
      setSelectedRoutine('');
    }
  }, [selectedProgram, allRoutines]);

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, description, category, tier')
        .eq('is_published', true)
        .order('name');
      
      if (error) throw error;
      console.log('Loaded programs:', data);
      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          id, 
          name, 
          description, 
          program_id,
          programs!inner(name)
        `)
        .eq('is_published', true)
        .order('name');
      
      if (error) throw error;
      setAllRoutines(data || []);
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  };

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

  // Generate category options from skills data with emojis and organized by category
  const categoryOptions = [
    // Add a General option first
    { id: 'general', name: 'General', emoji: '🎯', color: '#6B7280', category: 'general' },
    
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

  const handleClose = () => {
    setExerciseName('');
    setTargetCriteria('');
    setInstructions('');
    setTip1('');
    setTip2('');
    setTip3('');
    setYoutubeUrl('');
    setEstimatedTime('10 min');
    setDifficulty(1);
    setSkillCategories(['general']);
    setSelectedProgram('');
    setSelectedRoutine('');
    setShowProgramDropdown(false);
    setShowRoutineDropdown(false);
    onClose();
  };

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

  // Create preview exercise object
  const previewExercise = useMemo(() => ({
    code: exerciseName ? exerciseName.trim().toUpperCase().replace(/\s+/g, '_').substring(0, 10) : "EXERCISE",
    title: exerciseName || "Exercise Name",
    level: `Difficulty Level ${difficulty}`,
    goal: targetCriteria || "Enter the target/success criteria for this exercise",
    instructions: instructions || "Enter detailed step-by-step instructions here",
    targetType: "count",
    targetValue: targetCriteria || "Complete",
    difficulty: difficulty,
    validationMode: "manual",
    estimatedTime: estimatedTime,
    tips: [tip1, tip2, tip3].filter(tip => tip.trim()).length > 0 
      ? [tip1, tip2, tip3].filter(tip => tip.trim()) 
      : ["Enter helpful tips for this exercise"]
  }), [exerciseName, targetCriteria, instructions, difficulty, estimatedTime, tip1, tip2, tip3]);

  const getDifficultyStars = (diffLevel) => {
    return Array.from({ length: 5 }, (_, i) => (
      <View
        key={i}
        style={[
          styles.previewDifficultyDot,
          { backgroundColor: i < diffLevel ? '#F59E0B' : '#E5E7EB' }
        ]}
      />
    ));
  };

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewHeaderTitle}>Preview</Text>
      </View>
      
      <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.previewExerciseHeader}>
          <View style={styles.previewHeaderText}>
            <Text style={styles.previewLevelText}>{previewExercise.level}</Text>
            <Text style={styles.previewTitleText}>{previewExercise.code} {previewExercise.title}</Text>
          </View>
          <View style={styles.previewDifficultyContainer}>
            {getDifficultyStars(previewExercise.difficulty)}
          </View>
        </View>

          {/* Target/Success Criteria Card */}
        <View style={styles.previewGoalCard}>
          <View style={styles.previewGoalContent}>
            <Text style={styles.previewGoalIcon}>🎯</Text>
            <View style={styles.previewGoalTextContainer}>
              <Text style={styles.previewGoalTitle}>Target/Success Criteria</Text>
              <Text style={styles.previewGoalDescription}>{previewExercise.goal}</Text>
            </View>
          </View>
        </View>

        {/* Video Section */}
        <View style={styles.previewVideoSection}>
          <View style={styles.previewVideoContainer}>
            <Text style={styles.previewPlayButton}>▶</Text>
          </View>
          <View style={styles.previewVideoInfo}>
            <Text style={styles.previewVideoDetailText}>⏱ {previewExercise.estimatedTime}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.previewCard}>
          <Text style={styles.previewCardTitle}>Instructions</Text>
          <Text style={styles.previewInstructionText}>{previewExercise.instructions}</Text>
        </View>

        {/* Tips */}
        <View style={styles.previewCard}>
          <Text style={styles.previewCardTitle}>Pro Tips</Text>
          <View style={styles.previewTipsContainer}>
            {previewExercise.tips.map((tip, index) => (
              <View key={index} style={styles.previewTipItem}>
                <View style={styles.previewTipNumber}>
                  <Text style={styles.previewTipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.previewTipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    if (!targetCriteria.trim()) {
      Alert.alert('Error', 'Please enter the target/success criteria');
      return;
    }

    if (!instructions.trim()) {
      Alert.alert('Error', 'Please enter the exercise instructions');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          title: exerciseName.trim(),
          code: exerciseName.trim().toUpperCase().replace(/\s+/g, '_'),
          description: targetCriteria.trim() || 'Complete the exercise successfully',
          goal_text: targetCriteria.trim() || 'Complete the exercise successfully',
          instructions: instructions.trim() || 'Follow the provided guidelines',
          
          // Enhanced JSONB fields (will be added by migration)
          tips_json: [tip1.trim(), tip2.trim(), tip3.trim()].filter(tip => tip),
          skill_categories_json: skillCategories,
          estimated_minutes: parseInt(estimatedTime.replace(' min', '')),
          goal: targetCriteria.trim() || 'Complete the exercise successfully',
          youtube_url: youtubeUrl.trim() || '',
          
          // Existing schema fields
          demo_video_url: youtubeUrl.trim() || '',
          target_value: parseInt(targetCriteria.match(/\d+/)?.[0]) || null,
          skill_category: skillCategories.join(','),
          difficulty: difficulty,
          is_published: false,
          created_by: user.id
        }])
        .select();

      if (error) throw error;

      // If a routine is selected, link the exercise to the routine
      if (selectedRoutine && data && data[0]) {
        const exerciseId = data[0].id;
        
        // Get the highest order_index for this routine
        const { data: existingExercises, error: orderError } = await supabase
          .from('routine_exercises')
          .select('order_index')
          .eq('routine_id', selectedRoutine)
          .order('order_index', { ascending: false })
          .limit(1);

        if (orderError) {
          console.error('Error getting order index:', orderError);
        }

        const nextOrderIndex = existingExercises && existingExercises[0] 
          ? existingExercises[0].order_index + 1 
          : 1;

        // Insert into routine_exercises
        const { error: linkError } = await supabase
          .from('routine_exercises')
          .insert({
            routine_id: selectedRoutine,
            exercise_id: exerciseId,
            order_index: nextOrderIndex,
            is_optional: false
          });

        if (linkError) {
          console.error('Error linking exercise to routine:', linkError);
          Alert.alert(
            'Partial Success', 
            `Exercise "${exerciseName}" created but could not be linked to the routine. You can link it manually later.`
          );
        } else {
          const selectedRoutineName = routines.find(r => r.id === selectedRoutine)?.name || 'the routine';
          Alert.alert('Success', `Exercise "${exerciseName}" created and linked to ${selectedRoutineName}!`);
        }
      } else {
        Alert.alert('Success', `Exercise "${exerciseName}" created successfully!`);
      }

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
            style={[
              styles.modalCreateButton, 
              (!exerciseName.trim() || !targetCriteria.trim() || !instructions.trim()) && styles.modalCreateButtonDisabled
            ]}
            onPress={handleCreateExercise}
            disabled={!exerciseName.trim() || !targetCriteria.trim() || !instructions.trim() || loading}
          >
            <Text style={[
              styles.modalCreateText, 
              (!exerciseName.trim() || !targetCriteria.trim() || !instructions.trim()) && styles.modalCreateTextDisabled
            ]}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalBodyContainer}>
          {/* Left Side - Form */}
          <ScrollView style={styles.formContainer}>
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

            <Text style={styles.modalLabel}>Program (Optional)</Text>
            <TouchableOpacity 
              style={[styles.dropdown, !selectedProgram && styles.dropdownPlaceholder]}
              onPress={() => {
                console.log('Program dropdown clicked, current state:', showProgramDropdown);
                setShowProgramDropdown(!showProgramDropdown);
              }}
            >
              <Text style={[
                styles.dropdownText,
                !selectedProgram && styles.dropdownPlaceholderText
              ]}>
                {selectedProgram 
                  ? programs.find(p => p.id === selectedProgram)?.name || 'Select Program'
                  : `Select Program (${programs.length} available)`
                }
              </Text>
              <Ionicons 
                name={showProgramDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            {/* Program Selection List - Inline */}
            {showProgramDropdown && (
              <View style={styles.inlineDropdownList}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <TouchableOpacity 
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedProgram('');
                      setShowProgramDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>None (Standalone Exercise)</Text>
                  </TouchableOpacity>
                  {programs.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setSelectedProgram(program.id);
                        setShowProgramDropdown(false);
                      }}
                    >
                      <View>
                        <Text style={styles.dropdownOptionText}>{program.name}</Text>
                        <Text style={styles.dropdownOptionSubtext}>
                          {program.category} • {program.tier}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedProgram && (
              <>
                <Text style={styles.modalLabel}>Routine</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, !selectedRoutine && styles.dropdownPlaceholder]}
                  onPress={() => setShowRoutineDropdown(!showRoutineDropdown)}
                >
                  <Text style={[
                    styles.dropdownText,
                    !selectedRoutine && styles.dropdownPlaceholderText
                  ]}>
                    {selectedRoutine 
                      ? routines.find(r => r.id === selectedRoutine)?.name || 'Select Routine'
                      : 'Select Routine'
                    }
                  </Text>
                  <Ionicons 
                    name={showRoutineDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                
                {/* Routine Selection List - Inline */}
                {showRoutineDropdown && (
                  <View style={styles.inlineDropdownList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {routines.map((routine) => (
                        <TouchableOpacity
                          key={routine.id}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setSelectedRoutine(routine.id);
                            setShowRoutineDropdown(false);
                          }}
                        >
                          <View>
                            <Text style={styles.dropdownOptionText}>{routine.name}</Text>
                            <Text style={styles.dropdownOptionSubtext}>{routine.description}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            <Text style={styles.modalLabel}>Target/Success Criteria *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={targetCriteria}
              onChangeText={setTargetCriteria}
              placeholder="What is the target/success criteria? e.g., Land 6 out of 10 drops in the NVZ, Complete 20 consecutive dinks"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.modalLabel}>Instructions *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalLargeTextArea]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder={`Detailed step-by-step instructions:

Setup:
• Stand at the baseline
• Partner feeds balls from the NVZ

Execution:
1. Take a comfortable ready position
2. Use proper technique
3. Focus on consistency

Success Criteria:
Complete the target successfully`}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <Text style={styles.modalLabel}>Pro Tips</Text>
            
            <Text style={styles.tipLabel}>Tip 1</Text>
            <TextInput
              style={styles.modalInput}
              value={tip1}
              onChangeText={setTip1}
              placeholder="e.g., Keep your paddle face open"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.tipLabel}>Tip 2</Text>
            <TextInput
              style={styles.modalInput}
              value={tip2}
              onChangeText={setTip2}
              placeholder="e.g., Use your legs for power, not your arm"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.tipLabel}>Tip 3</Text>
            <TextInput
              style={styles.modalInput}
              value={tip3}
              onChangeText={setTip3}
              placeholder="e.g., Aim for the kitchen line, not the net"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.modalLabel}>YouTube URL</Text>
            <TextInput
              style={styles.modalInput}
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.modalLabel}>Estimated Time</Text>
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

            <Text style={styles.modalLabel}>Skill Categories (Select one or more)</Text>
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
                  Exercise will be created as a draft. You can publish it later from the exercises list.
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="code-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  A unique code will be generated automatically based on the exercise name.
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  You can select multiple skill categories. At least one category must be selected.
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="link-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Optionally link this exercise to a program and routine. The exercise will be automatically added to the routine.
                </Text>
              </View>
            </View>
          </View>
          </ScrollView>
          
          {/* Right Side - Preview */}
          {screenWidth > 768 && renderPreview()}
        </View>
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
  modalBodyContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    maxWidth: '50%',
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
  tipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
    marginTop: 12,
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
    height: 80,
    textAlignVertical: 'top',
  },
  modalLargeTextArea: {
    height: 160,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formColumn: {
    flex: 1,
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
    minHeight: 40,
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
  // Preview Styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    maxWidth: '50%',
  },
  previewHeader: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewContent: {
    flex: 1,
    padding: 16,
  },
  previewExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  previewHeaderText: {
    flex: 1,
  },
  previewLevelText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  previewTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  previewDifficultyContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  previewDifficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewGoalCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewGoalContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewGoalIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  previewGoalTextContainer: {
    flex: 1,
  },
  previewGoalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  previewGoalDescription: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  previewVideoSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewVideoContainer: {
    aspectRatio: 16/9,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlayButton: {
    fontSize: 24,
    color: 'white',
  },
  previewVideoInfo: {
    padding: 12,
  },
  previewVideoDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  previewCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewInstructionText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  previewTipsContainer: {
    gap: 8,
  },
  previewTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewTipNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  previewTipNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  previewTipText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  // Dropdown Styles
  dropdown: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dropdownPlaceholder: {
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  dropdownPlaceholderText: {
    color: '#9CA3AF',
  },
  inlineDropdownList: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownOptionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
