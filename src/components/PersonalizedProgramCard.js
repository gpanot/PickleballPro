import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { loadPersonalizedProgram, clearPersonalizedProgram } from '../lib/personalizedProgramStorage';
import { getOrCreatePersonalizedProgram, canCreateMeaningfulProgram, regeneratePersonalizedProgram } from '../lib/personalizedProgramUtils';

export default function PersonalizedProgramCard({ navigation, onProgramLoad }) {
  const { user } = useUser();
  const [personalizedProgram, setPersonalizedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);

  useEffect(() => {
    loadProgram();
  }, [user?.id, user?.focus_areas, user?.name]); // Trigger when user data changes

  const loadProgram = async () => {
    if (!user?.id) {
      setLoading(false);
      setShowEmptyState(true);
      return;
    }

    try {
      setLoading(true);
      
      // Try to get existing program or create new one
      const program = await getOrCreatePersonalizedProgram(user);
      
      if (program) {
        setPersonalizedProgram(program);
        setShowEmptyState(false);
        // Notify parent component about loaded program
        onProgramLoad && onProgramLoad(program);
        console.log('✅ PersonalizedProgramCard: Program loaded/created successfully');
      } else {
        // Check if we can create a meaningful program
        if (canCreateMeaningfulProgram(user)) {
          console.log('⚠️ PersonalizedProgramCard: Failed to create program despite having user data');
        } else {
          console.log('⚠️ PersonalizedProgramCard: User lacks necessary data for program creation');
        }
        setShowEmptyState(true);
      }
    } catch (error) {
      console.error('❌ PersonalizedProgramCard: Error loading/creating personalized program:', error);
      setShowEmptyState(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramPress = () => {
    if (personalizedProgram) {
      // Navigate to program detail with the personalized program
      navigation.navigate('ProgramDetail', { 
        program: personalizedProgram,
        source: 'personalized',
        onUpdateProgram: (updatedProgram) => {
          setPersonalizedProgram(updatedProgram);
        }
      });
    }
  };

  const handleResetProgram = () => {
    Alert.alert(
      'Reset Personal Program',
      'This will regenerate your personalized program based on your current profile data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear current program and regenerate
              await clearPersonalizedProgram();
              const newProgram = await regeneratePersonalizedProgram(user);
              
              if (newProgram) {
                setPersonalizedProgram(newProgram);
                setShowEmptyState(false);
                onProgramLoad && onProgramLoad(newProgram);
                Alert.alert('Success', 'Personal program has been regenerated!');
              } else {
                setPersonalizedProgram(null);
                setShowEmptyState(true);
                Alert.alert('Error', 'Failed to regenerate program');
              }
            } catch (error) {
              console.error('Error regenerating program:', error);
              setPersonalizedProgram(null);
              setShowEmptyState(true);
              Alert.alert('Error', 'Failed to regenerate program');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getProgressText = () => {
    if (!personalizedProgram?.progress) return '0/4 sessions completed';
    
    const completedSessions = personalizedProgram.progress.completedSessions || 0;
    const totalSessions = personalizedProgram.routines?.length || 4;
    return `${completedSessions}/${totalSessions} sessions completed`;
  };

  const getFocusAreasText = () => {
    if (!personalizedProgram?.focus_areas || personalizedProgram.focus_areas.length === 0) {
      return 'General training';
    }
    
    return personalizedProgram.focus_areas.slice(0, 3).join(', ') + 
           (personalizedProgram.focus_areas.length > 3 ? '...' : '');
  };

  const getFormattedProgramName = () => {
    // Use user's name if available, otherwise use "Your"
    const userName = user?.name || 'Your';
    return `${userName} Personal AI Training Program`;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your program...</Text>
      </View>
    );
  }

  // Empty state - no program exists
  if (showEmptyState || !personalizedProgram) {
    const canCreate = canCreateMeaningfulProgram(user);
    
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateContent}>
          <Text style={styles.emptyStateIcon}>🎯</Text>
          <Text style={styles.emptyStateTitle}>No Personal Program</Text>
          <Text style={styles.emptyStateDescription}>
            {canCreate 
              ? 'Create your personalized training program based on your profile and focus areas.'
              : 'Complete your profile setup to generate a personalized training program.'
            }
          </Text>
          
          {canCreate && (
            <TouchableOpacity
              style={styles.createProgramButton}
              onPress={async () => {
                try {
                  setLoading(true);
                  const program = await regeneratePersonalizedProgram(user);
                  
                  if (program) {
                    setPersonalizedProgram(program);
                    setShowEmptyState(false);
                    onProgramLoad && onProgramLoad(program);
                  } else {
                    Alert.alert('Error', 'Failed to create personalized program');
                  }
                } catch (error) {
                  console.error('Error creating program:', error);
                  Alert.alert('Error', 'Failed to create personalized program');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.createProgramButtonText}>Create Personal Program</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Program exists - show program card (consistent with ProgramScreen style)
  return (
    <View style={styles.personalProgramSection}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetProgram}
        >
          <Ionicons name="refresh-outline" size={16} color="#666666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.programCard}>
        <TouchableOpacity
          style={styles.programContent}
          onPress={handleProgramPress}
          activeOpacity={0.7}
        >
          <View style={styles.programThumbnailContainer}>
            <View style={styles.programPlaceholder}>
              <Text style={styles.placeholderText}>🏆</Text>
            </View>
          </View>
          
          <View style={styles.programInfo}>
            <Text style={styles.programName}>{getFormattedProgramName()}</Text>
            {personalizedProgram.description && (
              <Text style={styles.programDescription} numberOfLines={2}>
                {personalizedProgram.description}
              </Text>
            )}
            <View style={styles.programStatsContainer}>
              <View style={styles.programStatsRow}>
                <View style={styles.programStats}>
                  <Text style={styles.programStatsText}>
                    {personalizedProgram.routines?.length || 4} routine{(personalizedProgram.routines?.length || 4) !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.programStatsText}>•</Text>
                  <Text style={styles.programStatsText}>
                    {personalizedProgram.routines?.reduce((total, routine) => total + (routine.exercises?.length || 0), 0) || 12} exercises
                  </Text>
                </View>
                <View style={styles.programActions}>
                  <Text style={styles.chevronText}>{'>'}</Text>
                </View>
              </View>
              <View style={styles.focusRow}>
                <Text style={styles.programStatsText}>
                  Focus: {getFocusAreasText()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  emptyStateContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createProgramButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  createProgramButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  personalProgramSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButton: {
    padding: 8,
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programContent: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    alignItems: 'center',
  },
  programThumbnailContainer: {
    width: 60,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
  },
  programPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 24,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  programStatsContainer: {
    gap: 4,
  },
  programStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  programStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  programActions: {
    paddingLeft: 8,
  },
  chevronText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
