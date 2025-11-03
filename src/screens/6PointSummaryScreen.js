import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SHOT_TYPES = [
  { id: 'serve', icon: '🎯', label: 'Bad Serve' },
  { id: 'drop', icon: '🏓', label: 'Bad Drop' },
  { id: 'return', icon: '↩️', label: 'Bad Return' },
  { id: 'net', icon: '🕸', label: 'Net' },
  { id: 'smash', icon: '🔥', label: 'Bad Smash' },
  { id: 'out', icon: '⬅️', label: 'Out' },
];

export default function SixPointSummaryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { 
    players, 
    points, 
    allPoints, 
    teamAScore = 0, 
    teamBScore = 0,
    gameData // If gameData exists, this is a loaded game (not a new one)
  } = route.params || { players: {}, points: [], allPoints: [], teamAScore: 0, teamBScore: 0 };
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(!!gameData); // If gameData exists, it's already saved
  
  // Calculate stats
  const teamAWins = allPoints.filter(p => p.winnerTeam === 'A').length;
  const teamBWins = allPoints.filter(p => p.winnerTeam === 'B').length;
  
  // Use duration from gameData if available, otherwise calculate
  const duration = gameData?.duration_minutes || 
    Math.round((allPoints[allPoints.length - 1]?.timestamp - allPoints[0]?.timestamp || 0) / 1000 / 60);
  
  // Calculate top player
  const playerStats = {};
  ['A1', 'A2', 'B1', 'B2'].forEach(slot => {
    const pointsWon = allPoints.filter(p => p.pointMaker === slot).length;
    const errorsForced = allPoints.filter(p => p.errorMaker !== slot && (p.pointMaker === slot)).length;
    playerStats[slot] = {
      pointsWon,
      errorsForced,
      total: pointsWon + errorsForced,
    };
  });
  
  const topPlayer = Object.entries(playerStats).sort((a, b) => b[1].total - a[1].total)[0];
  const topPlayerSlot = topPlayer?.[0];
  const topPlayerData = topPlayer?.[1];
  const topPlayerName = players[topPlayerSlot]?.name || topPlayerSlot;
  
  // Calculate common mistakes
  const mistakeCounts = {};
  allPoints.forEach(point => {
    // Support both old format (shotType) and new format (errorShotType)
    const mistakeType = point.errorShotTypeLabel || point.shotTypeLabel || point.errorShotType || point.shotType;
    mistakeCounts[mistakeType] = (mistakeCounts[mistakeType] || 0) + 1;
  });
  const commonMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];
  
  // Auto-save game data on mount (only for new games, not loaded ones)
  useEffect(() => {
    if (user?.id && allPoints.length > 0 && !gameData) {
      saveGameData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Helper function to validate UUID format
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Helper function to sanitize player data - remove invalid UUIDs
  const sanitizePlayer = (player) => {
    if (!player) return null;
    // If player has an id but it's not a valid UUID, remove it or set to null
    if (player.id && !isValidUUID(player.id)) {
      const { id, ...playerWithoutId } = player;
      return { ...playerWithoutId, id: null };
    }
    return player;
  };

  const saveGameData = async () => {
    // Don't save if already saved or if this is a loaded game
    if (isSaving || isSaved || !user?.id || allPoints.length === 0 || gameData) return;
    
    setIsSaving(true);
    try {
      // Sanitize player data to ensure only valid UUIDs are saved
      const sanitizedTeamAPlayers = {
        A1: sanitizePlayer(players.A1),
        A2: sanitizePlayer(players.A2),
      };
      const sanitizedTeamBPlayers = {
        B1: sanitizePlayer(players.B1),
        B2: sanitizePlayer(players.B2),
      };

      // Save to Supabase database first to get the generated ID
      let dbGameId = null;
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('doubles_games')
          .insert({
            created_by: user.id,
            date: new Date().toISOString().split('T')[0],
            team_a_players: sanitizedTeamAPlayers,
            team_b_players: sanitizedTeamBPlayers,
            team_a_score: teamAScore,
            team_b_score: teamBScore,
            winner: teamAScore >= 6 ? 'A' : 'B',
            points: allPoints,
            duration_minutes: duration,
            top_player: topPlayerSlot || null,
            common_mistake: commonMistake?.[0] || null,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error saving to database:', dbError);
          // Use fallback ID if DB save fails
          dbGameId = `game_${Date.now()}`;
        } else {
          // Use the database-generated ID
          dbGameId = dbData.id;
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Use fallback ID if DB save fails
        dbGameId = `game_${Date.now()}`;
      }

      // Save to local storage with the same ID from database
      const newGameData = {
        id: dbGameId,
        created_by: user.id,
        date: new Date().toISOString().split('T')[0],
        team_a_players: sanitizedTeamAPlayers,
        team_b_players: sanitizedTeamBPlayers,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        winner: teamAScore >= 6 ? 'A' : 'B',
        points: allPoints,
        duration_minutes: duration,
        top_player: topPlayerSlot || null,
        common_mistake: commonMistake?.[0] || null,
        created_at: new Date().toISOString(),
      };

      try {
        const existingGames = await AsyncStorage.getItem(`@user_doubles_games_${user.id}`);
        const games = existingGames ? JSON.parse(existingGames) : [];
        games.unshift(newGameData);
        // Keep only last 50 games locally
        const limitedGames = games.slice(0, 50);
        await AsyncStorage.setItem(`@user_doubles_games_${user.id}`, JSON.stringify(limitedGames));
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }

      setIsSaved(true);
      console.log('✅ Game data saved successfully');
    } catch (error) {
      console.error('Error saving game data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevenge = () => {
    // Go back to Court Setup screen with same players to start a new game
    navigation.navigate('DoublesSetup', { players });
  };

  const handleCloseGame = () => {
    // Navigate back to game list
    navigation.navigate('GamePlayedList');
  };

  const getShotIcon = (shotTypeId) => {
    return SHOT_TYPES.find(s => s.id === shotTypeId)?.icon || '🏓';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {gameData && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>6-Point Summary</Text>
          <Text style={styles.headerSubtext}>Quick outcome overview</Text>
        </View>
        {isSaved && !gameData && (
          <View style={styles.savedIndicatorHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.savedTextHeader}>Saved</Text>
          </View>
        )}
        {isSaving && !gameData && (
          <Text style={styles.savingTextHeader}>💾 Saving...</Text>
        )}
        {!gameData && !isSaved && !isSaving && <View style={styles.headerSpacer} />}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          !gameData && { paddingBottom: 120 }, // Padding for footer buttons
          gameData && { paddingBottom: 40 } // Less padding for past games without footer
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Top Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{teamAWins} / 6</Text>
            <Text style={styles.statLabel}>Team A Wins</Text>
            <View style={[styles.statIndicator, styles.statIndicatorGreen]} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{teamBWins} / 6</Text>
            <Text style={styles.statLabel}>Team B Wins</Text>
            <View style={[styles.statIndicator, styles.statIndicatorRed]} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>≈ {duration} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        {/* Breakdown Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableCol1]}>Point</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol2]}>Winner</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol3]}>Point Maker</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol4]}>Error By</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol5]}>Error Type</Text>
          </View>
          {allPoints.map((point, index) => {
            const pointMakerName = players[point.pointMaker]?.name || point.pointMaker;
            const errorMakerName = players[point.errorMaker]?.name || point.errorMaker;
            
            // Support both old format (shotType) and new format (errorShotType)
            const errorShotType = point.errorShotType || point.shotType;
            const errorShotTypeLabel = point.errorShotTypeLabel || point.shotTypeLabel || errorShotType;
            
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCol1]}>{point.pointNumber}</Text>
                <Text style={[styles.tableCell, styles.tableCol2]}>
                  {point.winnerTeam === 'A' ? '🟩 A' : '🟥 B'}
                </Text>
                <Text style={[styles.tableCell, styles.tableCol3]} numberOfLines={1}>
                  {pointMakerName}
                </Text>
                <Text style={[styles.tableCell, styles.tableCol4]} numberOfLines={1}>
                  {errorMakerName}
                </Text>
                <View style={[styles.tableCell, styles.tableCol5]}>
                  <Text style={styles.tableCellIcon}>{getShotIcon(errorShotType)}</Text>
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {errorShotTypeLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Highlights Section */}
        <View style={styles.highlightsContainer}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          
          <View style={styles.highlightCard}>
            <Text style={styles.highlightIcon}>🏅</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Top Player</Text>
              <Text style={styles.highlightText}>
                {topPlayerName} – {topPlayerData?.pointsWon || 0} winners, {topPlayerData?.errorsForced || 0} forced error
              </Text>
            </View>
          </View>

          {commonMistake && (
            <View style={styles.highlightCard}>
              <Text style={styles.highlightIcon}>⚠️</Text>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightTitle}>Common Mistake</Text>
                <Text style={styles.highlightText}>
                  {commonMistake[0]} ({commonMistake[1]}×)
                </Text>
              </View>
            </View>
          )}

          <View style={styles.highlightCard}>
            <Text style={styles.highlightIcon}>🎯</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Focus Next</Text>
              <Text style={styles.highlightText}>
                3rd Shot Consistency
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer Buttons - Only show for new games, not past games */}
      {!gameData && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonRevenge]}
            onPress={handleRevenge}
          >
            <Ionicons name="flame" size={20} color="#FFFFFF" />
            <Text style={styles.footerButtonText}>Revenge 6 Points</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonClose]}
            onPress={handleCloseGame}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.footerButtonText}>Close Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Match back button width for alignment
  },
  savedIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedTextHeader: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  savingTextHeader: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20, // Base padding
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statIndicatorGreen: {
    backgroundColor: '#27AE60',
  },
  statIndicatorRed: {
    backgroundColor: '#E74C3C',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  tableCol1: {
    width: 50,
  },
  tableCol2: {
    width: 60,
  },
  tableCol3: {
    flex: 1,
    minWidth: 70,
  },
  tableCol4: {
    flex: 1,
    minWidth: 70,
  },
  tableCol5: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  tableCellIcon: {
    fontSize: 14,
  },
  tableCellText: {
    fontSize: 12,
    color: '#1F2937',
    flex: 1,
  },
  highlightsContainer: {
    marginBottom: 24,
  },
  highlightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    minHeight: 44,
    marginBottom: 8,
  },
  footerButtonRevenge: {
    backgroundColor: '#EF4444',
  },
  footerButtonClose: {
    backgroundColor: '#6B7280',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

