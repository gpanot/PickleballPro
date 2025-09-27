import React, { useState, useCallback } from 'react';
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
import ModernIcon from '../components/ModernIcon';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const ExerciseDetailScreen = ({ route, navigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState(null);
  const insets = useSafeAreaInsets();
  
  // Get exercise data from navigation params or use mock data
  const initialRawExercise = route?.params?.exercise || route?.params?.rawExercise;
  const onExerciseUpdated = route?.params?.onExerciseUpdated;
  
  // Use current exercise data if available, otherwise fall back to initial data
  const rawExercise = currentExerciseData || initialRawExercise;

  // Pull-to-refresh function
  const onRefresh = useCallback(async () => {
    if (!rawExercise?.code && !rawExercise?.id) {
      console.log('No exercise code available for refresh');
      return;
    }

    setRefreshing(true);
    try {
      // Fetch fresh exercise data from database
      const exerciseCode = rawExercise.code || rawExercise.id;
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('code', exerciseCode)
        .single();

      if (error) {
        console.error('Error refreshing exercise data:', error);
      } else if (data) {
        console.log('Exercise data refreshed successfully');
        setCurrentExerciseData(data);
        
        // Call the update callback if available
        if (onExerciseUpdated) {
          onExerciseUpdated(data);
        }
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [rawExercise?.code, rawExercise?.id, onExerciseUpdated]);
  
  // Transform picker exercise format to detail screen format
  const exercise = rawExercise ? {
    code: rawExercise.code || rawExercise.id || "1.1",
    title: rawExercise.title || rawExercise.name || "Exercise",
    level: `Difficulty Level ${rawExercise.difficulty || 1}`,
    goal: rawExercise.goal_text || rawExercise.goal || rawExercise.description || "Complete the exercise successfully",
    instructions: rawExercise.instructions || `Target: ${rawExercise.target || "Complete the exercise"}

Description:
${rawExercise.description || "No additional instructions available"}

Success Criteria:
${rawExercise.target || "Complete as instructed"}`,
    targetType: rawExercise.target_type || "count",
    targetValue: rawExercise.target_value || rawExercise.target || "Complete",
    difficulty: rawExercise.difficulty || 1,
    validationMode: "manual",
    estimatedTime: rawExercise.estimated_minutes ? `${rawExercise.estimated_minutes} min` : "10-15 min",
    equipment: ["Balls", "Paddle"],
    tips: (rawExercise.tips_json && Array.isArray(rawExercise.tips_json) && rawExercise.tips_json.length > 0) 
      ? rawExercise.tips_json.filter(tip => tip && tip.trim())
      : [
          "Focus on proper form and technique",
          "Take your time with each repetition", 
          "Practice consistently for best results"
        ]
  } : {
    code: "7.1",
    title: "Drop Consistency",
    level: "Level 7: Third Shot Drop",
    goal: "Master the third shot drop by consistently placing the ball in the NVZ",
    instructions: `Setup:
• Stand at the baseline
• Partner feeds balls from the NVZ
• Focus on soft touch and arc

Execution:
1. Take a comfortable ready position
2. Use a pendulum swing motion
3. Aim for the NVZ with proper arc
4. Reset after each attempt

Success Criteria:
Land 6 out of 10 drops in the NVZ to pass this drill.`,
    targetType: "count",
    targetValue: "6/10",
    difficulty: 3,
    validationMode: "manual",
    estimatedTime: "10-15 min",
    equipment: ["Balls", "Partner/Coach"],
    tips: [
      "Keep your paddle face open",
      "Use your legs for power, not your arm", 
      "Aim for the kitchen line, not the net"
    ]
  };


  const getDifficultyStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <View
        key={i}
        style={[
          styles.difficultyDot,
          { backgroundColor: i < exercise.difficulty ? '#F59E0B' : '#E5E7EB' }
        ]}
      />
    ));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
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
        <View style={styles.headerText}>
          <Text style={styles.levelText}>{exercise.level}</Text>
          <Text style={styles.titleText}>{exercise.title}</Text>
        </View>
        <View style={styles.difficultyContainer}>
          {getDifficultyStars()}
        </View>
      </View>
    </View>
  );

  const renderGoalCard = () => (
    <View style={styles.goalCard}>
      <View style={styles.goalContent}>
        <ModernIcon name="target" size={20} color="#2563EB" style={styles.goalIcon} />
        <View style={styles.goalTextContainer}>
          <Text style={styles.goalTitle}>Goal</Text>
          <Text style={styles.goalDescription}>{exercise.goal}</Text>
        </View>
      </View>
    </View>
  );

  const renderVideoSection = () => (
    <View style={styles.videoSection}>
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <ModernIcon 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.videoInfo}>
        <View style={styles.videoDetails}>
          <ModernIcon name="time" size={16} color="#6B7280" />
          <Text style={styles.videoDetailText}>{exercise.estimatedTime}</Text>
        </View>
      </View>
    </View>
  );

  const renderInstructions = () => {
    // Split instructions by double newlines to create sections
    const instructionSections = exercise.instructions.split('\n\n');
    
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Instructions</Text>
        
        {instructionSections.map((section, index) => {
          const lines = section.split('\n');
          const title = lines[0];
          const items = lines.slice(1);
          
          return (
            <View key={index} style={styles.instructionSection}>
              <Text style={styles.instructionSectionTitle}>{title}</Text>
              {items.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.instructionItem}>{item}</Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTips = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pro Tips</Text>
      <View style={styles.tipsContainer}>
        {exercise.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTags = () => {
    const tags = rawExercise?.skill_categories_json || rawExercise?.tags || [];
    
    if (!tags || tags.length === 0) {
      return null;
    }

    return (
      <View style={styles.tagsSection}>
        <Text style={styles.tagsTitle}>Tags:</Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Text key={index} style={styles.tagText}>
              {tag}{index < tags.length - 1 ? ' • ' : ''}
            </Text>
          ))}
        </View>
      </View>
    );
  };



  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {renderHeader()}
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
            progressBackgroundColor="white"
          />
        }
      >
        <View style={styles.content}>
          {renderGoalCard()}
          {renderVideoSection()}
          {renderInstructions()}
          {renderTips()}
          {renderTags()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  safeArea: {
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -4, // Align with iOS guidelines
  },
  headerText: {
    flex: 1,
  },
  levelText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  goalCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  videoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  videoContainer: {
    aspectRatio: 16/9,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 16,
  },
  videoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionSection: {
    marginBottom: 16,
  },
  instructionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tagsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tagsTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagText: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});

export default ExerciseDetailScreen;
