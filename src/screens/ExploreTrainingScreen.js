import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';
import { getPrograms, transformProgramData } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function ExploreTrainingScreen({ navigation }) {
  console.log('🎾 ExploreTrainingScreen rendering!');
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  
  console.log('🎾 ExploreTrainingScreen: User context state:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email
  });
  
  // State for API data
  const [explorePrograms, setExplorePrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch programs from API on component mount
  useEffect(() => {
    console.log('🎾 ExploreTrainingScreen: useEffect triggered - component mounted');
    console.log('🎾 ExploreTrainingScreen: User state:', !!user, 'User ID:', user?.id);
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    console.log('🎾 ExploreTrainingScreen: Starting fetchPrograms...');
    
    // Add timeout for the entire fetch operation
    const fetchTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch programs timeout after 20 seconds')), 20000)
    );
    
    const fetchOperation = async () => {
      try {
        setLoading(true);
        console.log('🎾 ExploreTrainingScreen: Loading state set to true');
        
        console.log('🎾 ExploreTrainingScreen: Calling getPrograms from Supabase...');
        const startTime = Date.now();
        const { data, error } = await getPrograms();
        const endTime = Date.now();
        
        console.log(`🎾 ExploreTrainingScreen: getPrograms completed in ${endTime - startTime}ms`);
        console.log('🎾 ExploreTrainingScreen: getPrograms response - error:', !!error, 'data length:', data?.length || 0);
        
        if (error) {
          console.error('🎾 ExploreTrainingScreen: Supabase error:', error);
          console.error('🎾 ExploreTrainingScreen: Error type:', typeof error);
          console.error('🎾 ExploreTrainingScreen: Error details:', error.message, error.code, error.details);
          throw error;
        }
        
        if (!data) {
          console.warn('🎾 ExploreTrainingScreen: No data returned from getPrograms - setting empty array');
          setExplorePrograms([]);
          setError(null);
          return;
        }
        
        if (Array.isArray(data) && data.length === 0) {
          console.warn('🎾 ExploreTrainingScreen: Empty array returned from database');
          setExplorePrograms([]);
          setError(null);
          return;
        }
        
        console.log('🎾 ExploreTrainingScreen: Raw data from Supabase (first item):');
        console.log(JSON.stringify(data[0], null, 2));
        
        // Transform the data to match your current app structure
        console.log('🎾 ExploreTrainingScreen: Transforming program data...');
        const transformedPrograms = transformProgramData(data);
        console.log('🎾 ExploreTrainingScreen: Transformed programs:', transformedPrograms.length, 'items');
        
        if (transformedPrograms.length > 0) {
          console.log('🎾 ExploreTrainingScreen: First transformed program:', JSON.stringify(transformedPrograms[0], null, 2));
        }
        
        setExplorePrograms(transformedPrograms);
        setError(null);
        console.log('🎾 ExploreTrainingScreen: ✅ Programs loaded successfully');
      } catch (err) {
        console.error('🎾 ExploreTrainingScreen: Error fetching programs:', err);
        console.error('🎾 ExploreTrainingScreen: Error name:', err.name);
        console.error('🎾 ExploreTrainingScreen: Error message:', err.message);
        console.error('🎾 ExploreTrainingScreen: Error stack:', err.stack);
        setError(err.message || 'Failed to load programs');
        // Fallback to empty array if API fails
        setExplorePrograms([]);
      } finally {
        setLoading(false);
        console.log('🎾 ExploreTrainingScreen: Loading state set to false');
      }
    };
    
    try {
      await Promise.race([fetchOperation(), fetchTimeout]);
    } catch (timeoutError) {
      console.error('🎾 ExploreTrainingScreen: Fetch operation timed out:', timeoutError);
      setError('Request timed out. Please try again.');
      setExplorePrograms([]);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    console.log('🎾 ExploreTrainingScreen: Pull to refresh triggered');
    setRefreshing(true);
    try {
      console.log('🎾 ExploreTrainingScreen: Calling getPrograms for refresh...');
      const { data, error } = await getPrograms();
      
      if (error) {
        console.error('🎾 ExploreTrainingScreen: Refresh error:', error);
        throw error;
      }
      
      // Transform the data to match your current app structure
      const transformedPrograms = transformProgramData(data);
      console.log('🎾 ExploreTrainingScreen: Refresh successful, got', transformedPrograms.length, 'programs');
      setExplorePrograms(transformedPrograms);
      setError(null);
    } catch (err) {
      console.error('🎾 ExploreTrainingScreen: Error refreshing programs:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
      console.log('🎾 ExploreTrainingScreen: Refresh completed');
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

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>
    );
  };

  const renderProgramsContent = () => {
    // Loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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

    // Group programs by category
    const proTrainingPrograms = filteredPrograms.filter(p => p.category === 'Pro Training');
    const fundamentalsPrograms = filteredPrograms.filter(p => p.category === 'Fundamentals');

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
        {/* Pro Training Section */}
        {proTrainingPrograms.length > 0 && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Pro Training</Text>
            <View style={styles.programsGrid}>
              {proTrainingPrograms.map((program) => (
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
                        <Text style={styles.placeholderText}>🏆</Text>
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
          </View>
        )}

        {/* Fundamentals Section */}
        {fundamentalsPrograms.length > 0 && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Fundamentals</Text>
            <View style={styles.programsGrid}>
              {fundamentalsPrograms.map((program) => (
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
                        <Text style={styles.placeholderText}>📚</Text>
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
          </View>
        )}

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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
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
