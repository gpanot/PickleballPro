import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from '../components/WebIcon';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import skillsData from '../data/Commun_skills_tags.json';

export default function ExercisePickerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { onAddExercise, alreadyAddedIds = [] } = route.params || {};
  
  // Track locally removed exercises for better UX
  const [removedExerciseIds, setRemovedExerciseIds] = useState(new Set());
  
  // State for real exercises from Supabase
  const [userCreatedExercises, setUserCreatedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Generate skill-based categories from the JSON data
  const skillCategories = Object.values(skillsData.skillCategories).flatMap(category => 
    category.skills.map(skill => ({
      ...skill,
      categoryName: category.name
    }))
  );

  // Track selected category (default to first skill)
  const [selectedCategory, setSelectedCategory] = useState(skillCategories[0]?.id || 'dinks');

  // Load user-created exercises
  useEffect(() => {
    console.log('ExercisePickerScreen useEffect - user:', user?.id);
    loadUserCreatedExercises();
  }, [user]);

  const loadUserCreatedExercises = async (isRefreshing = false) => {
    if (!user) {
      console.log('No user found, skipping exercise load');
      return;
    }
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Loading exercises for user:', user.id);
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_published', false) // User exercises are saved as drafts
        .order('created_at', { ascending: false }); // Order by creation date
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Loaded user exercises:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample user exercises:', data.slice(0, 3).map(ex => ({
          id: ex.id,
          title: ex.title,
          created_by: ex.created_by,
          is_published: ex.is_published
        })));
        
        // Validate that all exercises belong to the current user
        const invalidExercises = data.filter(ex => ex.created_by !== user.id);
        if (invalidExercises.length > 0) {
          console.error('ERROR: Found exercises from other users:', invalidExercises);
        }
      }
      setUserCreatedExercises(data || []);
    } catch (error) {
      console.error('Error loading user exercises:', error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Callback for when a new exercise is created
  const handleExerciseCreated = (newExercise) => {
    // Add to user-created exercises list
    setUserCreatedExercises(prev => [...prev, newExercise]);
    // Also add to the selected category if it matches
    loadUserCreatedExercises(); // Refresh the list
  };

  // Callback for when an exercise is updated or deleted
  const handleExerciseUpdated = (updatedExercise) => {
    if (updatedExercise === null) {
      // Exercise was deleted, refresh the list
      console.log('Exercise was deleted, refreshing list');
      loadUserCreatedExercises();
    } else {
      // Exercise was updated, refresh the list to get latest data
      console.log('Exercise was updated, refreshing list');
      loadUserCreatedExercises();
    }
  };

  // Pull to refresh handler
  const onRefresh = () => {
    loadUserCreatedExercises(true);
  };

  // Generate sample exercises for each skill
  const generateExercisesForSkill = (skill) => {
    const difficultyMap = { beginner: 2, intermediate: 3, advanced: 4 };
    const baseDifficulty = difficultyMap[skill.difficulty] || 3;
    
    const exerciseTemplates = [
      {
        suffix: "Wall Drill",
        target: "15 consecutive repetitions",
        description: `Practice ${skill.name.toLowerCase()} against a wall for consistency`
      },
      {
        suffix: "Target Practice",
        target: "8/12 successful attempts",
        description: `Precision ${skill.name.toLowerCase()} to specific targets`
      },
      {
        suffix: "Progressive Drill",
        target: "Complete 3-level progression",
        description: `Progressive ${skill.name.toLowerCase()} difficulty training`
      },
      {
        suffix: "Game Simulation",
        target: "Execute in 5 rally scenarios",
        description: `Apply ${skill.name.toLowerCase()} in realistic game situations`
      }
    ];

    return exerciseTemplates.map((template, index) => ({
      id: `${skill.id}_${index + 1}`,
      name: `${skill.name} ${template.suffix}`,
      target: template.target,
      difficulty: Math.min(5, baseDifficulty + index),
      description: template.description,
      skillId: skill.id,
      tags: skill.tags || []
    }));
  };

  // Transform user-created exercises to match the expected format
  const transformUserExercise = (exercise) => ({
    id: `user_${exercise.id}`,
    code: exercise.code || 'USER_EXERCISE',
    title: exercise.title,
    name: exercise.title,
    target: exercise.goal || exercise.goal_text || 'Complete the exercise',
    difficulty: exercise.difficulty || 3,
    description: exercise.description || exercise.instructions || 'User-created exercise',
    skillId: 'user_created',
    tags: ['user_created'],
    isUserCreated: true,
    originalId: exercise.id,
    skillCategories: exercise.skill_categories_json || exercise.skill_category?.split(',') || []
  });

  // Create categories with their exercises (both generated and user-created)
  const categories = skillCategories.map(skill => {
    const generatedExercises = generateExercisesForSkill(skill);
    
    // Filter user-created exercises for this skill category
    const userExercisesForSkill = userCreatedExercises
      .filter(exercise => {
        const exerciseSkills = exercise.skill_categories_json || 
                             (exercise.skill_category ? exercise.skill_category.split(',') : []);
        const matches = exerciseSkills.includes(skill.id);
        if (matches) {
          console.log(`Exercise "${exercise.title}" matches skill "${skill.id}" for user ${exercise.created_by}`);
        }
        return matches;
      })
      .map(transformUserExercise);

    return {
      key: skill.id,
      title: skill.name,
      icon: skill.emoji,
      color: skill.color,
      difficulty: skill.difficulty,
      exercises: [...userExercisesForSkill, ...generatedExercises], // User exercises first
      categoryName: skill.categoryName
    };
  });

  const handleAddExercise = (exercise) => {
    // Add to removed list for immediate UI feedback
    setRemovedExerciseIds(prev => new Set([...prev, exercise.id]));
    
    // Call the callback to add to parent component
    if (onAddExercise) {
      onAddExercise(exercise);
    }
  };

  const handleExerciseDetail = (exercise) => {
    // Navigate to exercise detail screen with updated callback
    navigation.navigate('ExerciseDetail', { 
      exercise,
      rawExercise: exercise,
      onExerciseUpdated: handleExerciseUpdated
    });
  };

  const isExerciseUnavailable = (exerciseId) => {
    return alreadyAddedIds.includes(exerciseId) || removedExerciseIds.has(exerciseId);
  };

  // Filter out unavailable exercises for each category
  const getAvailableExercises = (exercises) => {
    return exercises.filter(exercise => !isExerciseUnavailable(exercise.id));
  };

  // Get available exercises for the selected category
  const selectedCategoryData = categories.find(cat => cat.key === selectedCategory);
  const availableExercises = selectedCategoryData ? getAvailableExercises(selectedCategoryData.exercises) : [];

  // Filter categories that have available exercises
  const availableCategories = categories.filter(category => 
    getAvailableExercises(category.exercises).length > 0
  );

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Add Exercise</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('AddExercise', { 
            selectedSkillCategory: selectedCategory,
            onExerciseCreated: handleExerciseCreated
          })}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Yours</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {availableCategories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryTab,
                selectedCategory === category.key && styles.categoryTabActive,
                selectedCategory === category.key && { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text style={styles.categoryTabIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category.key && styles.categoryTabTextActive
              ]}>
                {category.title}
              </Text>
              <Text style={[
                styles.categoryTabDifficulty,
                selectedCategory === category.key && styles.categoryTabDifficultyActive
              ]}>
                {category.difficulty}
              </Text>
              <Text style={[
                styles.categoryTabCount,
                selectedCategory === category.key && styles.categoryTabCountActive
              ]}>
                ({getAvailableExercises(category.exercises).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Exercise List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
      >
        {availableExercises.length > 0 ? (
          <View style={styles.exerciseListContainer}>
            {availableExercises.map((exercise, index) => (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseItem,
                  index === availableExercises.length - 1 && styles.exerciseItemLast
                ]}
              >
                <TouchableOpacity
                  style={styles.exerciseContent}
                  onPress={() => handleExerciseDetail(exercise)}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {exercise.isUserCreated && (
                      <View style={styles.userCreatedTag}>
                        <Text style={styles.userCreatedTagText}>YOURS</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.exerciseTarget}>Target: {exercise.target}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exerciseActions}
                  onPress={() => handleAddExercise(exercise)}
                >
                  <Ionicons name="add-circle" size={32} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateTitle}>All Exercises Added!</Text>
            <Text style={styles.emptyStateDescription}>
              You've added all available exercises in this category to your custom list.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
    marginLeft: -4, // Align with iOS guidelines
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryTabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    minWidth: 90,
    minHeight: 85,
    gap: 2,
  },
  categoryTabActive: {
    backgroundColor: '#3B82F6',
  },
  categoryTabIcon: {
    fontSize: 20,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryTabTextActive: {
    color: 'white',
  },
  categoryTabDifficulty: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  categoryTabDifficultyActive: {
    color: '#F3F4F6',
  },
  categoryTabCount: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTabCountActive: {
    color: '#DBEAFE',
  },
  exerciseListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseItem: {
    flexDirection: 'row',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  userCreatedTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  userCreatedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 48,
    minHeight: 48,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});
