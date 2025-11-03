import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase, transformProgramData } from '../../lib/supabase';

const PRIMARY_COLOR = '#27AE60';
const SECONDARY_COLOR = '#F4F5F7';

export default function AssignProgramListScreen({ route, navigation }) {
  const { studentId, studentName, assignedProgramIds = [] } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [coachPrograms, setCoachPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachPrograms();
  }, []);

  const loadCoachPrograms = async () => {
    try {
      setLoading(true);
      console.log('Loading coach programs for assignment...');
      
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          description,
          category,
          tier,
          thumbnail_url,
          rating,
          added_count,
          order_index,
          created_at,
          routines (
            id,
            name,
            description,
            order_index,
            time_estimate_minutes,
            routine_exercises (
              order_index,
              custom_target_value,
              is_optional,
              exercises (*)
            )
          )
        `)
        .eq('is_published', true)
        .eq('is_coach_program', true)
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });
      
      if (error) {
        console.error('Error loading coach programs:', error);
        throw error;
      }
      
      console.log('Raw coach programs data:', data?.length || 0, 'programs');
      
      const transformedPrograms = data ? transformProgramData(data) : [];
      console.log('Transformed coach programs:', transformedPrograms.length);
      
      setCoachPrograms(transformedPrograms);
    } catch (error) {
      console.error('Error loading coach programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramPress = (program) => {
    navigation.navigate('ProgramDetail', {
      program,
      source: 'coach_assignment',
      studentId,
      studentName,
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Program</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Loading programs...</Text>
          </View>
        ) : coachPrograms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No coach programs available</Text>
          </View>
        ) : (
          coachPrograms.map((program) => {
            const isAssigned = assignedProgramIds.includes(program.id);
            
            return (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.programCard,
                  isAssigned && styles.programCardDisabled
                ]}
                onPress={() => !isAssigned && handleProgramPress(program)}
                disabled={isAssigned}
              >
                {(program.thumbnail_url || program.thumbnail) && (
                  <Image 
                    source={{ uri: program.thumbnail_url || program.thumbnail }} 
                    style={styles.programThumbnail}
                  />
                )}
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {program.description && (
                    <Text style={styles.programDescription} numberOfLines={2}>
                      {program.description}
                    </Text>
                  )}
                  <View style={styles.programMeta}>
                    {program.category && (
                      <Text style={styles.programCategory}>{program.category}</Text>
                    )}
                    {program.tier && (
                      <Text style={styles.programTier}>• {program.tier}</Text>
                    )}
                  </View>
                </View>
                {isAssigned ? (
                  <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  programCardDisabled: {
    opacity: 0.6,
  },
  programThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
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
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 4,
  },
  programTier: {
    fontSize: 11,
    color: '#6B7280',
  },
});

