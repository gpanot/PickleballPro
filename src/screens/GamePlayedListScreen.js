import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

export default function GamePlayedListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      // TODO: Replace with actual query when doubles_games table exists
      // For now, using mock data
      const mockGames = [
        {
          id: '1',
          date: '2024-01-15',
          team_a: ['Player A1', 'Player A2'],
          team_b: ['Player B1', 'Player B2'],
          score: '6-4',
          winner: 'Team A',
        },
        {
          id: '2',
          date: '2024-01-12',
          team_a: ['Player A1', 'Player A2'],
          team_b: ['Player B1', 'Player B2'],
          score: '6-2',
          winner: 'Team B',
        },
      ];
      setGames(mockGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGameItem = ({ item }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
      <View style={styles.gameCard}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameDate}>{formatDate(item.date)}</Text>
          <View style={[
            styles.winnerBadge,
            item.winner === 'Team A' ? styles.teamABadge : styles.teamBBadge
          ]}>
            <Text style={styles.winnerText}>{item.winner} Won</Text>
          </View>
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <View style={[styles.teamLabel, styles.teamALabel]}>
              <Text style={styles.teamLabelText}>Team A</Text>
            </View>
            <Text style={styles.teamPlayers}>
              {item.team_a[0]} & {item.team_a[1]}
            </Text>
          </View>
          <View style={styles.teamRow}>
            <View style={[styles.teamLabel, styles.teamBLabel]}>
              <Text style={styles.teamLabelText}>Team B</Text>
            </View>
            <Text style={styles.teamPlayers}>
              {item.team_b[0]} & {item.team_b[1]}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Final Score: {item.score}</Text>
        </View>
      </View>
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
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => {
            // Navigate to DoublesSetup with scan mode
            navigation.navigate('DoublesSetup', { scanMode: true });
          }}
        >
          <Ionicons name="qr-code" size={20} color="#3B82F6" />
          <Text style={styles.scanButtonText}>Scan to Join</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.startGameButton}
          onPress={() => navigation.navigate('DoublesSetup')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.startGameButtonText}>Start A New Game</Text>
        </TouchableOpacity>
      </View>
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
  gameDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
  scanButton: {
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
});

