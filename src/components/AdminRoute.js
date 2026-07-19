import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { checkAdminAccess, checkCoachAccess, supabase } from '../lib/supabase';
import AdminDashboard from '../screens/AdminDashboard';

export default function AdminRoute({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionRole, setSessionRole] = useState(null); // 'admin' | 'manager' | 'coach' | null
  const [adminRole, setAdminRole] = useState(null);
  const [coachId, setCoachId] = useState(null);
  const [academyId, setAcademyId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkAccess();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const checkAccess = async () => {
    const t0 = Date.now();
    console.log('[AdminRoute] 🔍 checkAccess() started');
    try {
      // 1. Admin check always wins
      const t1 = Date.now();
      const { isAdmin: adminStatus, role, error: adminError } = await checkAdminAccess(user.id);
      console.log(`[AdminRoute] ✅ checkAdminAccess took ${Date.now() - t1}ms → isAdmin=${adminStatus}`);

      if (adminError) {
        console.error('Error checking admin access:', adminError);
      }

      if (adminStatus) {
        setSessionRole('admin');
        setAdminRole(role);
        console.log(`[AdminRoute] 🏁 Total checkAccess time: ${Date.now() - t0}ms`);
        return;
      }

      // 2. Academy manager check (precedes coach — broader tier)
      const t2 = Date.now();
      const { data: managerRow, error: managerError } = await supabase
        .from('academy_members')
        .select('academy_id')
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();
      console.log(`[AdminRoute] ✅ manager check took ${Date.now() - t2}ms → isManager=${!!(managerRow && !managerError)}`);

      if (!managerError && managerRow) {
        // Also fetch coach row so we keep coachId available (manager may also be a coach)
        const t3 = Date.now();
        const { isCoach, coachId: cid } = await checkCoachAccess(user.id);
        console.log(`[AdminRoute] ✅ checkCoachAccess (manager+coach) took ${Date.now() - t3}ms → isCoach=${isCoach}`);
        setSessionRole('manager');
        setAcademyId(managerRow.academy_id);
        if (isCoach) setCoachId(cid);
        console.log(`[AdminRoute] 🏁 Total checkAccess time: ${Date.now() - t0}ms`);
        return;
      }

      // 3. Coach check
      const t4 = Date.now();
      const { isCoach, coachId: id } = await checkCoachAccess(user.id);
      console.log(`[AdminRoute] ✅ checkCoachAccess took ${Date.now() - t4}ms → isCoach=${isCoach}`);

      if (isCoach) {
        setSessionRole('coach');
        setCoachId(id);
        // Also check if this coach belongs to an academy (as a coach member)
        const { data: coachMemberRow } = await supabase
          .from('academy_members')
          .select('academy_id')
          .eq('user_id', user.id)
          .eq('role', 'coach')
          .maybeSingle();
        if (coachMemberRow?.academy_id) {
          setAcademyId(coachMemberRow.academy_id);
          console.log(`[AdminRoute] Coach also has academy membership → academyId=${coachMemberRow.academy_id}`);
        }
        console.log(`[AdminRoute] 🏁 Total checkAccess time: ${Date.now() - t0}ms`);
        return;
      }

      // 4. Neither admin, manager, nor coach — access denied
      console.log(`[AdminRoute] ⛔ Access denied. Total checkAccess time: ${Date.now() - t0}ms`);
    } catch (error) {
      console.error('Error in access check:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorText}>Please sign in to access the dashboard.</Text>
      </View>
    );
  }

  if (!sessionRole) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>
          You don't have admin, manager, or coach access. Please contact an administrator.
        </Text>
      </View>
    );
  }

  return (
    <AdminDashboard
      navigation={navigation}
      adminRole={adminRole}
      sessionRole={sessionRole}
      coachId={coachId}
      academyId={academyId}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
