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
import { CheckCircle, ChevronRight, Library } from 'lucide-react-native';
import { supabase, transformProgramData } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { ScreenHeaderShell } from '../../components/logbook/ScreenHeader';

export default function AssignProgramListScreen({ route, navigation }) {
  const { studentId, studentName, assignedProgramIds = [] } = route.params || {};
  const { logbookTheme: t, isDark } = useTheme();

  const [coachPrograms, setCoachPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCoachPrograms(); }, []);

  const loadCoachPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select(`id, name, description, category, tier, thumbnail_url, rating, added_count, order_index, created_at, routines(id, name, description, order_index, time_estimate_minutes, routine_exercises(order_index, custom_target_value, is_optional, exercises(*)))`)
        .eq('is_published', true)
        .eq('is_coach_program', true)
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });
      if (error) throw error;
      setCoachPrograms(data ? transformProgramData(data) : []);
    } catch (error) {
      console.error('Error loading coach programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramPress = (program) => {
    navigation.navigate('ProgramDetail', { program, source: 'coach_assignment', studentId, studentName });
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell tokens={t} isDark={isDark} background="bg" bordered title="Assign Program" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={t.accentPurple} />
            <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>Loading programs...</Text>
          </View>
        ) : coachPrograms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Library size={48} color={t.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: t.textMuted, fontFamily: t.fontBody }]}>No coach programs available</Text>
          </View>
        ) : (
          coachPrograms.map((program) => {
            const isAssigned = assignedProgramIds.includes(program.id);
            return (
              <TouchableOpacity
                key={program.id}
                style={[styles.programCard, { backgroundColor: t.surface, borderWidth: isDark ? 1 : 0, borderColor: t.border }, isAssigned && { opacity: 0.6 }]}
                onPress={() => !isAssigned && handleProgramPress(program)}
                disabled={isAssigned}
              >
                {(program.thumbnail_url || program.thumbnail) && (
                  <Image source={{ uri: program.thumbnail_url || program.thumbnail }} style={[styles.programThumbnail, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]} />
                )}
                <View style={styles.programInfo}>
                  <Text style={[styles.programName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{program.name}</Text>
                  {program.description && (
                    <Text style={[styles.programDescription, { color: t.textMuted, fontFamily: t.fontBody }]} numberOfLines={2}>{program.description}</Text>
                  )}
                  <View style={styles.programMeta}>
                    {program.category && <Text style={[styles.programCategory, { color: t.textCaption, fontFamily: t.fontBody }]}>{program.category}</Text>}
                    {program.tier && <Text style={[styles.programTier, { color: t.textCaption, fontFamily: t.fontBody }]}>• {program.tier}</Text>}
                  </View>
                </View>
                {isAssigned
                  ? <CheckCircle size={22} color={t.accentPurple} strokeWidth={2} />
                  : <ChevronRight size={18} color={t.textMuted} strokeWidth={2} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 14 },
  programCard: { borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  programThumbnail: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  programInfo: { flex: 1 },
  programName: { fontSize: 15, marginBottom: 3 },
  programDescription: { fontSize: 12, marginBottom: 6, lineHeight: 16 },
  programMeta: { flexDirection: 'row', alignItems: 'center' },
  programCategory: { fontSize: 11, marginRight: 4 },
  programTier: { fontSize: 11 },
});
