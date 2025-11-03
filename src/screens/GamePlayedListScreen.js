import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GamePlayedListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    loadGames();
  }, [user?.id]);

  // Refresh games when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGames();
    });
    return unsubscribe;
  }, [navigation, user?.id]);

  // Helper function to validate UUID format
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadGames = async () => {
    try {
      setLoading(true);
      const allGames = [];

      // Load from local storage
      if (user?.id) {
        try {
          const localGamesData = await AsyncStorage.getItem(`@user_doubles_games_${user.id}`);
          if (localGamesData) {
            const localGames = JSON.parse(localGamesData);
            // Filter out any invalid games and ensure IDs are valid
            const validLocalGames = localGames
              .filter(game => game && game.id)
              .map(game => ({ ...game, source: 'local' }));
            allGames.push(...validLocalGames);
          }
        } catch (localError) {
          console.error('Error loading local games:', localError);
        }
      }

      // Load from Supabase (games where user participated)
      // Only query if user.id exists and is a valid UUID format
      if (user?.id && isValidUUID(user.id)) {
        try {
          const { data: dbGames, error: dbError } = await supabase
            .from('doubles_games')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (dbError) {
            // Check if it's a UUID parsing error - this might happen if RLS policy encounters invalid data
            if (dbError.code === '22P02') {
              console.warn('Database query encountered invalid UUID data. Skipping database games.');
            } else {
              console.error('Error loading games from database:', dbError);
            }
          } else if (dbGames) {
            // Transform database games to match expected format
            const transformedGames = dbGames.map(game => ({
              id: game.id,
              created_by: game.created_by,
              date: game.date,
              team_a_players: game.team_a_players,
              team_b_players: game.team_b_players,
              team_a_score: game.team_a_score,
              team_b_score: game.team_b_score,
              winner: game.winner,
              points: game.points,
              duration_minutes: game.duration_minutes,
              top_player: game.top_player,
              common_mistake: game.common_mistake,
              created_at: game.created_at,
              source: 'database',
            }));
            allGames.push(...transformedGames);
          }
        } catch (dbError) {
          // Handle unexpected errors gracefully
          if (dbError?.code === '22P02') {
            console.warn('Database query encountered invalid UUID data. Skipping database games.');
          } else {
            console.error('Error querying database:', dbError);
          }
        }
      } else if (user?.id && !isValidUUID(user.id)) {
        console.warn('User ID is not a valid UUID format. Skipping database query.');
      }

      // Deduplicate games by ID (prefer database over local)
      const gamesMap = new Map();
      allGames.forEach(game => {
        if (!gamesMap.has(game.id) || game.source === 'database') {
          gamesMap.set(game.id, game);
        }
      });

      // Convert to array and sort by date
      const uniqueGames = Array.from(gamesMap.values()).sort((a, b) => {
        const dateA = new Date(a.created_at || a.date);
        const dateB = new Date(b.created_at || b.date);
        return dateB - dateA;
      });

      setGames(uniqueGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCodeSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character code.');
      return;
    }
    
    const code = manualCode.trim().toUpperCase();
    handleJoinCode(code);
  };

  const handleJoinCode = (code) => {
    // Validate the code
    if (code && code.length === 6) {
      setShowEnterCodeModal(false);
      setManualCode('');
      // Show alert for now - TODO: Navigate to join flow with code when backend is ready
      Alert.alert(
        'Game Found',
        `Would you like to join game ${code}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join', 
            onPress: () => {
              // TODO: Navigate to join flow with code when backend is ready
              console.log('Joining game:', code);
              // For now, just navigate to DoublesSetup as fallback
              navigation.navigate('DoublesSetup');
            }
          }
        ]
      );
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character code.');
    }
  };

  const handleDeleteGame = async (gameId) => {
    Alert.alert(
      'Delete Game',
      'Are you sure you want to delete this game? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from database if it's a database game
              if (user?.id && isValidUUID(user.id)) {
                try {
                  const { error: dbError } = await supabase
                    .from('doubles_games')
                    .delete()
                    .eq('id', gameId);
                  
                  if (dbError) {
                    console.error('Error deleting from database:', dbError);
                  }
                } catch (dbError) {
                  console.error('Error deleting from database:', dbError);
                }
              }

              // Delete from local storage
              if (user?.id) {
                try {
                  const localGamesData = await AsyncStorage.getItem(`@user_doubles_games_${user.id}`);
                  if (localGamesData) {
                    const localGames = JSON.parse(localGamesData);
                    const updatedGames = localGames.filter(game => game.id !== gameId);
                    await AsyncStorage.setItem(`@user_doubles_games_${user.id}`, JSON.stringify(updatedGames));
                  }
                } catch (localError) {
                  console.error('Error deleting from local storage:', localError);
                }
              }

              // Update UI by removing the game from the list
              setGames(prevGames => prevGames.filter(game => game.id !== gameId));
            } catch (error) {
              console.error('Error deleting game:', error);
              Alert.alert('Error', 'Failed to delete the game. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderGameItem = ({ item }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase().replace(/\s/g, '');
    };

    // Extract player names from JSONB objects
    const teamAPlayers = item.team_a_players || {};
    const teamBPlayers = item.team_b_players || {};
    const teamANames = [
      teamAPlayers.A1?.name || teamAPlayers.A1 || 'Player A1',
      teamAPlayers.A2?.name || teamAPlayers.A2 || 'Player A2',
    ];
    const teamBNames = [
      teamBPlayers.B1?.name || teamBPlayers.B1 || 'Player B1',
      teamBPlayers.B2?.name || teamBPlayers.B2 || 'Player B2',
    ];

    const winner = item.winner === 'A' ? 'Team A' : 'Team B';
    const score = `${item.team_a_score || 0}-${item.team_b_score || 0}`;

    const handlePress = () => {
      // Navigate to summary screen with game data
      navigation.navigate('SixPointSummary', {
        gameData: item,
        players: {
          A1: teamAPlayers.A1 || null,
          A2: teamAPlayers.A2 || null,
          B1: teamBPlayers.B1 || null,
          B2: teamBPlayers.B2 || null,
        },
        points: item.points || [],
        allPoints: item.points || [],
        teamAScore: item.team_a_score || 0,
        teamBScore: item.team_b_score || 0,
      });
    };

    return (
      <TouchableOpacity 
        style={styles.gameCard}
        onPress={handlePress}
        onLongPress={() => handleDeleteGame(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.gameHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.gameDate}>{formatDate(item.date || item.created_at)}</Text>
            <Text style={styles.gameTime}>{formatTime(item.created_at || item.date)}</Text>
          </View>
          <View style={[
            styles.winnerBadge,
            winner === 'Team A' ? styles.teamABadge : styles.teamBBadge
          ]}>
            <Text style={styles.winnerText}>{winner} Won</Text>
          </View>
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <View style={[styles.teamLabel, styles.teamALabel]}>
              <Text style={styles.teamLabelText}>Team A</Text>
            </View>
            <Text style={styles.teamPlayers}>
              {teamANames[0]} & {teamANames[1]}
            </Text>
          </View>
          <View style={styles.teamRow}>
            <View style={[styles.teamLabel, styles.teamBLabel]}>
              <Text style={styles.teamLabelText}>Team B</Text>
            </View>
            <Text style={styles.teamPlayers}>
              {teamBNames[0]} & {teamBNames[1]}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Final Score: {score}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Played List</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : games.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Games Yet</Text>
          <Text style={styles.emptyDescription}>
            Start your first doubles challenge game!
          </Text>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.joinButtonsRow}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              navigation.navigate('DoublesSetup', { scanMode: true });
            }}
          >
            <Ionicons name="qr-code" size={20} color="#3B82F6" />
            <Text style={styles.scanButtonText}>Scan to Join</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.enterCodeButton}
            onPress={() => setShowEnterCodeModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
            <Text style={styles.enterCodeButtonText}>Enter Code</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.startGameButton}
          onPress={() => navigation.navigate('DoublesSetup')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.startGameButtonText}>Start A New Game</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Code Entry Modal */}
      <Modal
        visible={showEnterCodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowEnterCodeModal(false);
          setManualCode('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Join Code</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEnterCodeModal(false);
                  setManualCode('');
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtext}>
              Enter the 6-character game code to join
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="ABCD12"
              placeholderTextColor="#9CA3AF"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEnterCodeModal(false);
                  setManualCode('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleEnterCodeSubmit}
              >
                <Text style={styles.modalButtonSubmitText}>Join Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  gameDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  gameTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  winnerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teamABadge: {
    backgroundColor: '#D1FAE5',
  },
  teamBBadge: {
    backgroundColor: '#DBEAFE',
  },
  winnerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  teamsContainer: {
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  teamALabel: {
    backgroundColor: '#D1FAE5',
  },
  teamBLabel: {
    backgroundColor: '#DBEAFE',
  },
  teamLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  teamPlayers: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  scoreContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  joinButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  enterCodeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  enterCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  startGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startGameButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonSubmit: {
    backgroundColor: '#3B82F6',
  },
  modalButtonSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

