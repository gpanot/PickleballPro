import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Bell, Play, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

export default function AppSettingsScreen({ navigation }) {
  const { themeMode, setThemeMode, isDark, logbookTheme: t } = useTheme();
  const { user: authUser, signOut } = useAuth();
  const { resetAllOnboarding } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const appVersion = '1.0.0';

  const handleDeleteAccount = async () => {
    try {
      if (!authUser?.id) throw new Error('User not authenticated');

      const { error: programsError } = await supabase
        .from('user_programs').delete().eq('user_id', authUser.id);
      if (programsError) console.error('Error deleting user programs:', programsError);

      const { error: logbookError } = await supabase
        .from('logbook_entries').delete().eq('user_id', authUser.id);
      if (logbookError) console.error('Error deleting logbook entries:', logbookError);

      const { error: feedbackError } = await supabase
        .from('feedback').delete().eq('user_id', authUser.id);
      if (feedbackError) console.error('Error deleting feedback entries:', feedbackError);

      const { error: coachError } = await supabase
        .from('coaches').delete().eq('user_id', authUser.id);
      if (coachError) console.error('Error deleting coach profile:', coachError);

      const { error: reviewsError } = await supabase
        .from('coach_reviews').delete().eq('user_id', authUser.id);
      if (reviewsError) console.error('Error deleting coach reviews:', reviewsError);

      const { error: userError } = await supabase
        .from('users').delete().eq('id', authUser.id);
      if (userError) throw userError;

      try {
        const { data: userData } = await supabase
          .from('users').select('avatar_url').eq('id', authUser.id).single();
        if (userData?.avatar_url) {
          const fileName = userData.avatar_url.split('/').pop();
          await supabase.storage.from('avatars').remove([`${authUser.id}/${fileName}`]);
        }
      } catch {}

      setShowDeleteModal(false);
      setShowDeleteConfirmModal(false);

      await signOut();
      resetAllOnboarding();

      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
    }
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {
        color: t.sectionLabelColor,
        fontFamily: t.fontBodySemibold,
        letterSpacing: t.sectionLabelTracking,
        fontSize: t.sectionLabelSize + 1,
      }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionContent, {
        backgroundColor: t.surface,
        borderWidth: isDark ? 1 : 0,
        borderColor: t.border,
      }]}>
        {children}
      </View>
    </View>
  );

  const renderSettingRow = (Icon, label, value, onValueChange, description = null, isLast = false) => (
    <View style={[styles.settingRow, {
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: isDark ? t.border : '#F3F4F6',
    }]}>
      <View style={styles.settingLeft}>
        <Icon size={20} color={t.textMuted} strokeWidth={2} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#333' : '#D1D5DB', true: t.accentPurple }}
        thumbColor={value ? (isDark ? t.fabTextColor : '#fff') : (isDark ? '#666' : '#F3F4F6')}
        ios_backgroundColor={isDark ? '#333' : '#D1D5DB'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell tokens={t} isDark={isDark} background="bg" bordered title="App Settings" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('Notifications', (
          renderSettingRow(
            Bell,
            'Enable Notifications',
            notificationsEnabled,
            setNotificationsEnabled,
            'Receive updates about your training',
            true,
          )
        ))}

        {renderSection('Appearance', (
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <SlidersHorizontal size={20} color={t.textMuted} strokeWidth={2} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                  Color Theme
                </Text>
                <Text style={[styles.settingDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {themeMode === 'dark' ? 'Sport Dark' : 'Warm & Friendly'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ].map(({ id, label }) => {
                const active = themeMode === id;
                if (active) {
                  return (
                    <LinearGradient
                      key={id}
                      colors={id === 'dark' ? ['#C5F22A', '#C5F22A'] : ['#B48ACA', '#CF8FAD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 8, overflow: 'hidden' }}
                    >
                      <Text
                        onPress={() => setThemeMode(id)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          fontSize: 11,
                          fontFamily: t.fontBodyBold,
                          color: id === 'dark' ? '#0C0C0C' : '#FFFFFF',
                        }}
                      >
                        {label}
                      </Text>
                    </LinearGradient>
                  );
                }
                return (
                  <Text
                    key={id}
                    onPress={() => setThemeMode(id)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      overflow: 'hidden',
                      fontSize: 11,
                      fontFamily: t.fontBodySemibold,
                      color: t.textMuted,
                      backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6',
                    }}
                  >
                    {label}
                  </Text>
                );
              })}
            </View>
          </View>
        ))}

        {renderSection('Preferences', (
          renderSettingRow(
            Play,
            'Auto-play Videos',
            autoPlay,
            setAutoPlay,
            'Automatically play exercise videos',
            true,
          )
        ))}

        {renderSection('About', (
          <View style={styles.aboutSection}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>App Version</Text>
              <Text style={[styles.aboutValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{appVersion}</Text>
            </View>
          </View>
        ))}

        {/* Delete Account section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {
            color: t.sectionLabelColor,
            fontFamily: t.fontBodySemibold,
            letterSpacing: t.sectionLabelTracking,
            fontSize: t.sectionLabelSize + 1,
          }]}>
            ACCOUNT
          </Text>
          <View style={[styles.sectionContent, {
            backgroundColor: isDark ? '#EF444418' : '#FEF2F2',
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? '#EF444444' : t.border,
          }]}>
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: '#EF4444', fontFamily: t.fontBodySemibold }]}>
                    Delete My Account
                  </Text>
                  <Text style={[styles.settingDescription, { color: isDark ? '#EF444499' : '#EF444488', fontFamily: t.fontBody }]}>
                    Permanently remove your account and all data
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* First confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Your data, logbook and programs will be deleted. Your account will be deleted permanently. You won't be able to restore your account and your data.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setShowDeleteConfirmModal(true);
                }}
              >
                <Text style={styles.modalBtnDeleteText}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Second (final) confirmation modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalText}>
              This action cannot be undone. All your data including programs, logbook entries, and account information will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalBtnDeleteText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { textTransform: 'uppercase', marginBottom: 10 },
  sectionContent: { borderRadius: 14 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTextContainer: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15 },
  settingDescription: { fontSize: 12, marginTop: 2 },
  aboutSection: { paddingHorizontal: 16, paddingVertical: 4 },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  aboutLabel: { fontSize: 15 },
  aboutValue: { fontSize: 15 },
  bottomSpacing: { height: 32 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    gap: 10,
  },
  modalBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalBtnDelete: {
    backgroundColor: '#EF4444',
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalBtnDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
