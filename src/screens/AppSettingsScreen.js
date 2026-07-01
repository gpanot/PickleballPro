import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { Bell, Play, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';

export default function AppSettingsScreen({ navigation }) {
  const { themeMode, setThemeMode, isDark, logbookTheme: t } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  const appVersion = '1.0.0';

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
            <View style={[styles.aboutRow, { borderBottomWidth: 1, borderBottomColor: isDark ? t.border : '#F3F4F6' }]}>
              <Text style={[styles.aboutLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>App Version</Text>
              <Text style={[styles.aboutValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{appVersion}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: t.textMuted, fontFamily: t.fontBody }]}>Build</Text>
              <Text style={[styles.aboutValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Production</Text>
            </View>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: { zIndex: 10 },
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
});
