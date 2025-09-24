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
  
  // State for API data
  const [explorePrograms, setExplorePrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch programs from API on component mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      console.log('🎾 ExploreTrainingScreen: Starting fetchPrograms...');
      setLoading(true);
      console.log('🎾 ExploreTrainingScreen: Calling getPrograms API...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout after 10 seconds')), 10000)
      );
      
      const { data, error } = await Promise.race([getPrograms(), timeoutPromise]);
      
      console.log('🎾 ExploreTrainingScreen: API response received - data:', !!data, 'error:', !!error);
      
      if (error) {
        console.error('🎾 ExploreTrainingScreen: API error:', error);
        throw error;
      }
      
      console.log('🎾 ExploreTrainingScreen: Raw data received:', data?.length, 'programs');
      
      // Transform the data to match your current app structure
      const transformedPrograms = transformProgramData(data);
      console.log('🎾 ExploreTrainingScreen: Transformed programs:', transformedPrograms?.length, 'programs');
      
      setExplorePrograms(transformedPrograms);
      setError(null);
      console.log('🎾 ExploreTrainingScreen: ✅ Programs loaded successfully');
    } catch (err) {
      console.error('🎾 ExploreTrainingScreen: Error fetching programs:', err);
      setError(err.message);
      // Fallback to empty array if API fails
      setExplorePrograms([]);
      console.log('🎾 ExploreTrainingScreen: Set empty programs due to error');
    } finally {
      setLoading(false);
      console.log('🎾 ExploreTrainingScreen: Loading state set to false');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await getPrograms();
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match your current app structure
      const transformedPrograms = transformProgramData(data);
      setExplorePrograms(transformedPrograms);
      setError(null);
    } catch (err) {
      console.error('Error refreshing programs:', err);
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
