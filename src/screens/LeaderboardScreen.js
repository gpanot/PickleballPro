import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';

export default function LeaderboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentUserScore, setCurrentUserScore] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('global'); // 'global', 'nearby', 'male', 'female', 'other'
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUserLocation();
  }, [selectedFilter]);

  const getCurrentUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Update user's location in database
      if (user?.id) {
        await supabase
          .from('users')
          .update({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // First, get all users with their basic info
      let usersQuery = supabase
        .from('users')
        .select('id, name, gender, tier, avatar_url, latitude, longitude, city');

      // Apply gender filter if selected
      if (['male', 'female', 'other'].includes(selectedFilter)) {
        usersQuery = usersQuery.eq('gender', selectedFilter);
      }

      const { data: users, error: usersError } = await usersQuery;

      if (usersError) throw usersError;

      // Get all coach assessments ordered by date (latest first)
      const { data: assessments, error: assessmentsError } = await supabase
        .from('coach_assessments')
        .select('student_id, total_score, assessment_date, created_at')
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Get the latest score for each user
      const userScores = {};
      assessments.forEach(assessment => {
        // Only store the first (latest) assessment for each user
        if (!userScores[assessment.student_id]) {
          userScores[assessment.student_id] = assessment.total_score || 0;
        }
      });

      // Combine user data with scores
      let leaderboard = users.map(user => ({
        ...user,
        score: userScores[user.id] || 0,
      }));

      // Apply nearby filter if selected
      if (selectedFilter === 'nearby' && userLocation) {
        leaderboard = leaderboard.filter(user => {
          if (!user.latitude || !user.longitude) return false;
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.latitude,
            user.longitude
          );
          return distance <= 50; // 50km radius
        });
      }

      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score);

      // Add rank
      leaderboard = leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      // Find current user's rank
      const currentUserData = leaderboard.find(u => u.id === user?.id);
      if (currentUserData) {
        setCurrentUserRank(currentUserData.rank);
        setCurrentUserScore(currentUserData.score);
      } else {
        setCurrentUserRank(null);
        setCurrentUserScore(userScores[user?.id] || 0);
      }

      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#6366F1'; // Default purple
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const FilterButton = ({ filter, label }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.headerSubtitle}>
          {selectedFilter === 'nearby' 
            ? 'Players within 50km • Based on latest coach assessment' 
            : selectedFilter === 'global' 
            ? 'Global Rankings • Based on latest coach assessment' 
            : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Players • Latest assessment`}
        </Text>
      </View>

      {/* Current User Card */}
      {currentUserRank && (
        <View style={styles.currentUserCard}>
          <View style={styles.currentUserRankBadge}>
            <Text style={styles.currentUserRankText}>{getRankIcon(currentUserRank)}</Text>
          </View>
          <View style={styles.currentUserInfo}>
            <Text style={styles.currentUserName}>Your Rank</Text>
            <Text style={styles.currentUserScore}>{currentUserScore} points</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton filter="global" label="🌍 Global" />
          <FilterButton filter="nearby" label="📍 Nearby" />
          <FilterButton filter="male" label="👨 Male" />
          <FilterButton filter="female" label="👩 Female" />
          <FilterButton filter="other" label="⚥ Other" />
        </ScrollView>
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedFilter === 'nearby'
                  ? 'No players found nearby. Try enabling location or changing filters.'
                  : 'No players found. Change filters to see more players!'}
              </Text>
            </View>
          ) : (
            leaderboardData.map((player) => (
              <View
                key={player.id}
                style={[
                  styles.playerCard,
                  player.id === user?.id && styles.playerCardCurrent,
                ]}
              >
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: getRankColor(player.rank) },
                  ]}
                >
                  <Text style={styles.rankBadgeText}>
                    {player.rank <= 3 ? getRankIcon(player.rank) : `#${player.rank}`}
                  </Text>
                </View>

                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {player.name || 'Anonymous Player'}
                    {player.id === user?.id && ' (You)'}
                  </Text>
                  <Text style={styles.playerTier}>
                    {player.tier || 'No Tier'} • {player.city || 'Location not set'}
                  </Text>
                </View>

                <View style={styles.playerScore}>
                  <Text style={styles.scoreValue}>{player.score}</Text>
                  <Text style={styles.scoreLabel}>points</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  currentUserRankBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserRankText: {
    fontSize: 28,
  },
  currentUserInfo: {
    flex: 1,
    marginLeft: 16,
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  currentUserScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playerCardCurrent: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  playerTier: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  playerScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

