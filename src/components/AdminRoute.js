import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { checkAdminAccess } from '../lib/supabase';
import AdminDashboard from '../screens/AdminDashboard';

export default function AdminRoute({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkAdmin();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const checkAdmin = async () => {
    try {
      const { isAdmin: adminStatus, role, error } = await checkAdminAccess(user.id);
      
      if (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(adminStatus);
        setAdminRole(role);
      }
    } catch (error) {
      console.error('Error in admin check:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Checking admin access...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorText}>Please sign in to access the admin dashboard.</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>
          You don't have admin privileges. Please contact an administrator for access.
        </Text>
      </View>
    );
  }

  return <AdminDashboard navigation={navigation} adminRole={adminRole} />;
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
