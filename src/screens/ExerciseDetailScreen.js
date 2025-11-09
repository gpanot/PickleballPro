import React, { useState, useCallback, useRef } from 'react';
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
import YoutubePlayer from 'react-native-youtube-iframe';
import AddLogExercise_from_routine from '../components/AddLogExercise_from_routine';

const ExerciseDetailScreen = ({ route, navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const insets = useSafeAreaInsets();
  
  // Get exercise data from navigation params or use mock data
  const initialRawExercise = route?.params?.exercise || route?.params?.rawExercise;
  const onExerciseUpdated = route?.params?.onExerciseUpdated;
  const studentId = route?.params?.studentId; // For coach logging
  const program = route?.params?.program; // For logging context
  const routine = route?.params?.routine; // For logging context

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };
  
  // Use current exercise data if available, otherwise fall back to initial data
  const rawExercise = currentExerciseData || initialRawExercise;
  
  // Debug logging for tips data
  React.useEffect(() => {
    console.log('🔍 [ExerciseDetailScreen] Raw exercise data received:', {
      id: rawExercise?.id,
      code: rawExercise?.code,
      title: rawExercise?.title,
      hasTipsJson: !!rawExercise?.tips_json,
      tipsJson: rawExercise?.tips_json,
      tipsCount: rawExercise?.tips_json ? rawExercise.tips_json.length : 0,
      hasCompleteExerciseData: !!rawExercise?.completeExerciseData,
      completeDataTips: rawExercise?.completeExerciseData?.tips_json
    });
  }, [rawExercise]);

  // Pull-to-refresh function
  const onRefresh = useCallback(async () => {
    if (!rawExercise?.code && !rawExercise?.id) {
      console.log('No exercise code available for refresh');
      return;
    }

    setRefreshing(true);
    try {
      const exerciseCode = rawExercise.code || rawExercise.id;
      

      // Fetch fresh exercise data from database
      let data, error;
      
      // First try to find by code (for older exercises with code field)
      const { data: dataByCode, error: errorByCode } = await supabase
        .from('exercises')
        .select('*')
        .eq('code', exerciseCode)
        .single();
      
      if (!errorByCode && dataByCode) {
        data = dataByCode;
        error = errorByCode;
      } else {
        // If not found by code, try to find by UUID (for database exercises)
        const { data: dataById, error: errorById } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', exerciseCode)
          .single();
        
        data = dataById;
        error = errorById;
      }

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
    instructions: rawExercise.instructions || rawExercise.description || "No additional instructions available",
    targetType: rawExercise.target_type || "count",
    targetValue: rawExercise.target_value || rawExercise.target || "Complete",
    targetUnit: rawExercise.target_unit || "attempts",
    difficulty: rawExercise.difficulty || 1,
    validationMode: rawExercise.validation_mode || "manual",
    estimatedTime: rawExercise.estimated_minutes ? `${rawExercise.estimated_minutes} min` : "10-15 min",
    equipment: ["Balls", "Paddle"],
    videoUrl: rawExercise.youtube_url || rawExercise.demo_video_url || rawExercise.video_url || rawExercise.videoUrl || null,
    tips: (() => {
      // Try multiple sources for tips data
      // 1. Direct tips_json field (from database)
      if (rawExercise.tips_json && Array.isArray(rawExercise.tips_json) && rawExercise.tips_json.length > 0) {
        return rawExercise.tips_json.filter(tip => tip && tip.trim());
      }
      // 2. completeExerciseData.tips_json (from transformed data)
      if (rawExercise.completeExerciseData?.tips_json && Array.isArray(rawExercise.completeExerciseData.tips_json) && rawExercise.completeExerciseData.tips_json.length > 0) {
        return rawExercise.completeExerciseData.tips_json.filter(tip => tip && tip.trim());
      }
      // 3. completeExerciseData.tips (from transformed data)
      if (rawExercise.completeExerciseData?.tips && Array.isArray(rawExercise.completeExerciseData.tips) && rawExercise.completeExerciseData.tips.length > 0) {
        return rawExercise.completeExerciseData.tips.filter(tip => tip && tip.trim());
      }
      // 4. Legacy tips field (fallback)
      if (rawExercise.tips && Array.isArray(rawExercise.tips) && rawExercise.tips.length > 0) {
        return rawExercise.tips.filter(tip => tip && tip.trim());
      }
      return [];
    })()
  } : null;


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
          <Text style={styles.titleText}>{exercise.title}</Text>
        </View>
      </View>
    </View>
  );

  const renderGoalTargetRow = () => (
    <View style={styles.goalTargetContainer}>
      <View style={styles.goalCard}>
        <View style={styles.goalContent}>
          <ModernIcon name="target" size={20} color="#2563EB" style={styles.goalIcon} />
          <View style={styles.goalTextContainer}>
            <Text style={styles.goalTitle}>Goal</Text>
            <Text style={styles.goalDescription}>{exercise.goal}</Text>
          </View>
        </View>
      </View>
      
      {exercise.targetValue && exercise.targetValue !== "Complete" && (
        <View style={styles.targetCard}>
          <View style={styles.targetContent}>
            <ModernIcon name="flag" size={20} color="#059669" style={styles.targetIcon} />
            <View style={styles.targetTextContainer}>
              <Text style={styles.targetTitle}>Target</Text>
              <Text style={styles.targetDescription}>
                {exercise.targetValue} {exercise.targetUnit && exercise.targetUnit !== "attempts" ? exercise.targetUnit : ""}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderVideoSection = () => {
    const videoId = getYouTubeVideoId(exercise.videoUrl);
    
    console.log('🎥 [Video Debug]', {
      videoUrl: exercise.videoUrl,
      extractedVideoId: videoId
    });
    
    if (!videoId) {
      // Show placeholder if no video URL
      console.log('❌ No video ID found');
      return (
        <View style={styles.videoSection}>
          <View style={styles.videoContainer}>
            <View style={styles.noVideoContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noVideoText}>No video available</Text>
            </View>
          </View>
          <View style={styles.videoInfo}>
            <View style={styles.videoDetails}>
              <ModernIcon name="time" size={16} color="#6B7280" />
              <Text style={styles.videoDetailText}>{exercise.estimatedTime}</Text>
            </View>
          </View>
        </View>
      );
    }

    console.log('✅ Rendering YouTube player with ID:', videoId);

    return (
      <View style={styles.videoSection}>
        <View style={styles.videoContainer}>
          <YoutubePlayer
            ref={playerRef}
            width={'100%'}
            height={200}
            videoId={videoId}
            play={isPlaying}
            webViewProps={{
              allowsFullscreenVideo: true,
              androidLayerType: 'hardware',
            }}
            webViewStyle={{
              opacity: 0.99,
            }}
            initialPlayerParams={{
              loop: false,
              controls: true,
              modestbranding: false,
              showClosedCaptions: false,
              preventFullScreen: false,
            }}
            onChangeState={(state) => {
              console.log('📺 YouTube State Changed:', state);
              if (state === 'ended' || state === 'paused') {
                setIsPlaying(false);
              } else if (state === 'playing') {
                setIsPlaying(true);
              }
            }}
            onReady={() => {
              console.log('✅ YouTube Player Ready');
            }}
            onError={(error) => {
              console.log('❌ YouTube Player Error:', error);
            }}
            onFullScreenChange={(isFullScreen) => {
              console.log('📺 Fullscreen changed:', isFullScreen);
            }}
          />
        </View>
        <View style={styles.videoInfo}>
          <View style={styles.videoDetails}>
            <ModernIcon name="time" size={16} color="#6B7280" />
            <Text style={styles.videoDetailText}>{exercise.estimatedTime}</Text>
          </View>
          {exercise.videoUrl && (
            <View style={styles.videoDetails}>
              <Ionicons name="logo-youtube" size={16} color="#FF0000" />
              <Text style={styles.videoUrlText} numberOfLines={1} ellipsizeMode="tail">
                {exercise.videoUrl}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

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

  const renderTips = () => {
    if (!exercise.tips || exercise.tips.length === 0) {
      return null;
    }

    return (
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
  };

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



  // Handle case when no exercise data is available
  if (!exercise) {
    return (
      <View style={styles.container}>
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
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
                <Text style={styles.titleText}>Exercise Not Found</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No exercise data available</Text>
        </View>
      </View>
    );
  }

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
          {renderGoalTargetRow()}
          {renderVideoSection()}
          {renderInstructions()}
          {renderTips()}
          {renderTags()}
        </View>
      </ScrollView>
      
      {/* Log Button - only show for coaches viewing student exercises */}
      {studentId && program && routine && (
        <TouchableOpacity
          style={[styles.logButton, { bottom: insets.bottom + 20 }]}
          onPress={() => setShowLogModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.logButtonText}>Add Log</Text>
        </TouchableOpacity>
      )}
      
      {/* Log Modal */}
      <AddLogExercise_from_routine
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        exercise={rawExercise}
        program={program}
        routine={routine}
        studentId={studentId}
        onResultSaved={() => {
          console.log('✅ Log saved for student');
        }}
      />
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
  goalTargetContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    flex: 0.6, // 60% width
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
  targetCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 16,
    flex: 0.4, // 40% width
  },
  targetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  targetIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  targetTextContainer: {
    flex: 1,
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  targetDescription: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
    position: 'relative',
  },
  noVideoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
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
  videoUrlText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    flex: 1,
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
    fontSize: 14,
    fontWeight: 'normal',
    color: '#374151',
    marginBottom: 4,
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
  logButton: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseDetailScreen;
