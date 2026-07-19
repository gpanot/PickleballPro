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
import SeededAvatar from '../components/SeededAvatar';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { Globe, MapPin, Trophy, User, Users } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import ScreenAvatarHeader from '../components/ScreenAvatarHeader';
import * as Location from 'expo-location';

export default function LeaderboardScreen({ navigation }) {
  const { user } = useAuth();
  const { user: userProfile } = useUser();
  const { logbookTheme: t, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentUserScore, setCurrentUserScore] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('global'); // 'global', 'nearby', 'male', 'female', 'other'
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedFilter]);

  useEffect(() => {
    if (selectedFilter === 'nearby') {
      getCurrentUserLocation();
    }
  }, [selectedFilter]);

  const getCurrentUserLocation = async () => {
    try {
      // Show rationale before requesting permission
      await new Promise((resolve) => {
        Alert.alert(
          'Find Players Nearby',
          'Allow location access to see players within 50km of you on the Nearby leaderboard.',
          [
            { text: 'Not Now', style: 'cancel', onPress: resolve },
            { text: 'Allow', onPress: resolve },
          ]
        );
      });

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

      // Single joined query: users + their latest non-first-time assessment score.
      // Limits to 200 rows max so we never do a full-table scan.
      let usersQuery = supabase
        .from('users')
        .select('id, name, gender, tier, avatar_url, latitude, longitude, city')
        .limit(200);

      if (['male', 'female', 'other'].includes(selectedFilter)) {
        usersQuery = usersQuery.eq('gender', selectedFilter);
      }

      const { data: users, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      // Get assessments filtered to only the users we already fetched — avoids full scan.
      const userIds = (users || []).map(u => u.id);
      if (userIds.length === 0) {
        setLeaderboardData([]);
        return;
      }

      const { data: assessments, error: assessmentsError } = await supabase
        .from('coach_assessments')
        .select('student_id, total_score, created_at, skills_data')
        .in('student_id', userIds)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Helper: skip First Time Assessment records
      const isFirstTimeAssessment = (a) =>
        a?.skills_data?.newbie_assessment?.type === 'first_time_assessment';

      // Latest real score per user
      const userScores = {};
      (assessments || [])
        .filter(a => !isFirstTimeAssessment(a))
        .forEach(a => {
          if (!userScores[a.student_id]) {
            userScores[a.student_id] = a.total_score || 0;
          }
        });

      let leaderboard = users.map(u => ({ ...u, score: userScores[u.id] || 0 }));

      // Nearby filter
      if (selectedFilter === 'nearby' && userLocation) {
        leaderboard = leaderboard.filter(u => {
          if (!u.latitude || !u.longitude) return false;
          return calculateDistance(
            userLocation.latitude, userLocation.longitude,
            u.latitude, u.longitude
          ) <= 50;
        });
      }

      // Keep only ranked players, sort desc
      leaderboard = leaderboard.filter(u => u.score > 0);
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.map((u, i) => ({ ...u, rank: i + 1 }));

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
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return t.accentPurple;
  };

  const getRankIcon = (rank) => {
    // Returns a string label; medal rendering is done inline with RankMedal component
    return `#${rank}`;
  };

  const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

  const RankMedal = ({ rank, size = 22, style }) => {
    const color = MEDAL_COLORS[rank] || '#fff';
    const label = rank <= 3 ? `${rank}` : `#${rank}`;
    return <Text style={[{ fontSize: size, color, fontWeight: '900' }, style]}>{label}</Text>;
  };

  const PodiumCard = ({ player, height, rank }) => {
    if (!player) return <View style={{ flex: 1 }} />;
    const medalColor = MEDAL_COLORS[rank];
    const isCenter = rank === 1;
    return (
      <View style={[styles.podiumCard, isCenter && styles.podiumCardCenter]}>
        <SeededAvatar
          uri={player.avatar_url}
          name={player.name}
          size={52}
          style={{ borderWidth: 2, borderColor: medalColor }}
        />
        <Text style={[styles.podiumMedal, { color: medalColor }]}>{rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</Text>
        <Text style={[styles.podiumName, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]} numberOfLines={1}>{player.name || 'Player'}</Text>
        <Text style={[styles.podiumScore, { color: t.textMuted, fontFamily: t.fontBody }]}>{player.score} pts</Text>
        <View style={[styles.podiumBlock, { height, backgroundColor: medalColor + '33', borderTopColor: medalColor }]} />
      </View>
    );
  };

  const FilterButton = ({ filter, label, Icon }) => {
    const isActive = selectedFilter === filter;
    const iconColor = isActive ? (isDark ? t.fabTextColor : '#fff') : t.textMuted;
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          { backgroundColor: isDark ? t.surfaceRaised : '#fff', borderColor: isDark ? t.border : '#E2E8F0' },
          isActive && { backgroundColor: t.accentPurple, borderColor: t.accentPurple },
        ]}
        onPress={() => setSelectedFilter(filter)}
      >
        {Icon && <Icon size={14} color={iconColor} style={{ marginRight: 6 }} />}
        <Text style={[
          styles.filterButtonText,
          { color: t.textMuted, fontFamily: t.fontBodySemibold },
          isActive && { color: isDark ? t.fabTextColor : '#fff' },
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const accent = t.accentPurple;
  const nudgeBg = isDark ? t.surfaceRaised : '#EEF2FF';
  const nudgeBorder = isDark ? t.border : '#C7D2FE';

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenAvatarHeader
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="Leaderboard"
        user={userProfile}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      {/* Current User Card */}
      {currentUserRank && (
        <View style={[styles.currentUserCard, { backgroundColor: accent, shadowColor: accent }]}>
          <View style={styles.currentUserRankBadge}>
            <RankMedal rank={currentUserRank} size={26} />
          </View>
          <View style={styles.currentUserInfo}>
            <Text style={[styles.currentUserName, { fontFamily: t.fontBodySemibold }]}>Your Rank</Text>
            <Text style={[styles.currentUserScore, { fontFamily: t.fontDisplay }]}>{currentUserScore} points</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={[styles.filterContainer, { paddingHorizontal: t.headerPaddingH }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton filter="global" label="Global" Icon={Globe} />
          <FilterButton filter="nearby" label="Nearby" Icon={MapPin} />
          <FilterButton filter="male" label="Male" Icon={User} />
          <FilterButton filter="female" label="Female" Icon={User} />
          <FilterButton filter="other" label="Other" Icon={Users} />
        </ScrollView>
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[styles.loadingText, { color: t.textMuted, fontFamily: t.fontBody }]}>Loading rankings...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
            }
          >
            {leaderboardData.length === 0 ? (
              <EmptyState
                Icon={selectedFilter === 'nearby' ? MapPin : Trophy}
                title={selectedFilter === 'nearby' ? 'No players found nearby' : 'No rankings yet'}
                subtitle={selectedFilter === 'nearby'
                  ? 'Try enabling location access or switch to Global rankings.'
                  : 'Complete a coach assessment to earn your rank and appear on the board.'}
              />
            ) : (
              <>
                {/* Podium — top 3 */}
                {leaderboardData.length >= 3 && (
                  <View style={styles.podiumContainer}>
                    <PodiumCard player={leaderboardData[1]} height={70} rank={2} />
                    <PodiumCard player={leaderboardData[0]} height={100} rank={1} />
                    <PodiumCard player={leaderboardData[2]} height={50} rank={3} />
                  </View>
                )}

                {/* Rest of list (rank 4+) */}
                {leaderboardData.slice(leaderboardData.length >= 3 ? 3 : 0).map((player) => (
                  <View
                    key={player.id}
                    style={[
                      styles.playerCard,
                      { backgroundColor: t.surface },
                      player.id === user?.id && { borderWidth: 2, borderColor: accent, backgroundColor: isDark ? t.surfaceRaised : '#F0F9FF' },
                    ]}
                  >
                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(player.rank) }]}>
                      <RankMedal rank={player.rank} size={16} />
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerName, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                        {player.name || 'Anonymous Player'}
                        {player.id === user?.id && ' (You)'}
                      </Text>
                      <Text style={[styles.playerTier, { color: t.textMuted, fontFamily: t.fontBody }]}>
                        {player.tier || 'No Tier'} • {player.city || 'Location not set'}
                      </Text>
                    </View>
                    <View style={styles.playerScore}>
                      <Text style={[styles.scoreValue, { color: accent, fontFamily: t.fontDisplay }]}>{player.score}</Text>
                      <Text style={[styles.scoreLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>pts</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {/* Pinned current-user row */}
          {currentUserRank && (
            <View>
              <View style={[styles.pinnedUserRow, { backgroundColor: nudgeBg, borderTopColor: nudgeBorder }]}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(currentUserRank) }]}>
                  <RankMedal rank={currentUserRank} size={16} />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: accent, fontFamily: t.fontBodySemibold }]}>You</Text>
                  <Text style={[styles.playerTier, { color: t.textMuted, fontFamily: t.fontBody }]}>{currentUserScore} points</Text>
                </View>
                <Text style={[styles.pinnedLabel, { color: accent, fontFamily: t.fontBodySemibold }]}>Your rank</Text>
              </View>
              {currentUserRank > 3 && (
                <TouchableOpacity
                  style={[styles.improveNudge, { backgroundColor: nudgeBg, borderTopColor: nudgeBorder }]}
                  onPress={() => navigation.navigate('Training2')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trending-up-outline" size={16} color={accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.improveNudgeText, { color: accent, fontFamily: t.fontBody }]}>Request a coach assessment to climb the ranks</Text>
                  <Ionicons name="chevron-forward" size={14} color={accent} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {!currentUserRank && (
            <TouchableOpacity
              style={[styles.improveNudge, { backgroundColor: nudgeBg, borderTopColor: nudgeBorder }]}
              onPress={() => navigation.navigate('Training2')}
              activeOpacity={0.8}
            >
              <Ionicons name="star-outline" size={16} color={accent} style={{ marginRight: 6 }} />
              <Text style={[styles.improveNudgeText, { color: accent, fontFamily: t.fontBody }]}>Get a coach assessment to earn your ranking</Text>
              <Ionicons name="chevron-forward" size={14} color={accent} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: { zIndex: 10 },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  currentUserRankBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserInfo: { flex: 1, marginLeft: 16 },
  currentUserName: { fontSize: 16, color: 'white', marginBottom: 4 },
  currentUserScore: { fontSize: 20, color: 'white' },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
  },
  filterButtonText: { fontSize: 13 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 16 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 16,
    marginBottom: 20,
    gap: 4,
  },
  podiumCard: { flex: 1, alignItems: 'center' },
  podiumCardCenter: { marginBottom: 0 },
  podiumMedal: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  podiumName: { fontSize: 11, textAlign: 'center', marginBottom: 2, maxWidth: 80 },
  podiumScore: { fontSize: 11, marginBottom: 6 },
  podiumBlock: { width: '100%', borderTopWidth: 3, borderRadius: 4 },
  pinnedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  pinnedLabel: { fontSize: 12 },
  improveNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  improveNudgeText: { flex: 1, fontSize: 12 },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, marginBottom: 3 },
  playerTier: { fontSize: 12 },
  playerScore: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 24, marginBottom: 2 },
  scoreLabel: { fontSize: 12 },
});

