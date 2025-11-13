import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RoutinesTable({
  routines,
  loading,
  searchQuery,
  handleEditRoutine,
  styles
}) {
  const filteredRoutines = routines.filter(routine =>
    routine.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.programs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Training Routines</Text>
        <Text style={styles.sectionSubtitle}>Manage workout routines and sessions</Text>
      </View>

      <View style={styles.modernTable}>
        <View style={styles.modernTableHeader}>
          <View style={[styles.modernTableHeaderCell, { flex: 2 }]}>
            <Text style={styles.modernTableHeaderText}>Routine</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1.5 }]}>
            <Text style={styles.modernTableHeaderText}>Program</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Order</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Status</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Created</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Actions</Text>
          </View>
        </View>

        <ScrollView style={styles.modernTableBody}>
          {filteredRoutines.length > 0 ? filteredRoutines.map(routine => (
            <View key={routine.id} style={styles.modernTableRow}>
              <View style={[styles.modernTableCell, { flex: 2 }]}>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                {routine.description && (
                  <Text style={styles.routineMeta}>{routine.description}</Text>
                )}
              </View>
              <View style={[styles.modernTableCell, { flex: 1.5 }]}>
                <Text style={styles.cellText}>
                  {routine.programs?.name || 'No Program'}
                </Text>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <Text style={styles.cellText}>{routine.order_index}</Text>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <View style={[styles.statusBadge, routine.is_published ? styles.statusPublished : styles.statusDraft]}>
                  <Text style={[styles.statusText, routine.is_published ? styles.statusTextPublished : styles.statusTextDraft]}>
                    {routine.is_published ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <Text style={styles.cellText}>
                  {new Date(routine.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.modernTableCell, { flex: 1 }]}>
                <View style={styles.modernActionButtons}>
                  <TouchableOpacity
                    style={styles.modernActionButton}
                    onPress={() => handleEditRoutine(routine)}
                  >
                    <Ionicons name="create-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.comingSoon}>
              <Ionicons name="library-outline" size={48} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>No routines found</Text>
              <Text style={styles.comingSoonSubtext}>Create your first routine to get started</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
