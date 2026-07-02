import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLogbook } from '../context/LogbookContext';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import YoutubePlayer from 'react-native-youtube-iframe';
import AddLogExercise_from_routine from '../components/AddLogExercise_from_routine';
import ExerciseTrainingFooter from '../components/training/ExerciseTrainingFooter';

function getYouTubeVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

const ExerciseDetailScreen = ({ route, navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [lastLogResult, setLastLogResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const playerRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { logbookTheme: t, isDark } = useTheme();
  const { logbookEntries } = useLogbook();

  // Get exercise data from navigation params or use mock data
  const initialRawExercise = route?.params?.exercise || route?.params?.rawExercise;
  const onExerciseUpdated = route?.params?.onExerciseUpdated;
  const studentId = route?.params?.studentId; // For coach logging
  const program = route?.params?.program; // For logging context
  const routine = route?.params?.routine; // For logging context
  const source = route?.params?.source; // 'training' | 'library' | 'coach_assignment' | etc.
  const allExercises = route?.params?.allExercises; // Full list for Next exercise nav
  const currentExerciseIndex = route?.params?.currentExerciseIndex; // Position in session

  const isTrainingMode = source === 'training';
  const hasNextExercise = isTrainingMode && allExercises && currentExerciseIndex < allExercises.length - 1;

  const handleNavigateNext = () => {
    if (!hasNextExercise) return;
    const nextExercise = allExercises[currentExerciseIndex + 1];
    navigation.replace('ExerciseDetail', {
      ...route.params,
      exercise: nextExercise,
      currentExerciseIndex: currentExerciseIndex + 1,
    });
  };

  // Use current exercise data if available, otherwise fall back to initial data
  const rawExercise = currentExerciseData || initialRawExercise;

  const currentVideoUrl = rawExercise?.youtube_url
    || rawExercise?.demo_video_url
    || rawExercise?.video_url
    || rawExercise?.videoUrl
    || null;
  const currentVideoId = getYouTubeVideoId(currentVideoUrl);

  React.useEffect(() => {
    setIsPlaying(!!currentVideoId);
  }, [currentVideoId]);

  // Load exercise history from logbook entries whenever entries or exercise changes
  const loadExerciseHistory = useCallback(() => {
    if (!rawExercise) {
      setExerciseHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const exerciseName = rawExercise.title || rawExercise.name;
      const exerciseId = rawExercise.id || rawExercise.code;

      const history = (logbookEntries || []).filter(entry => {
        if (!entry.exerciseDetails) return false;
        if (entry.exerciseDetails.exerciseName === exerciseName) return true;
        if (exerciseId && entry.exerciseDetails.exerciseId === exerciseId) return true;
        return false;
      });

      const sorted = [...history].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
      });

      setExerciseHistory(sorted);
    } catch (err) {
      console.error('Error filtering exercise history:', err);
      setExerciseHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [rawExercise, logbookEntries]);

  React.useEffect(() => {
    loadExerciseHistory();
  }, [loadExerciseHistory]);

  // Debug logging for tips data
  React.useEffect(() => {
    console.log('🔍 [ExerciseDetailScreen] Raw exercise data received:', {
      id: rawExercise?.id,
      code: rawExercise?.code,
      title: rawExercise?.title,
      hasTipsJson: !!rawExercise?.tips_json,
      tipsCount: rawExercise?.tips_json ? rawExercise.tips_json.length : 0,
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

      let data, error;

      const { data: dataByCode, error: errorByCode } = await supabase
        .from('exercises')
        .select('*')
        .eq('code', exerciseCode)
        .single();

      if (!errorByCode && dataByCode) {
        data = dataByCode;
        error = errorByCode;
      } else {
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
      if (rawExercise.tips_json && Array.isArray(rawExercise.tips_json) && rawExercise.tips_json.length > 0) {
        return rawExercise.tips_json.filter(tip => tip && tip.trim());
      }
      if (rawExercise.completeExerciseData?.tips_json && Array.isArray(rawExercise.completeExerciseData.tips_json) && rawExercise.completeExerciseData.tips_json.length > 0) {
        return rawExercise.completeExerciseData.tips_json.filter(tip => tip && tip.trim());
      }
      if (rawExercise.completeExerciseData?.tips && Array.isArray(rawExercise.completeExerciseData.tips) && rawExercise.completeExerciseData.tips.length > 0) {
        return rawExercise.completeExerciseData.tips.filter(tip => tip && tip.trim());
      }
      if (rawExercise.tips && Array.isArray(rawExercise.tips) && rawExercise.tips.length > 0) {
        return rawExercise.tips.filter(tip => tip && tip.trim());
      }
      return [];
    })()
  } : null;

  const renderGoalTargetRow = () => (
    <View style={styles.goalTargetContainer}>
      <View style={[styles.goalCard, {
        backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
        borderColor: isDark ? '#2563EB40' : '#DBEAFE',
      }]}>
        <View style={styles.goalContent}>
          <ModernIcon name="target" size={20} color="#2563EB" style={styles.goalIcon} />
          <View style={styles.goalTextContainer}>
            <Text style={[styles.goalTitle, { color: isDark ? '#93C5FD' : '#1E3A8A' }]}>Goal</Text>
            <Text style={[styles.goalDescription, { color: isDark ? '#BFDBFE' : '#1E40AF' }]}>{exercise.goal}</Text>
          </View>
        </View>
      </View>

      {exercise.targetValue && exercise.targetValue !== "Complete" && (
        <View style={[styles.targetCard, {
          backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
          borderColor: isDark ? '#05966940' : '#A7F3D0',
        }]}>
          <View style={styles.targetContent}>
            <ModernIcon name="flag" size={20} color="#059669" style={styles.targetIcon} />
            <View style={styles.targetTextContainer}>
              <Text style={[styles.targetTitle, { color: isDark ? '#6EE7B7' : '#047857' }]}>Target</Text>
              <Text style={[styles.targetDescription, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
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

    if (!videoId) {
      return (
        <View style={[styles.videoSection, { backgroundColor: t.bgCard }]}>
          <View style={[styles.videoContainer, { backgroundColor: isDark ? '#0F172A' : '#1F2937' }]}>
            <View style={styles.noVideoContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noVideoText}>No video available</Text>
            </View>
          </View>
          <View style={styles.videoInfo}>
            <View style={styles.videoDetails}>
              <ModernIcon name="time" size={16} color={t.textSecondary} />
              <Text style={[styles.videoDetailText, { color: t.textSecondary }]}>{exercise.estimatedTime}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.videoSection, { backgroundColor: t.bgCard }]}>
        <View style={[styles.videoContainer, { backgroundColor: isDark ? '#0F172A' : '#1F2937' }]}>
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
            webViewStyle={{ opacity: 0.99 }}
            initialPlayerParams={{
              autoplay: 1,
              loop: false,
              controls: true,
              modestbranding: false,
              showClosedCaptions: false,
              preventFullScreen: false,
            }}
            onChangeState={(state) => {
              if (state === 'ended' || state === 'paused') {
                setIsPlaying(false);
              } else if (state === 'playing') {
                setIsPlaying(true);
              }
            }}
            onReady={() => {
              if (videoId) setIsPlaying(true);
            }}
            onError={(error) => {
              console.log('YouTube Player Error:', error);
            }}
          />
        </View>
        <View style={styles.videoInfo}>
          <View style={styles.videoDetails}>
            <ModernIcon name="time" size={16} color={t.textSecondary} />
            <Text style={[styles.videoDetailText, { color: t.textSecondary }]}>{exercise.estimatedTime}</Text>
          </View>
          {exercise.videoUrl && (
            <View style={styles.videoDetails}>
              <Ionicons name="logo-youtube" size={16} color="#FF0000" />
              <Text style={[styles.videoUrlText, { color: t.textTertiary }]} numberOfLines={1} ellipsizeMode="tail">
                {exercise.videoUrl}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderInstructions = () => {
    const instructionSections = exercise.instructions.split('\n\n');

    return (
      <View style={[styles.card, { backgroundColor: t.bgCard }]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>Instructions</Text>

        {instructionSections.map((section, index) => {
          const lines = section.split('\n');
          const title = lines[0];
          const items = lines.slice(1);

          return (
            <View key={index} style={styles.instructionSection}>
              <Text style={[styles.instructionSectionTitle, { color: t.textSecondary }]}>{title}</Text>
              {items.map((item, itemIndex) => (
                <Text key={itemIndex} style={[styles.instructionItem, { color: t.textSecondary }]}>{item}</Text>
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
      <View style={[styles.card, { backgroundColor: t.bgCard }]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>Pro Tips</Text>
        <View style={styles.tipsContainer}>
          {exercise.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={[styles.tipNumber, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                <Text style={[styles.tipNumberText, { color: isDark ? '#34D399' : '#16A34A' }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: t.textSecondary }]}>{tip}</Text>
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
      <View style={[styles.tagsSection, { borderTopColor: t.border }]}>
        <Text style={[styles.tagsTitle, { color: t.textTertiary }]}>Tags:</Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Text key={index} style={[styles.tagText, { color: t.textTertiary }]}>
              {tag}{index < tags.length - 1 ? ' • ' : ''}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderPreviousResults = () => {
    return (
      <View style={[styles.card, { backgroundColor: t.bgCard, marginTop: 8 }]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>Previous Results</Text>

        {loadingHistory ? (
          <View style={styles.historyLoadingContainer}>
            <ActivityIndicator size="small" color={t.primary} />
          </View>
        ) : exerciseHistory.length === 0 ? (
          <View style={[styles.historyEmptyContainer, { borderColor: t.border }]}>
            <Ionicons name="time-outline" size={28} color={t.textTertiary} />
            <Text style={[styles.historyEmptyText, { color: t.textSecondary }]}>No results yet</Text>
            <Text style={[styles.historyEmptySubtext, { color: t.textTertiary }]}>
              Your logged results will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {exerciseHistory.slice(0, 5).map((entry, index) => {
              const entryDate = new Date(entry.date || entry.createdAt);
              const formattedDate = entryDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const result = entry.exerciseDetails?.result || 'N/A';
              const target = entry.exerciseDetails?.target || exercise.targetValue || 'N/A';
              const notes = entry.exerciseDetails?.notes || '';
              const targetMet = entry.exerciseDetails?.target_met !== false;

              return (
                <View
                  key={entry.id || index}
                  style={[styles.historyItem, {
                    backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
                    borderColor: t.border,
                  }]}
                >
                  <View style={styles.historyItemHeader}>
                    <View style={styles.historyDateRow}>
                      <Ionicons name="calendar-outline" size={13} color={t.textTertiary} />
                      <Text style={[styles.historyDate, { color: t.textSecondary }]}>{formattedDate}</Text>
                    </View>
                    <View style={[
                      styles.historyResultBadge,
                      {
                        backgroundColor: targetMet
                          ? (isDark ? '#064E3B' : '#D1FAE5')
                          : (isDark ? '#292524' : '#FEF3C7'),
                        borderColor: targetMet
                          ? (isDark ? '#34D399' : '#6EE7B7')
                          : (isDark ? '#FBBF24' : '#FDE68A'),
                      }
                    ]}>
                      <Text style={[
                        styles.historyResultText,
                        { color: targetMet ? (isDark ? '#34D399' : '#059669') : (isDark ? '#FBBF24' : '#92400E') }
                      ]}>
                        {result} / {target}
                      </Text>
                    </View>
                  </View>
                  {notes ? (
                    <Text style={[styles.historyNotes, { color: t.textTertiary }]} numberOfLines={2}>
                      {notes}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {exerciseHistory.length > 5 && (
              <Text style={[styles.historyMore, { color: t.textTertiary }]}>
                +{exerciseHistory.length - 5} more entries
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Handle case when no exercise data is available
  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <ScreenHeaderShell tokens={t} isDark={isDark} background="surface" bordered title="Exercise Not Found" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: t.textMuted }]}>No exercise data available</Text>
        </View>
      </View>
    );
  }

  // Bottom padding: FAB button (56px) + gap (20) + bottom inset, or training footer height
  const scrollBottomPadding = isTrainingMode ? 16 : insets.bottom + 96;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="surface"
        bordered
        title={exercise.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.primary}
            colors={[t.primary]}
            progressBackgroundColor={t.bgCard}
          />
        }
      >
        <View style={styles.content}>
          {renderGoalTargetRow()}
          {renderVideoSection()}
          {renderInstructions()}
          {renderTips()}
          {renderTags()}
          {renderPreviousResults()}
        </View>
      </ScrollView>

      {/* FAB "Add log" — shown when not in training mode AND we have logging context */}
      {!isTrainingMode && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20, backgroundColor: '#27AE60' }]}
          onPress={() => setShowLogModal(true)}
          activeOpacity={0.85}
          accessibilityLabel="Add log"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color="white" />
          <Text style={styles.fabText}>Add log</Text>
        </TouchableOpacity>
      )}

      {/* Training mode: sticky ExerciseTrainingFooter */}
      {isTrainingMode && (
        <ExerciseTrainingFooter
          logResult={lastLogResult}
          hasNextExercise={hasNextExercise}
          onLog={() => setShowLogModal(true)}
          onNext={handleNavigateNext}
          onBackToSession={() => navigation.goBack()}
          isDark={isDark}
          theme={t}
        />
      )}

      {/* Log Modal */}
      <AddLogExercise_from_routine
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        exercise={rawExercise}
        program={program}
        routine={routine}
        studentId={isTrainingMode ? undefined : studentId}
        onResultSaved={(routineExerciseId, resultData) => {
          console.log('✅ Log saved');
          setLastLogResult({ target_met: resultData?.target_met });
          if (onExerciseUpdated) onExerciseUpdated(rawExercise);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flex: 0.6,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  goalTextContainer: { flex: 1 },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  targetCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flex: 0.4,
  },
  targetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  targetIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  targetTextContainer: { flex: 1 },
  targetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  targetDescription: {
    fontSize: 14,
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
    textAlign: 'center',
  },
  videoSection: {
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
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
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
  videoInfo: { padding: 16 },
  videoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoDetailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  videoUrlText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  card: {
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
    marginBottom: 12,
  },
  instructionSection: { marginBottom: 16 },
  instructionSectionTitle: {
    fontSize: 14,
    fontWeight: 'normal',
    marginBottom: 4,
  },
  instructionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  tipsContainer: { gap: 12 },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tagsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  tagsTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagText: {
    fontSize: 11,
    lineHeight: 16,
  },
  // Previous results
  historyLoadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  historyEmptyContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  historyEmptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyEmptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  historyList: { gap: 10 },
  historyItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  historyResultBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  historyResultText: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyNotes: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  historyMore: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseDetailScreen;
