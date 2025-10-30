// Authentication Test Utilities
// Use these functions to test persistent authentication

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const APP_VERSION_KEY = '@pickleball_hero:app_version';
const SESSION_BACKUP_KEY = '@pickleball_hero:session_backup';

export const authTestUtils = {
  // Check current authentication state
  async checkAuthState() {
    console.log('🧪 Testing Authentication State...');
    
    try {
      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🧪 Supabase Session:', session ? 'Active' : 'None');
      console.log('🧪 Session Error:', error?.message || 'None');
      
      // Check app version
      const version = await AsyncStorage.getItem(APP_VERSION_KEY);
      console.log('🧪 App Version:', version || 'Not set');
      
      // Check backup session
      const backup = await AsyncStorage.getItem(SESSION_BACKUP_KEY);
      console.log('🧪 Backup Session:', backup ? 'Exists' : 'None');
      
      if (backup) {
        const backupData = JSON.parse(backup);
        const age = Date.now() - (backupData.backup_timestamp || 0);
        console.log('🧪 Backup Age:', Math.round(age / (1000 * 60 * 60)), 'hours');
      }
      
      return {
        hasSession: !!session,
        hasBackup: !!backup,
        appVersion: version,
        sessionUser: session?.user?.email || null
      };
    } catch (error) {
      console.error('🧪 Auth state check failed:', error);
      return { error: error.message };
    }
  },

  // Simulate app update by changing version
  async simulateAppUpdate(newVersion) {
    console.log('🧪 Simulating app update to version:', newVersion);
    
    try {
      const currentVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
      console.log('🧪 Current version:', currentVersion);
      
      await AsyncStorage.setItem(APP_VERSION_KEY, newVersion);
      console.log('🧪 Version updated to:', newVersion);
      
      return { success: true, oldVersion: currentVersion, newVersion };
    } catch (error) {
      console.error('🧪 App update simulation failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear all authentication data
  async clearAllAuthData() {
    console.log('🧪 Clearing all authentication data...');
    
    try {
      await AsyncStorage.multiRemove([APP_VERSION_KEY, SESSION_BACKUP_KEY]);
      await supabase.auth.signOut();
      console.log('🧪 All auth data cleared');
      return { success: true };
    } catch (error) {
      console.error('🧪 Clear auth data failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test session recovery
  async testSessionRecovery() {
    console.log('🧪 Testing session recovery...');
    
    try {
      // First, sign out to clear current session
      await supabase.auth.signOut();
      console.log('🧪 Signed out from Supabase');
      
      // Check if we have backup data
      const backup = await AsyncStorage.getItem(SESSION_BACKUP_KEY);
      if (!backup) {
        console.log('🧪 No backup data available for recovery test');
        return { success: false, reason: 'No backup data' };
      }
      
      console.log('🧪 Backup data found, attempting recovery...');
      
      // Try to get session (this should trigger recovery)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        console.log('🧪 Session recovery successful:', session.user.email);
        return { success: true, user: session.user.email };
      } else {
        console.log('🧪 Session recovery failed:', error?.message);
        return { success: false, error: error?.message };
      }
    } catch (error) {
      console.error('🧪 Session recovery test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get detailed storage information
  async getStorageInfo() {
    console.log('🧪 Getting storage information...');
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => key.includes('pickleball_hero') || key.includes('supabase'));
      
      const storageData = {};
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        storageData[key] = value ? 'Present' : 'Empty';
      }
      
      console.log('🧪 Storage keys found:', authKeys);
      return { keys: authKeys, data: storageData };
    } catch (error) {
      console.error('🧪 Storage info failed:', error);
      return { error: error.message };
    }
  }
};

export default authTestUtils;
