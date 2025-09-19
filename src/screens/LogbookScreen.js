import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebLinearGradient from '../components/WebLinearGradient';
import WebIcon from '../components/WebIcon';
import { useUser } from '../context/UserContext';
import { useLogbook } from '../context/LogbookContext';

export default function LogbookScreen({ navigation }) {
  const { user } = useUser();
  const { logbookEntries, isLoading, deleteLogbookEntry, getLogbookSummary } = useLogbook();
  const insets = useSafeAreaInsets();

  // Feeling options
  const feelingOptions = [
    { value: 1, emoji: '😓', label: 'Struggling', color: '#EF4444' },
    { value: 2, emoji: '😕', label: 'Difficult', color: '#F97316' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#6B7280' },
    { value: 4, emoji: '😊', label: 'Good', color: '#10B981' },
    { value: 5, emoji: '🤩', label: 'Excellent', color: '#8B5CF6' },
  ];

  // Training focus options
  const trainingFocusOptions = [
    { value: 'dinks', emoji: '🥒', label: 'Dinks', color: '#10B981' },
    { value: 'drives', emoji: '🚀', label: 'Drives', color: '#3B82F6' },
    { value: 'serves', emoji: '🎾', label: 'Serves', color: '#F59E0B' },
    { value: 'returns', emoji: '↩️', label: 'Returns', color: '#8B5CF6' },
    { value: 'volleys', emoji: '🛡️', label: 'Volleys/Resets', color: '#EF4444' },
  ];


  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this training session from ${formatDate(entry.date)}?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteLogbookEntry(entry.id);
            Alert.alert('Deleted', 'Training session has been deleted.');
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getFeelingData = (value) => {
    return feelingOptions.find(option => option.value === value) || feelingOptions[2];
  };

  const getTrainingFocusData = (value) => {
    return trainingFocusOptions.find(option => option.value === value) || trainingFocusOptions[0];
  };


  const summary = getLogbookSummary();

  const renderHeader = () => (
    <View style={styles.header}>
      <WebLinearGradient
        colors={['#10B981', '#059669']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Your Logbook</Text>
              <Text style={styles.headerSubtitle}>Track your training progress</Text>
            </View>
          </View>
        </View>
      </WebLinearGradient>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Training Summary</Text>
      
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.totalHours}h</Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summarySubtext}>
            Since {formatDate(summary.firstSessionDate)}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.thisWeekHours}h</Text>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summarySubtext}>
            {summary.weekSessions} session{summary.weekSessions !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.thisMonthHours}h</Text>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summarySubtext}>
            {summary.monthSessions} session{summary.monthSessions !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {summary.weeklyAverageFeeling > 0 && (
        <View style={styles.weeklyFeelingCard}>
          <View style={styles.weeklyFeelingHeader}>
            <Text style={styles.weeklyFeelingTitle}>Weekly Progress Feeling</Text>
            <View style={styles.feelingDisplay}>
              <Text style={styles.feelingEmoji}>
                {getFeelingData(Math.round(summary.weeklyAverageFeeling)).emoji}
              </Text>
              <Text style={styles.feelingLabel}>
                {getFeelingData(Math.round(summary.weeklyAverageFeeling)).label}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );


  const renderLogbookEntries = () => (
    <View style={styles.entriesContainer}>
      <Text style={styles.entriesTitle}>Recent Sessions</Text>
      
      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      ) : logbookEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <WebIcon name="document-text" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No sessions logged yet</Text>
          <Text style={styles.emptyStateText}>
            Tap the + button below to log your first training session!
          </Text>
        </View>
      ) : (
        <View style={styles.entriesList}>
          {logbookEntries.slice(0, 10).map((entry) => {
            const feelingData = getFeelingData(entry.feeling);
            
            // Handle both old single focus and new multiple focus formats
            const entryFocuses = Array.isArray(entry.trainingFocus) 
              ? entry.trainingFocus 
              : [entry.trainingFocus || 'dinks'];
            
            return (
              <TouchableWithoutFeedback
                key={entry.id}
                onLongPress={() => handleDeleteEntry(entry)}
                delayLongPress={800}
              >
                <View style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryDateContainer}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      <Text style={styles.entryHours}>{entry.hours}h</Text>
                    </View>
                    <View style={styles.entryFeeling}>
                      <Text style={styles.entryFeelingEmoji}>{feelingData.emoji}</Text>
                      <Text style={[styles.entryFeelingLabel, { color: feelingData.color }]}>
                        {feelingData.label}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Training focus display */}
                  <View style={styles.entryFocusContainer}>
                    <Text style={styles.entryFocusTitle}>Focused on:</Text>
                    <View style={styles.entryFocusTags}>
                      {entryFocuses.map((focus, index) => {
                        const focusData = getTrainingFocusData(focus);
                        return (
                          <View key={index} style={[styles.entryFocusTag, { borderColor: focusData.color }]}>
                            <Text style={styles.entryFocusTagEmoji}>{focusData.emoji}</Text>
                            <Text style={[styles.entryFocusTagLabel, { color: focusData.color }]}>
                              {focusData.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  
                  {entry.notes && (
                    <Text style={styles.entryNotes}>{entry.notes}</Text>
                  )}
                  
                  {/* Visual hint for long press */}
                  <View style={styles.entryHint}>
                    <Text style={styles.entryHintText}>Hold to delete</Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        {renderHeader()}
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {renderSummary()}
        {renderLogbookEntries()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTrainingSession')}
        activeOpacity={0.8}
      >
        <WebIcon 
          name="add" 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header styles
  header: {
    marginBottom: 0,
  },
  headerGradient: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Summary styles
  summaryContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  weeklyFeelingCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  weeklyFeelingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyFeelingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
  },
  feelingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feelingEmoji: {
    fontSize: 18,
  },
  feelingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  // Entries styles
  entriesContainer: {
    margin: 16,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  entryHours: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  entryFeeling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryFeelingEmoji: {
    fontSize: 20,
  },
  entryFeelingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryFocusContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  entryFocusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  entryFocusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryFocusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  entryFocusTagEmoji: {
    fontSize: 12,
  },
  entryFocusTagLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  entryHint: {
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  entryHintText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100, // Extra space to account for FAB
  },
});
