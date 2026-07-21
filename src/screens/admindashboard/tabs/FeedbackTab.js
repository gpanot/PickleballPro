import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import styles from '../adminDashboardStyles';

export default function FeedbackTab() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          id,
          rating,
          selected_options,
          what_you_like,
          what_to_add,
          app_version,
          platform,
          created_at,
          updated_at,
          users (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Alert.alert('Error', 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.content}>
      {/* Feedback Stats */}
      <View style={styles.feedbackStatsGrid}>
        <View style={styles.feedbackStatCard}>
          <Text style={styles.feedbackStatNumber}>{feedback.length}</Text>
          <Text style={styles.feedbackStatLabel}>Total Feedback</Text>
          <Text style={styles.feedbackStatSubtext}>All time submissions</Text>
        </View>
        <View style={styles.feedbackStatCard}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.feedbackStatNumber}>
              {feedback.length > 0
                ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
                : '0.0'}
            </Text>
          </View>
          <Text style={styles.feedbackStatLabel}>Average Rating</Text>
          <Text style={styles.feedbackStatSubtext}>User satisfaction</Text>
        </View>
        <View style={styles.feedbackStatCard}>
          <Text style={styles.feedbackStatNumber}>
            {feedback.filter(f => f.rating >= 4).length}
          </Text>
          <Text style={styles.feedbackStatLabel}>Positive Reviews</Text>
          <Text style={styles.feedbackStatSubtext}>4+ star ratings</Text>
        </View>
        <View style={styles.feedbackStatCard}>
          <Text style={styles.feedbackStatNumber}>
            {feedback.filter(f => f.what_to_add?.trim()).length}
          </Text>
          <Text style={styles.feedbackStatLabel}>Feature Requests</Text>
          <Text style={styles.feedbackStatSubtext}>Improvement suggestions</Text>
        </View>
      </View>

      {/* Feedback Table */}
      <View style={styles.feedbackSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>User Feedback</Text>
            <Text style={styles.sectionSubtitle}>{feedback.length} feedback submissions</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading feedback...</Text>
          </View>
        ) : feedback.length === 0 ? (
          <View style={styles.comingSoon}>
            <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
            <Text style={styles.comingSoonText}>No feedback yet</Text>
            <Text style={styles.comingSoonSubtext}>User feedback will appear here</Text>
          </View>
        ) : (
          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.modernTableHeaderText, { flex: 0.5 }]}>Rating</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>User</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Options</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>What They Like</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 2 }]}>Suggestions</Text>
              <Text style={[styles.modernTableHeaderText, { flex: 1 }]}>Date</Text>
            </View>
            <View>
              {feedback.map(item => (
                <View key={item.id} style={styles.modernTableRow}>
                  <View style={[styles.modernTableCell, { flex: 0.5 }]}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.feedbackUserName}>{item.users?.name || 'Anonymous'}</Text>
                    <Text style={styles.feedbackUserEmail}>{item.users?.email || 'No email'}</Text>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.feedbackOptionsContainer}>
                      {item.selected_options?.slice(0, 2).map((option, index) => (
                        <View key={index} style={styles.feedbackOptionTag}>
                          <Text style={styles.feedbackOptionText}>{option}</Text>
                        </View>
                      ))}
                      {item.selected_options?.length > 2 && (
                        <Text style={styles.moreOptionsText}>
                          +{item.selected_options.length - 2} more
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <Text style={styles.feedbackText} numberOfLines={3}>
                      {item.what_you_like || '—'}
                    </Text>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <Text style={styles.feedbackText} numberOfLines={3}>
                      {item.what_to_add || '—'}
                    </Text>
                  </View>

                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.feedbackDate}>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.feedbackTime}>
                      {new Date(item.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
