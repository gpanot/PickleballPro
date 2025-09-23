import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from '../components/WebIcon';
import { Ionicons } from '@expo/vector-icons';

export default function ExercisePickerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { onAddExercise, alreadyAddedIds = [] } = route.params || {};
  
  // Track locally removed exercises for better UX
  const [removedExerciseIds, setRemovedExerciseIds] = useState(new Set());
  
  // Track selected category (default to first category)
  const [selectedCategory, setSelectedCategory] = useState('dinks');

  // Static exercises data - can be moved to a separate file later
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

  const categories = [
    { key: 'dinks', title: 'Dinks', icon: '🏓', exercises: staticExercises.dinks },
    { key: 'drives', title: 'Drives', icon: '💨', exercises: staticExercises.drives },
    { key: 'serves', title: 'Serves', icon: '🎯', exercises: staticExercises.serves },
    { key: 'returns', title: 'Returns', icon: '↩️', exercises: staticExercises.returns },
    { key: 'volleys', title: 'Volleys', icon: '⚡', exercises: staticExercises.volleys },
    { key: 'others', title: 'Others', icon: '🔄', exercises: staticExercises.others }
  ];

  const handleAddExercise = (exercise) => {
    // Add to removed list for immediate UI feedback
    setRemovedExerciseIds(prev => new Set([...prev, exercise.id]));
    
    // Call the callback to add to parent component
    if (onAddExercise) {
      onAddExercise(exercise);
    }
  };

  const handleExerciseDetail = (exercise) => {
    // Navigate to exercise detail screen
    navigation.navigate('ExerciseDetail', { exercise });
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
        <View style={styles.headerSpacer} />
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
                selectedCategory === category.key && styles.categoryTabActive
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
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
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
    minWidth: 80,
    minHeight: 70,
    gap: 4,
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
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
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
