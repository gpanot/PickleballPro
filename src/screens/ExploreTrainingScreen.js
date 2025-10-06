import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';
import { usePreload } from '../context/PreloadContext';
import { getPrograms, transformProgramData, supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function ExploreTrainingScreen({ navigation }) {
  const { user } = useUser();
  const { getDataWithFallback, hasPreloadedData, isDataLoading, refreshData, getDataError } = usePreload();
  const insets = useSafeAreaInsets();
  
  // State for API data
  const [explorePrograms, setExplorePrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savedCategoryOrder, setSavedCategoryOrder] = useState([]);
  
  // Animation for rotating ball
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Fetch programs from API on component mount
  useEffect(() => {
    // Check if we have preloaded data first
    const preloadedPrograms = getDataWithFallback('programs');
    if (preloadedPrograms && preloadedPrograms.length > 0) {
      console.log('🚀 ExploreTrainingScreen: Using preloaded programs data - INSTANT LOAD!');
      setExplorePrograms(preloadedPrograms);
      setLoading(false);
      setError(null);
    } else if (hasPreloadedData('programs')) {
      // We have preloaded data but it's empty
      console.log('📭 ExploreTrainingScreen: Preloaded programs data is empty - INSTANT LOAD!');
      setExplorePrograms([]);
      setLoading(false);
      setError(null);
    } else {
      // No preloaded data, fetch normally
      console.log('⏳ ExploreTrainingScreen: No preloaded data, fetching programs...');
      fetchPrograms();
    }
    
    fetchCategoryOrder();
  }, []);

  // Start rotation animation when loading
  useEffect(() => {
    if (loading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      
      return () => {
        rotateAnimation.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [loading, rotateAnim]);

  const fetchPrograms = async () => {
    // Add timeout for the entire fetch operation
    const fetchTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch programs timeout after 20 seconds')), 20000)
    );
    
    const fetchOperation = async () => {
      try {
        setLoading(true);
        const { data, error } = await getPrograms();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setExplorePrograms([]);
          setError(null);
          return;
        }
        
        if (Array.isArray(data) && data.length === 0) {
          setExplorePrograms([]);
          setError(null);
          return;
        }
        
        // Transform the data to match your current app structure
        const transformedPrograms = transformProgramData(data);
        setExplorePrograms(transformedPrograms);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load programs');
        setExplorePrograms([]);
      } finally {
        setLoading(false);
      }
    };
    
    try {
      await Promise.race([fetchOperation(), fetchTimeout]);
    } catch (timeoutError) {
      setError('Request timed out. Please try again.');
      setExplorePrograms([]);
      setLoading(false);
    }
  };

  const fetchCategoryOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .rpc('get_category_order');
      
      if (orderError) {
        setSavedCategoryOrder([]);
      } else {
        setSavedCategoryOrder(orderData || []);
      }
    } catch (error) {
      setSavedCategoryOrder([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Try to refresh from preload context first
      const refreshedPrograms = await refreshData('programs');
      if (refreshedPrograms) {
        setExplorePrograms(refreshedPrograms);
        setError(null);
      } else {
        // Fallback to direct API call
        const { data, error } = await getPrograms();
        
        if (error) {
          throw error;
        }
        
        // Transform the data to match your current app structure
        const transformedPrograms = transformProgramData(data);
        setExplorePrograms(transformedPrograms);
        setError(null);
      }
      
      // Also refresh category order
      await fetchCategoryOrder();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper functions - now just returns all programs since we only have "For You"
  const filteredPrograms = explorePrograms;

  const navigateToProgram = (program) => {
    navigation.navigate('ProgramDetail', { 
      program,
      source: 'explore' 
    });
  };

  const getCurrentRating = () => {
    return user.duprRating || 2.5;
  };

  const getNextMilestone = () => {
    const currentRating = getCurrentRating();
    const currentHalf = Math.floor(currentRating * 2) / 2;
    return currentHalf + 0.5;
  };

  const getTotalExerciseCount = () => {
    return explorePrograms.reduce((total, program) => {
      const programExerciseCount = program.routines?.reduce((routineTotal, routine) => {
        return routineTotal + (routine.exercises?.length || 0);
      }, 0) || 0;
      return total + programExerciseCount;
    }, 0);
  };

  const renderHeader = () => {
    const exerciseCount = getTotalExerciseCount();
    
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.exerciseCount}>{exerciseCount} exercises</Text>
        </View>
      </View>
    );
  };

  const renderProgramsContent = () => {
    // Loading state
    if (loading) {
      const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <View style={styles.loadingContainer}>
          <Animated.Image
            source={require('../../assets/images/icon_ball.png')}
            style={[
              styles.loadingBall,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      );
    }

    // Error state
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load programs</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPrograms}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Get all unique categories from programs and sort them according to saved order
    const uniqueCategories = [...new Set(filteredPrograms.map(p => p.category).filter(Boolean))];
    
    // Sort categories according to saved order
    let categories;
    if (savedCategoryOrder && savedCategoryOrder.length > 0) {
      // Create ordered list based on saved order
      const orderedCategories = [];
      
      // Add categories in saved order
      savedCategoryOrder.forEach(savedCat => {
        if (uniqueCategories.includes(savedCat.name)) {
          orderedCategories.push(savedCat.name);
        }
      });
      
      // Add any new categories that weren't in saved order
      const savedCategoryNames = savedCategoryOrder.map(sc => sc.name);
      const newCategories = uniqueCategories.filter(cat => !savedCategoryNames.includes(cat));
      orderedCategories.push(...newCategories);
      
      categories = orderedCategories;
    } else {
      categories = uniqueCategories;
    }
    
    // Define category icons for better visual appeal
    const getCategoryIcon = (category) => {
      switch (category.toLowerCase()) {
        case 'pro training': return '🏆';
        case 'fundamentals': return '📚';
        case 'technique': return '🎯';
        case 'fitness': return '💪';
        case 'strategy': return '🧠';
        case 'mental game': return '🧘';
        case 'conditioning': return '🏃';
        case 'drills': return '⚡';
        default: return '🏓';
      }
    };

    return (
      <ScrollView 
        style={styles.programsContainer}
        contentContainerStyle={styles.programsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Dynamically render all categories */}
        {categories.map((category) => {
          const categoryPrograms = filteredPrograms.filter(p => p.category === category);
          
          if (categoryPrograms.length === 0) return null;
          
          const useHorizontalScroll = categoryPrograms.length > 2;
          
          return (
            <View key={category} style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>{category}</Text>
              {useHorizontalScroll ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                  style={styles.horizontalScroll}
                >
                  {categoryPrograms.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.horizontalProgramCard}
                      onPress={() => navigateToProgram(program)}
                    >
                      <View style={styles.thumbnailContainer}>
                        {program.thumbnail ? (
                          <Image 
                            source={{ uri: program.thumbnail }} 
                            style={styles.programThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeholderThumbnail}>
                            <Text style={styles.placeholderText}>{getCategoryIcon(category)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.programDetails}>
                        <Text style={styles.programTitle}>{program.name}</Text>
                        <View style={styles.ratingContainer}>
                          <WebIcon name="star" size={12} color="#FFB800" />
                          <Text style={styles.ratingText}>{program.rating}</Text>
                          <Text style={styles.addedText}>• Added {program.addedCount.toLocaleString()} times</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.programsGrid}>
                  {categoryPrograms.map((program) => (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.programCard}
                      onPress={() => navigateToProgram(program)}
                    >
                      <View style={styles.thumbnailContainer}>
                        {program.thumbnail ? (
                          <Image 
                            source={{ uri: program.thumbnail }} 
                            style={styles.programThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeholderThumbnail}>
                            <Text style={styles.placeholderText}>{getCategoryIcon(category)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.programDetails}>
                        <Text style={styles.programTitle}>{program.name}</Text>
                        <View style={styles.ratingContainer}>
                          <WebIcon name="star" size={12} color="#FFB800" />
                          <Text style={styles.ratingText}>{program.rating}</Text>
                          <Text style={styles.addedText}>• Added {program.addedCount.toLocaleString()} times</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Empty state */}
        {filteredPrograms.length === 0 && !loading && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No programs available</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        {renderHeader()}
      </View>
      {renderProgramsContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  // Header styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  exerciseCount: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
  // Programs Content styles
  programsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  programsContent: {
    paddingVertical: 20,
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  programsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  horizontalScroll: {
    paddingLeft: 16,
  },
  horizontalScrollContent: {
    paddingRight: 16,
  },
  programCard: {
    width: (width - 48) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalProgramCard: {
    width: ((width - 48) / 2) * 0.9,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  programThumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  programDetails: {
    padding: 12,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  addedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flexShrink: 1,
  },
  // Loading, error, and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingBall: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
