import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import SwipeableRow from '../components/SwipeableRow';
import EmptyState from '../components/EmptyState';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLogbook } from '../context/LogbookContext';
import { useTheme } from '../context/ThemeContext';

import ScreenAvatarHeader from '../components/ScreenAvatarHeader';
import LogbookSummaryCard from '../components/logbook/LogbookSummaryCard';
import SkillPatternsCard from '../components/logbook/SkillPatternsCard';
import MoodTimelineCard from '../components/logbook/MoodTimelineCard';
import CoachInsightCard from '../components/logbook/CoachInsightCard';
import SessionCard from '../components/logbook/SessionCard';
import LogbookHistoryModal from '../components/logbook/LogbookHistoryModal';

const ENTRIES_PAGE_SIZE = 10;

export default function LogbookScreen({ navigation }) {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { logbookEntries, isLoading, deleteLogbookEntry, getLogbookSummary, getMonthlyBreakdown, refreshLogbook } = useLogbook();
  const { logbookTheme: tokens, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ENTRIES_PAGE_SIZE);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLogbook();
    } finally {
      setRefreshing(false);
    }
  }, [refreshLogbook]);

  const summary = getLogbookSummary();

  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this session from ${entry.date}?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
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

  const px = isDark ? 20 : 24;
  const refreshTint = isDark ? '#C5F22A' : '#B48ACA';
  // Screen content ends at the tab bar — keep FAB just above it
  const fabBottom = 12;

  return (
    <View style={[styles.container, { backgroundColor: tokens.bg }]}>
      <ScreenAvatarHeader
        tokens={tokens}
        isDark={isDark}
        background="bg"
        title={isDark ? 'LOGBOOK' : 'Your Logbook'}
        user={user}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshTint}
            colors={[refreshTint]}
          />
        }
      >
        <View style={styles.cardsStack}>
          {/* ── Summary card ── */}
          <LogbookSummaryCard
            tokens={tokens}
            summary={summary}
            onPress={() => setHistoryModalVisible(true)}
          />

          {/* ── Skill patterns ── */}
          {(summary.topStrongSkills?.length > 0 || summary.topWeakSkills?.length > 0) && (
            <SkillPatternsCard
              tokens={tokens}
              topStrongSkills={summary.topStrongSkills || []}
              topWeakSkills={summary.topWeakSkills || []}
            />
          )}

          {/* ── Mood timeline ── */}
          {summary.last5Moods?.length >= 2 && (
            <MoodTimelineCard
              tokens={tokens}
              last5Moods={summary.last5Moods}
              moodTrendUp={summary.moodTrendUp}
            />
          )}

          {/* ── Coach Insight ── */}
          {logbookEntries.length >= 1 && (
            <CoachInsightCard
              tokens={tokens}
              logbookEntries={logbookEntries}
              summary={summary}
              onNavigateToCoach={() => navigation.navigate('CoachDetail')}
            />
          )}

          {/* ── Recent Sessions ── */}
          <View style={{ paddingHorizontal: px }}>
            <Text style={[styles.sectionLabel, {
              color: tokens.sectionLabelColor,
              fontFamily: tokens.fontBodySemibold,
              letterSpacing: tokens.sectionLabelTracking,
              fontSize: tokens.sectionLabelSize,
            }]}>
              RECENT SESSIONS
            </Text>

            {isLoading ? (
              <Text style={[styles.loadingText, { color: tokens.textMuted, fontFamily: tokens.fontBody }]}>
                Loading your sessions…
              </Text>
            ) : logbookEntries.length === 0 ? (
              <EmptyState
                emoji="📔"
                title="Add your last session"
                subtitle="Tap the + button to log your first training session and start tracking your progress."
              />
            ) : (
              <>
                {logbookEntries.slice(0, visibleCount).map((entry) => (
                  <SwipeableRow
                    key={entry.id}
                    onDelete={() => handleDeleteEntry(entry)}
                    surfaceColor={tokens.surface}
                    borderRadius={tokens.radiusInner}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('EditTrainingSession', { entry })}
                    >
                      <SessionCard
                        tokens={tokens}
                        entry={entry}
                      />
                    </TouchableOpacity>
                  </SwipeableRow>
                ))}

                {logbookEntries.length > visibleCount && (
                  <TouchableOpacity
                    style={[styles.loadMoreButton, {
                      backgroundColor: isDark ? tokens.surfaceRaised : tokens.accentPurpleMuted,
                      borderRadius: tokens.radiusCard,
                    }]}
                    onPress={() => setVisibleCount(v => v + ENTRIES_PAGE_SIZE)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.loadMoreText, {
                      color: isDark ? tokens.accentPurple : tokens.accentPurple,
                      fontFamily: tokens.fontBodySemibold,
                    }]}>
                      Load more ({logbookEntries.length - visibleCount} remaining)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <LogbookHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        tokens={tokens}
        monthlyData={getMonthlyBreakdown()}
      />

      {/* FAB — lower right above tab bar */}
      <View style={[styles.fabContainer, { bottom: fabBottom }]}>
        <LinearGradient
          colors={tokens.fabColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fab,
            isDark ? styles.fabDark : styles.fabLight,
            {
              shadowColor: isDark ? '#C5F22A' : '#B48ACA',
              shadowOpacity: isDark ? 0.35 : 0.3,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabInner}
            onPress={() => navigation.navigate('AddTrainingSession')}
            activeOpacity={0.85}
          >
            <Plus size={16} color={tokens.fabTextColor} strokeWidth={2.5} />
            <Text style={{
              color: tokens.fabTextColor,
              fontFamily: isDark ? tokens.fontDisplay : tokens.fontBodyBold,
              fontSize: isDark ? 13 : 14,
              letterSpacing: isDark ? 1.2 : 0,
            }}>
              {isDark ? 'LOG SESSION' : 'Log a session'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardsStack: {
    gap: 12,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadMoreButton: {
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  loadMoreText: {
    fontSize: 13,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },
  fab: {
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  fabDark: {
    borderWidth: 2,
    borderColor: '#0C0C0C',
  },
  fabLight: {
    borderWidth: 3,
    borderColor: '#FAF7F4',
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    gap: 6,
  },
  bottomSpacing: {
    height: 100,
  },
});
