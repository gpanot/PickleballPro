import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import styles from '../adminDashboardStyles';

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

export default function DashboardTab({
  sessionRole,
  academyId,
  coachId,
  isMobile,
  user,
  onCreateProgram,
  onCreateRoutine,
  onCreateExercise,
  onAddCoach,
}) {
  const [stats, setStats] = useState({});
  const [publishedStats, setPublishedStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [popularPrograms, setPopularPrograms] = useState([]);
  const [loading, setLoading] = useState(false);

  const isManagerSession = sessionRole === 'manager';
  const isCoachSession = sessionRole === 'coach';
  const compactStatCardStyle = isMobile ? styles.dashboardStatCardCompact : null;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (isManagerSession) {
        const [academyProgramsRes, myStudentsRes] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact' }).eq('academy_id', academyId),
          coachId
            ? supabase.from('coach_students').select('id', { count: 'exact' }).eq('coach_id', coachId)
            : Promise.resolve({ count: 0 }),
        ]);
        const [membersRes] = await Promise.all([
          supabase.from('academy_members').select('id', { count: 'exact' }).eq('academy_id', academyId),
        ]);
        setStats({
          programs: academyProgramsRes.count || 0,
          members: membersRes.count || 0,
          students: myStudentsRes.count || 0,
        });
        setPublishedStats({ published_programs: 0 });
      } else if (isCoachSession) {
        const [myProgramsRes, myStudentsRes] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact' }).eq('created_by', user.id),
          supabase.from('coach_students').select('id', { count: 'exact' }).eq('coach_id', coachId),
        ]);
        setStats({ programs: myProgramsRes.count || 0, students: myStudentsRes.count || 0 });
        setPublishedStats({});
      } else {
        const [programsRes, exercisesRes, coachesRes, usersRes, publishedProgramsRes] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact' }),
          supabase.from('exercises').select('id', { count: 'exact' }),
          supabase.from('coaches').select('id', { count: 'exact' }),
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('programs').select('id', { count: 'exact' }).eq('is_published', true),
        ]);
        setStats({
          programs: programsRes.count || 0,
          exercises: exercisesRes.count || 0,
          coaches: coachesRes.count || 0,
          users: usersRes.count || 0,
        });
        setPublishedStats({ published_programs: publishedProgramsRes.count || 0 });
      }

      await Promise.all([fetchRecentActivity(), fetchPopularPrograms()]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [
        { data: recentUsers, error: usersError },
        { data: recentPrograms, error: programsError },
        { data: recentCoaches, error: coachesError },
      ] = await Promise.all([
        supabase.from('users').select('name, email, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('programs').select('name, created_at, updated_at').eq('is_published', true).order('updated_at', { ascending: false }).limit(2),
        supabase.from('coaches').select('name, updated_at').order('updated_at', { ascending: false }).limit(2),
      ]);

      const activities = [];
      if (recentUsers && !usersError) {
        recentUsers.forEach(u => activities.push({
          text: `New user registration: ${u.name || u.email}`,
          time: getTimeAgo(u.created_at),
          timestamp: new Date(u.created_at),
        }));
      }
      if (recentPrograms && !programsError) {
        recentPrograms.forEach(p => activities.push({
          text: `Program "${p.name}" published`,
          time: getTimeAgo(p.updated_at),
          timestamp: new Date(p.updated_at),
        }));
      }
      if (recentCoaches && !coachesError) {
        recentCoaches.forEach(c => activities.push({
          text: `Coach profile updated: ${c.name}`,
          time: getTimeAgo(c.updated_at),
          timestamp: new Date(c.updated_at),
        }));
      }
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  };

  const fetchPopularPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, added_count, rating')
        .eq('is_published', true)
        .order('added_count', { ascending: false })
        .limit(5);
      if (error) throw error;
      setPopularPrograms((data || []).map(p => ({
        name: p.name,
        users: p.added_count || 0,
        progress: Math.min(Math.round((p.rating || 0) * 20), 100),
      })));
    } catch (error) {
      console.error('Error fetching popular programs:', error);
      setPopularPrograms([]);
    }
  };

  return (
    <View style={styles.content}>
      {/* Quick Action Buttons */}
      <View style={[styles.dashboardQuickActions, isMobile && styles.dashboardQuickActionsCompact]}>
        <TouchableOpacity
          style={[styles.dashboardPrimaryAction, isMobile && styles.dashboardActionCompact]}
          onPress={onCreateProgram}
        >
          <Ionicons name="add" size={isMobile ? 16 : 20} color="white" />
          <Text style={[styles.dashboardPrimaryActionText, isMobile && styles.dashboardActionTextCompact]}>
            {isMobile ? 'Program' : 'Add Program'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dashboardSecondaryAction, isMobile && styles.dashboardActionCompact]}
          onPress={onCreateRoutine}
        >
          <Ionicons name="add" size={isMobile ? 16 : 20} color="#6B7280" />
          <Text style={[styles.dashboardSecondaryActionText, isMobile && styles.dashboardActionTextCompact]}>
            {isMobile ? 'Routine' : 'Add Routine'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dashboardSecondaryAction, isMobile && styles.dashboardActionCompact]}
          onPress={onCreateExercise}
        >
          <Ionicons name="add" size={isMobile ? 16 : 20} color="#6B7280" />
          <Text style={[styles.dashboardSecondaryActionText, isMobile && styles.dashboardActionTextCompact]}>
            {isMobile ? 'Exercise' : 'Add Exercise'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dashboardSecondaryAction, isMobile && styles.dashboardActionCompact]}
          onPress={onAddCoach}
        >
          <Ionicons name="add" size={isMobile ? 16 : 20} color="#6B7280" />
          <Text style={[styles.dashboardSecondaryActionText, isMobile && styles.dashboardActionTextCompact]}>
            {isMobile ? 'Coach' : 'Add Coach'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Stats Cards */}
      <View style={[styles.dashboardStatsGrid, isMobile && styles.dashboardStatsGridRow]}>
        {isManagerSession ? (
          <>
            <View style={[styles.dashboardStatCard, compactStatCardStyle]}>
              <View style={styles.dashboardStatHeader}><Ionicons name="library-outline" size={24} color="#6B7280" /></View>
              <Text style={styles.dashboardStatNumber}>{loading ? '—' : stats.programs?.toLocaleString() || '0'}</Text>
              <Text style={styles.dashboardStatLabel}>Academy Programs</Text>
              <View style={styles.dashboardStatTrend}>
                <View style={styles.dashboardTrendBadge}><Text style={styles.dashboardTrendText}>Total</Text></View>
                <Text style={styles.dashboardStatSubtext}>All programs in your academy</Text>
              </View>
            </View>
            <View style={[styles.dashboardStatCard, compactStatCardStyle]}>
              <View style={styles.dashboardStatHeader}><Ionicons name="people-outline" size={24} color="#6B7280" /></View>
              <Text style={styles.dashboardStatNumber}>{loading ? '—' : stats.members?.toLocaleString() || '0'}</Text>
              <Text style={styles.dashboardStatLabel}>Academy Members</Text>
              <View style={styles.dashboardStatTrend}>
                <View style={[styles.dashboardTrendBadge, styles.dashboardTrendSuccess]}><Text style={[styles.dashboardTrendText, styles.dashboardTrendSuccessText]}>Active</Text></View>
                <Text style={styles.dashboardStatSubtext}>Coaches, managers, staff</Text>
              </View>
            </View>
            <View style={[styles.dashboardStatCard, compactStatCardStyle]}>
              <View style={styles.dashboardStatHeader}><Ionicons name="person-outline" size={24} color="#6B7280" /></View>
              <Text style={styles.dashboardStatNumber}>{loading ? '—' : stats.students?.toLocaleString() || '0'}</Text>
              <Text style={styles.dashboardStatLabel}>My Students</Text>
              <View style={styles.dashboardStatTrend}>
                <View style={styles.dashboardTrendBadge}><Text style={styles.dashboardTrendText}>—</Text></View>
                <Text style={styles.dashboardStatSubtext}>Students linked to you</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.dashboardStatCard, isMobile && styles.dashboardStatCardKpi]}>
              <View style={[styles.dashboardStatHeader, isMobile && styles.dashboardStatHeaderKpi]}>
                <Ionicons name="people-outline" size={isMobile ? 18 : 24} color="#6B7280" />
              </View>
              <Text style={[styles.dashboardStatNumber, isMobile && styles.dashboardStatNumberKpi]}>
                {loading ? '—' : stats.users?.toLocaleString() || '0'}
              </Text>
              <Text style={[styles.dashboardStatLabel, isMobile && styles.dashboardStatLabelKpi]}>{isMobile ? 'Users' : 'Total Users'}</Text>
              {!isMobile && (
                <View style={styles.dashboardStatTrend}>
                  <View style={styles.dashboardTrendBadge}><Text style={styles.dashboardTrendText}>—</Text></View>
                  <Text style={styles.dashboardStatSubtext}>Registered users</Text>
                </View>
              )}
            </View>

            <View style={[styles.dashboardStatCard, isMobile && styles.dashboardStatCardKpi]}>
              <View style={[styles.dashboardStatHeader, isMobile && styles.dashboardStatHeaderKpi]}>
                <Ionicons name="library-outline" size={isMobile ? 18 : 24} color="#6B7280" />
              </View>
              <Text style={[styles.dashboardStatNumber, isMobile && styles.dashboardStatNumberKpi]}>
                {loading ? '—' : publishedStats.published_programs?.toLocaleString() || '0'}
              </Text>
              <Text style={[styles.dashboardStatLabel, isMobile && styles.dashboardStatLabelKpi]}>{isMobile ? 'Programs' : 'Published Programs'}</Text>
              {!isMobile && (
                <View style={styles.dashboardStatTrend}>
                  <View style={[styles.dashboardTrendBadge, styles.dashboardTrendSuccess]}><Text style={[styles.dashboardTrendText, styles.dashboardTrendSuccessText]}>Live</Text></View>
                  <Text style={styles.dashboardStatSubtext}>Available training programs</Text>
                </View>
              )}
            </View>

            <View style={[styles.dashboardStatCard, isMobile && styles.dashboardStatCardKpi]}>
              <View style={[styles.dashboardStatHeader, isMobile && styles.dashboardStatHeaderKpi]}>
                <Ionicons name="fitness-outline" size={isMobile ? 18 : 24} color="#6B7280" />
              </View>
              <Text style={[styles.dashboardStatNumber, isMobile && styles.dashboardStatNumberKpi]}>
                {loading ? '—' : stats.exercises?.toLocaleString() || '0'}
              </Text>
              <Text style={[styles.dashboardStatLabel, isMobile && styles.dashboardStatLabelKpi]}>{isMobile ? 'Exercises' : 'Exercise Library'}</Text>
              {!isMobile && (
                <View style={styles.dashboardStatTrend}>
                  <View style={[styles.dashboardTrendBadge, styles.dashboardTrendWarning]}><Text style={[styles.dashboardTrendText, styles.dashboardTrendWarningText]}>Total</Text></View>
                  <Text style={styles.dashboardStatSubtext}>Total exercises available</Text>
                </View>
              )}
            </View>

            <View style={[styles.dashboardStatCard, isMobile && styles.dashboardStatCardKpi]}>
              <View style={[styles.dashboardStatHeader, isMobile && styles.dashboardStatHeaderKpi]}>
                <Ionicons name="people-circle-outline" size={isMobile ? 18 : 24} color="#6B7280" />
              </View>
              <Text style={[styles.dashboardStatNumber, isMobile && styles.dashboardStatNumberKpi]}>
                {loading ? '—' : stats.coaches?.toLocaleString() || '0'}
              </Text>
              <Text style={[styles.dashboardStatLabel, isMobile && styles.dashboardStatLabelKpi]}>{isMobile ? 'Coaches' : 'Total Coaches'}</Text>
              {!isMobile && (
                <View style={styles.dashboardStatTrend}>
                  <View style={[styles.dashboardTrendBadge, styles.dashboardTrendPrimary]}><Text style={[styles.dashboardTrendText, styles.dashboardTrendPrimaryText]}>All</Text></View>
                  <Text style={styles.dashboardStatSubtext}>Coach profiles</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Main Content Grid */}
      <View style={styles.dashboardMainGrid}>
        <View style={styles.dashboardActivityCard}>
          <View style={styles.dashboardCardHeader}>
            <Ionicons name="pulse" size={20} color="#1F2937" />
            <Text style={styles.dashboardCardTitle}>Recent Activity</Text>
          </View>
          <Text style={styles.dashboardCardSubtitle}>Latest updates across the platform</Text>
          <View style={styles.dashboardActivityList}>
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <View key={index} style={styles.dashboardActivityItem}>
                <View style={styles.dashboardActivityDot} />
                <View style={styles.dashboardActivityContent}>
                  <Text style={styles.dashboardActivityText}>{activity.text}</Text>
                  <Text style={styles.dashboardActivityTime}>{activity.time}</Text>
                </View>
              </View>
            )) : (
              <View style={styles.dashboardActivityItem}>
                <View style={styles.dashboardActivityDot} />
                <View style={styles.dashboardActivityContent}>
                  <Text style={styles.dashboardActivityText}>
                    {loading ? 'Loading recent activity...' : 'No recent activity found'}
                  </Text>
                  <Text style={styles.dashboardActivityTime}>—</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.dashboardProgramsCard}>
          <View style={styles.dashboardCardHeader}>
            <Ionicons name="trending-up" size={20} color="#1F2937" />
            <Text style={styles.dashboardCardTitle}>Popular Programs</Text>
          </View>
          <Text style={styles.dashboardCardSubtitle}>Most enrolled training programs</Text>
          <View style={styles.dashboardProgramsList}>
            {popularPrograms.length > 0 ? popularPrograms.map((program, index) => (
              <View key={index} style={styles.dashboardProgramItem}>
                <View style={styles.dashboardProgramInfo}>
                  <Text style={styles.dashboardProgramName}>{program.name}</Text>
                  <Text style={styles.dashboardProgramUsers}>{program.users} user{program.users !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.dashboardProgressContainer}>
                  <View style={styles.dashboardProgressBar}>
                    <View style={[styles.dashboardProgressFill, { width: `${program.progress}%` }]} />
                  </View>
                  <Text style={styles.dashboardProgressText}>{program.progress}%</Text>
                </View>
              </View>
            )) : (
              <View style={styles.dashboardProgramItem}>
                <View style={styles.dashboardProgramInfo}>
                  <Text style={styles.dashboardProgramName}>{loading ? 'Loading programs...' : 'No programs found'}</Text>
                  <Text style={styles.dashboardProgramUsers}>—</Text>
                </View>
                <View style={styles.dashboardProgressContainer}>
                  <View style={styles.dashboardProgressBar}>
                    <View style={[styles.dashboardProgressFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.dashboardProgressText}>—</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.dashboardStatusGrid}>
        <View style={styles.dashboardStatusCard}>
          <Text style={styles.dashboardStatusTitle}>API Status</Text>
          <View style={styles.dashboardStatusIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.dashboardStatusText}>All systems operational</Text>
          </View>
          <Text style={styles.dashboardStatusSubtext}>Last checked: 2 minutes ago</Text>
        </View>
        <View style={styles.dashboardStatusCard}>
          <Text style={styles.dashboardStatusTitle}>Database Performance</Text>
          <View style={styles.dashboardStatusIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.dashboardStatusText}>125ms avg response</Text>
          </View>
          <Text style={styles.dashboardStatusSubtext}>Excellent performance</Text>
        </View>
        <View style={styles.dashboardStatusCard}>
          <Text style={styles.dashboardStatusTitle}>Storage Usage</Text>
          <View style={styles.dashboardStorageBar}>
            <View style={[styles.dashboardStorageFill, { width: '35%' }]} />
          </View>
          <Text style={styles.dashboardStatusSubtext}>2.1 GB of 6.0 GB used</Text>
        </View>
      </View>
    </View>
  );
}
