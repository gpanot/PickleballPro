import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { checkAdminAccess, checkCoachAccess } from '../lib/supabase';
import AdminDashboard from '../screens/AdminDashboard';

export default function AdminRoute({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionRole, setSessionRole] = useState(null); // 'admin' | 'coach' | null
  const [adminRole, setAdminRole] = useState(null);
  const [coachId, setCoachId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkAccess();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const checkAccess = async () => {
    try {
      // Admin check always wins — if in admin_users, role = 'admin' regardless of coaches table
      const { isAdmin: adminStatus, role, error: adminError } = await checkAdminAccess(user.id);

      if (adminError) {
        console.error('Error checking admin access:', adminError);
      }

      if (adminStatus) {
        setSessionRole('admin');
        setAdminRole(role);
        return;
      }

      // Fallback: check coaches table
      const { isCoach, coachId: id } = await checkCoachAccess(user.id);

      if (isCoach) {
        setSessionRole('coach');
        setCoachId(id);
        return;
      }

      // Neither admin nor coach — access denied (sessionRole stays null)
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
          You don't have admin or coach access. Please contact an administrator.
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
